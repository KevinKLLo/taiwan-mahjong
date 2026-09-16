# 吃碰槓驗收紀錄

日期：2026-09-16。

## 自動驗證

- Core 新增 7 項測試先失敗，再完成實作轉為通過；之後補上偽造 IDs、跨北東座位、吃碰後禁止自槓、補花耗盡等案例。
- UI 新增 2 項測試先失敗，完成按鈕、副露與組合順序修正後通過。
- 最終 npm test：8 個檔案、55 項測試全部通過。npm run preflight、npm run build、OpenSpec strict validation、git diff --check 通過。
- 舊固定 seed 9 回放保留原出牌順序與北家自摸結果：明確選過新增副露機會，revision 增量包含過牌。守恆測試加入副露實體牌，手牌張數依副露組數扣除，不刪除原驗證。

## 情境追溯

| 規則／情境 | 自動測試 | 可見驗收 |
| --- | --- | --- |
| 吃僅上家、多組合、偽造 IDs | tests/mahjong/melds.test.ts | 測試頁點選第二組二萬＋四萬，副露為二三四萬，來源北家 |
| 碰可三家、明槓不可上家 | tests/mahjong/melds.test.ts | 正常 seed 9 玩家碰南家一萬，牌牆維持 66、手牌 14 張直接出牌 |
| 胡＞碰槓＞吃、全過 | tests/mahjong/melds.test.ts | AI 正常輪轉並顯示吃牌副露 |
| 三種槓、尾補與槓後自摸 | tests/mahjong/melds.test.ts | 開發情境頁分別操作明槓、暗槓、加槓，顯示四張與補牌 |
| 搶加槓、暗槓資訊隔離 | tests/mahjong/melds.test.ts、tests/ui/game.test.ts | 罕見搶槓流程以自動測試驗證，未聲稱自然牌局逐例人工重現 |
| 不重複提交、唯一組合 IDs | tests/ui/game.test.ts | 吃牌按鈕與 Enter 鍵操作成功 |
| 多局守恆與有限終局 | tests/mahjong/game.test.ts、tests/mahjong/melds.test.ts | 以完整 AI 模擬驗證 |
| 小視窗可操作 | DOM 操作測試 | 390×844、800×600 無水平溢出，副露與組合按鈕可達 |

## 桌面交付

以 `MAHJONG_RELEASE_DIR=release/meld-actions npm run desktop:package` 成功建立 macOS arm64、Electron 44.3.0 未簽章版本：

`release/meld-actions/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app`

已檢查 app.asar 只含 desktop runtime、dist 與 package metadata；不包含開發測試頁。舊版產物保留。沙箱內下載曾遇 DNS 限制，授權網路存取後打包成功，並重新執行全部 55 項測試通過。

使用者開啟新版後回覆「操作 ok，進行 commit」，作為本次桌面操作的人工作業驗收。未另外聲稱已逐項驗證離線、最小化、還原及退出的所有原生生命週期；先前 desktop-playable-mvp 的剩餘驗收與 main 合併狀態不在此次自行勾選。

此次提交至 mvp/integration，不自動合併 main、push、Sync Specs 或 Archive。現有範圍不含計台、連線與存檔。
