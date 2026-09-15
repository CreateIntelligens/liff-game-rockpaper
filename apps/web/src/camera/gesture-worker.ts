import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { mapGestureCategory } from "./gesture-mapper";

type InitMessage = { type: "init"; modelPath: string; wasmPath: string; modelVersion: string };
type FrameMessage = { type: "frame"; bitmap: ImageBitmap; timestamp: number };
type WorkerMessage = InitMessage | FrameMessage;

let recognizer: GestureRecognizer | null = null;
let modelVersion = "unknown";

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === "init") {
    const vision = await FilesetResolver.forVisionTasks(event.data.wasmPath);
    recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: event.data.modelPath },
      runningMode: "VIDEO",
      numHands: 1,
      cannedGesturesClassifierOptions: {
        categoryAllowlist: ["Closed_Fist", "Open_Palm", "Victory"],
        scoreThreshold: 0.6,
      },
    });
    modelVersion = event.data.modelVersion;
    self.postMessage({ type: "ready", modelVersion });
    return;
  }

  if (!recognizer) {
    self.postMessage({ type: "error", message: "GESTURE_RECOGNIZER_NOT_READY" });
    event.data.bitmap.close();
    return;
  }

  const result = recognizer.recognizeForVideo(event.data.bitmap, event.data.timestamp);
  event.data.bitmap.close();
  const handCount = result.landmarks.length;
  const category = handCount === 1 ? result.gestures[0]?.[0] : undefined;
  const confidence = category?.score ?? 0;
  self.postMessage({
    type: "result",
    hand: handCount === 1 ? mapGestureCategory(category?.categoryName, confidence) : "unknown",
    confidence,
    modelVersion,
  });
};
