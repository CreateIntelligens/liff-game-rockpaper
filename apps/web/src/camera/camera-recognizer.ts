import type { CameraRecognitionResult } from "@rockpaper/ports";
import { observeStableHand } from "./gesture-stability";

type RecognitionMessage =
  | { type: "ready"; modelVersion: string }
  | { type: "result"; hand: CameraRecognitionResult["hand"]; confidence: number; modelVersion: string }
  | { type: "error"; message: string };

export class CameraRecognizer {
  private readonly worker: Worker;
  private stream: MediaStream | null = null;
  private modelReady = false;
  private modelError: Error | null = null;
  private modelInit: Promise<void> | null = null;

  constructor(
    private readonly modelPath = `${import.meta.env.BASE_URL}models/gesture_recognizer.task`,
    private readonly wasmPath = `${import.meta.env.BASE_URL}wasm`,
    private readonly modelVersion = "v1",
  ) {
    this.worker = new Worker(new URL("./gesture-worker.ts", import.meta.url), { type: "module" });
  }

  async start(video: HTMLVideoElement): Promise<void> {
    this.stream = await this.requestCameraStream();
    video.srcObject = this.stream;
    await video.play();
    this.modelInit = new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
        this.modelError = new Error("GESTURE_RECOGNIZER_TIMEOUT");
        resolve();
      }, 15_000);
      const onMessage = (event: MessageEvent<RecognitionMessage>) => {
        if (event.data.type === "ready") {
          this.worker.removeEventListener("message", onMessage);
          this.worker.removeEventListener("error", onError);
          window.clearTimeout(timeout);
          this.modelReady = true;
          resolve();
        }
        if (event.data.type === "error") {
          this.worker.removeEventListener("message", onMessage);
          this.worker.removeEventListener("error", onError);
          window.clearTimeout(timeout);
          this.modelError = new Error(event.data.message);
          resolve();
        }
      };
      const onError = () => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
        window.clearTimeout(timeout);
        this.modelError = new Error("GESTURE_RECOGNIZER_WORKER_FAILED");
        resolve();
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);
      this.worker.postMessage({ type: "init", modelPath: this.modelPath, wasmPath: this.wasmPath, modelVersion: this.modelVersion });
    });
  }

  private async requestCameraStream(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNSUPPORTED");
    const constraints: MediaStreamConstraints = {
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false,
    };
    return new Promise<MediaStream>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        settled = true;
        reject(new Error("CAMERA_PERMISSION_TIMEOUT"));
      }, 10_000);
      navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
          if (settled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          settled = true;
          window.clearTimeout(timeout);
          resolve(stream);
        },
        (error: unknown) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          reject(normalizeCameraError(error));
        },
      );
    });
  }

  async recognize(video: HTMLVideoElement, timestamp = performance.now()): Promise<CameraRecognitionResult> {
    if (this.modelInit) await this.modelInit;
    if (!this.modelReady) throw this.modelError ?? new Error("GESTURE_RECOGNIZER_NOT_READY");
    const bitmap = await createImageBitmap(video);
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
        reject(new Error("GESTURE_RECOGNIZER_TIMEOUT"));
      }, 10_000);
      const onMessage = (event: MessageEvent<RecognitionMessage>) => {
        if (event.data.type === "result") {
          this.worker.removeEventListener("message", onMessage);
          this.worker.removeEventListener("error", onError);
          window.clearTimeout(timeout);
          resolve({ hand: event.data.hand, confidence: event.data.confidence, modelVersion: event.data.modelVersion });
        }
        if (event.data.type === "error") {
          this.worker.removeEventListener("message", onMessage);
          this.worker.removeEventListener("error", onError);
          window.clearTimeout(timeout);
          reject(new Error(event.data.message));
        }
      };
      const onError = () => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
        window.clearTimeout(timeout);
        reject(new Error("GESTURE_RECOGNIZER_WORKER_FAILED"));
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);
      this.worker.postMessage({ type: "frame", bitmap, timestamp }, [bitmap]);
    });
  }

  async recognizeStable(video: HTMLVideoElement, frames = 2): Promise<CameraRecognitionResult> {
    let history: CameraRecognitionResult["hand"][] = [];
    let latest: CameraRecognitionResult = { hand: "unknown", confidence: 0, modelVersion: this.modelVersion };
    for (let index = 0; index < frames; index += 1) {
      latest = await this.recognize(video, performance.now());
      const stable = observeStableHand(history.filter((hand): hand is Exclude<typeof hand, "unknown"> => hand !== "unknown"), latest.hand, frames);
      history = stable.history;
      if (stable.hand !== "unknown") return { ...latest, hand: stable.hand };
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    return { ...latest, hand: "unknown" };
  }

  stop(video?: HTMLVideoElement): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (video) video.srcObject = null;
    this.worker.terminate();
  }
}

export function normalizeCameraError(error: unknown): Error {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return new Error("CAMERA_PERMISSION_DENIED");
  if (name === "NotFoundError" || name === "OverconstrainedError") return new Error("CAMERA_MISSING");
  if (name === "NotReadableError" || name === "AbortError") return new Error("CAMERA_BUSY");
  return error instanceof Error ? error : new Error("CAMERA_ACCESS_FAILED");
}
