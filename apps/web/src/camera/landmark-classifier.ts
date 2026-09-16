import type { Hand } from "@rockpaper/core";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function fingerExtended(landmarks: HandLandmark[], tipIndex: number, pipIndex: number): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  if (!wrist || !tip || !pip) return false;
  return distance(tip, wrist) > distance(pip, wrist) * 1.18;
}

export function classifyRpsLandmarks(landmarks: HandLandmark[] | undefined): Hand | "unknown" {
  if (!landmarks || landmarks.length < 21) return "unknown";
  const index = fingerExtended(landmarks, 8, 6);
  const middle = fingerExtended(landmarks, 12, 10);
  const ring = fingerExtended(landmarks, 16, 14);
  const pinky = fingerExtended(landmarks, 20, 18);
  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length;

  if (extendedCount === 0) return "rock";
  if (extendedCount >= 3) return "paper";
  if (index && middle && !ring && !pinky) return "scissors";
  return "unknown";
}
