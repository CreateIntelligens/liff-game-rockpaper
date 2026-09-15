export const initialMigration = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY NOT NULL,
  line_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  mgm_opt_in_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_versions (
  id TEXT PRIMARY KEY NOT NULL,
  rule_json TEXT NOT NULL,
  asset_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  player_hand TEXT NOT NULL,
  host_hand TEXT NOT NULL,
  result TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  asset_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(member_id, request_id),
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS energy_events (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(member_id, reason, reference_id),
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY NOT NULL,
  inviter_member_id TEXT NOT NULL,
  invited_member_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  attribution_source TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(inviter_member_id) REFERENCES members(id),
  FOREIGN KEY(invited_member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS referral_links (
  id TEXT PRIMARY KEY NOT NULL,
  inviter_member_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  UNIQUE(inviter_member_id),
  FOREIGN KEY(inviter_member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS referral_attributions (
  id TEXT PRIMARY KEY NOT NULL,
  token TEXT NOT NULL,
  invited_member_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY(token) REFERENCES referral_links(token),
  FOREIGN KEY(invited_member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  game_id TEXT NOT NULL UNIQUE,
  member_id TEXT NOT NULL,
  recipient TEXT,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(game_id) REFERENCES games(id),
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS leaderboard_source_scores (
  id TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  type TEXT NOT NULL,
  score INTEGER NOT NULL,
  rule_version TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  UNIQUE(member_id, type, rule_version),
  FOREIGN KEY(member_id) REFERENCES members(id)
);
`;
