import { z } from "zod";

export const publicConfigSchema = z.object({
  appName: z.string().min(1),
  apiBaseUrl: z.string().url(),
  publicBaseUrl: z.string().url(),
  liffId: z.string(),
  liffEnabled: z.boolean(),
  cameraEnabled: z.boolean(),
  cameraFallbackEnabled: z.boolean(),
  mgmEnabled: z.boolean(),
  leaderboardEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  ruleVersion: z.string().min(1),
  assetVersion: z.string().min(1),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export function createApiError(code: string, message: string, details?: unknown): ApiError {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } };
}

export const campaignRuleSchema = z
  .object({
    id: z.string().min(1),
    initialEnergy: z.number().int().nonnegative(),
    energyCap: z.number().int().positive(),
    energyCost: z.number().int().positive(),
    referralEnergyReward: z.number().int().nonnegative(),
    fallbackEnabled: z.boolean(),
    fallbackModes: z.array(z.enum(["manual", "random"])).default([]),
    timezone: z.string().min(1),
    invitationLeaderboardEnabled: z.boolean(),
    winLeaderboardEnabled: z.boolean(),
  })
  .superRefine((rule, context) => {
    if (rule.initialEnergy > rule.energyCap) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initialEnergy"],
        message: "initialEnergy cannot exceed energyCap",
      });
    }

    if (!rule.fallbackEnabled && rule.fallbackModes.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fallbackModes"],
        message: "fallbackModes must be empty when fallback is disabled",
      });
    }
  });

export type CampaignRuleConfig = z.infer<typeof campaignRuleSchema>;

export const assetManifestSchema = z.object({
  version: z.string().min(1),
  frame: z.object({
    canvasWidth: z.number().int().positive(),
    canvasHeight: z.number().int().positive(),
    safeArea: z.object({
      top: z.number().int().nonnegative(),
      right: z.number().int().nonnegative(),
      bottom: z.number().int().nonnegative(),
      left: z.number().int().nonnegative(),
    }),
    borderAsset: z.string().min(1),
    formats: z.array(z.enum(["png", "webp", "jpeg"])).min(1),
    transparent: z.boolean(),
    crop: z.enum(["contain", "cover", "none"]),
  }),
  gestureModel: z.object({
    name: z.literal("mediapipe-gesture-recognizer"),
    version: z.string().min(1),
    path: z.string().startsWith("/").or(z.string().startsWith("https://")),
  }),
  decorativeAsset: z.string().startsWith("/"),
});

export type AssetManifest = z.infer<typeof assetManifestSchema>;

const serverConfigSchema = z.object({
  appName: z.string().min(1),
  port: z.coerce.number().int().positive(),
  apiBaseUrl: z.string().url(),
  publicBaseUrl: z.string().url(),
  liffId: z.string(),
  allowedOrigin: z.string().url(),
  databasePath: z.string().min(1),
  liffEnabled: z.boolean(),
  cameraEnabled: z.boolean(),
  cameraFallbackEnabled: z.boolean(),
  mgmEnabled: z.boolean(),
  leaderboardEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  ruleVersion: z.string().min(1),
  assetVersion: z.string().min(1),
  lineChannelId: z.string().optional(),
  lineChannelSecret: z.string().optional(),
  resendApiKey: z.string().optional(),
  resendFrom: z.string().optional(),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

function envValue(environment: Record<string, string | undefined>, key: string, fallback: string) {
  return environment[key] ?? fallback;
}

function envBoolean(environment: Record<string, string | undefined>, key: string, fallback: boolean) {
  const value = environment[key];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${key} must be true or false`);
}

export function loadServerConfig(environment: Record<string, string | undefined>): ServerConfig {
  return serverConfigSchema.parse({
    appName: envValue(environment, "APP_NAME", "猜拳挑戰"),
    port: envValue(environment, "PORT", "3000"),
    apiBaseUrl: envValue(environment, "API_BASE_URL", "http://localhost:3000"),
    publicBaseUrl: envValue(environment, "PUBLIC_BASE_URL", "http://localhost:5173"),
    liffId: envValue(environment, "LIFF_ID", ""),
    allowedOrigin: envValue(environment, "ALLOWED_ORIGIN", "http://localhost:5173"),
    databasePath: envValue(environment, "DATABASE_PATH", "./data/game.sqlite"),
    liffEnabled: envBoolean(environment, "LIFF_ENABLED", false),
    cameraEnabled: envBoolean(environment, "CAMERA_ENABLED", true),
    cameraFallbackEnabled: envBoolean(environment, "CAMERA_FALLBACK_ENABLED", false),
    mgmEnabled: envBoolean(environment, "MGM_ENABLED", false),
    leaderboardEnabled: envBoolean(environment, "LEADERBOARD_ENABLED", true),
    emailEnabled: envBoolean(environment, "EMAIL_ENABLED", false),
    ruleVersion: envValue(environment, "RULE_VERSION", "v1"),
    assetVersion: envValue(environment, "ASSET_VERSION", "v1"),
    lineChannelId: environment.LINE_CHANNEL_ID,
    lineChannelSecret: environment.LINE_CHANNEL_SECRET,
    resendApiKey: environment.RESEND_API_KEY,
    resendFrom: environment.RESEND_FROM,
  });
}

export function toPublicConfig(config: ServerConfig): PublicConfig {
  return publicConfigSchema.parse({
    appName: config.appName,
    apiBaseUrl: config.apiBaseUrl,
    publicBaseUrl: config.publicBaseUrl,
    liffId: config.liffId,
    liffEnabled: config.liffEnabled,
    cameraEnabled: config.cameraEnabled,
    cameraFallbackEnabled: config.cameraFallbackEnabled,
    mgmEnabled: config.mgmEnabled,
    leaderboardEnabled: config.leaderboardEnabled,
    emailEnabled: config.emailEnabled,
    ruleVersion: config.ruleVersion,
    assetVersion: config.assetVersion,
  });
}
