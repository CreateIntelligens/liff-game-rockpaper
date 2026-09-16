## Context

本 repository 目前只有 OpenSpec 設定與空的 specs 目錄，沒有既有前端、後端或資料庫可延伸。需求來自 wiki 的猜拳、相機授權、邀請歸戶、遊戲結果與活動規則討論，並新增三點初始體力、MGM opt-in、邀請補體力、遮碼排行榜與個人排名。

系統需要同時處理瀏覽器互動、LINE 身分、活動規則、交易型資料、圖片資產與外部 email 服務。因此前端只負責呈現與取得使用者操作，後端才是遊戲結果、體力、邀請獎勵與排行榜的權威來源。

## Goals / Non-Goals

**Goals:**

- 以 LIFF web app 加後端 API 建立可部署的活動骨架。
- 用公開 runtime config 控制 LIFF、相機、MGM、排行榜與 email 功能。
- 讓三點初始體力、消耗、補充與排名規則可版本化。
- 以 SQLite + Docker persistent volume 支援第一階段單機部署。
- 以 outbox 與冪等處理整合 Resend，避免寄信失敗影響遊戲結果。
- 保留好友邀請與排行榜所需的查帳事件，並限制敏感資料公開範圍。

**Non-Goals:**

- 第一版不承諾可靠辨識所有假帳號、分身帳號或機器人。
- 第一版不建立完整營運後台、抽獎開獎系統或獎品兌換流程。
- 第一版不直接支援多副本 SQLite 高併發部署。
- 第一版不把 LINE channel secret、access token 或 Resend API key 暴露給瀏覽器。
- 第一版不把圖片辨識模型本身視為活動規則；相機與手勢辨識可替換。
- 第一版以 Docker Compose 支援本機、測試與單機部署，並鎖定可重現的 Node.js 與套件版本。
- 第一版以 MediaPipe Gesture Recognizer 作為唯一正式影像辨識模型，模型檔與前端 asset manifest 一起版本化。
- 第一版 SHALL 將 domain logic 與 Node/SQLite/Resend runtime 隔離，保留未來 Cloudflare Workers runtime 的替換點。

## Decisions

### 1. Frontend and backend boundary

採用 `frontend` 與 `server` 的清楚邊界。前端處理 LIFF 初始化、相機權限、手勢辨識、fallback opt-in、動畫、排行榜展示與錯誤提示；後端處理 token 驗證、遊戲結果、體力、MGM、排行榜計算、資料存取與 email。

LINE 官方建議將 LIFF 取得的 ID token 或 access token 傳給 server，由 server 向 LINE 驗證；不直接相信前端傳來的 profile 欄位。這也避免使用者修改前端 payload 後偽造勝場或邀請獎勵。

### 2. Runtime configuration with secret separation

建立公開 `/api/config` 與伺服器私有環境設定兩層：

- 公開：LIFF ID、API URL、活動名稱、功能開關、目前規則與資產版本。
- 私有：LINE channel secret、channel access token、Resend API key、資料庫位置與管理密鑰。

功能開關由 server 發布，前端只讀取結果。遊戲正式 API 仍會在 server 端再次檢查開關，避免使用者自行呼叫被關閉的功能。

### 3. Energy ledger instead of a mutable counter only

會員資料可以保存目前體力快取，但每次增加或扣除都要同時保存不可重複處理的 energy event。遊戲消耗使用交易與請求識別碼；有效 MGM 邀請使用受邀者唯一約束。這比單純更新 `energy = energy - 1` 更容易查帳與修復。

預設規則為初始 3 點、每局消耗 1 點、有效邀請補 1 點、且不超過上限。每日限制、時區、上限與相機 fallback policy 放在規則版本，避免把 wiki 中可能變動的數字寫死在 UI。

### 4. MGM as explicit opt-in

MGM 分成三個狀態：全域 disabled、會員未 opt-in、會員已 opt-in。只有第三種狀態能建立邀請連結並取得補體力獎勵。邀請參數先保存，直到受邀者完成活動要求的登入、授權與官方帳號加入流程才完成歸戶。

初始歸戶策略採「完成加入時仍有效的最後一個邀請連結」，符合 wiki 中以完成加入的連結為主的決議。邀請事件以受邀者 LINE user identity 唯一化，並保留拒絕原因。

### 5. Leaderboard privacy and metrics

排行榜 API 分成公開排行榜與自己的排名兩種 response，並在每種 response 中明確標示 leaderboard type。系統提供有效會員邀請排行榜與猜拳勝場排行榜。公開資料只包含遮碼顯示名稱或匿名代號、排名與公開分數；自己的排名可以包含兩種排名、有效邀請數、勝場數與距離上一名的差距，但不能回傳其他會員的完整資訊。

兩組排行榜各自保存計分規則。有效邀請排行榜只計算已驗證且去重的 MGM 事件；勝場排行榜只計算後端正式結算的勝場。每個排名 response 帶計算時間、規則版本與指標版本，方便活動結束後查帳。

### 6. SQLite first, migration-safe schema

第一版使用 SQLite 放在 `/app/data/game.sqlite`，Docker 以 host folder 或 named volume 掛載。資料存取使用參數化查詢與交易；schema 避免依賴 SQLite 特有的不可遷移行為，保留日後移往 PostgreSQL 的可能性。

核心資料邊界包括：會員、活動規則、遊戲結果、energy ledger、MGM referral events、leaderboard snapshots/source scores、email deliveries。任何會改變體力或有效邀請的操作都必須可由事件與結果重建。

### 7. Email outbox and Resend

遊戲交易成功後只建立 email delivery outbox，不在遊戲 request 中同步等待 Resend。背景 worker 依 delivery 狀態寄送，使用結果 ID 作為冪等鍵；暫時性錯誤可重試，永久性錯誤保留狀態供管理者處理。

收件地址優先使用已取得同意且經過驗證的 LINE email；若沒有 email scope、使用者未同意或資料不存在，系統保存遊戲結果並將通知標記為 skipped，不能讓寄信需求阻塞遊戲。

### 8. Versioned rules and visual assets

規則與圖片資產使用獨立版本，遊戲結果同時保存 `ruleVersion` 與 `assetVersion`。圖片包邊規格用 schema 描述畫布、safe area、邊框、透明度、裁切與輸出格式；發布前驗證，前端依設定渲染。

### 9. Camera fallback as a second opt-in

相機是主要遊玩方式。相機拒絕、不可用或辨識失敗時，前端先顯示替代流程說明；只有在 fallback 全域開關開啟且使用者再次明確 opt-in 後，才顯示活動規則允許的模式。MVP 支援 `manual`（使用者選石頭／剪刀／布）與 `random`（由後端隨機選一個合法手勢）兩種模式。手動模式提交使用者選擇；隨機模式只提交模式，正式出拳與勝負都由後端判定。

### 10. Technology stack and Docker runtime

採用以下技術棧：

- Frontend：React + TypeScript + Vite；`@line/liff` 負責 LIFF 初始化與登入；瀏覽器 `getUserMedia` 負責相機；影像辨識封裝在可替換的 camera adapter，MVP 明確採用 `@mediapipe/tasks-vision` 的 Gesture Recognizer。
- Backend：Node.js LTS + TypeScript + Fastify；Zod 負責 API boundary validation；LINE token 驗證、遊戲規則、體力、MGM、排行榜與 email orchestration 全部在 server。
- Database：SQLite + Drizzle ORM + `better-sqlite3`；使用 `/app/data/game.sqlite`，以參數化查詢與交易保護資料一致性。
- Email：Resend REST API via `fetch`；API key 只存在 API container 的 secret environment，未來可由 Workers/Queues adapter 重用。
- Testing：Vitest 做 domain/API tests，Playwright 做瀏覽器與 LIFF fallback flow tests。
- Packaging：npm workspaces；lockfile 固定依賴版本。

Docker Compose MVP 提供兩個 service：

```text
web  -> Nginx serves Vite build and proxies /api
api  -> Fastify HTTP API + SQLite + email outbox loop
                  |
                  +--> ./data:/app/data
```

`web` 使用 multi-stage build 產出靜態檔；`api` 使用 Debian slim 類型的 Node runtime，避免 SQLite native dependency 在 Alpine 編譯造成不必要的部署摩擦。正式環境必須以 `.env`、secret manager 或部署平台 secret 注入敏感設定，不將 `.env` 提交到 repository。

Docker commands 的最低契約為：

- `docker compose build`：建立前後端 image
- `docker compose up -d`：啟動活動服務
- `docker compose logs -f api`：查看 API 與 outbox 狀態
- `docker compose down`：停止服務但保留 host data folder

API 目前同時執行 HTTP 與 outbox loop，以降低 SQLite 多進程競爭；若未來需要多副本或大量寄信，再將 outbox 拆為獨立 worker 與集中式資料庫。

### 11. Hand gesture recognition model

MVP 採用 MediaPipe Gesture Recognizer 的 web/JavaScript runtime，而不是 YOLO。官方提供的 canned gestures 包含 `Closed_Fist`、`Open_Palm` 與 `Victory`，可分別映射為石頭、布與剪刀；辨識結果也包含 hand landmarks，方便畫面提示與後續品質檢查。

模型在使用者裝置端以 WebAssembly 執行，只傳送抽象化的 `rock`、`paper`、`scissors` 或 `unknown` 結果給後端，不傳送影像或影格。前端 camera adapter SHALL 負責：

- 使用 `runningMode: VIDEO` 逐影格辨識，避免每個畫面都建立模型。
- 只允許一隻手，符合猜拳規則。
- 使用 confidence threshold、連續多幀一致與穩定時間窗，避免單幀誤判直接送出結果。
- 將 `None`、低信心或多手結果視為 `unknown`，讓使用者重試或進入 opt-in fallback。
- 將 model asset 與 model version 納入前端 asset manifest，方便未來更換模型。

CV 結果是未可信任的 client input，不作為獎勵或排行榜的安全依據。後端只接受合法手勢 enum，並依目前活動規則產生主持人拳與正式輸贏；若活動採 wiki 中的 50/50 結果規則，勝場應由後端隨機結果計算。若未來要求後端驗證使用者真的做出該手勢，需另行評估上傳影像、遠端推論或裝置證明，這不列入 MVP。

YOLO 保留為後續方案，不列入 MVP。它較適合需要自訂資料集、物件框選、複雜背景或多類物件偵測的情境；若未來要辨識活動專用手勢、主持人手勢或非標準姿勢，再以相同 adapter contract 評估 YOLO、MediaPipe custom gesture model 或其他瀏覽器模型。

### 12. Documentation deliverables

施工完成時 SHALL 更新 repository root 的 `README.md` 與 `CHANGELOG.md`。README 必須說明 Docker 啟動、環境變數、LIFF 設定、模型資產、SQLite volume、功能開關與測試指令；CHANGELOG 必須記錄本次功能、預設規則、fallback opt-in、兩組排行榜、Resend 與任何已知限制。

### 13. Cloudflare portability boundary

目前先提供 Node/Fastify + SQLite + Docker runtime，但不讓活動核心依賴 Node、檔案系統、SQLite driver 或 Resend API runtime。模組邊界如下：

```text
packages/core
  domain rules, energy, game result, referral, ranking
        ↓ depends on interfaces only
packages/ports
  GameStore, CampaignStore, AuthVerifier, Mailer, Clock, RandomSource
        ↓ implemented by runtime adapters
apps/api
  Fastify + SQLite/Drizzle + LINE verify + Resend fetch + local outbox

future apps/worker
  Worker/Hono + D1 + LINE fetch verifier + Queues + Resend fetch
```

核心規則 SHALL 不 import Fastify、Drizzle、`better-sqlite3`、Resend client、Node `fs` 或 Node-only globals。資料庫 port SHALL 以 domain input/output 與 SQL migration contract 表達，避免把 SQLite driver 的 row type 傳入 core。Email port SHALL 接收已渲染且已驗證的 message command，讓本機 outbox 與未來 Cloudflare Queues consumer 使用同一個 contract。

Cloudflare 路徑採以下替換策略：React/Vite build 可部署為 Workers Static Assets；SQLite schema 可遷移至 D1 binding；email outbox loop 可替換為 Queues producer/consumer；資產在需要時可從靜態 assets 遷移至 R2。這是未來部署 target，不列入目前 Docker MVP 的正式部署工作。

目前 Docker MVP 的限制仍明確保留：本機 SQLite 需要 persistent volume，API 可執行 outbox loop；Cloudflare Workers 沒有相同的 persistent local filesystem 或長駐 loop，因此不可直接重用這些 runtime adapter。

### 14. Localization and responsive UI

前端第一版支援 `zh-TW` 與 `en`。初始化時依序使用使用者已保存的選擇、LIFF/瀏覽器語系與 English fallback；使用者切換 `繁` 或 `En` 後，選擇保存於該瀏覽器，下一次開啟優先使用手動選擇。所有使用者可見文字、按鈕、相機提示、fallback 說明、排行榜標籤、錯誤訊息與 email 狀態都必須由 locale dictionary 取得，不得在元件中散落硬編碼。

介面 SHALL 提供深色與淺色兩套完整 theme token。深色以深海藍遊戲桌為預設 fallback，淺色以冷白／霧藍表面呈現；兩套 theme 共用資訊架構、accent 色與互動狀態規則，使用者可手動切換且選擇保存於瀏覽器。未選擇時依 `prefers-color-scheme` 偵測，無法偵測時使用深色。

UI 採 mobile-first responsive layout，目標裝置為 LINE LIFF 內的手機瀏覽器。基礎樣式先支援 320px 以上窄螢幕與觸控，使用 44px 以上觸控目標、safe-area inset、單欄內容與不造成水平捲軸的長文字；在 640px、768px、1024px 以上逐步增加間距與內容寬度，但不改變資訊架構。相機畫面、體力區、fallback controls、排行榜 tabs 與語系切換在橫向手機、平板與桌面都必須可操作。

### 15. Deployment profiles

系統提供三個明確 profile：

- `demo-static`：前端從本地 demo config 啟動，可部署到 GitHub Pages；不呼叫正式 API、不使用 LIFF、不保存正式體力／MGM／排行榜資料。
- `docker`：Docker Compose 的 `web` + `api`，使用 host SQLite volume，適合本機與單機活動環境。
- `cloudflare`：Cloudflare Worker + Static Assets，未來以 D1 取代 SQLite、Queues 取代本機 outbox loop；正式 secret 使用 Worker secrets。

GitHub Pages workflow SHALL 以 `VITE_DEMO_MODE=true` 建置，並使用 repository subpath base。Cloudflare `wrangler.jsonc` SHALL 使用當日 compatibility date、Static Assets binding、observability 與 environment 分層；D1/Queues binding 只在實際資源建立後加入，不提交 placeholder ID 作為可部署設定。

## Risks / Trade-offs

- [LINE 身分或好友狀態判定不完整] → 把 token 驗證、官方帳號加入與 MGM 歸戶拆成明確事件；不能只相信 URL 參數。
- [前端相機權限被拒絕] → 將 camera feature flag、fallback feature flag 與使用者 fallback opt-in 分離；未同意 fallback 時保留關閉遊戲流程。
- [手勢在低光源、角度或不同手機上誤判] → 以多幀穩定判定與 confidence threshold 降低誤判；unknown 時允許重試或使用者主動 opt-in fallback。
- [MGM 假帳號與刷邀請] → 先做唯一性、速率限制、事件查帳與人工處理欄位；不宣稱能完全自動偵測假帳號。
- [SQLite 寫入競爭或 host disk 遺失] → 單機部署限制、使用 transaction、提供 volume 備份；流量或副本增加時遷移集中式資料庫。
- [規則變更造成排名爭議] → 所有結果、邀請、排名資料保存規則版本與計算時間，新的規則不回寫歷史事件。
- [Resend 暫時失敗或重複寄信] → outbox、重試上限、delivery 狀態與冪等鍵；遊戲結果與通知結果分離。
- [排行榜洩漏個資] → 只提供遮碼 public projection，個人排名 endpoint 依 session scope 查詢。
- [LINE email 未取得或未同意] → email 為可選通知，不阻塞遊戲；必要時另設使用者主動輸入 email 的流程與同意紀錄。

## Migration Plan

1. 先以單一 Docker service、SQLite volume、手動規則與資產版本完成 MVP。
2. 加入備份檔驗證與還原演練，再開放小流量活動。
3. 若需要多副本或高併發，先建立 repository-level database adapter，再將 SQLite schema 與事件資料遷移到 PostgreSQL。
4. 若 email 量增加，將 outbox worker 拆成獨立 process 或 queue；前端 API contract 不變。
5. 若排行榜需要即時性，從 source scores 重建 snapshot；不直接修改歷史遊戲事件。

Rollback：關閉正式遊戲、MGM、email 或排行榜功能開關，保留已寫入資料；若新規則造成問題，將 active rule version 切回上一個已驗證版本，不刪除事件資料。

## Open Questions

- 正式活動的 email 收件來源要使用 LINE email，還是讓使用者另行輸入 email？這會影響 LINE scope、同意畫面與個資流程。
- 排行榜目前確定拆成有效邀請數與猜拳勝場數兩組，兩組各自排名；未來若要加權總分，另建立新的規則版本。
- 官方帳號「新好友」的定義是否包含曾封鎖後重新加入者？此規則需要企劃確認後寫入活動規則。
- 相機拒絕授權時提供 opt-in fallback；MVP 支援手動選石頭／剪刀／布與隨機出拳，未同意 fallback 時關閉遊戲。
