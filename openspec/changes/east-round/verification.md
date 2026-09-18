# 東風一圈驗收

2026-09-17：實作、自動測試、Browser 驗證與獨立 App 打包完成。2026-09-18：使用者回覆「測試 ok，commit 後進行下一步」，接受本階段試玩結果並授權提交。以下保留 scenario 追溯。

| Rule or Example | OpenSpec scenario | Automated test | Browser or human acceptance |
| --- | --- | --- | --- |
| 莊胡與流局加連莊 | 莊胡後流局 | match.test.ts | 結果與下局標題 |
| 不是贏家接莊 | 非下家的閒家胡牌 | match.test.ts | 下家接莊提示 |
| 門風變、座位不變 | 換莊後玩家門風改變 | match-session.test.ts | 下方人類變東家 |
| 下一局只開門 | 下一局只擲開門 | opening.test.ts、ui/opening.test.ts | 無抓位按鈕、全新牌局 |
| 四次下莊終止 | 第四任莊家連莊 | match.test.ts、ui/match.test.ts | 完圈摘要與無下一局 |
| 不跳局 | 重複結果或下一局 | match-session.test.ts | 單一下一局流程 |
| 中途重開保護 | 中途重開 | ui/match.test.ts、match-session.test.ts | 取消保留，確認重抓位 |

Questions：上述四項規則已由使用者確認；沒有待決桌規。

## Red → Green

- 首輪規則測試因 match 模組不存在、既有座位仍從 seat-roll 開始而失敗。
- 整合／UI 測試先因缺少協調器、連莊安排、下一局按鈕，以及圈未完重開未要求確認而失敗。
- 實作後全套 `npm test`：15 個檔案、81 項測試通過，既有 67 項保留；新增規則、開門、協調器、UI 及真實引擎整圈重播案例。
- `match-replay.test.ts` 分別以有花、無花跑完一圈，驗證每手 17/16、清空牌河／副露、全部牌唯一守恆，以及恰好四次非莊家胡牌才結束。
- `npm run build`、`npm run preflight`、`openspec validate east-round --strict`、`git diff --check` 均通過。

## Browser 驗收

- 開發專用 tests/browser/east-round.html 透過真實圈協調器與開門 UI，指定單手終局結果來檢查可見行為；不是自然牌局胡牌證據。真實引擎結果由自動重播補足。
- Seed 615：首任莊家電腦 3，首手莊胡 → 連莊 1；第二手流局 → 連莊 2；下莊仍 0。
- 第二手起只呈現 2 階段「開門／發牌」，無風牌選擇，Seed 依手數更新（第二手 105344），花牌模式鎖定，原座位保留。
- 隨後四次指定當局西家胡牌：莊家依序電腦 3 → 電腦 1 → 人類 → 電腦 2；不是由胡牌者接莊。人類門風西→南→東→北，始終固定下方。
- 第六手完成第四次下莊：顯示「東風一圈完成」、6 筆歷史，只剩重新開圈，不提供下一局。每筆使用固定人類／電腦身分，不把舊門風當成新玩家。
- 圈未完的流局結果頁進設定重開，顯示「放棄本圈進度？」；取消後仍保留連莊 2 與兩筆歷史。
- 1280px 與 390px 的完圈結果：scrollWidth 等於 viewport width，無水平溢出；已視覺檢查紀錄與按鈕。
- 正式入口以有花 Seed 20260915 完成抓位、起莊、開門、AI 推進、人類北家選二條確認出牌；東一局／連莊 0／第 1 手標示正確，牌河顯示二條。console error 為空。
- 已關閉開發 fixture 分頁、還原 viewport，保留正式預覽供測試。

## 修改與交付

- 新增 contracts/match.ts、mahjong/match.ts、match-session.ts：公開圈摘要、純規則與跨局隔離。
- 擴充 mahjong/opening.ts、ui/opening.ts：既有座位直接開門。
- 修改 contracts/game.ts、main.ts、ui/game.ts、styles.css：圈控制、局次／連莊、下一局、歷史及重新開圈確認。
- README 更新；測試新增 match、match-session、match-replay、ui/match 及 Browser fixture，擴充 opening 測試。
- App：release/east-round/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app。
- ASAR 僅含 desktop、dist 及 package metadata；JS index-BX_q3Nln.js、CSS index-CHt8G3pG.css 與最後 build 一致，執行檔存在且可執行。dist 搜尋不到測試 fixture 標記或 tests/browser，未打包驗收控制項。
- 本機未簽章 arm64 App，使用者已確認試玩通過，但未逐項回報原生生命週期測試，不將其宣稱為逐項證據。先前已驗收 App 保留。
- 本次隨功能提交驗收紀錄；未 sync specs 或 archive。東風一圈以外的計台、存檔、南西北圈不在本次提交範圍。
