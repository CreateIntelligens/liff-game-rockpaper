## Purpose

提供具遊戲感但不暴露完整個資的排行榜，讓使用者能查看活動排名與自己的位置，同時依規則版本固定排名計算方式，避免結果因規則變更而無法解釋。

## ADDED Requirements

### Requirement: Invitation and win leaderboards
系統 SHALL 提供兩組可分開查看的排行榜：有效會員邀請排行榜與猜拳勝場排行榜。兩組排行榜 SHALL 各自使用已驗證的統計數值排序，並以活動規則指定的次排序規則處理平手。

#### Scenario: Member views invitation leaderboard
- **WHEN** 使用者選擇有效會員邀請排行榜
- **THEN** 系統依有效邀請數排序，且只計算符合 MGM 規則並完成去重的邀請

#### Scenario: Member views win leaderboard
- **WHEN** 使用者選擇猜拳勝場排行榜
- **THEN** 系統依已保存的正式猜拳勝場數排序，且不採用前端自行宣告的勝利

#### Scenario: Ranking rule changes
- **WHEN** 活動發布新規則版本並變更其中一組排行榜的計分方式
- **THEN** 新增或更新的排名資料使用新版本計算，舊紀錄保留原規則版本

### Requirement: Masked public leaderboard
公開排行榜 SHALL 只顯示遮碼後的會員識別資訊、排名與公開分數，不得顯示 LINE user ID、完整 email、完整姓名或邀請明細。

#### Scenario: Public member views leaderboard
- **WHEN** 任一符合公開條件的使用者查看排行榜
- **THEN** 系統回傳遮碼名稱或固定匿名代號、公開排名與公開分數

#### Scenario: Sensitive fields are requested
- **WHEN** 前端或未授權請求要求完整會員資料
- **THEN** 系統不回傳敏感欄位

### Requirement: Current member rankings
已驗證會員 SHALL 能分別查看自己的有效邀請排名與猜拳勝場排名、對應分數、有效邀請數、勝場數與距離上一名的差距；若會員未 opt-in MGM，系統 SHALL 顯示未參與 MGM 邀請排名，但仍可顯示猜拳勝場排名。

#### Scenario: Member has both rankings
- **WHEN** 已驗證會員查看自己的排名
- **THEN** 系統分別回傳有效邀請排名與猜拳勝場排名、分數與必要的排名上下文

#### Scenario: Member is not eligible for invitation ranking
- **WHEN** 會員未 opt-in 或沒有任何有效排名資料
- **THEN** 系統清楚顯示未參與有效邀請排名，但不得因此隱藏其可公開的猜拳勝場排名，也不得顯示其他會員的私人資料

### Requirement: Stable ranking snapshot
排行榜回應 SHALL 帶有計算時間、活動規則版本與排名指標版本；同一計算週期內的排名結果 SHALL 可重現。

#### Scenario: Ranking response is audited
- **WHEN** 管理者需要確認某次排行榜結果
- **THEN** 系統可依回應中的版本與計算時間追溯排名規則
