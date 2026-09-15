import type { Hand } from "@rockpaper/core";

export type StableHand = Hand | "unknown";

export function observeStableHand(history: Hand[], next: StableHand, requiredFrames = 3): { history: Hand[]; hand: StableHand } {
  if (next === "unknown") return { history: [], hand: "unknown" };
  const nextHistory = [...history, next].slice(-requiredFrames);
  const stable = nextHistory.length === requiredFrames && nextHistory.every((hand) => hand === next);
  return { history: nextHistory, hand: stable ? next : "unknown" };
}
