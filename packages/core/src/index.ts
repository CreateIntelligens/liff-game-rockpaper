export const HANDS = ["rock", "paper", "scissors"] as const;

export type Hand = (typeof HANDS)[number];

export type GameResult = "win" | "lose" | "draw";

export type FallbackMode = "manual" | "random";

export interface GameInput {
  mode: "camera" | FallbackMode;
  playerHand?: Hand;
}

export interface CampaignRule {
  id: string;
  initialEnergy: number;
  energyCap: number;
  energyCost: number;
  referralEnergyReward: number;
  fallbackEnabled: boolean;
  fallbackModes: FallbackMode[];
  timezone: string;
  invitationLeaderboardEnabled: boolean;
  winLeaderboardEnabled: boolean;
}

export interface GameOutcome {
  playerHand: Hand;
  hostHand: Hand;
  result: GameResult;
}

export interface GameStorePort {
  getRuleVersion(): Promise<{ rule: CampaignRule; assetVersion: string }>;
  findGameByRequestId(memberId: string, requestId: string): Promise<GameRecordPort | null>;
  createGame(input: {
    memberId: string;
    requestId: string;
    input: GameInput;
    outcome: GameOutcome;
    ruleVersion: string;
    assetVersion: string;
  }): Promise<GameRecordPort>;
}

export interface GameRecordPort extends GameOutcome {
  id: string;
  memberId: string;
  requestId: string;
  mode: GameInput["mode"];
  ruleVersion: string;
  assetVersion: string;
  createdAt: string;
}

export interface RandomSourcePort {
  pick<T>(values: readonly T[]): T;
}

export function isHand(value: unknown): value is Hand {
  return typeof value === "string" && HANDS.includes(value as Hand);
}

export function resolveResult(playerHand: Hand, hostHand: Hand): GameResult {
  if (playerHand === hostHand) return "draw";

  const winsAgainst: Record<Hand, Hand> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  return winsAgainst[playerHand] === hostHand ? "win" : "lose";
}

export function assertValidGameInput(input: GameInput): asserts input is GameInput & { playerHand: Hand } {
  if (input.mode === "random") {
    return;
  }

  if (!isHand(input.playerHand)) {
    throw new Error("A valid player hand is required for camera or manual play");
  }
}

export async function playGame(
  store: GameStorePort,
  random: RandomSourcePort,
  memberId: string,
  requestId: string,
  input: GameInput,
): Promise<GameRecordPort> {
  const existing = await store.findGameByRequestId(memberId, requestId);
  if (existing) return existing;

  const { rule, assetVersion } = await store.getRuleVersion();
  if (input.mode === "random" && (!rule.fallbackEnabled || !rule.fallbackModes.includes("random"))) {
    throw new Error("Random fallback is not enabled");
  }
  if (input.mode === "manual" && (!rule.fallbackEnabled || !rule.fallbackModes.includes("manual"))) {
    throw new Error("Manual fallback is not enabled");
  }

  if (input.mode !== "random") assertValidGameInput(input);

  const playerHand = input.mode === "random" ? random.pick(HANDS) : input.playerHand;
  if (!playerHand) throw new Error("A player hand is required");

  const hostHand = random.pick(HANDS);
  const outcome = {
    playerHand,
    hostHand,
    result: resolveResult(playerHand, hostHand),
  } satisfies GameOutcome;

  return store.createGame({
    memberId,
    requestId,
    input,
    outcome,
    ruleVersion: rule.id,
    assetVersion,
  });
}
