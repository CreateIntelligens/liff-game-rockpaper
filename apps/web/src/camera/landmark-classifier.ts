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

function isFingerExtended(
  landmarks: HandLandmark[],
  mcpIndex: number,
  pipIndex: number,
  dipIndex: number,
  tipIndex: number,
): boolean {
  const wrist = landmarks[0];
  const mcp = landmarks[mcpIndex];
  const pip = landmarks[pipIndex];
  const dip = landmarks[dipIndex];
  const tip = landmarks[tipIndex];
  if (!wrist || !mcp || !pip || !dip || !tip) return false;

  const tipWrist = distance(tip, wrist);
  const pipWrist = distance(pip, wrist);
  const wristRatio = tipWrist / Math.max(pipWrist, 0.001);
  const pipAngle = angleAtJoint(mcp, pip, dip);
  const dipAngle = angleAtJoint(pip, dip, tip);
  const tipMcp = distance(tip, mcp);
  const pipMcp = distance(pip, mcp);

  // Standard extension (upright, tilted, rotated): tip is clearly further from wrist than PIP
  if (wristRatio > 1.08 && pipAngle >= 120) return true;

  // Foreshortened extension (fingers pointing towards camera):
  // PIP joint is straight and tip extends forward beyond PIP relative to MCP
  if (pipAngle >= 135 && (dipAngle >= 120 || tipMcp > pipMcp * 1.05)) return true;

  return false;
}

export function classifyRpsLandmarks(landmarks: HandLandmark[] | undefined): Hand | "unknown" {
  if (!landmarks || landmarks.length < 21) return "unknown";
  if (landmarks.some((landmark) => !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y) || !Number.isFinite(landmark.z))) {
    return "unknown";
  }

  const indexExt = isFingerExtended(landmarks, 5, 6, 7, 8);
  const middleExt = isFingerExtended(landmarks, 9, 10, 11, 12);
  const ringExt = isFingerExtended(landmarks, 13, 14, 15, 16);
  const pinkyExt = isFingerExtended(landmarks, 17, 18, 19, 20);

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  // Paper: all 4 fingers extended, or 3 extended including pinky (scissors never extends pinky)
  if (extendedCount === 4 || (extendedCount >= 3 && pinkyExt && (!indexExt || !middleExt))) {
    return "paper";
  }

  // Scissors: index and middle are extended, pinky is folded (tolerates ring falsely reported extended)
  if (indexExt && middleExt && !pinkyExt && extendedCount < 4) {
    return "scissors";
  }

  // Rock: 0 fingers extended
  if (extendedCount === 0) {
    return "rock";
  }

  return "unknown";
}
