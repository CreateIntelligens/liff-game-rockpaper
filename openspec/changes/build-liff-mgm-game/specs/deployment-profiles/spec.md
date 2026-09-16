## Purpose

讓同一套活動前端能以無後端的 GitHub Pages demo、Docker 單機環境或 Cloudflare Worker 正式環境啟動，並清楚限制各 profile 可提供的功能與資料保證。

## ADDED Requirements

### Requirement: Static demo profile
系統 SHALL 支援不依賴 API、LIFF 或秘密設定的 static demo profile；demo profile 可展示介面與本地模擬遊戲，但不得宣稱產生正式活動資料、MGM 獎勵、email 或排行榜結果。

#### Scenario: GitHub Pages has no API
- **WHEN** static demo build 開啟且 `/api/config` 不可用
- **THEN** 前端載入本地 demo config，仍可展示與操作 demo UI，不顯示 API failure page

#### Scenario: Demo result is created
- **WHEN** 使用者在 static demo 進行模擬遊戲
- **THEN** 結果只存在瀏覽器狀態，不建立正式會員、體力、MGM、排行榜或 email 紀錄

### Requirement: Cloudflare Worker profile
Cloudflare profile SHALL 以 Wrangler 設定 Worker entrypoint、Static Assets、compatibility date、observability 與 environment 分層；正式 token、email key、D1 與 Queues 資訊 SHALL 透過 Cloudflare bindings/secrets 提供。

#### Scenario: Worker serves the SPA
- **WHEN** 使用者開啟 Cloudflare Worker URL
- **THEN** Worker 回傳靜態前端與 `/health`、`/api/config`，並以 SPA fallback 處理前端路由

#### Scenario: Worker config has no fake resources
- **WHEN** repository 尚未建立 D1 或 Queues 資源
- **THEN** Wrangler config 不包含假的 resource ID，且 dry-run 不因 placeholder binding 失敗

### Requirement: Runtime profile boundary
正式功能 SHALL 依 profile 提供相同的 domain/ports contract；Docker 的 local filesystem、SQLite driver 與長駐 outbox loop SHALL 不被直接 import 到 Cloudflare Worker runtime。

#### Scenario: Runtime adapter is replaced
- **WHEN** 從 Docker profile 遷移到 Cloudflare profile
- **THEN** 只替換 storage、mail queue、auth runtime 與 static serving adapters，核心遊戲規則與 API contract 保持不變
