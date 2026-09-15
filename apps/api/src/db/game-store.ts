import { randomUUID } from "node:crypto";
import type { CampaignRule, GameInput, GameOutcome } from "@rockpaper/core";
import type { GameRecord, GameStore, MemberIdentity } from "@rockpaper/ports";
import { campaignRuleSchema } from "@rockpaper/config";
import type { SqliteDatabase } from "./sqlite.js";

type GameRow = {
  id: string;
  member_id: string;
  request_id: string;
  mode: string;
  player_hand: GameRecord["playerHand"];
  host_hand: GameRecord["hostHand"];
  result: GameRecord["result"];
  rule_version: string;
  asset_version: string;
  created_at: string;
};

function toGameRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    requestId: row.request_id,
    mode: row.mode as GameInput["mode"],
    playerHand: row.player_hand,
    hostHand: row.host_hand,
    result: row.result,
    ruleVersion: row.rule_version,
    assetVersion: row.asset_version,
    createdAt: row.created_at,
  };
}

export function createSqliteGameStore(database: SqliteDatabase, now: () => Date = () => new Date()): GameStore & {
  activateCampaignVersion(input: { rule: CampaignRule; asset: unknown }): void;
} {
  const { raw } = database;

  function activeRule(): { rule: CampaignRule; assetVersion: string } {
    const row = raw
      .prepare("SELECT id, rule_json, asset_json FROM campaign_versions WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
      .get() as { id: string; rule_json: string; asset_json: string } | undefined;
    if (!row) throw new Error("ACTIVE_CAMPAIGN_NOT_FOUND");

    const rule = campaignRuleSchema.parse(JSON.parse(row.rule_json));
    const asset = JSON.parse(row.asset_json) as { version?: string };
    return { rule, assetVersion: asset.version ?? row.id };
  }

  return {
    activateCampaignVersion({ rule, asset }) {
      const timestamp = now().toISOString();
      const transaction = raw.transaction(() => {
        raw.prepare("UPDATE campaign_versions SET is_active = 0 WHERE is_active = 1").run();
        raw
          .prepare(
            "INSERT OR REPLACE INTO campaign_versions (id, rule_json, asset_json, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
          )
          .run(rule.id, JSON.stringify(rule), JSON.stringify(asset), timestamp);
      });
      transaction();
    },

    async getRuleVersion() {
      return activeRule();
    },

    async getEnergy(memberId) {
      const row = raw
        .prepare("SELECT COALESCE(SUM(delta), 0) AS energy FROM energy_events WHERE member_id = ?")
        .get(memberId) as { energy: number };
      return row.energy;
    },

    async getMemberEmail(memberId) {
      const row = raw.prepare("SELECT email FROM members WHERE id = ?").get(memberId) as { email: string | null } | undefined;
      return row?.email ?? null;
    },

    async addEnergy({ memberId, delta, reason, referenceId, cap }) {
      const transaction = raw.transaction(() => {
        const existing = raw
          .prepare("SELECT id FROM energy_events WHERE member_id = ? AND reason = ? AND reference_id = ?")
          .get(memberId, reason, referenceId) as { id: string } | undefined;
        if (!existing) {
          const current = raw
            .prepare("SELECT COALESCE(SUM(delta), 0) AS energy FROM energy_events WHERE member_id = ?")
            .get(memberId) as { energy: number };
          const next = Math.max(0, Math.min(cap, current.energy + delta));
          const appliedDelta = next - current.energy;
          if (appliedDelta !== 0) {
            raw
              .prepare(
                "INSERT INTO energy_events (id, member_id, delta, reason, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              )
              .run(randomUUID(), memberId, appliedDelta, reason, referenceId, now().toISOString());
          }
          return next;
        }

        const current = raw
          .prepare("SELECT COALESCE(SUM(delta), 0) AS energy FROM energy_events WHERE member_id = ?")
          .get(memberId) as { energy: number };
        return current.energy;
      });
      return transaction() as number;
    },

    async ensureMember(member: MemberIdentity, initialEnergy: number) {
      const timestamp = now().toISOString();
      const transaction = raw.transaction(() => {
        const result = raw
          .prepare(
            "INSERT INTO members (id, line_user_id, email, display_name, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(line_user_id) DO UPDATE SET email = COALESCE(excluded.email, members.email), display_name = COALESCE(excluded.display_name, members.display_name)",
          )
          .run(member.memberId, member.lineUserId, member.email ?? null, member.displayName ?? null, timestamp);

        if (result.changes > 0) {
          raw
            .prepare(
              "INSERT OR IGNORE INTO energy_events (id, member_id, delta, reason, reference_id, created_at) VALUES (?, ?, ?, 'initial', 'campaign', ?)",
            )
            .run(randomUUID(), member.memberId, initialEnergy, timestamp);
        }
      });
      transaction();
    },

    async findGameByRequestId(memberId, requestId) {
      const row = raw
        .prepare("SELECT * FROM games WHERE member_id = ? AND request_id = ?")
        .get(memberId, requestId) as GameRow | undefined;
      return row ? toGameRecord(row) : null;
    },

    async createGame({ memberId, requestId, input, outcome, ruleVersion, assetVersion }) {
      const transaction = raw.transaction(() => {
        const existing = raw
          .prepare("SELECT * FROM games WHERE member_id = ? AND request_id = ?")
          .get(memberId, requestId) as GameRow | undefined;
        if (existing) return toGameRecord(existing);

        const { rule } = activeRule();
        const energy = raw
          .prepare("SELECT COALESCE(SUM(delta), 0) AS energy FROM energy_events WHERE member_id = ?")
          .get(memberId) as { energy: number };
        if (energy.energy < rule.energyCost) throw new Error("INSUFFICIENT_ENERGY");

        const id = randomUUID();
        const timestamp = now().toISOString();
        raw
          .prepare(
            "INSERT INTO games (id, member_id, request_id, mode, player_hand, host_hand, result, rule_version, asset_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(id, memberId, requestId, input.mode, outcome.playerHand, outcome.hostHand, outcome.result, ruleVersion, assetVersion, timestamp);
        raw
          .prepare(
            "INSERT INTO energy_events (id, member_id, delta, reason, reference_id, created_at) VALUES (?, ?, ?, 'game', ?, ?)",
          )
          .run(randomUUID(), memberId, -rule.energyCost, id, timestamp);

        return {
          id,
          memberId,
          requestId,
          mode: input.mode,
          ...outcome,
          ruleVersion,
          assetVersion,
          createdAt: timestamp,
        } satisfies GameRecord;
      });

      return transaction() as GameRecord;
    },

    async listGames(memberId) {
      const rows = raw
        .prepare("SELECT * FROM games WHERE member_id = ? ORDER BY created_at DESC")
        .all(memberId) as GameRow[];
      return rows.map(toGameRecord);
    },
  };
}
