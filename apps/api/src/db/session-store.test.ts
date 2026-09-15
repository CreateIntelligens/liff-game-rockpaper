import { describe, expect, it } from "vitest";
import { createSqliteDatabase } from "./sqlite.js";
import { createSqliteSessionStore } from "./session-store.js";

describe("SQLite session store", () => {
  it("expires sessions and returns the owning member", async () => {
    const database = createSqliteDatabase(":memory:");
    let current = new Date("2026-09-15T00:00:00.000Z");
    const store = createSqliteSessionStore(database, () => current);

    database.raw
      .prepare("INSERT INTO members (id, line_user_id, created_at) VALUES (?, ?, ?)")
      .run("member-1", "line-1", current.toISOString());
    const sessionId = await store.createSession("member-1", "2026-09-15T01:00:00.000Z");

    expect(await store.getMemberId(sessionId)).toBe("member-1");
    current = new Date("2026-09-15T02:00:00.000Z");
    expect(await store.getMemberId(sessionId)).toBeNull();

    database.raw.close();
  });
});
