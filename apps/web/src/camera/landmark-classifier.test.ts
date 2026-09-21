import { describe, expect, it } from "vitest";
import { classifyRpsLandmarks, type HandLandmark } from "./landmark-classifier";

function landmarksWithExtendedFingers(extended: number[]): HandLandmark[] {
  const points = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  points[0] = { x: 0, y: 0.8, z: 0 };
  for (const [mcp, pip, dip, tip] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]) {
    const x = tip / 100;
    points[mcp] = { x, y: 0.35, z: 0 };
    if (extended.includes(tip)) {
      points[pip] = { x, y: 0.05, z: 0 };
      points[dip] = { x, y: -0.25, z: 0 };
      points[tip] = { x, y: -0.55, z: 0 };
    } else {
      points[pip] = { x, y: 0.12, z: 0 };
      points[dip] = { x: x + 0.12, y: 0.12, z: 0 };
      points[tip] = { x: x + 0.2, y: 0.3, z: 0 };
    }
  }
  return points;
}

function rotateLandmarks(landmarks: HandLandmark[], degrees: number): HandLandmark[] {
  const angle = degrees * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return landmarks.map((point) => ({
    ...point,
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }));
}

function foreshortenedScissors(): HandLandmark[] {
  const points = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  points[0] = { x: 0, y: 0, z: 0.8 };
  for (const [mcp, pip, dip, tip, x] of [[5, 6, 7, 8, -0.12], [9, 10, 11, 12, 0.12]]) {
    points[mcp] = { x, y: 0, z: 0.3 };
    points[pip] = { x, y: 0, z: 0.4 };
    points[dip] = { x, y: 0, z: 0.5 };
    points[tip] = { x, y: 0, z: 0.6 };
  }
  for (const [mcp, pip, dip, tip, x] of [[13, 14, 15, 16, 0.28], [17, 18, 19, 20, 0.4]]) {
    points[mcp] = { x, y: 0, z: 0.3 };
    points[pip] = { x, y: 0, z: 0.5 };
    points[dip] = { x: x + 0.12, y: 0, z: 0.55 };
    points[tip] = { x: x + 0.2, y: 0, z: 0.5 };
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

  it("classifies a rotated scissors gesture", () => {
    const rotated = rotateLandmarks(landmarksWithExtendedFingers([8, 12]), 70);
    expect(classifyRpsLandmarks(rotated)).toBe("scissors");
  });

  it("classifies scissors when the extended fingers are foreshortened toward the camera", () => {
    expect(classifyRpsLandmarks(foreshortenedScissors())).toBe("scissors");
  });
});
