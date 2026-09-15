# Desktop MVP 驗收紀錄

日期：2026-09-15。使用者已確認桌規並授權平行 worktree 與完成後合併 main。

## Branches and ownership

- 共同基底：2370429，contracts、fixtures 與正式 artifacts。
- Core：mvp/core，a06abab。Core 子代理完成主要規則與測試後受 workspace spend cap 中止，由整合者檢查、執行測試並提交。
- UI：mvp/ui，6ac4b78。UI 子代理完成模組與 Red 測試後受同一限制中止；整合者接手完成樣式、HTML、互動修正與 Green 測試。
- Desktop：mvp/desktop，359b2c6。桌面殼、協定權限、打包腳本與文件。
- 三分支已以 merge commit 合併至 mvp/integration；main 尚未合併，等待原生視窗驗收。

## Test evidence

- Core 先由缺少新模組產生 Red，再通過規則、AI、胡牌、回應優先權、補花耗盡及守恆測試。
- UI Red：缺少 game module；接手後另發現提交後按鈕未停用，修正後通過。
- Session Red：缺少 session module；新增取消計時器、gameId／revision 與玩家權限驗證後通過。
- 最終乾淨 npm ci：217 packages installed、0 vulnerabilities；preflight 通過。
- npm test：7 files、43 tests 通過。npm run build、OpenSpec strict validation、git diff --check 通過。
- 既有 13 tests（含四個完整花牌 snapshots）保留，沒有重寫 snapshot 使測試過關。

## Scenario traceability

| Rule / Example | OpenSpec scenario | Automated test | Browser / desktop evidence |
| --- | --- | --- | --- |
| 雙模式、合法摸打 | 無花開局與出牌 | tests/mahjong/game.test.ts preserves deal / moves discard | Browser 無花 71 張，玩家出牌後三 AI 依序行動 |
| stale 與越權 | 非法或過期動作 | game.test.ts、session.test.ts | 重開舊局動作在測試中被拒絕 |
| 一般胡牌、多種分解 | 一般胡牌 | game.test.ts 一般胡牌兩 tests | seed 9 實際北家自摸 |
| 多家可胡、過胡 | 多人可胡 | game.test.ts 最近者先回應、全過、不設 furiten | 動作選单由 Core 決定；多家情境以單元測試覆蓋 |
| 胡牌／流局、守恆 | 終局、完整模擬 | game.test.ts 十個固定雙模式牌局、補花耗盡；replay.test.ts | Browser seed 9 終局、暗牌揭露、禁止出牌、再開一局成功 |
| AI 隱藏資訊 | AI 與資訊隔離 | game.test.ts detached views、strategy.test.ts | 進行中 48 張對手牌背，終局改揭露 |
| 同牌、提交一次 | 選牌出牌 | tests/ui/game.test.ts | Browser 實際選牌確認與九次玩家出牌 |
| 取消重開 | 取消重開 | tests/ui/game.test.ts | 改有花後取消，畫面仍為無花牌 |
| 鍵盤與小視窗 | 鍵盤及小視窗 | UI 語意按鈕 | Space 選取「中」、焦點實線可見；1280／800／390 寬度 scrollWidth 等於 innerWidth |
| 桌面隔離 | 不可信導覽 | tests/desktop/security.test.ts | ASAR 只含 dist、兩個 runtime 檔與 metadata |
| 離線原生操作 | 打包後遊玩 | macOS arm64 package 成功 | 尚未驗收：CUA 回報 Computer Use permissions are not granted |

## Reproducible Browser replay

選無花牌、seed 9，玩家依序打出：中、三筒、九萬、白、西、中、發、北、東。每次等三 AI 行動。revision 36 北家自摸；此序列另由 replay.test.ts 固定驗證。再開一局後回到東家 17 張與牌牆 71 張。

## Desktop artifact and remaining gate

Electron 44.3.0、Packager 20.3.0、macOS arm64，本機未簽章產物：`release/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app`。正式資源由 app://mahjong 提供，不引用 localhost；ASAR allowlist 已檢查。

尚欠實際原生視窗的啟動、離線遊玩、縮放／最小化／還原、退出驗收。2026-09-15 呼叫 CUA 啟動產物被電腦操作權限擋下；已通知使用者開啟權限，未透過其他 UI 自動化方式繞過。

目前不宣稱桌面驗收完成，未 archive、未 Sync Specs。完成此最後驗收後再依授權合併 main。
