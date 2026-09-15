## Purpose

在遊戲結果確定後提供可靠的 email 通知，將遊戲回應與寄信服務解耦，並確保 Resend API key 不會暴露給前端或被重複使用造成多封通知。

## ADDED Requirements

### Requirement: Result email opt-in and recipient
系統 SHALL 依活動設定決定是否啟用結果 email；寄送前 SHALL 有明確且合法的收件地址來源，若使用者未提供可用地址或未同意收信，系統 SHALL 保留遊戲結果但不寄信。

#### Scenario: Email is disabled
- **WHEN** email 功能開關為關閉
- **THEN** 系統不建立寄信工作，但遊戲結果仍正常保存

#### Scenario: Recipient is unavailable
- **WHEN** email 已啟用但使用者沒有可驗證的 email
- **THEN** 系統完成遊戲並標記通知為 skipped，不阻塞遊戲結果

### Requirement: Secure Resend delivery
Resend API 呼叫 SHALL 只在後端執行，並使用伺服器環境變數中的 API key；前端 SHALL 不得直接呼叫 Resend。

#### Scenario: Email delivery is queued
- **WHEN** 遊戲結果成功保存且使用者符合寄信條件
- **THEN** 系統建立包含結果識別碼與模板版本的寄信工作

#### Scenario: Client tries to send email directly
- **WHEN** 前端直接提交 Resend API request 或要求取得 API key
- **THEN** 系統拒絕該請求，且不回傳密鑰

### Requirement: Idempotent and retryable delivery
同一遊戲結果 SHALL 最多產生一筆有效寄信工作；暫時性失敗 SHALL 可重試，永久性失敗 SHALL 標記為 failed 並保留錯誤類型供管理者查詢。

#### Scenario: Delivery is retried
- **WHEN** Resend 暫時回應錯誤或網路逾時
- **THEN** 系統依重試政策再次寄送，不建立重複的通知工作

#### Scenario: Duplicate delivery request
- **WHEN** 同一結果因重整或重試再次觸發寄信
- **THEN** 系統使用冪等識別碼避免重複寄送

### Requirement: Delivery status
系統 SHALL 保存通知狀態、建立時間、最後嘗試時間、Resend message ID（若有）、重試次數與不含敏感密鑰的錯誤摘要。

#### Scenario: Member checks notification state
- **WHEN** 會員查看自己的結果通知狀態
- **THEN** 系統只回傳該會員可見的 queued、sent、skipped 或 failed 狀態
