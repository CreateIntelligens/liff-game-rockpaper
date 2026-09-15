import { randomUUID } from "node:crypto";
import type { EmailDelivery, EmailDeliveryStore } from "@rockpaper/ports";
import type { SqliteDatabase } from "./sqlite.js";

type DeliveryRow = {
  id: string;
  game_id: string;
  member_id: string;
  recipient: string | null;
  subject: string;
  html: string;
  status: EmailDelivery["status"];
  provider_message_id: string | null;
  retry_count: number;
  last_error: string | null;
};

function toDelivery(row: DeliveryRow): EmailDelivery {
  return {
    id: row.id,
    gameId: row.game_id,
    memberId: row.member_id,
    recipient: row.recipient,
    status: row.status,
    providerMessageId: row.provider_message_id ?? undefined,
    retryCount: row.retry_count,
    lastError: row.last_error ?? undefined,
  };
}

export function createSqliteEmailDeliveryStore(database: SqliteDatabase, now: () => Date = () => new Date()): EmailDeliveryStore {
  const { raw } = database;
  return {
    async enqueue({ gameId, memberId, recipient, subject, html }) {
      const id = randomUUID();
      const status = recipient ? "queued" : "skipped";
      raw
        .prepare(
          "INSERT INTO email_deliveries (id, game_id, member_id, recipient, subject, html, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(game_id) DO NOTHING",
        )
        .run(id, gameId, memberId, recipient, subject, html, status, now().toISOString(), now().toISOString());
      const row = raw.prepare("SELECT * FROM email_deliveries WHERE game_id = ?").get(gameId) as DeliveryRow;
      return toDelivery(row);
    },

    async listQueued(limit) {
      const rows = raw
        .prepare("SELECT * FROM email_deliveries WHERE status = 'queued' AND retry_count < 5 ORDER BY created_at ASC LIMIT ?")
        .all(Math.min(Math.max(limit, 1), 100)) as DeliveryRow[];
      return rows.map((row) => ({ ...toDelivery(row), subject: row.subject, html: row.html }));
    },

    async markSent(id, providerMessageId) {
      raw
        .prepare("UPDATE email_deliveries SET status = 'sent', provider_message_id = ?, updated_at = ? WHERE id = ?")
        .run(providerMessageId, now().toISOString(), id);
    },

    async markRetry(id, error, maxRetries) {
      raw
        .prepare(
          "UPDATE email_deliveries SET status = CASE WHEN retry_count + 1 >= ? THEN 'failed' ELSE 'queued' END, retry_count = retry_count + 1, last_error = ?, updated_at = ? WHERE id = ?",
        )
        .run(maxRetries, error.slice(0, 500), now().toISOString(), id);
    },

    async getMemberDeliveries(memberId) {
      const rows = raw
        .prepare("SELECT * FROM email_deliveries WHERE member_id = ? ORDER BY created_at DESC")
        .all(memberId) as DeliveryRow[];
      return rows.map(toDelivery);
    },
  };
}
