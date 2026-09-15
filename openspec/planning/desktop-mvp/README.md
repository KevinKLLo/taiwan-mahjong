# 桌面麻將 MVP：Worktree 規格

狀態：使用者於 2026-09-15 確認下列 MVP 桌規與本機 macOS 交付，正式實作見 `openspec/changes/desktop-playable-mvp/`。三個 worktree 已從共同 contracts commit 2370429 建立；本資料夾保留 ownership 與規劃脈絡。

## Scope

- 已確認：從現有花牌／無花牌工具擴充成可玩的較小版本；以 worktree 平行分工。
- 規劃假設：單機一人對三個 AI、單局、玩家固定東家／莊家。需確認後才固化規則。
- 不包含吃碰槓、計台、連莊、完整一圈、連線、帳號、存檔及特殊花牌勝利。
- 現有 AGENTS.md 的禁止新增胡牌與回合限制與本次新需求不同；本次明示需求授權規劃此範圍，其餘邊界保留。

## Ownership

| Owner／建議 branch | 唯一可寫範圍 | 交付規格 |
| --- | --- | --- |
| Integrator／mvp/integration | src/contracts/**、src/main.ts、package.json、package-lock.json、根目錄建置與測試設定、AGENTS.md、OpenSpec | integration.md |
| Core／mvp/core | src/mahjong/**、src/ai/**、tests/mahjong/**、tests/ai/**、tests/rules.test.ts、tests/__snapshots__/** | core.md |
| UI／mvp/ui | src/ui/**、src/styles.css、index.html、tests/ui/**、public/ui/** | ui.md |
| Desktop／mvp/desktop | desktop/**、tests/desktop/**、docs/desktop/** | desktop.md |

目前只有文件，不新增上述程式目錄。UI 模組拆出 src/ui 是本次規劃建議，整合者應在 kickoff 更新舊 AGENTS.md 路徑慣例。Tauri 若獲選，desktop owner 範圍再明確增加 src-tauri/**；不可兩個封裝方案同時落地。

## Parallel workflow

1. 整合者先確認下方桌規及平台，建立正式 OpenSpec change、共用型別、fixtures 與入口占位，提交 contract baseline。
2. 三條 worktree 都從同一 baseline 建立；尚未決定實際路徑，不執行 git worktree add。
3. Core 用單元測試開發；UI 用 fixtures；Desktop 用靜態頁驗證生命週期。每條分支不依賴其他未提交檔案。
4. 分三次整合：開局可見 → 玩家與 AI 摸打循環 → 胡牌／流局與打包驗收。
5. 整合者合併後，各分支同步整合分支；不跨 worktree 複製 node_modules，不同預覽使用 5174／5175／5176。

共享型別或依賴變更先交整合者提交；其他 owner 不修改 lockfile 或他人檔案。每次交付附 commit、測試命令與结果、scenario 對照及已知限制。

## Decisions required

以下 1–5 與 macOS 未簽章交付已獲使用者確認。框架由整合者選用 Electron，以沿用 npm 工具鏈。這是本 MVP 的明示桌規，不宣稱是所有台灣麻將的通用規則。

1. 對戰與莊家：建議一人對三個 AI、玩家固定東家／莊家。
2. 胡牌範圍：建議一般五組面子加一對將眼，可自摸或胡他人棄牌；不納入特殊牌型或花牌直接勝利。
3. 多人可胡同一棄牌：建議依出牌者下家起，取最近一位；是否採一炮多響須由使用者決定。
4. 過胡：建議本 MVP 不設過水限制；與部分實際桌規不同，須確認。
5. 流局：建議普通可摸牌耗盡即流局，不保留尾牌；補花無牌可補亦流局。若要傳統留牌，需指定張數與補花消耗規則。
6. 桌面平台與框架：第一目標建議 macOS；Electron 或 Tauri 尚未選定，不假定有簽章、公證或 Windows 發布需求。

## Definition of done

三條分支各自驗收後，必須由實際桌面產物完成「開局 → 玩家出牌 → 三個 AI 行動 → 再輪到玩家 → 終局 → 新局」。所有 UI 所見以引擎狀態為準；不以僅成功 build 當作遊戲已可玩。未決規則全部記錄人類決定後才進入規則實作。
