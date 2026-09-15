## Purpose

將活動規則、遊戲參數、圖片包邊與前端展示資產集中管理並版本化，使活動未來調整時不必散改元件，且每筆歷史資料仍可追溯當時使用的設定。

## ADDED Requirements

### Requirement: Versioned campaign configuration
系統 SHALL 將初始體力、體力上限、消耗量、遊玩上限、MGM 獎勵、邀請排行榜、勝場排行榜、相機 fallback 模式、時區與功能開關保存為具識別碼的活動規則版本。

#### Scenario: New campaign version is published
- **WHEN** 管理者發布新的活動規則
- **THEN** 新建立的遊戲、邀請與排行榜事件使用新版本，既有事件不被靜默改寫

#### Scenario: Historical result is displayed
- **WHEN** 使用者查看歷史遊戲或管理者查帳
- **THEN** 系統能指出該筆資料使用的活動規則版本

### Requirement: Structured image frame specification
圖片包邊 SHALL 以結構化資產規格描述，包括資產版本、畫布尺寸、邊框或安全區、格式、透明度、裁切策略與可替換資產位置；前端 SHALL 依規格渲染，不得依賴散落的固定尺寸常數。

#### Scenario: Asset version is active
- **WHEN** 活動規則指定一個有效圖片資產版本
- **THEN** 遊戲結果與分享畫面使用該版本的包邊與資產規格

#### Scenario: Asset is invalid
- **WHEN** 圖片缺少必要格式、尺寸或資產檔案
- **THEN** 系統拒絕發布該資產版本並指出驗證錯誤

### Requirement: Configuration validation
活動規則與資產設定 SHALL 在啟用前通過 schema 驗證；不合法的體力、獎勵、排名或資產參數 SHALL 不得影響正式活動。

#### Scenario: Invalid rule version is submitted
- **WHEN** 設定包含負數體力、未知排名指標或不支援的資產格式
- **THEN** 系統拒絕啟用設定並回傳欄位級錯誤

### Requirement: Fallback policy configuration
活動規則 SHALL 能分別控制 fallback 是否啟用，以及允許的 `manual`、`random` 出拳模式；未被規則允許的模式 SHALL 不得出現在正式遊戲流程。

#### Scenario: Only manual fallback is enabled
- **WHEN** 規則啟用 fallback 且只允許手動模式
- **THEN** 相機失敗後系統只顯示石頭、剪刀、布選項，不顯示隨機出拳選項

#### Scenario: Fallback is disabled
- **WHEN** 規則關閉 fallback
- **THEN** 即使相機失敗，系統也不提供替代出拳選項
