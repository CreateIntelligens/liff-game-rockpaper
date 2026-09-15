import type { Hand } from "@rockpaper/core";

const gestureToHand: Record<string, Hand> = {
  Closed_Fist: "rock",
  Open_Palm: "paper",
  Victory: "scissors",
};

export function mapGestureCategory(categoryName: string | undefined, confidence: number, threshold = 0.6): Hand | "unknown" {
  if (!categoryName || confidence < threshold) return "unknown";
  return gestureToHand[categoryName] ?? "unknown";
}
