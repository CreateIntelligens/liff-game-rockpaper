function booleanVar(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ status: "ok" });
    if (url.pathname === "/api/config") {
      return Response.json({
        appName: env.APP_NAME,
        apiBaseUrl: url.origin,
        publicBaseUrl: url.origin,
        liffId: env.LIFF_ID ?? "",
        demoMode: booleanVar(env.DEMO_MODE, false),
        liffEnabled: booleanVar(env.LIFF_ENABLED, false),
        cameraEnabled: booleanVar(env.CAMERA_ENABLED, true),
        cameraFallbackEnabled: booleanVar(env.CAMERA_FALLBACK_ENABLED, false),
        mgmEnabled: booleanVar(env.MGM_ENABLED, false),
        leaderboardEnabled: booleanVar(env.LEADERBOARD_ENABLED, true),
        emailEnabled: booleanVar(env.EMAIL_ENABLED, false),
        ruleVersion: env.RULE_VERSION,
        assetVersion: env.ASSET_VERSION,
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
