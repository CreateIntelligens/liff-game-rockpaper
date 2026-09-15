import { describe, expect, it } from "vitest";
import { createSqliteDatabase } from "./sqlite.js";
import { createSqliteLeaderboardStore } from "./leaderboard-store.js";

describe("SQLite leaderboard store", () => {
  it("returns masked invitation and win rankings", async () => {
    const database = createSqliteDatabase(":memory:");
    const now = new Date().toISOString();
    const insertMember = database.raw.prepare("INSERT INTO members (id, line_user_id, display_name, created_at) VALUES (?, ?, ?, ?)");
    insertMember.run("member-a", "line-a", "Alice", now);
    insertMember.run("member-b", "line-b", "Bob", now);
    database.raw
      .prepare("INSERT INTO referrals (id, inviter_member_id, invited_member_id, status, created_at) VALUES (?, ?, ?, 'valid', ?)")
      .run("ref-1", "member-a", "member-b", now);
    database.raw
      .prepare(
        "INSERT INTO games (id, member_id, request_id, mode, player_hand, host_hand, result, rule_version, asset_version, created_at) VALUES (?, ?, ?, 'manual', 'rock', 'scissors', 'win', 'v1', 'assets-v1', ?)",
      )
      .run("game-1", "member-a", "request-1", now);

    const store = createSqliteLeaderboardStore(database);
    const invitations = await store.list("invitations", 10);
    const wins = await store.list("wins", 10);
    expect(invitations[0]).toMatchObject({ memberId: "member-a", rank: 1, score: 1, maskedName: "A••" });
    expect(wins[0]).toMatchObject({ memberId: "member-a", rank: 1, score: 1, maskedName: "A••" });
    await expect(store.getMemberRanks("member-a")).resolves.toMatchObject({
      invitations: { rank: 1 },
      wins: { rank: 1 },
    });

    database.raw.close();
  });
});
