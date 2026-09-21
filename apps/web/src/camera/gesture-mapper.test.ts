import { describe, expect, it } from "vitest";
import { mapGestureCategory } from "./gesture-mapper";

describe("MediaPipe gesture mapping", () => {
  it.each([
    ["Closed_Fist", "rock"],
    ["Open_Palm", "paper"],
    ["Victory", "scissors"],
  ] as const)("maps %s to %s", (category, hand) => {
    expect(mapGestureCategory(category, 0.9)).toBe(hand);
  });

  it("rejects unknown and low-confidence gestures", () => {
    expect(mapGestureCategory("Thumb_Up", 0.99)).toBe("unknown");
    expect(mapGestureCategory("Victory", 0.44)).toBe("unknown");
  });

  it("accepts a lower-confidence Victory when the frame is still above the tuned threshold", () => {
    expect(mapGestureCategory("Victory", 0.45)).toBe("scissors");
  });
});
