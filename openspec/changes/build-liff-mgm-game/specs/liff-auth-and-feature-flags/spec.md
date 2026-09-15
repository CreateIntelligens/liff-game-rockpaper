## Purpose

提供可在 LINE LIFF 與一般瀏覽器中運作的活動入口，安全驗證使用者身分，並允許活動管理者在不修改前端程式的情況下開關整合功能。

## ADDED Requirements

### Requirement: Public runtime configuration
系統 SHALL 提供前端所需的公開 runtime 設定，包括 LIFF ID、API 位址、活動名稱與功能開關；設定 SHALL NOT 包含 LINE channel secret、channel access token、Resend API key 或其他伺服器密鑰。

#### Scenario: Frontend loads public configuration
- **WHEN** 使用者開啟活動頁面
- **THEN** 前端取得公開設定並依設定顯示或隱藏 LIFF 登入、相機、MGM、排行榜與 email 功能

#### Scenario: Secret values are not exposed
- **WHEN** 使用者查看公開設定或前端 bundle
- **THEN** 系統不回傳任何 LINE secret、LINE access token 或 Resend API key

### Requirement: LIFF authentication
系統 SHALL 在 LIFF 功能啟用時初始化 LIFF，並將前端取得的 ID token 或 access token 傳送至後端驗證；後端 SHALL 以 LINE 驗證結果建立或取得活動會員。

#### Scenario: LIFF browser login succeeds
- **WHEN** 使用者在 LIFF browser 完成初始化與授權
- **THEN** 系統建立已驗證的活動 session，並顯示會員專屬體力與遊戲資料

#### Scenario: External browser login succeeds
- **WHEN** 使用者在 Safari 或 Chrome 開啟活動連結且登入功能啟用
- **THEN** 系統引導 LINE Login，完成後回到活動頁並建立已驗證 session

#### Scenario: Invalid token is rejected
- **WHEN** 後端收到過期、格式錯誤或 channel 不符的 token
- **THEN** 系統拒絕建立 session，且不建立遊戲、體力或 MGM 紀錄

### Requirement: Authentication feature toggle
系統 SHALL 支援將 LINE 登入設為啟用或停用；停用時 SHALL 允許設定為展示模式或拒絕正式遊戲，且展示模式不得產生正式獎勵資料。

#### Scenario: Login is disabled for preview
- **WHEN** LINE login 開關為關閉且展示模式為啟用
- **THEN** 使用者可以觀看活動與遊戲介面，但不能產生正式遊戲結果、MGM 獎勵或排行榜積分

#### Scenario: Login is required for production play
- **WHEN** LINE login 開關為關閉且展示模式為停用
- **THEN** 系統提示使用者目前無法進行正式遊戲
