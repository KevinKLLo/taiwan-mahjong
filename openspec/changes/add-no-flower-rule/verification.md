# 驗收記錄

使用者於 2026-09-15 指示「commit 後進行實作」，採用既有提案；提案 commit 為 362c6d1。無待決業務規則。

## TDD 與自動化證據

- 改動前先產生 seeds 1、42、1234、20260915 的四份完整牌局 snapshots，8 個測試通過。
- 新增無花牌測試後出現預期 Red：牌組仍 144 張（期望 136）、模式仍 flowers（期望 no-flowers）；10 pass、2 fail。
- 實作後最終 13 個測試與 npm run build 通過，既有測試保留，四份 snapshots 未更新。
- 連續補花測試以固定順序搜尋首張與末張皆花、倒數第二张普通牌的 seed，驗證東家收到兩張花與尾端普通牌及總牌數守恆。此項補強於實作後加入；補花函式本身未修改。

## Scenario Traceability

| Rule or Example | OpenSpec scenario | Automated test | Browser or human acceptance |
| --- | --- | --- | --- |
| 牌組 | 有花牌牌組／無花牌牌組 | 建立 144 張牌牆／無花牌牌組只有 136 張普通牌 | 規則標籤同步 |
| 起手 | 無花牌發牌完成 | 無花牌發牌完成且不從尾端補牌 | seed 42、1234：71 張、花牌區空 |
| 補花 | 有花牌補牌完成／連續補到花牌 | 花牌移到花牌區／連續補到花牌仍從尾端補到普通牌 | 初始 seed 20260915 剩 76 張 |
| 重現 | 重複同模式牌局／預設花牌相容 | 雙模式 seed 1234／四份 baseline snapshots | seed 20260915 切回有花恢复原畫面 |
| 開關 | 關閉及重新開啟花牌 | — | 實際點擊往返：有花 76／無花 71，通過 |
| 鍵盤 | 鍵盤操作 | — | Shift+Tab 從 seed 聚焦開關、Space 切換；可見實線焦點框 |
| 開局 | 所選模式重新開局 | — | 無花模式改為 seed 1234、提交後模式保留且 seed 更新 |
| 錯誤 | 無效 seed 下切換 | — | 空白及 0：錯誤訊息、牌局不變、開關還原 |

## Browser 與 Review

- 使用本機 Vite 預覽 http://127.0.0.1:5174/，重啟已停止的伺服器後完成驗收。
- 390×844 預覽：開關、輸入框與按鈕完整可見，scrollWidth 與 innerWidth 同為 390；驗收後重設 viewport。
- Git diff --check 通過；修改限於 index.html、src/main.ts、src/styles.css、src/mahjong/rules.ts、tests 與本 change 記錄。
- UI 使用 Browser 手動操作驗收，未新增 Browser 自動化框架。保留既有逐家發牌順序；未新增計台或胡牌功能。
- 尚未 Sync Specs 或 Archive；實作變更尚未另行 commit。
