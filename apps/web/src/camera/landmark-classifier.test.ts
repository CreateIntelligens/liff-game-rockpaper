import { describe, expect, it } from "vitest";
import { classifyRpsLandmarks, type HandLandmark } from "./landmark-classifier";

function landmarksWithExtendedFingers(extended: number[]): HandLandmark[] {
  const points = Array.from({ length: 21 }, () => ({ x: 0, y: 0.2, z: 0 }));
  points[0] = { x: 0, y: 1, z: 0 };
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
    points[pip] = { x: tip / 100, y: 0.65, z: 0 };
    points[tip] = extended.includes(tip)
      ? { x: tip / 100, y: 0.1, z: 0 }
      : { x: tip / 100, y: 0.78, z: 0 };
  }
  return points;
}

describe("RPS landmark classifier", () => {
  it("classifies a closed hand as rock", () => {
    expect(classifyRpsLandmarks(landmarksWithExtendedFingers([]))).toBe("rock");
  });

  it("classifies an open hand as paper", () => {
    expect(classifyRpsLandmarks(landmarksWithExtendedFingers([8, 12, 16, 20]))).toBe("paper");
  });

  it("classifies index and middle fingers as scissors", () => {
    expect(classifyRpsLandmarks(landmarksWithExtendedFingers([8, 12]))).toBe("scissors");
  });
});
