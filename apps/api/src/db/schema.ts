import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    lineUserId: text("line_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    mgmOptInAt: text("mgm_opt_in_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ lineUserIdUnique: uniqueIndex("members_line_user_id_unique").on(table.lineUserId) }),
);

export const campaignVersions = sqliteTable("campaign_versions", {
  id: text("id").primaryKey(),
  ruleJson: text("rule_json").notNull(),
  assetJson: text("asset_json").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ memberSessionUnique: uniqueIndex("sessions_member_id_unique").on(table.memberId) }),
);

export const games = sqliteTable(
  "games",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").notNull(),
    requestId: text("request_id").notNull(),
    mode: text("mode").notNull(),
    playerHand: text("player_hand").notNull(),
    hostHand: text("host_hand").notNull(),
    result: text("result").notNull(),
    ruleVersion: text("rule_version").notNull(),
    assetVersion: text("asset_version").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ memberRequestUnique: uniqueIndex("games_member_request_unique").on(table.memberId, table.requestId) }),
);

export const energyEvents = sqliteTable(
  "energy_events",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").notNull(),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    referenceId: text("reference_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ referenceUnique: uniqueIndex("energy_member_reason_reference_unique").on(table.memberId, table.reason, table.referenceId) }),
);

export const referrals = sqliteTable(
  "referrals",
  {
    id: text("id").primaryKey(),
    inviterMemberId: text("inviter_member_id").notNull(),
    invitedMemberId: text("invited_member_id").notNull(),
    status: text("status").notNull(),
    attributionSource: text("attribution_source"),
    rejectionReason: text("rejection_reason"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ invitedMemberUnique: uniqueIndex("referrals_invited_member_unique").on(table.invitedMemberId) }),
);

export const referralLinks = sqliteTable(
  "referral_links",
  {
    id: text("id").primaryKey(),
    inviterMemberId: text("inviter_member_id").notNull(),
    token: text("token").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ tokenUnique: uniqueIndex("referral_links_token_unique").on(table.token), inviterUnique: uniqueIndex("referral_links_inviter_unique").on(table.inviterMemberId) }),
);

export const referralAttributions = sqliteTable(
  "referral_attributions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    invitedMemberId: text("invited_member_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({ invitedUnique: uniqueIndex("referral_attributions_invited_unique").on(table.invitedMemberId) }),
);

export const emailDeliveries = sqliteTable(
  "email_deliveries",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id").notNull(),
    memberId: text("member_id").notNull(),
    recipient: text("recipient"),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    status: text("status").notNull(),
    providerMessageId: text("provider_message_id"),
    retryCount: integer("retry_count").notNull().default(0),
    lastError: text("last_error"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({ gameUnique: uniqueIndex("email_deliveries_game_unique").on(table.gameId) }),
);

export const leaderboardSourceScores = sqliteTable(
  "leaderboard_source_scores",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").notNull(),
    type: text("type").notNull(),
    score: integer("score").notNull(),
    ruleVersion: text("rule_version").notNull(),
    calculatedAt: text("calculated_at").notNull(),
  },
  (table) => ({ memberTypeVersionUnique: uniqueIndex("leaderboard_member_type_version_unique").on(table.memberId, table.type, table.ruleVersion) }),
);

export const sqliteSchema = {
  members,
  campaignVersions,
  sessions,
  games,
  energyEvents,
  referrals,
  referralLinks,
  referralAttributions,
  emailDeliveries,
  leaderboardSourceScores,
};
