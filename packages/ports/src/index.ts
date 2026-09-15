import type { CampaignRule, GameInput, GameOutcome, Hand } from "@rockpaper/core";

export interface MemberIdentity {
  memberId: string;
  lineUserId: string;
  email?: string;
  displayName?: string;
}

export interface GameRecord extends GameOutcome {
  id: string;
  memberId: string;
  requestId: string;
  mode: GameInput["mode"];
  ruleVersion: string;
  assetVersion: string;
  createdAt: string;
}

export interface GameStore {
  getRuleVersion(): Promise<{ rule: CampaignRule; assetVersion: string }>;
  getEnergy(memberId: string): Promise<number>;
  getMemberEmail(memberId: string): Promise<string | null>;
  addEnergy(input: {
    memberId: string;
    delta: number;
    reason: string;
    referenceId: string;
    cap: number;
  }): Promise<number>;
  ensureMember(member: MemberIdentity, initialEnergy: number): Promise<void>;
  createGame(input: {
    memberId: string;
    requestId: string;
    input: GameInput;
    outcome: GameOutcome;
    ruleVersion: string;
    assetVersion: string;
  }): Promise<GameRecord>;
  findGameByRequestId(memberId: string, requestId: string): Promise<GameRecord | null>;
  listGames(memberId: string): Promise<GameRecord[]>;
}

export type ReferralStatus = "valid" | "rejected";

export interface ReferralResult {
  status: ReferralStatus;
  rewardGranted: number;
  rejectionReason?: string;
}

export interface ReferralStore {
  createInviteLink(memberId: string): Promise<string>;
  recordAttribution(token: string, invitedMemberId: string): Promise<boolean>;
  optIn(memberId: string, ruleVersion: string): Promise<void>;
  isOptedIn(memberId: string): Promise<boolean>;
  completeReferral(input: {
    inviterMemberId: string;
    invitedMemberId: string;
    attributionSource: string;
    isEligibleNewFriend: boolean;
    energyReward: number;
    energyCap: number;
  }): Promise<ReferralResult>;
  countValidReferrals(memberId: string): Promise<number>;
}

export type LeaderboardType = "invitations" | "wins";

export interface LeaderboardEntry {
  memberId: string;
  rank: number;
  score: number;
  maskedName: string;
}

export interface LeaderboardStore {
  list(type: LeaderboardType, limit: number): Promise<LeaderboardEntry[]>;
  getMemberRanks(memberId: string): Promise<{ invitations: LeaderboardEntry | null; wins: LeaderboardEntry | null }>;
}

export interface AuthVerifier {
  verifyToken(token: string): Promise<MemberIdentity>;
}

export interface SessionStore {
  createSession(memberId: string, expiresAt: string): Promise<string>;
  getMemberId(sessionId: string): Promise<string | null>;
}

export interface MailMessage {
  idempotencyKey: string;
  to: string;
  subject: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<{ providerMessageId: string }>;
}

export type EmailDeliveryStatus = "queued" | "sent" | "skipped" | "failed";

export interface EmailDelivery {
  id: string;
  gameId: string;
  memberId: string;
  recipient: string | null;
  status: EmailDeliveryStatus;
  providerMessageId?: string;
  retryCount: number;
  lastError?: string;
}

export interface EmailDeliveryStore {
  enqueue(input: { gameId: string; memberId: string; recipient: string | null; subject: string; html: string }): Promise<EmailDelivery>;
  listQueued(limit: number): Promise<Array<EmailDelivery & { subject: string; html: string }>>;
  markSent(id: string, providerMessageId: string): Promise<void>;
  markRetry(id: string, error: string, maxRetries: number): Promise<void>;
  getMemberDeliveries(memberId: string): Promise<EmailDelivery[]>;
}

export interface Clock {
  now(): Date;
}

export interface RandomSource {
  pick<T>(values: readonly T[]): T;
}

export interface CameraRecognitionResult {
  hand: Hand | "unknown";
  confidence: number;
  modelVersion: string;
}
