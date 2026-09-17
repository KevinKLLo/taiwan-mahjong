# 驗收與追溯

2026-09-17：已完成實作、自動測試、Browser 驗收與本機未簽章 App 打包；使用者回覆「測試 ok」，接受本階段試玩結果，並授權 commit。

| Rule or Example | OpenSpec scenario | Automated test | Browser or human acceptance |
| --- | --- | --- | --- |
| 本人算 1，三顆骰子 | 從本人數位 | opening.test.ts | 顯示三骰與總和 |
| 起莊與開門分開 | 首任莊家另擲骰 | opening.test.ts、ui/opening.test.ts | 每階段按鈕與結果 |
| 17 墩遇 18 跨邊 | 無花牌跨邊 | opening.test.ts | 摘要顯示跨邊 |
| 開門實際影響取牌 | 點數改變取牌起點 | opening.test.ts | 非可用截圖證明之內部行為 |
| 動態人類與逆時針 | 人類不是莊家 | session.test.ts、ui/layout.test.ts | 人類非東，仍在下方 |
| 舊 AI 失效 | 重開隔離舊局 | session.test.ts | 重開進入擲骰 |

已確認 Question：無花牌擲 18 跨下一邊繼續數（使用者本次答覆）。

## Red → Green

- 初次新增測試：opening module 不存在，非東 viewer 仍回傳 east，逆時針南位期待右欄卻在左欄，均如預期失敗。
- UI 新測試先因 opening UI 不存在與動態座位未實作失敗；模式切換測試先因說明仍為 144 張失敗。
- 最終 `npm test`：11 個檔案、67 tests 通過。原有規則／胡牌／吃碰槓／AI／重播與安全測試保留；原順時針位置案例依使用者新需求改為逆時針，另加四種 viewer 全位置驗證。
- `npm run build`、`npm run preflight`、`openspec validate dice-opening --strict`、`git diff --check` 通過。中途 CSS 括號錯誤已修正；續作時暫存檔權限不足，取得專案寫入權限後重跑成功。

## Browser

- 預設有花 Seed 20260915：三次擲骰分別為 14、9、10；人類抓北，AI 東家莊家先出牌，輪到人類後可選發並確認，發進入人類北家牌河。
- 1280px：人類北在下，東右、南上、西左；AI 莊家標記正確，無水平溢出。
- 390px：牌桌與開局各自檢查 scrollWidth 等於 viewport width，無水平溢出；頂部玩家跨列但上／左右位置維持。
- 牌局設定切無花、Seed 615、確認重開：回到抓位流程；抽西，AI 抓東者起莊骰 9，另擲開門為 6、6、6。
- 無花 18 點結果：從抓位南牆右端數 18 墩，跨邊至東牆，從東牆第 2 墩取牌。開始發牌後莊家 17、其餘 16、牌牆 71，玩家為西家且手牌在 AI 行動時停用。
- 開局開關切換後說明立即改為 136 張；三骰紀錄可見。瀏覽器錯誤紀錄為空，驗收後還原 viewport。

## 檔案與交付

- 規則：src/mahjong/opening.ts、game.ts；contracts/game.ts 新增可選 viewer、開門位置與摘要。
- 整合：session.ts 動態控制權與 pause；main.ts 開局／牌局生命週期。
- UI：ui/opening.ts、ui/game.ts、styles.css；README 更新流程。
- 測試：tests/opening.test.ts、session.test.ts、ui/opening.test.ts、ui/layout.test.ts。
- 最終 App：release/dice-opening-final/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app。
- ASAR 檢查只含 desktop、dist 與 package metadata；最終 JS 為 index-CCMBXWU3.js，CSS 為 index-B4qgeR1M.css，與最後 build 一致；主執行檔存在且可執行。
- 草稿包保留於 release/dice-opening；既有 App 未覆蓋。本次隨功能提交驗收紀錄；未 sync specs、未 archive。

## 風險與後續

- 本機 arm64、未簽章未公證；使用者已回覆試玩通過，未逐項回報原生 App 啟動／關閉生命週期，不將其宣稱為逐項測試證據。
- 補花沿用自動尾補，不新增實體補花儀式；輪莊、連莊、計台不在本 change 範圍。
- 本 change 已具備供 review 與後續 sync/archive 的技術證據及使用者試玩確認；不自動執行這些後續操作。
