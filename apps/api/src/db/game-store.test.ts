import { describe, expect, it } from "vitest";
import type { CampaignRule } from "@rockpaper/core";
import { createSqliteGameStore } from "./game-store.js";
import { createSqliteDatabase } from "./sqlite.js";

const rule: CampaignRule = {
  id: "v1",
  initialEnergy: 3,
  energyCap: 3,
  energyCost: 1,
  referralEnergyReward: 1,
  fallbackEnabled: true,
  fallbackModes: ["manual", "random"],
  timezone: "Asia/Taipei",
  invitationLeaderboardEnabled: true,
  winLeaderboardEnabled: true,
};

describe("SQLite game store", () => {
  it("tracks initial energy, consumes once, and deduplicates retries", async () => {
    const database = createSqliteDatabase(":memory:");
    const store = createSqliteGameStore(database, () => new Date("2026-09-15T00:00:00.000Z"));
    store.activateCampaignVersion({ rule, asset: { version: "assets-v1" } });
    await store.ensureMember({ memberId: "member-1", lineUserId: "line-1" }, rule.initialEnergy);

    const input = {
      memberId: "member-1",
      requestId: "request-1",
      input: { mode: "manual" as const, playerHand: "rock" as const },
      outcome: { playerHand: "rock" as const, hostHand: "scissors" as const, result: "win" as const },
      ruleVersion: "v1",
      assetVersion: "assets-v1",
    };

    const first = await store.createGame(input);
    const retry = await store.createGame(input);

    store.activateCampaignVersion({ rule: { ...rule, id: "v2" }, asset: { version: "assets-v2" } });

    expect(first.id).toBe(retry.id);
    expect(first.ruleVersion).toBe("v1");
    expect((await store.getRuleVersion()).rule.id).toBe("v2");
    expect(await store.getEnergy("member-1")).toBe(2);
    expect((await store.listGames("member-1")).length).toBe(1);

    await store.createGame({ ...input, requestId: "request-2" });
    await store.createGame({ ...input, requestId: "request-3" });
    await expect(store.createGame({ ...input, requestId: "request-4" })).rejects.toThrow("INSUFFICIENT_ENERGY");

    database.raw.close();
  });
});
