## Why

將現有起手發牌工具擴充成可離線遊玩的桌面單局麻將，讓玩家能完成摸打、胡牌或流局。使用者已於 2026-09-15 確認 MVP 桌規並要求以 worktree 平行實作後合併 main。

## What Changes

- 單機玩家固定東家／莊家，對三個 AI；有花與無花模式。
- 僅摸打與一般五面子一將胡牌，可自摸及胡棄牌；最近下家優先、不設過水、不留尾牌、補花耗盡也流局。
- 四方牌桌、合法操作、結算與重開確認。
- macOS Electron 本機未簽章應用，使用打包內的本機資源。

## Capabilities

### New Capabilities

- `single-round-game`: 合法回合、胡牌、AI、資訊隔離及終局。
- `playable-table`: 玩家操作與可見牌桌。
- `desktop-runtime`: 離線桌面殼及打包。

### Modified Capabilities

無；現有主 specs 尚未建立，起手工具 API 保留。

## Impact

詳見 openspec/planning/desktop-mvp/ 的 ownership。新增 Core、UI、desktop 模組及共用 contracts，整合者管理入口與依賴。新增 Electron 與打包工具；不含計台、吃碰槓、連線、存檔、連莊、特殊胡牌或自動發布。
