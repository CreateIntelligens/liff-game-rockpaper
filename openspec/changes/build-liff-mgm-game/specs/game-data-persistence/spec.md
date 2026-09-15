## Purpose

建立可在 Docker 單機部署中持久保存活動資料的資料層，確保遊戲、體力、MGM、排行榜與寄信狀態具備一致性，並保留未來遷移集中式資料庫的清楚邊界。

## ADDED Requirements

### Requirement: Persistent activity records
系統 SHALL 保存會員、活動 session、遊戲結果、體力異動、MGM 事件、排行榜來源資料與 email delivery 狀態；每筆記錄 SHALL 具備建立時間與必要的規則或資產版本。

#### Scenario: Container restarts
- **WHEN** Docker container 停止後以相同 persistent volume 啟動
- **THEN** 既有會員、體力、遊戲歷史、邀請與寄信狀態仍可查詢

### Requirement: Atomic energy and reward changes
遊戲結果、體力扣除、MGM 補充與獎勵事件 SHALL 以不可部分提交的資料操作完成，避免成功回傳但資料未扣除或重複加值。

#### Scenario: Game transaction fails
- **WHEN** 遊戲結果保存或體力更新其中一項失敗
- **THEN** 系統回滾該次遊戲交易，不回傳成功結果，也不建立可用獎勵

#### Scenario: Referral transaction is repeated
- **WHEN** 同一受邀者的有效邀請事件被重複處理
- **THEN** 唯一性約束或等價機制保證邀請人只取得一次體力獎勵

### Requirement: Docker persistence contract
SQLite 資料庫 SHALL 位於明確的資料目錄，Docker 部署 SHALL 支援將該目錄掛載到 host folder 或 named volume；系統 SHALL 提供備份與還原說明。

#### Scenario: Host folder is mounted
- **WHEN** 管理者將 host 的資料夾掛載至應用程式資料目錄
- **THEN** 系統在該資料夾建立或開啟 SQLite database，且重建 container 不會清除資料

### Requirement: Access-scoped queries
會員資料查詢 SHALL 依已驗證身分限制範圍；會員只能查詢自己的歷史、體力、通知與個人排名，公開排行榜只能取得遮碼欄位。

#### Scenario: Member requests another member's history
- **WHEN** 會員嘗試以自己的 session 查詢其他會員的遊戲歷史
- **THEN** 系統拒絕該請求並不洩露目標會員是否存在
