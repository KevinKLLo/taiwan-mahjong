# 順時針 UI 驗收

日期：2026-09-17。僅完成階段 0，不改規則引擎或進入後續階段。

- 修改 src/styles.css：東下、南左、西上、北右；窄視窗保留相對方位。
- tests/ui/layout.test.ts 新增兩項測試：座位 CSS 位置與插入回應的行動框。先修正測試載入方式後，確認旧樣式因南家 column 3 而非 1 失敗，再調整 CSS 轉為通過。
- 完整 57 tests 通過，build、OpenSpec strict validation、git diff --check 通過。既有吃牌與明槓來源限制測試保持通過。
- Browser 1280×800、800×600、390×844：南家 x 小於西家中心、北家位於右側，西家 y 小於左右兩家；scrollWidth 等於 viewport width，畫面無水平溢出。
- 正常牌局東家打出東後，DOM status 顯示輪到南家、行動框位於 grid-column 1 / grid-row 2。回應插入由 DOM 單元測試逐一驗證 actingPlayer，不改引擎輪序。
- 已還原 Browser viewport。規格情境對應上述座位測試、行動框測試與三種寬度 Browser 檢查。

## 新版桌面產物

`release/clockwise-table/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app`

以 MAHJONG_RELEASE_DIR=release/clockwise-table 打包成功，macOS arm64、Electron 44.3.0、本機未簽章；舊版未覆蓋。app.asar 已核對包含 index-CFve5v2r.css 與 index-CJ8KwsQ_.js，不包含測試頁。

使用者測試新版後確認「測試位置正常」，順時針座位的人工作業驗收通過。此為使用者驗收，不宣稱由代理完成全部原生生命週期測試。使用者已授權提交階段 0 並接續階段 1；未 Sync Specs 或 Archive。
