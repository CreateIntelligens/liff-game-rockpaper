## Why

目前只有活動概念與 wiki 討論，尚未有可執行的 LIFF 遊戲系統規劃。需要先建立一個可配置、可追溯、可逐步擴充的活動基礎，讓猜拳、體力值、會員拉會員（MGM）、排行榜、結果寄信與圖片規範不會互相耦合。

這次規劃也要處理活動規則會變動的情況：每次遊戲必須保留當時的規則與資產版本，並且讓 MGM 成為可選擇參加的功能，避免未同意的使用者被自動納入邀請機制。

## What Changes

- 建立 LIFF 前端與後端 API 的整體活動架構。
- 支援 LINE 登入、LIFF 初始化與登入功能開關。
- 建立猜拳遊戲流程：預設三次體力、每次遊玩消耗一點體力、遊戲結果與每日限制可追蹤；相機不可用時提供需使用者主動選擇的手動或隨機出拳 fallback。
- 猜拳影像辨識 MVP 採用瀏覽器端 MediaPipe Gesture Recognizer，將模型資產納入前端 Docker image；YOLO 不列入 MVP。
- 建立 MGM 會員拉會員功能，包含全域開關、使用者 opt-in、邀請連結歸戶與成功邀請補充體力。
- 建立兩組排行榜：有效會員邀請排行榜與猜拳勝場排行榜；兩者均顯示遮碼後的會員識別資訊，並顯示目前使用者自己的兩種排名。
- 建立 SQLite 儲存模型，支援 Docker local folder persistent volume。
- 建立可版本化的活動規則、圖片包邊規格與資產設定。
- 建立遊戲結果 email 通知流程，透過後端安全呼叫 Resend API，支援重試與避免重複寄送。
- 提供 Docker / Docker Compose 執行版本，包含前端靜態服務、後端 API、SQLite persistent volume 與環境變數設定。
- 提供 GitHub Pages 靜態 demo profile，以及 Cloudflare Worker / Static Assets 的正式 deployment profile。
- 施工完成後更新 `README.md` 與 `CHANGELOG.md`，記錄啟動方式、環境變數、活動功能與版本變更。
- 建立資料與 API 邊界驗證、LINE Token 驗證、權限與敏感設定管理。
- 建立 domain、ports 與 runtime adapters 邊界，讓目前 Docker runtime 可在未來替換為 Cloudflare Workers、D1、Queues 與 Static Assets。
- **BREAKING**：正式遊戲結果、體力變更、MGM 獎勵與排行榜資料不再由前端自行決定，改由後端作為權威來源。

## Capabilities

### New Capabilities

- `liff-auth-and-feature-flags`: LIFF 初始化、LINE 身分驗證、公開設定與功能開關。
- `rock-paper-scissors-gameplay`: 猜拳流程、體力消耗、輸贏結果、每日限制與遊戲歷史。
- `mgm-referral-and-energy`: 使用者 opt-in、會員邀請、邀請歸戶、成功邀請補充體力與防重複處理。
- `leaderboard-and-ranking`: 遮碼排行榜、排名計算、自己的排名與隱私邊界。
- `campaign-rules-and-assets`: 活動規則、圖片包邊與 UI 資產規格的版本化管理。
- `result-email-notifications`: 遊戲結果通知、Resend 整合、寄信狀態、重試與冪等性。
- `game-data-persistence`: SQLite schema、Docker volume、資料一致性與查詢介面。
- `localized-responsive-ui`: 繁體中文／English 偵測與切換、手機優先 RWD、觸控與可讀性規範。
- `deployment-profiles`: 一般 Web demo、GitHub Pages、Docker 與 Cloudflare Worker 的啟動邊界與設定。

### Modified Capabilities

- None. The repository has no existing capability specifications; this is a greenfield system plan.

## Impact

- 新增前端 LIFF web app、後端 API、SQLite database layer、email delivery worker/outbox 與 Docker runtime。
- 新增公開 API：runtime config、登入交換、開始遊戲、遊戲歷史、體力、邀請、排行榜與自己的排名。
- 需要 LINE Login/LIFF 設定與可能的 `openid`、`profile`、`email` scope；前端只取得公開設定，LINE channel secret、access token 與 Resend API key 僅存在後端環境變數。
- 需要 Resend 寄件網域驗證與寄件 API key。
- 需要定義遊戲結果寄送對象；若使用 LINE Email，需處理 email scope、使用者同意與未提供 email 的 fallback。
- SQLite 適合單一 container 或小型活動；若要多副本、高併發或跨主機部署，需保留未來遷移 PostgreSQL 等集中式資料庫的邊界。
- 需要補充活動辦法、隱私權、相機權限、LINE 授權、MGM opt-in 與排行榜公開顯示方式。
