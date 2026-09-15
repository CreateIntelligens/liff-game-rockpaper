## Purpose

提供使用者主動參加的會員拉會員機制，將有效邀請轉換成體力補充，同時保留歸戶、去重與活動規則版本，避免未同意參加者被自動納入 MGM 活動。

## ADDED Requirements

### Requirement: MGM opt-in
MGM SHALL 受全域功能開關控制，且每位會員 SHALL 在首次使用前明確選擇參加；未 opt-in 的會員不得產生邀請連結、邀請獎勵或被計入 MGM 排名。

#### Scenario: MGM is globally disabled
- **WHEN** MGM 全域開關為關閉
- **THEN** 系統不顯示邀請入口、不建立 MGM 歸戶資料，且不因任何邀請增加體力

#### Scenario: Member opts in
- **WHEN** 會員閱讀活動說明並明確選擇參加 MGM
- **THEN** 系統記錄 opt-in 時間與規則版本，並提供該會員的邀請連結

#### Scenario: Member does not opt in
- **WHEN** 會員未同意 MGM
- **THEN** 系統仍允許符合條件的遊戲功能，但不提供邀請獎勵與 MGM 排名資料

### Requirement: Referral attribution
系統 SHALL 將邀請參數保存至受邀者完成活動身分驗證與官方帳號加入流程的時點；若受邀者曾點擊多個邀請連結，預設 SHALL 以完成加入時仍有效的最後一個邀請連結歸戶。

#### Scenario: Referred member completes onboarding
- **WHEN** 受邀者透過邀請連結完成登入、授權與活動規則要求的加入流程
- **THEN** 系統將一次有效邀請歸戶給對應邀請人

#### Scenario: Multiple invitation links are opened
- **WHEN** 受邀者先後開啟 A 與 B 的邀請連結，最後透過 B 完成加入
- **THEN** 有效邀請歸戶給 B，且 A 不取得該次獎勵

#### Scenario: Self-referral is attempted
- **WHEN** 會員使用自己的邀請連結完成活動流程
- **THEN** 系統拒絕該筆歸戶，不增加邀請人或受邀者的體力

### Requirement: Valid referral grants energy
每位受邀會員在符合活動規則且尚未被計算過的情況下 SHALL 只產生一次有效邀請獎勵；預設每次有效邀請補充 1 點體力，且不得超過活動規則設定的體力上限。

#### Scenario: First valid referral
- **WHEN** 邀請人與受邀者均符合活動資格，且該受邀者尚未被計算
- **THEN** 系統建立一筆有效邀請並為邀請人增加 1 點體力，但不超過體力上限

#### Scenario: Duplicate referral callback
- **WHEN** 同一受邀者再次觸發完成流程或重送 callback
- **THEN** 系統回傳原歸戶結果，不重複增加體力

### Requirement: Referral abuse controls
系統 SHALL 對邀請歸戶執行唯一性、速率與基本資格檢查，並 SHALL 保留足以查帳的邀請事件；防刷機制 SHALL 不宣稱能可靠辨識所有假帳號。

#### Scenario: Invalid or repeated referral data
- **WHEN** 邀請資料缺少必要欄位、過期、重複或與目前會員不一致
- **THEN** 系統拒絕獎勵並記錄可供管理者查詢的拒絕原因
