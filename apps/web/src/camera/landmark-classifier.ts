import type { Hand } from "@rockpaper/core";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function angleAtJoint(a: HandLandmark, joint: HandLandmark, c: HandLandmark): number {
  const first = { x: a.x - joint.x, y: a.y - joint.y, z: a.z - joint.z };
  const second = { x: c.x - joint.x, y: c.y - joint.y, z: c.z - joint.z };
  const firstLength = Math.hypot(first.x, first.y, first.z);
  const secondLength = Math.hypot(second.x, second.y, second.z);
  if (firstLength === 0 || secondLength === 0) return 0;
  const cosine = (first.x * second.x + first.y * second.y + first.z * second.z) / (firstLength * secondLength);
  return Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI;
}

function fingerExtended(landmarks: HandLandmark[], mcpIndex: number, pipIndex: number, dipIndex: number, tipIndex: number): boolean {
  const wrist = landmarks[0];
  const mcp = landmarks[mcpIndex];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const dip = landmarks[dipIndex];
  if (!wrist || !mcp || !tip || !pip || !dip) return false;
  const wristDistanceRatio = distance(tip, wrist) / Math.max(distance(pip, wrist), 0.001);
  const jointAngle = angleAtJoint(mcp, pip, dip);
  return jointAngle >= 145 || (jointAngle >= 120 && wristDistanceRatio > 1.08);
}

export function classifyRpsLandmarks(landmarks: HandLandmark[] | undefined): Hand | "unknown" {
  if (!landmarks || landmarks.length < 21) return "unknown";
  const index = fingerExtended(landmarks, 5, 6, 7, 8);
  const middle = fingerExtended(landmarks, 9, 10, 11, 12);
  const ring = fingerExtended(landmarks, 13, 14, 15, 16);
  const pinky = fingerExtended(landmarks, 17, 18, 19, 20);
  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length;

  if (extendedCount === 0) return "rock";
  if (extendedCount >= 3) return "paper";
  if (index && middle && !ring && !pinky) return "scissors";
  return "unknown";
}
