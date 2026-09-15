import { describe, expect, it } from "vitest";
import { assertValidGameInput, playGame, resolveResult, type CampaignRule, type GameRecordPort } from "./index.js";

describe("rock-paper-scissors domain", () => {
  it("resolves a player win", () => {
    expect(resolveResult("rock", "scissors")).toBe("win");
  });

  it("resolves a draw", () => {
    expect(resolveResult("paper", "paper")).toBe("draw");
  });

  it("requires a hand for non-random play", () => {
    expect(() => assertValidGameInput({ mode: "manual" })).toThrow();
  });

  it("allows random mode to be resolved by the server", () => {
    expect(() => assertValidGameInput({ mode: "random" })).not.toThrow();
  });

  it("lets the server generate random fallback input and host hand", async () => {
    const rule: CampaignRule = {
      id: "v1",
      initialEnergy: 3,
      energyCap: 3,
      energyCost: 1,
      referralEnergyReward: 1,
      fallbackEnabled: true,
      fallbackModes: ["random"],
      timezone: "Asia/Taipei",
      invitationLeaderboardEnabled: true,
      winLeaderboardEnabled: true,
    };
    const saved: GameRecordPort = {
      id: "game-1",
      memberId: "member-1",
      requestId: "request-1",
      mode: "random",
      playerHand: "rock",
      hostHand: "scissors",
      result: "win",
      ruleVersion: "v1",
      assetVersion: "v1",
      createdAt: new Date().toISOString(),
    };
    const store = {
      getRuleVersion: async () => ({ rule, assetVersion: "assets-v1" }),
      findGameByRequestId: async () => null,
      createGame: async () => saved,
    };
    let index = 0;
    const random = { pick: <T>(items: readonly T[]) => items[index++ === 0 ? 0 : 2] };

    const result = await playGame(store, random, "member-1", "request-1", { mode: "random" });

    expect(result.result).toBe("win");
    expect(result.playerHand).toBe("rock");
  });
});
