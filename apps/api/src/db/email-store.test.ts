import { describe, expect, it } from "vitest";
import { createSqliteDatabase } from "./sqlite.js";
import { createSqliteEmailDeliveryStore } from "./email-store.js";

describe("SQLite email delivery store", () => {
  it("skips missing recipients and keeps queued messages idempotent", async () => {
    const database = createSqliteDatabase(":memory:");
    const now = new Date().toISOString();
    database.raw.prepare("INSERT INTO members (id, line_user_id, created_at) VALUES (?, ?, ?)").run("member", "line", now);
    database.raw
      .prepare(
        "INSERT INTO games (id, member_id, request_id, mode, player_hand, host_hand, result, rule_version, asset_version, created_at) VALUES (?, ?, ?, 'manual', 'rock', 'scissors', 'win', 'v1', 'assets-v1', ?)",
      )
      .run("game", "member", "request", now);

    const store = createSqliteEmailDeliveryStore(database);
    await expect(store.enqueue({ gameId: "game", memberId: "member", recipient: null, subject: "Result", html: "<p>Win</p>" })).resolves.toMatchObject({ status: "skipped" });
    await expect(store.enqueue({ gameId: "game", memberId: "member", recipient: "member@example.com", subject: "Result", html: "<p>Win</p>" })).resolves.toMatchObject({ status: "skipped" });

    database.raw.close();
  });
});
