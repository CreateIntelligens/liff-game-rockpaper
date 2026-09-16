export type Locale = "zh-TW" | "en";
export type Theme = "dark" | "light";

type MessageKey =
  | "brand"
  | "title"
  | "intro"
  | "loading"
  | "authenticated"
  | "preview"
  | "unavailable"
  | "ready"
  | "energyPreparing"
  | "energy"
  | "languageLabel"
  | "localeZh"
  | "localeEn"
  | "statusLabel"
  | "cameraStart"
  | "cameraStarting"
  | "cameraReady"
  | "cameraStop"
  | "cameraSwitchToFront"
  | "cameraSwitchToRear"
  | "energyEmptyButton"
  | "cameraScanning"
  | "cameraDetected"
  | "gestureModelUnavailable"
  | "cameraDenied"
  | "cameraPermissionDenied"
  | "cameraMissing"
  | "cameraBusy"
  | "cameraTimeout"
  | "cameraRetryHint"
  | "recognize"
  | "fallbackOffer"
  | "fallbackOptIn"
  | "fallbackManual"
  | "fallbackRandom"
  | "chooseHand"
  | "rock"
  | "paper"
  | "scissors"
  | "playing"
  | "resultWin"
  | "resultLose"
  | "resultDraw"
  | "battleYou"
  | "battleComputer"
  | "battleLocked"
  | "battleAgain"
  | "gameLockedPreview"
  | "leaderboards"
  | "invitationBoard"
  | "winBoard"
  | "loadingBoard"
  | "mgm"
  | "mgmOptIn"
  | "mgmOptedIn"
  | "referralCount"
  | "optIn"
  | "errorRetry"
  | "cameraUnknown"
  | "energyEmpty"
  | "energyEmptyTitle"
  | "energyRestHint"
  | "energyRestOnlyHint"
  | "energyInviteNow"
  | "energyInviteOptIn"
  | "energyViewOptions"
  | "fallbackDisabled"
  | "cameraPrompt"
  | "leaderboardEmpty"
  | "inviteLink"
  | "copyLink"
  | "linkCopied"
  | "myRank"
  | "noRank"
  | "score"
  | "themeLabel"
  | "themeDark"
  | "themeLight";

const messages: Record<Locale, Record<MessageKey, string>> = {
  "zh-TW": {
    brand: "猜拳挑戰 / LIFF",
    title: "猜拳挑戰",
    intro: "三點初始體力。相機辨識是主要玩法，替代出拳需要你的主動選擇。",
    loading: "載入活動設定中…",
    authenticated: "LINE 身分已驗證",
    preview: "預覽模式",
    unavailable: "活動設定或登入暫時無法使用",
    ready: "活動骨架已啟動",
    energyPreparing: "遊戲功能準備中",
    energy: "目前體力：{value}",
    languageLabel: "切換語系",
    localeZh: "繁",
    localeEn: "En",
    statusLabel: "活動初始化狀態",
    cameraStart: "啟用相機辨識",
    cameraStarting: "啟動相機中…",
    cameraReady: "相機已準備好",
    cameraStop: "停止相機",
    cameraSwitchToFront: "切換前鏡頭",
    cameraSwitchToRear: "切換後鏡頭",
    energyEmptyButton: "體力已用完",
    cameraScanning: "自動偵測中…",
    cameraDetected: "已偵測：{hand}",
    gestureModelUnavailable: "手勢模型載入失敗，相機仍可使用；請改用替代出拳。",
    cameraDenied: "無法使用相機，請選擇替代方式。",
    cameraPermissionDenied: "相機權限被拒絕，請到瀏覽器設定允許相機後再試。",
    cameraMissing: "找不到可用相機，請確認裝置有相機。",
    cameraBusy: "相機目前被其他程式使用，請關閉後再試。",
    cameraTimeout: "相機權限等待逾時，請重新整理或改用替代方式。",
    cameraRetryHint: "若你在 LINE 內建瀏覽器，請改用 LIFF 連結或 Safari／Chrome 開啟。",
    recognize: "辨識手勢",
    fallbackOffer: "要使用替代出拳嗎？",
    fallbackOptIn: "我同意使用替代出拳",
    fallbackManual: "手動選拳",
    fallbackRandom: "隨機出拳",
    chooseHand: "選擇你的手勢",
    rock: "石頭",
    paper: "布",
    scissors: "剪刀",
    playing: "結算中…",
    resultWin: "勝利！你壓制了電腦",
    resultLose: "惜敗！下一拳翻盤",
    resultDraw: "平手！再來一拳",
    battleYou: "你的出拳",
    battleComputer: "電腦出拳",
    battleLocked: "手勢已鎖定",
    battleAgain: "再戰一局",
    gameLockedPreview: "預覽模式無法進行正式遊戲",
    leaderboards: "排行榜",
    invitationBoard: "邀請排行",
    winBoard: "勝場排行",
    loadingBoard: "載入排行中…",
    mgm: "會員邀請",
    mgmOptIn: "同意參加會員邀請，成功邀請好友可補充體力。",
    mgmOptedIn: "已參加會員邀請",
    referralCount: "有效邀請：{value}",
    optIn: "同意參加",
    errorRetry: "發生問題，請再試一次。",
    cameraUnknown: "沒有辨識到穩定手勢，請調整後再試。",
    energyEmpty: "體力不足，請透過有效邀請補充體力。",
    energyEmptyTitle: "體力已用完",
    energyRestHint: "請依活動規則休息一段時間後再回來；也可以立即邀請好友補充體力。",
    energyRestOnlyHint: "請依活動規則休息一段時間後再回來。",
    energyInviteNow: "立即邀請好友補充體力",
    energyInviteOptIn: "先同意會員邀請",
    energyViewOptions: "查看補充方式",
    fallbackDisabled: "替代出拳目前未啟用。",
    cameraPrompt: "把一隻手放進框內",
    leaderboardEmpty: "目前還沒有排名資料",
    inviteLink: "你的邀請連結",
    copyLink: "複製連結",
    linkCopied: "已複製",
    myRank: "我的排名",
    noRank: "尚無排名",
    score: "分數：{value}",
    themeLabel: "切換主題",
    themeDark: "深",
    themeLight: "淺",
  },
  en: {
    brand: "ROCK PAPER / LIFF",
    title: "Rock Paper Scissors",
    intro: "Start with three energy points. Camera recognition is the main play mode; fallback moves require your choice.",
    loading: "Loading campaign settings…",
    authenticated: "LINE identity verified",
    preview: "Preview mode",
    unavailable: "Campaign settings or login are temporarily unavailable",
    ready: "Campaign shell is ready",
    energyPreparing: "Game features are getting ready",
    energy: "Energy remaining: {value}",
    languageLabel: "Change language",
    localeZh: "繁",
    localeEn: "En",
    statusLabel: "Campaign initialization status",
    cameraStart: "Enable camera recognition",
    cameraStarting: "Starting camera…",
    cameraReady: "Camera is ready",
    cameraStop: "Stop camera",
    cameraSwitchToFront: "Switch to front camera",
    cameraSwitchToRear: "Switch to rear camera",
    energyEmptyButton: "Out of energy",
    cameraScanning: "Detecting automatically…",
    cameraDetected: "Detected: {hand}",
    gestureModelUnavailable: "The gesture model failed to load. The camera still works; use a fallback move.",
    cameraDenied: "Camera is unavailable. Choose a fallback move.",
    cameraPermissionDenied: "Camera permission was denied. Allow camera access in browser settings and try again.",
    cameraMissing: "No usable camera was found on this device.",
    cameraBusy: "The camera is being used by another app. Close it and try again.",
    cameraTimeout: "The camera permission request timed out. Reload or use a fallback move.",
    cameraRetryHint: "If you are in LINE's in-app browser, open the LIFF URL or use Safari/Chrome.",
    recognize: "Recognize hand",
    fallbackOffer: "Use a fallback move?",
    fallbackOptIn: "I agree to use fallback moves",
    fallbackManual: "Choose manually",
    fallbackRandom: "Random move",
    chooseHand: "Choose your hand",
    rock: "Rock",
    paper: "Paper",
    scissors: "Scissors",
    playing: "Resolving…",
    resultWin: "Victory! You beat the computer",
    resultLose: "So close! Take the next round",
    resultDraw: "Draw! One more round",
    battleYou: "Your move",
    battleComputer: "Computer",
    battleLocked: "Move locked",
    battleAgain: "Play again",
    gameLockedPreview: "Formal play is unavailable in preview mode",
    leaderboards: "Leaderboards",
    invitationBoard: "Invitations",
    winBoard: "Wins",
    loadingBoard: "Loading leaderboard…",
    mgm: "Member referrals",
    mgmOptIn: "Join member referrals to regain energy when friends join.",
    mgmOptedIn: "Member referrals enabled",
    referralCount: "Valid referrals: {value}",
    optIn: "Join",
    errorRetry: "Something went wrong. Please try again.",
    cameraUnknown: "No stable gesture detected. Adjust your hand and try again.",
    energyEmpty: "You are out of energy. Invite a valid member to regain energy.",
    energyEmptyTitle: "You are out of energy",
    energyRestHint: "Take a break and return when the campaign allows recovery; or invite a friend to regain energy now.",
    energyRestOnlyHint: "Take a break and return when the campaign allows recovery.",
    energyInviteNow: "Invite a friend to regain energy",
    energyInviteOptIn: "Join member referrals first",
    energyViewOptions: "See ways to regain energy",
    fallbackDisabled: "Fallback moves are not enabled.",
    cameraPrompt: "Place one hand inside the frame",
    leaderboardEmpty: "No ranking data yet",
    inviteLink: "Your invitation link",
    copyLink: "Copy link",
    linkCopied: "Copied",
    myRank: "My ranking",
    noRank: "No ranking yet",
    score: "Score: {value}",
    themeLabel: "Change theme",
    themeDark: "Dark",
    themeLight: "Light",
  },
};

const storageKey = "rockpaper.locale";
const themeStorageKey = "rockpaper.theme";

export function normalizeLocale(value: string | undefined): Locale {
  if (value?.toLowerCase().startsWith("zh")) return "zh-TW";
  return "en";
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return normalizeLocale(navigator.languages?.[0] ?? navigator.language);
}

export function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(storageKey);
  return saved === "zh-TW" || saved === "en" ? saved : detectLocale();
}

export function saveLocale(locale: Locale): void {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, locale);
}

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(themeStorageKey);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function saveTheme(theme: Theme): void {
  if (typeof window !== "undefined") window.localStorage.setItem(themeStorageKey, theme);
}

export function translate(locale: Locale, key: MessageKey, values?: Record<string, string | number>): string {
  const fallback = messages.en[key] ?? key;
  const template = messages[locale][key] ?? fallback;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values?.[name] ?? ""));
}

export type { MessageKey };
