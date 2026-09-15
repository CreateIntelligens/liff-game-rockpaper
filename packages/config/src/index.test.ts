import { describe, expect, it } from "vitest";
import {
  assetManifestSchema,
  campaignRuleSchema,
  createApiError,
  loadServerConfig,
  publicConfigSchema,
  toPublicConfig,
} from "./index.js";

describe("shared contracts", () => {
  it("creates a predictable API error", () => {
    expect(createApiError("VALIDATION_ERROR", "Invalid input")).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    });
  });

  it("strips secrets from public config", () => {
    const parsed = publicConfigSchema.parse({
        appName: "Rock Paper",
        apiBaseUrl: "https://example.com",
        publicBaseUrl: "https://example.com",
        liffId: "",
        liffEnabled: true,
        cameraEnabled: true,
        cameraFallbackEnabled: true,
        mgmEnabled: false,
        leaderboardEnabled: true,
        emailEnabled: false,
        ruleVersion: "v1",
        assetVersion: "v1",
        resendApiKey: "must-not-be-public",
      });

    expect(parsed).not.toHaveProperty("resendApiKey");
  });

  it("rejects an initial energy value above the cap", () => {
    const result = campaignRuleSchema.safeParse({
      id: "v1",
      initialEnergy: 4,
      energyCap: 3,
      energyCost: 1,
      referralEnergyReward: 1,
      fallbackEnabled: true,
      fallbackModes: ["manual", "random"],
      timezone: "Asia/Taipei",
      invitationLeaderboardEnabled: true,
      winLeaderboardEnabled: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts the MediaPipe asset manifest", () => {
    expect(
      assetManifestSchema.parse({
        version: "v1",
        frame: {
          canvasWidth: 1080,
          canvasHeight: 1080,
          safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
          borderAsset: "/assets/campaign/v1/frame.svg",
          formats: ["png", "webp"],
          transparent: true,
          crop: "contain",
        },
        gestureModel: {
          name: "mediapipe-gesture-recognizer",
          version: "v1",
          path: "/models/gesture_recognizer.task",
        },
        decorativeAsset: "/assets/campaign/v1/gesture-collage.png",
      }),
    ).toMatchObject({ version: "v1" });
  });

  it("never includes private configuration in public config", () => {
    const serverConfig = loadServerConfig({
      LIFF_ENABLED: "false",
      RESEND_API_KEY: "secret",
      LINE_CHANNEL_SECRET: "secret",
    });

    expect(serverConfig.liffEnabled).toBe(false);
    expect(toPublicConfig(serverConfig)).not.toHaveProperty("resendApiKey");
    expect(toPublicConfig(serverConfig)).not.toHaveProperty("lineChannelSecret");
  });
});
