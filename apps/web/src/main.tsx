import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PublicConfig } from "@rockpaper/config";
import { CameraRecognizer } from "./camera/camera-recognizer";
import {
  fetchLeaderboard,
  fetchMe,
  fetchMgmStatus,
  fetchMyRankings,
  fetchPublicConfig,
  fetchInviteLink,
  optInMgm,
  playDemoGame,
  playGame,
  recordReferralAttribution,
  type Hand,
} from "./lib/api";
import { initializeLiff } from "./lib/liff";
import { getInitialLocale, getInitialTheme, saveLocale, saveTheme, translate, type Locale, type Theme } from "./i18n";
import "./styles.css";

type AuthState = "loading" | "authenticated" | "preview" | "unavailable";
type CameraState = "idle" | "starting" | "ready" | "failed";
type Result = "win" | "lose" | "draw";

const hands: Hand[] = ["rock", "paper", "scissors"];

function App() {
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [energy, setEnergy] = useState<number | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [fallbackOptedIn, setFallbackOptedIn] = useState(false);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<"invitations" | "wins">("invitations");
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; score: number; maskedName: string }>>([]);
  const [mgmOptedIn, setMgmOptedIn] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [inviteUrl, setInviteUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [myRankings, setMyRankings] = useState<Awaited<ReturnType<typeof fetchMyRankings>> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraRecognizer | null>(null);

  useEffect(() => {
    saveLocale(locale);
    document.documentElement.lang = locale === "zh-TW" ? "zh-Hant" : "en";
  }, [locale]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const loadedConfig = await fetchPublicConfig();
        const nextAuthState = await initializeLiff(loadedConfig);
        if (!mounted) return;
        setConfig(loadedConfig);
        setAuthState(nextAuthState === "authenticated" ? "authenticated" : "preview");
        if (loadedConfig.demoMode) setEnergy(3);
        if (nextAuthState === "authenticated") {
          setEnergy((await fetchMe()).energy);
          setMyRankings(await fetchMyRankings());
          if (loadedConfig.mgmEnabled) {
            const mgm = await fetchMgmStatus();
            setMgmOptedIn(mgm.optedIn);
            setReferralCount(mgm.validReferralCount);
            if (mgm.optedIn) setInviteUrl((await fetchInviteLink()).inviteUrl);
          }
          const referralToken = new URLSearchParams(window.location.search).get("ref");
          if (referralToken) await recordReferralAttribution(referralToken);
        }
      } catch {
        if (mounted) setAuthState("unavailable");
      }
    })();

    return () => {
      mounted = false;
      cameraRef.current?.stop(videoRef.current ?? undefined);
    };
  }, []);

  useEffect(() => {
    void fetchLeaderboard(leaderboardType)
      .then((payload) => setLeaderboard(payload.entries))
      .catch(() => setLeaderboard([]));
  }, [leaderboardType]);

  const status =
    authState === "loading"
      ? translate(locale, "loading")
      : authState === "authenticated"
        ? translate(locale, "authenticated")
        : authState === "preview"
          ? translate(locale, "preview")
          : translate(locale, "unavailable");

  async function startCamera() {
    if (!videoRef.current) return;
    setCameraState("starting");
    setGameMessage(null);
    const camera = new CameraRecognizer();
    cameraRef.current = camera;
    try {
      await camera.start(videoRef.current);
      setCameraState("ready");
    } catch {
      cameraRef.current?.stop(videoRef.current);
      cameraRef.current = null;
      setCameraState("failed");
      setGameMessage(translate(locale, "cameraDenied"));
    }
  }

  async function submitGame(mode: "camera" | "manual" | "random", playerHand?: Hand) {
    if (authState !== "authenticated" && !config?.demoMode) {
      setGameMessage(translate(locale, "gameLockedPreview"));
      return;
    }

    setGameMessage(translate(locale, "playing"));
    setResult(null);
    try {
      if (config?.demoMode) {
        const response = playDemoGame({ mode, playerHand });
        if ((energy ?? 0) <= 0) {
          setGameMessage(translate(locale, "energyEmpty"));
          return;
        }
        setEnergy((current) => Math.max(0, (current ?? 3) - 1));
        setResult(response.result);
        setGameMessage(null);
        return;
      }
      const response = await playGame({ requestId: crypto.randomUUID(), mode, playerHand });
      setEnergy(response.energy);
      setResult(response.result.result);
      setGameMessage(null);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setGameMessage(
        translate(locale, code === "INSUFFICIENT_ENERGY" ? "energyEmpty" : code === "FALLBACK_DISABLED" ? "fallbackDisabled" : "errorRetry"),
      );
    }
  }

  async function recognizeCamera() {
    if (!cameraRef.current || !videoRef.current) return;
    try {
      const recognition = await cameraRef.current.recognizeStable(videoRef.current);
      if (recognition.hand === "unknown") {
        setGameMessage(translate(locale, "cameraUnknown"));
        return;
      }
      await submitGame("camera", recognition.hand);
    } catch {
      setGameMessage(translate(locale, "errorRetry"));
    }
  }

  async function joinMgm() {
    if (authState !== "authenticated") return;
    try {
      await optInMgm();
      setMgmOptedIn(true);
      setInviteUrl((await fetchInviteLink()).inviteUrl);
    } catch {
      setGameMessage(translate(locale, "errorRetry"));
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1600);
  }

  const resultLabel = result
    ? translate(locale, result === "win" ? "resultWin" : result === "lose" ? "resultLose" : "resultDraw")
    : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand">{translate(locale, "brand")}</span>
        <div className="locale-switcher" role="group" aria-label={translate(locale, "languageLabel")}>
          <button type="button" aria-pressed={locale === "zh-TW"} onClick={() => setLocale("zh-TW")}>
            {translate(locale, "localeZh")}
          </button>
          <span aria-hidden="true">|</span>
          <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
            {translate(locale, "localeEn")}
          </button>
        </div>
        <div className="theme-switcher" role="group" aria-label={translate(locale, "themeLabel")}>
          <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
            {translate(locale, "themeDark")}
          </button>
          <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
            {translate(locale, "themeLight")}
          </button>
        </div>
      </header>

      <section className="hero-block">
        <p className="status-line"><span className="status-dot" />{status}</p>
        <div className="title-lockup"><span className="game-mark" aria-hidden="true">RPS</span><h1>{translate(locale, "title")}</h1></div>
        <p className="intro">{translate(locale, "intro")}</p>
      </section>

      <div className="game-layout">
        <section className="game-panel" aria-label={translate(locale, "title")}>
          <div className="energy-bar">
            <span>{energy === null ? translate(locale, "energyPreparing") : translate(locale, "energy", { value: energy })}</span>
            <span className="rule-chip">3 / 3</span>
          </div>

          <div className="camera-stage">
            <video ref={videoRef} className="camera-preview" autoPlay playsInline muted aria-label={translate(locale, "cameraReady")} />
            {cameraState === "idle" && <span className="camera-placeholder">{translate(locale, "cameraPrompt")}</span>}
            {cameraState === "starting" && <span className="camera-placeholder">{translate(locale, "cameraStarting")}</span>}
          </div>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => void startCamera()} disabled={cameraState === "starting"}>
              {cameraState === "ready" ? translate(locale, "cameraReady") : translate(locale, "cameraStart")}
            </button>
            {cameraState === "ready" && (
              <button className="secondary-button" type="button" onClick={() => void recognizeCamera()}>
                {translate(locale, "recognize")}
              </button>
            )}
          </div>

          {config?.cameraFallbackEnabled && (cameraState === "failed" || config.demoMode) && !fallbackOptedIn && (
            <div className="fallback-consent">
              <p>{translate(locale, "fallbackOffer")}</p>
              <button className="secondary-button" type="button" onClick={() => setFallbackOptedIn(true)}>
                {translate(locale, "fallbackOptIn")}
              </button>
            </div>
          )}

          {config?.cameraFallbackEnabled && (fallbackOptedIn || config.demoMode) && (
            <div className="fallback-controls">
              <p>{translate(locale, "chooseHand")}</p>
              <div className="hand-row">
                {hands.map((hand) => (
                  <button key={hand} className="hand-button" type="button" onClick={() => void submitGame("manual", hand)}>
                    {translate(locale, hand)}
                  </button>
                ))}
              </div>
              <button className="text-button" type="button" onClick={() => void submitGame("random")}>
                {translate(locale, "fallbackRandom")}
              </button>
            </div>
          )}

          {gameMessage && <p className="game-message" role="status">{gameMessage}</p>}
          {resultLabel && <p className={`result-message result-${result}`}>{resultLabel}</p>}
        </section>

        <aside className="side-stack">
          {config?.mgmEnabled && authState === "authenticated" && (
            <section className="info-panel">
              <div className="panel-heading"><h2>{translate(locale, "mgm")}</h2><span className="rule-chip">+1</span></div>
              <p>{mgmOptedIn ? translate(locale, "mgmOptedIn") : translate(locale, "mgmOptIn")}</p>
              <p className="muted-copy">{translate(locale, "referralCount", { value: referralCount })}</p>
              {!mgmOptedIn && <button className="primary-button" type="button" onClick={() => void joinMgm()}>{translate(locale, "optIn")}</button>}
              {mgmOptedIn && inviteUrl && (
                <div className="invite-link-block">
                  <label htmlFor="invite-url">{translate(locale, "inviteLink")}</label>
                  <div className="invite-link-row">
                    <input id="invite-url" value={inviteUrl} readOnly />
                    <button className="secondary-button" type="button" onClick={() => void copyInviteLink()}>
                      {linkCopied ? translate(locale, "linkCopied") : translate(locale, "copyLink")}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="info-panel leaderboard-panel">
            <h2>{translate(locale, "leaderboards")}</h2>
            <div className="board-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={leaderboardType === "invitations"} onClick={() => setLeaderboardType("invitations")}>
                {translate(locale, "invitationBoard")}
              </button>
              <button type="button" role="tab" aria-selected={leaderboardType === "wins"} onClick={() => setLeaderboardType("wins")}>
                {translate(locale, "winBoard")}
              </button>
            </div>
            {leaderboard.length > 0 ? (
              <ol className="leaderboard-list">
                {leaderboard.map((entry) => (
                  <li key={`${entry.rank}-${entry.maskedName}`}><span>{entry.rank}</span><strong>{entry.maskedName}</strong><b>{entry.score}</b></li>
                ))}
              </ol>
            ) : <p className="leaderboard-empty">{translate(locale, "leaderboardEmpty")}</p>}
            {myRankings && (
              <div className="my-ranking">
                <h3>{translate(locale, "myRank")}</h3>
                <div className="my-ranking-grid">
                  <span>{translate(locale, "invitationBoard")}</span>
                  <strong>{myRankings.invitations ? `#${myRankings.invitations.rank}` : translate(locale, "noRank")}</strong>
                  <small>{myRankings.invitations ? translate(locale, "score", { value: myRankings.invitations.score }) : ""}</small>
                  <span>{translate(locale, "winBoard")}</span>
                  <strong>{myRankings.wins ? `#${myRankings.wins.rank}` : translate(locale, "noRank")}</strong>
                  <small>{myRankings.wins ? translate(locale, "score", { value: myRankings.wins.score }) : ""}</small>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
