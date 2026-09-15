## Purpose

定義猜拳活動的正式遊玩流程、體力消耗、結果判定與歷史紀錄，讓前端負責互動呈現，後端負責結果與活動資格的權威判定。

## ADDED Requirements

### Requirement: Initial energy and configurable play limit
每個新活動會員 SHALL 取得由活動規則指定的初始體力；初始規則預設為 3 點。每次正式猜拳成功建立結果 SHALL 消耗 1 點體力，活動 SHALL 可透過規則版本設定每日或活動期間的遊玩上限。

#### Scenario: New member receives default energy
- **WHEN** 已驗證會員第一次進入活動
- **THEN** 系統顯示 3 點初始體力，且尚未產生猜拳紀錄

#### Scenario: Play consumes one energy
- **WHEN** 會員仍有體力並送出一次有效猜拳
- **THEN** 系統建立一筆結果並將體力減少 1 點

#### Scenario: No energy blocks play
- **WHEN** 會員體力為 0
- **THEN** 系統拒絕開始正式猜拳，且不建立結果、不扣除體力

### Requirement: Server-authoritative game result
正式輸贏、玩家手勢、主持人手勢、體力變更與抽獎資格 SHALL 由後端以目前活動規則判定；前端傳入的結果或獎勵數值 SHALL NOT 被直接採用。

#### Scenario: Client submits a play
- **WHEN** 已驗證會員送出合法遊戲請求
- **THEN** 後端依目前規則產生唯一結果，回傳結果、剩餘體力、規則版本與資產版本

#### Scenario: Client attempts to forge a win
- **WHEN** 請求包含前端指定的勝負或獎勵數值
- **THEN** 後端忽略或拒絕該欄位，並依伺服器規則計算正式結果

### Requirement: Idempotent play submission
遊戲提交 SHALL 支援請求識別碼，重複提交同一請求 SHALL 回傳原結果，不得重複扣除體力或增加獎勵。

#### Scenario: Network retry repeats a request
- **WHEN** 同一會員以相同請求識別碼重送遊戲請求
- **THEN** 系統回傳第一次建立的結果，且體力與獎勵只變更一次

### Requirement: Game history
已驗證會員 SHALL 能查詢自己的遊戲歷史，歷史資料 SHALL 至少包含遊戲時間、輸贏、手勢、規則版本、資產版本與當時產生的獎勵。

#### Scenario: Member views history
- **WHEN** 會員要求查看遊戲紀錄
- **THEN** 系統只回傳該會員可存取的歷史資料，並依時間倒序排列

### Requirement: Camera fallback opt-in
當相機不可用、使用者拒絕相機授權或影像辨識失敗時，系統 SHALL 只有在 fallback 全域開關啟用且使用者明確 opt-in 後，才提供替代出拳方式；未 opt-in 時 SHALL 結束或關閉本次遊戲流程。

#### Scenario: User opts in to manual fallback
- **WHEN** 相機流程失敗，fallback 功能啟用，且使用者選擇手動出拳
- **THEN** 系統提供石頭、剪刀、布三個選項，並將使用者選擇送交後端進行正式結果判定

#### Scenario: User opts in to random fallback
- **WHEN** 相機流程失敗，fallback 功能啟用，且使用者選擇隨機出拳
- **THEN** 前端只提交 `random` 模式，後端產生一個合法的石頭、剪刀或布輸入，再進行正式結果判定

#### Scenario: User does not opt in to fallback
- **WHEN** 相機流程失敗且使用者未同意 fallback
- **THEN** 系統不建立遊戲結果、不扣除體力，並顯示相機授權或替代流程提示
