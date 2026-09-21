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

type FingerState = "extended" | "folded" | "unknown";

function fingerState(landmarks: HandLandmark[], mcpIndex: number, pipIndex: number, dipIndex: number, tipIndex: number): FingerState {
  const wrist = landmarks[0];
  const mcp = landmarks[mcpIndex];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const dip = landmarks[dipIndex];
  if (!wrist || !mcp || !tip || !pip || !dip) return "unknown";
  const wristDistanceRatio = distance(tip, wrist) / Math.max(distance(pip, wrist), 0.001);
  const mcpAngle = angleAtJoint(wrist, mcp, pip);
  const pipAngle = angleAtJoint(mcp, pip, dip);
  const dipAngle = angleAtJoint(pip, dip, tip);
  const extendedAngles = [mcpAngle, pipAngle, dipAngle].filter((angle) => angle >= 135).length;
  const foldedAngles = [mcpAngle, pipAngle, dipAngle].filter((angle) => angle <= 120).length;
  if (extendedAngles >= 2 && (pipAngle >= 145 || wristDistanceRatio > 1.08)) return "extended";
  if (foldedAngles >= 2 || wristDistanceRatio < 0.92) return "folded";
  return "unknown";
}

export function classifyRpsLandmarks(landmarks: HandLandmark[] | undefined): Hand | "unknown" {
  if (!landmarks || landmarks.length < 21) return "unknown";
  if (landmarks.some((landmark) => !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y) || !Number.isFinite(landmark.z))) {
    return "unknown";
  }
  const states = [
    fingerState(landmarks, 5, 6, 7, 8),
    fingerState(landmarks, 9, 10, 11, 12),
    fingerState(landmarks, 13, 14, 15, 16),
    fingerState(landmarks, 17, 18, 19, 20),
  ];
  const [index, middle, ring, pinky] = states;
  const extendedCount = states.filter((state) => state === "extended").length;
  const foldedCount = states.filter((state) => state === "folded").length;

  if (index === "extended" && middle === "extended" && extendedCount < 4) return "scissors";
  if (extendedCount === 4) return "paper";
  if (extendedCount === 0 && foldedCount >= 3) return "rock";
  return "unknown";
}
