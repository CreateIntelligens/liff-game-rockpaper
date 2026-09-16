import type { PublicConfig } from "@rockpaper/config";

const demoConfig: PublicConfig = {
  appName: "猜拳挑戰",
  apiBaseUrl: typeof window === "undefined" ? "https://demo.invalid" : window.location.origin,
  publicBaseUrl: typeof window === "undefined" ? "" : window.location.origin,
  liffId: "",
  demoMode: true,
  liffEnabled: false,
  cameraEnabled: true,
  cameraFallbackEnabled: true,
  mgmEnabled: false,
  leaderboardEnabled: true,
  emailEnabled: false,
  ruleVersion: "demo-v1",
  assetVersion: "assets-v1",
};

export async function fetchPublicConfig(): Promise<PublicConfig> {
  try {
    const response = await fetch("/api/config", { credentials: "include" });
    if (!response.ok) throw new Error("CONFIG_LOAD_FAILED");
    return (await response.json()) as PublicConfig;
  } catch (error) {
    if (import.meta.env.VITE_DEMO_MODE === "true") return demoConfig;
    throw error;
  }
}

export async function authenticateWithLine(idToken: string) {
  const response = await fetch("/api/auth/line", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error("LINE_AUTH_FAILED");
  return (await response.json()) as { authenticated: boolean; memberId: string };
}

export async function fetchMe() {
  const response = await fetch("/api/me", { credentials: "include" });
  if (!response.ok) throw new Error("ME_LOAD_FAILED");
  return (await response.json()) as { memberId: string; energy: number };
}

export type Hand = "rock" | "paper" | "scissors";

export async function playGame(input: { requestId: string; mode: "camera" | "manual" | "random"; playerHand?: Hand }) {
  const response = await fetch("/api/games/plays", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { result?: { result: "win" | "lose" | "draw" }; energy?: number; error?: { code: string } };
  if (!response.ok) throw new Error(payload.error?.code ?? "GAME_FAILED");
  return payload as { result: { result: "win" | "lose" | "draw" }; energy: number };
}

export function playDemoGame(input: { mode: "camera" | "manual" | "random"; playerHand?: Hand }) {
  const playerHand = input.playerHand ?? ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)] as Hand;
  const hostHand = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)] as Hand;
  const result = playerHand === hostHand
    ? "draw"
    : (playerHand === "rock" && hostHand === "scissors") || (playerHand === "paper" && hostHand === "rock") || (playerHand === "scissors" && hostHand === "paper")
      ? "win"
      : "lose";
  return { playerHand, hostHand, result } as const;
}

export async function fetchLeaderboard(type: "invitations" | "wins") {
  const response = await fetch(`/api/leaderboards/${type}`, { credentials: "include" });
  if (!response.ok) throw new Error("LEADERBOARD_FAILED");
  return (await response.json()) as { entries: Array<{ rank: number; score: number; maskedName: string }> };
}

export async function fetchMgmStatus() {
  const response = await fetch("/api/mgm/status", { credentials: "include" });
  if (!response.ok) throw new Error("MGM_STATUS_FAILED");
  return (await response.json()) as { optedIn: boolean; validReferralCount: number };
}

export async function optInMgm() {
  const response = await fetch("/api/mgm/opt-in", { method: "POST", credentials: "include" });
  if (!response.ok) throw new Error("MGM_OPT_IN_FAILED");
  return (await response.json()) as { optedIn: boolean };
}

export async function fetchInviteLink() {
  const response = await fetch("/api/mgm/invite-link", { method: "POST", credentials: "include" });
  if (!response.ok) throw new Error("INVITE_LINK_FAILED");
  return (await response.json()) as { inviteUrl: string };
}

export async function fetchMyRankings() {
  const response = await fetch("/api/me/rankings", { credentials: "include" });
  if (!response.ok) throw new Error("RANKINGS_FAILED");
  return (await response.json()) as {
    invitations: { rank: number; score: number } | null;
    wins: { rank: number; score: number } | null;
  };
}

export async function recordReferralAttribution(token: string) {
  const response = await fetch("/api/mgm/attribution", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error("ATTRIBUTION_FAILED");
  return (await response.json()) as { recorded: boolean };
}
