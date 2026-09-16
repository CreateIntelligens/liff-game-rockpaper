import { describe, expect, it } from "vitest";
import { canStartGame } from "./availability";

describe("game availability", () => {
  it("blocks camera and fallback play when energy is empty", () => {
    expect(canStartGame(0)).toBe(false);
  });

  it("allows play while energy remains", () => {
    expect(canStartGame(1)).toBe(true);
  });

  it("keeps the game unavailable while energy is still loading", () => {
    expect(canStartGame(null)).toBe(false);
  });
});
