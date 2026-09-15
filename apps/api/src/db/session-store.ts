import { randomUUID } from "node:crypto";
import type { SessionStore } from "@rockpaper/ports";
import type { SqliteDatabase } from "./sqlite.js";

export function createSqliteSessionStore(database: SqliteDatabase, now: () => Date = () => new Date()): SessionStore {
  const { raw } = database;

  return {
    async createSession(memberId, expiresAt) {
      const id = randomUUID();
      raw
        .prepare(
          "INSERT INTO sessions (id, member_id, expires_at, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(member_id) DO UPDATE SET id = excluded.id, expires_at = excluded.expires_at, created_at = excluded.created_at",
        )
        .run(id, memberId, expiresAt, now().toISOString());
      return id;
    },

    async getMemberId(sessionId) {
      const row = raw
        .prepare("SELECT member_id, expires_at FROM sessions WHERE id = ?")
        .get(sessionId) as { member_id: string; expires_at: string } | undefined;
      if (!row) return null;
      if (new Date(row.expires_at).getTime() <= now().getTime()) {
        raw.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
        return null;
      }
      return row.member_id;
    },
  };
}
