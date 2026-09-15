import { describe, expect, it } from "vitest";
import { observeStableHand } from "./gesture-stability";

describe("gesture stability", () => {
  it("requires consecutive matching frames", () => {
    let history: Array<"rock" | "paper" | "scissors"> = [];
    let output = observeStableHand(history, "rock");
    history = output.history;
    expect(output.hand).toBe("unknown");
    output = observeStableHand(history, "rock");
    history = output.history;
    expect(output.hand).toBe("unknown");
    output = observeStableHand(history, "rock");
    expect(output.hand).toBe("rock");
  });

  it("resets after an unknown frame", () => {
    const output = observeStableHand(["rock", "rock"], "unknown");
    expect(output).toEqual({ history: [], hand: "unknown" });
  });
});
