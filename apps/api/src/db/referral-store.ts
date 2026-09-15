import { randomUUID } from "node:crypto";
import type { ReferralResult, ReferralStore } from "@rockpaper/ports";
import type { SqliteDatabase } from "./sqlite.js";

export function createSqliteReferralStore(database: SqliteDatabase, now: () => Date = () => new Date()): ReferralStore {
  const { raw } = database;

  return {
    async createInviteLink(memberId) {
      const existing = raw.prepare("SELECT token FROM referral_links WHERE inviter_member_id = ?").get(memberId) as { token: string } | undefined;
      if (existing) return existing.token;
      const token = randomUUID();
      raw
        .prepare("INSERT INTO referral_links (id, inviter_member_id, token, created_at) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), memberId, token, now().toISOString());
      return token;
    },

    async recordAttribution(token, invitedMemberId) {
      const link = raw.prepare("SELECT inviter_member_id FROM referral_links WHERE token = ?").get(token) as { inviter_member_id: string } | undefined;
      if (!link || link.inviter_member_id === invitedMemberId) return false;
      const result = raw
        .prepare("INSERT INTO referral_attributions (id, token, invited_member_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(invited_member_id) DO UPDATE SET token = excluded.token, created_at = excluded.created_at")
        .run(randomUUID(), token, invitedMemberId, now().toISOString());
      return result.changes > 0;
    },

    async optIn(memberId, _ruleVersion) {
      raw.prepare("UPDATE members SET mgm_opt_in_at = COALESCE(mgm_opt_in_at, ?) WHERE id = ?").run(now().toISOString(), memberId);
    },

    async isOptedIn(memberId) {
      const row = raw.prepare("SELECT mgm_opt_in_at FROM members WHERE id = ?").get(memberId) as { mgm_opt_in_at: string | null } | undefined;
      return Boolean(row?.mgm_opt_in_at);
    },

    async completeReferral({ inviterMemberId, invitedMemberId, attributionSource, isEligibleNewFriend, energyReward, energyCap }) {
      const transaction = raw.transaction((): ReferralResult => {
        const reject = (reason: string): ReferralResult => {
          const id = randomUUID();
          raw
            .prepare(
              "INSERT OR IGNORE INTO referrals (id, inviter_member_id, invited_member_id, status, attribution_source, rejection_reason, created_at) VALUES (?, ?, ?, 'rejected', ?, ?, ?)",
            )
            .run(id, inviterMemberId, invitedMemberId, attributionSource, reason, now().toISOString());
          return { status: "rejected", rewardGranted: 0, rejectionReason: reason };
        };

        if (inviterMemberId === invitedMemberId) return reject("SELF_REFERRAL");
        const inviter = raw.prepare("SELECT mgm_opt_in_at FROM members WHERE id = ?").get(inviterMemberId) as { mgm_opt_in_at: string | null } | undefined;
        if (!inviter?.mgm_opt_in_at) return reject("INVITER_NOT_OPTED_IN");
        if (!isEligibleNewFriend) return reject("NOT_ELIGIBLE_NEW_FRIEND");

        const existing = raw.prepare("SELECT status FROM referrals WHERE invited_member_id = ?").get(invitedMemberId) as { status: string } | undefined;
        if (existing) return { status: existing.status as ReferralResult["status"], rewardGranted: 0 };

        const referralId = randomUUID();
        raw
          .prepare(
            "INSERT INTO referrals (id, inviter_member_id, invited_member_id, status, attribution_source, created_at) VALUES (?, ?, ?, 'valid', ?, ?)",
          )
          .run(referralId, inviterMemberId, invitedMemberId, attributionSource, now().toISOString());

        const current = raw
          .prepare("SELECT COALESCE(SUM(delta), 0) AS energy FROM energy_events WHERE member_id = ?")
          .get(inviterMemberId) as { energy: number };
        const next = Math.max(0, Math.min(energyCap, current.energy + energyReward));
        const applied = next - current.energy;
        if (applied !== 0) {
          raw
            .prepare(
              "INSERT INTO energy_events (id, member_id, delta, reason, reference_id, created_at) VALUES (?, ?, ?, 'referral', ?, ?)",
            )
            .run(randomUUID(), inviterMemberId, applied, referralId, now().toISOString());
        }
        return { status: "valid", rewardGranted: applied };
      });

      return transaction();
    },

    async countValidReferrals(memberId) {
      const row = raw
        .prepare("SELECT COUNT(*) AS count FROM referrals WHERE inviter_member_id = ? AND status = 'valid'")
        .get(memberId) as { count: number };
      return row.count;
    },
  };
}
