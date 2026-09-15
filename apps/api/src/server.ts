import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { createApiError, loadServerConfig, toPublicConfig } from "@rockpaper/config";
import { playGame } from "@rockpaper/core";
import { createSqliteGameStore } from "./db/game-store.js";
import { createSqliteDatabase } from "./db/sqlite.js";
import { createSqliteSessionStore } from "./db/session-store.js";
import { createSqliteReferralStore } from "./db/referral-store.js";
import { createSqliteLeaderboardStore } from "./db/leaderboard-store.js";
import { defaultAssetManifest, defaultCampaignRule } from "./campaign/defaults.js";
import { LineIdTokenVerifier } from "./adapters/line-auth.js";
import { ResendMailer } from "./adapters/resend-mailer.js";
import { processEmailOutbox } from "./email-worker.js";
import { createSqliteEmailDeliveryStore } from "./db/email-store.js";
import { randomInt } from "node:crypto";

const app = Fastify({ logger: true });
const config = loadServerConfig(process.env);

await app.register(cors, { origin: config.allowedOrigin });
await app.register(cookie, { hook: "onRequest" });
await app.register(helmet);
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

const database = createSqliteDatabase(config.databasePath);
const gameStore = createSqliteGameStore(database);
const sessionStore = createSqliteSessionStore(database);
const referralStore = createSqliteReferralStore(database);
const leaderboardStore = createSqliteLeaderboardStore(database);
const emailStore = createSqliteEmailDeliveryStore(database);
try {
  await gameStore.getRuleVersion();
} catch (error) {
  if (error instanceof Error && error.message === "ACTIVE_CAMPAIGN_NOT_FOUND") {
    gameStore.activateCampaignVersion({ rule: defaultCampaignRule, asset: defaultAssetManifest });
  } else {
    throw error;
  }
}

const lineVerifier = config.lineChannelId ? new LineIdTokenVerifier(config.lineChannelId) : null;
const mailer = config.emailEnabled && config.resendApiKey && config.resendFrom
  ? new ResendMailer(config.resendApiKey, config.resendFrom)
  : null;
const playRequestSchema = z.object({
  requestId: z.string().uuid(),
  mode: z.enum(["camera", "manual", "random"]),
  playerHand: z.enum(["rock", "paper", "scissors"]).optional(),
});

async function requireMember(request: { cookies: Record<string, string | undefined> }) {
  const sessionId = request.cookies.rpg_session;
  if (!sessionId) throw new Error("UNAUTHENTICATED");
  const memberId = await sessionStore.getMemberId(sessionId);
  if (!memberId) throw new Error("UNAUTHENTICATED");
  return memberId;
}

app.get("/health", async () => ({ status: "ok" }));

app.get("/api/config", async () => toPublicConfig(config));

app.post<{ Body: { idToken?: string } }>("/api/auth/line", async (request, reply) => {
  if (!config.liffEnabled || !lineVerifier) {
    return reply.status(503).send(createApiError("AUTH_DISABLED", "LINE 登入目前未啟用"));
  }

  const body = z.object({ idToken: z.string().min(1) }).safeParse(request.body);
  if (!body.success) return reply.status(422).send(createApiError("VALIDATION_ERROR", "缺少 LINE ID Token"));

  try {
    const member = await lineVerifier.verifyToken(body.data.idToken);
    const active = await gameStore.getRuleVersion();
    await gameStore.ensureMember(member, active.rule.initialEnergy);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const sessionId = await sessionStore.createSession(member.memberId, expiresAt);
    reply.setCookie("rpg_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    });
    return { authenticated: true, memberId: member.memberId };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "LINE 登入驗證失敗"));
  }
});

app.get("/api/me", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    return { memberId, energy: await gameStore.getEnergy(memberId) };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.post<{ Body: unknown }>("/api/games/plays", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    const parsed = playRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(422).send(createApiError("VALIDATION_ERROR", "遊戲輸入格式錯誤"));

    const random = { pick: <T>(values: readonly T[]) => values[randomInt(values.length)] };
    const result = await playGame(gameStore, random, memberId, parsed.data.requestId, parsed.data);
    if (config.emailEnabled) {
      const recipient = await gameStore.getMemberEmail(memberId);
      await emailStore.enqueue({
        gameId: result.id,
        memberId,
        recipient,
        subject: "猜拳挑戰遊戲結果 / Rock Paper Scissors Result",
        html: `<p>Result: ${result.result}</p><p>Rule version: ${result.ruleVersion}</p>`,
      });
      if (mailer) void processEmailOutbox(emailStore, mailer);
    }
    return { result, energy: await gameStore.getEnergy(memberId) };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_ENERGY") {
      return reply.status(409).send(createApiError("INSUFFICIENT_ENERGY", "體力不足"));
    }
    if (error instanceof Error && error.message.includes("fallback")) {
      return reply.status(409).send(createApiError("FALLBACK_DISABLED", "替代出拳目前未啟用"));
    }
    throw error;
  }
});

app.get("/api/me/games", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    return { games: await gameStore.listGames(memberId) };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.post("/api/mgm/opt-in", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    const active = await gameStore.getRuleVersion();
    await referralStore.optIn(memberId, active.rule.id);
    return { optedIn: true };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.get("/api/mgm/status", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    return {
      optedIn: await referralStore.isOptedIn(memberId),
      validReferralCount: await referralStore.countValidReferrals(memberId),
    };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.post("/api/mgm/invite-link", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    if (!config.mgmEnabled) return reply.status(404).send(createApiError("MGM_DISABLED", "會員邀請目前未啟用"));
    if (!(await referralStore.isOptedIn(memberId))) return reply.status(403).send(createApiError("MGM_OPT_IN_REQUIRED", "請先同意參加會員邀請"));
    const token = await referralStore.createInviteLink(memberId);
    return { inviteUrl: `${config.publicBaseUrl}/?ref=${encodeURIComponent(token)}` };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.post<{ Body: { token?: string } }>("/api/mgm/attribution", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    const parsed = z.object({ token: z.string().min(1) }).safeParse(request.body);
    if (!parsed.success) return reply.status(422).send(createApiError("VALIDATION_ERROR", "邀請參數錯誤"));
    return { recorded: await referralStore.recordAttribution(parsed.data.token, memberId) };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.get<{ Params: { type: string }; Querystring: { limit?: string } }>("/api/leaderboards/:type", async (request, reply) => {
  if (!config.leaderboardEnabled) return reply.status(404).send(createApiError("LEADERBOARD_DISABLED", "排行榜目前未啟用"));
  if (request.params.type !== "invitations" && request.params.type !== "wins") {
    return reply.status(422).send(createApiError("VALIDATION_ERROR", "排行榜類型錯誤"));
  }
  const limit = Number(request.query.limit ?? 20);
  const entries = await leaderboardStore.list(request.params.type, Number.isFinite(limit) ? limit : 20);
  return {
    type: request.params.type,
    entries: entries.map(({ memberId: _memberId, ...entry }) => entry),
  };
});

app.get("/api/me/rankings", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    const rankings = await leaderboardStore.getMemberRanks(memberId);
    return {
      invitations: rankings.invitations ? { rank: rankings.invitations.rank, score: rankings.invitations.score } : null,
      wins: rankings.wins ? { rank: rankings.wins.rank, score: rankings.wins.score } : null,
    };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.get("/api/me/notifications", async (request, reply) => {
  try {
    const memberId = await requireMember(request);
    return { notifications: await emailStore.getMemberDeliveries(memberId) };
  } catch {
    return reply.status(401).send(createApiError("UNAUTHENTICATED", "請先登入"));
  }
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  return reply.status(500).send(createApiError("INTERNAL_ERROR", "服務暫時無法使用"));
});

await app.listen({ host: "0.0.0.0", port: config.port });

if (mailer) {
  setInterval(() => {
    void processEmailOutbox(emailStore, mailer);
  }, 5_000);
}
