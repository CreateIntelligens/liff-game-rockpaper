## Purpose

讓主要在 LINE 手機瀏覽器使用的活動介面能自動選擇語系、提供繁體中文與英文切換，並在手機、平板與桌面尺寸維持可讀、可觸控與不溢出的操作體驗。

## ADDED Requirements

### Requirement: Locale detection and supported languages
前端 SHALL 支援 `zh-TW` 與 `en`，並依序使用已保存的使用者選擇、LIFF 或瀏覽器語系；不支援的語系 SHALL 安全回退至 `en`。

#### Scenario: Traditional Chinese is detected
- **WHEN** 使用者沒有手動選擇，且瀏覽器語系為 `zh-TW` 或繁體中文變體
- **THEN** 系統以繁體中文顯示活動介面

#### Scenario: Unsupported language is detected
- **WHEN** 使用者沒有手動選擇，且瀏覽器語系不是支援的語系
- **THEN** 系統以 English 顯示活動介面

### Requirement: User locale switch
使用者 SHALL 能透過 `繁` 與 `En` 控制切換語系；手動選擇 SHALL 保存於目前瀏覽器，並優先於後續自動偵測。

#### Scenario: User switches to English
- **WHEN** 使用者選擇 `En`
- **THEN** 所有活動 UI 文字立即切換為 English，且重新整理後仍維持 English

#### Scenario: User switches to Traditional Chinese
- **WHEN** 使用者選擇 `繁`
- **THEN** 所有活動 UI 文字立即切換為繁體中文，且重新整理後仍維持繁體中文

### Requirement: Localized user-facing states
所有活動可見文字 SHALL 來自 locale dictionary，至少涵蓋初始化、登入、相機授權、相機辨識失敗、manual/random fallback、體力、排行榜、錯誤與 email 通知狀態。

#### Scenario: API error is shown
- **WHEN** API 回傳已知錯誤代碼
- **THEN** 前端依目前語系顯示對應的可理解訊息與恢復動作

#### Scenario: Missing translation key
- **WHEN** 某個 UI 狀態沒有目前語系的翻譯
- **THEN** 系統使用 English fallback，不顯示 undefined、空白或 translation key

### Requirement: Mobile-first responsive layout
活動介面 SHALL 以 320px 以上手機寬度為基礎設計，並在橫向手機、平板與桌面寬度調整版面；核心內容不得產生水平捲軸。

#### Scenario: Small phone viewport
- **WHEN** 使用者以 320px 寬度開啟活動
- **THEN** 標題、語系切換、體力、相機區域與主要操作仍可讀且可操作，不被裁切

#### Scenario: Tablet or desktop viewport
- **WHEN** 使用者以 768px 以上寬度開啟活動
- **THEN** 內容增加留白與最大寬度限制，但維持相同資訊架構與操作順序

### Requirement: Touch and accessibility baseline
互動控制 SHALL 適合觸控，主要按鈕與語系切換 SHALL 至少具備 44px 操作尺寸、可見 focus state、可讀標籤與不依賴 hover 的操作方式。

#### Scenario: Touch user uses fallback
- **WHEN** 使用者在手機上開啟 manual/random fallback
- **THEN** 所有手勢選項與確認操作都可透過觸控完成，且不需要 hover

### Requirement: Light and dark themes
前端 SHALL 提供深色與淺色兩套可切換 theme，並依使用者保存選擇或 `prefers-color-scheme` 初始化；兩套 theme SHALL 維持可讀對比、focus state 與相同資訊架構。

#### Scenario: User switches theme
- **WHEN** 使用者切換淺色或深色主題
- **THEN** 活動介面立即套用對應色彩 token，且重新整理後維持該選擇

#### Scenario: Theme follows system preference
- **WHEN** 使用者沒有保存主題選擇
- **THEN** 系統依裝置的 `prefers-color-scheme` 選擇主題，無法偵測時使用深色
