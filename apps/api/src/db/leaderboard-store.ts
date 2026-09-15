import type { LeaderboardEntry, LeaderboardStore, LeaderboardType } from "@rockpaper/ports";
import type { SqliteDatabase } from "./sqlite.js";

type ScoreRow = { id: string; display_name: string | null; score: number };

function maskName(displayName: string | null, memberId: string): string {
  if (displayName?.trim()) return `${displayName.trim().slice(0, 1)}••`;
  return `會員-${memberId.slice(-4)}`;
}

export function createSqliteLeaderboardStore(database: SqliteDatabase): LeaderboardStore {
  const { raw } = database;

  function query(type: LeaderboardType, limit: number): LeaderboardEntry[] {
    const rows = (type === "invitations"
      ? raw
          .prepare(
            "SELECT m.id, m.display_name, COUNT(r.id) AS score FROM members m LEFT JOIN referrals r ON r.inviter_member_id = m.id AND r.status = 'valid' GROUP BY m.id ORDER BY score DESC, m.created_at ASC, m.id ASC LIMIT ?",
          )
          .all(limit)
      : raw
          .prepare(
            "SELECT m.id, m.display_name, COUNT(g.id) AS score FROM members m LEFT JOIN games g ON g.member_id = m.id AND g.result = 'win' GROUP BY m.id ORDER BY score DESC, m.created_at ASC, m.id ASC LIMIT ?",
          )
          .all(limit)) as ScoreRow[];

    return rows.map((row, index) => ({
      memberId: row.id,
      rank: index + 1,
      score: row.score,
      maskedName: maskName(row.display_name, row.id),
    }));
  }

  return {
    async list(type, limit) {
      return query(type, Math.min(Math.max(limit, 1), 100));
    },

    async getMemberRanks(memberId) {
      const result = { invitations: null, wins: null } as Awaited<ReturnType<LeaderboardStore["getMemberRanks"]>>;
      for (const type of ["invitations", "wins"] as const) {
        result[type] = query(type, 10000).find((entry) => entry.memberId === memberId) ?? null;
      }
      return result;
    },
  };
}
