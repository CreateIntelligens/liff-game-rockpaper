import type { Hand } from "@rockpaper/core";

export const GESTURE_CONFIDENCE_THRESHOLD = 0.45;

const gestureToHand: Record<string, Hand> = {
  Closed_Fist: "rock",
  Open_Palm: "paper",
  Victory: "scissors",
};

export function mapGestureCategory(categoryName: string | undefined, confidence: number, threshold = GESTURE_CONFIDENCE_THRESHOLD): Hand | "unknown" {
  if (!categoryName || confidence < threshold) return "unknown";
  return gestureToHand[categoryName] ?? "unknown";
}
