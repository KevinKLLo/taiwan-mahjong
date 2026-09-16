## Context

見 proposal.md。使用者已確認桌規與本機 macOS 未簽章版本；已有的花牌 API 與 snapshots 保留。ownership 見 planning/desktop-mvp，各 owner 在獨立 worktree 提交，整合者合併。

## Goals / Non-Goals

Goals：純規則引擎、僅可见資料的 UI／AI、可回放動作、獨立桌面啟動。
Non-Goals：不做計台、特殊胡牌、吃碰槓、持久化或發布。

## Decisions

- Electron 殼復用現有 JS 工具鏈，取代另加 Rust 的 Tauri；體積較大但縮短本機交付路徑。使用 sandbox、context isolation、關閉 Node integration、限制導覽與權限，依官方 security guidance。
- 共用 contracts 先提交，核心 state 由 Core 自有；PlayerView 不能含他人暗牌，終局才揭露。
- 合法動作與回應優先權全部歸 Core；UI 只 render 與 callback。回應者依距離順序，只有目前回應者能胡／過；全過後下一家摸牌。
- 每張牌唯一 ID。動作附 gameId／revision；排程以局次 generation token 防舊 callback。
- 最小 AI：必胡、其餘依自己牌的組合價值選合法棄牌，不讀暗牌，不要求強度。
- 三 worktree：mvp/core、mvp/ui、mvp/desktop；本 checkout mvp/integration 保持整合者 ownership。main 只在全部驗收後合併。

## Risks / Trade-offs

- 先前起手模式與新引擎漂移 → 保留舊 API 測試，另測新引擎完整循環。
- 非同步 AI 重複出牌 → revision＋gameId＋取消排程。
- 未簽章 app 不能視為公開發布 → 文件明示本機使用，不繞過系統安全提示。

## Verification

Core：Rule／Example 對應單元測試，含補花耗盡、多家胡、非 greedy 與守恆。UI：fixtures＋Browser 操作。Desktop：打包資源、離線啟動與實際視窗驗收。Integrator：假計時器驗證 stale callbacks、整局回放與新局。
