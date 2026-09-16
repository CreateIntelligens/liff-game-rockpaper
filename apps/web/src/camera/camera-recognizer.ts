import type { CameraRecognitionResult } from "@rockpaper/ports";
import { observeStableHand } from "./gesture-stability";

type RecognitionMessage =
  | { type: "ready"; modelVersion: string }
  | { type: "result"; hand: CameraRecognitionResult["hand"]; confidence: number; modelVersion: string }
  | { type: "error"; message: string };

export class CameraRecognizer {
  private readonly worker: Worker;
  private stream: MediaStream | null = null;

  constructor(
    private readonly modelPath = `${import.meta.env.BASE_URL}models/gesture_recognizer.task`,
    private readonly wasmPath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
    private readonly modelVersion = "v1",
  ) {
    this.worker = new Worker(new URL("./gesture-worker.ts", import.meta.url), { type: "module" });
  }

  async start(video: HTMLVideoElement): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = this.stream;
    await video.play();
    await new Promise<void>((resolve, reject) => {
      const onMessage = (event: MessageEvent<RecognitionMessage>) => {
        if (event.data.type === "ready") {
          this.worker.removeEventListener("message", onMessage);
          resolve();
        }
        if (event.data.type === "error") {
          this.worker.removeEventListener("message", onMessage);
          reject(new Error(event.data.message));
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage({ type: "init", modelPath: this.modelPath, wasmPath: this.wasmPath, modelVersion: this.modelVersion });
    });
  }

  async recognize(video: HTMLVideoElement, timestamp = performance.now()): Promise<CameraRecognitionResult> {
    const bitmap = await createImageBitmap(video);
    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<RecognitionMessage>) => {
        if (event.data.type === "result") {
          this.worker.removeEventListener("message", onMessage);
          resolve({ hand: event.data.hand, confidence: event.data.confidence, modelVersion: event.data.modelVersion });
        }
        if (event.data.type === "error") {
          this.worker.removeEventListener("message", onMessage);
          reject(new Error(event.data.message));
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage({ type: "frame", bitmap, timestamp }, [bitmap]);
    });
  }

  async recognizeStable(video: HTMLVideoElement, frames = 3): Promise<CameraRecognitionResult> {
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
