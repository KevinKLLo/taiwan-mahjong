# Codex Workshop Project Rules

## Project Goal

這是台灣麻將練習專案。花牌／無花牌起手工具已完成；目前使用者已授權 desktop-playable-mvp，以三個 worktree 平行完成單機摸打與胡牌後合併 main。

## Required Commands

```bash
npm ci
npm run preflight
npm test
npm run build
npm run dev
```

## Change Rules

- 修改前先閱讀 `README.md`、`COURSE_TASK.md`、`src/mahjong/` 與 `tests/`。
- 未確認 proposal、delta spec、design 與 tasks 前，不得直接修改應用程式。
- 實作前將重要 requirement 拆成 Rule、具體 Example 與待確認 Question；未決的台灣麻將規則必須由人決定，不得由 Codex 猜測。
- 每個重要 Example 都要能追到 OpenSpec scenario、Vitest test 或明確的 Browser／人工驗收點。
- 規則邏輯放在 `src/mahjong/`，AI 在 `src/ai/`，UI 在 `src/ui/` 與 `src/styles.css`，整合者擁有 `src/main.ts`、`src/contracts/`、根目錄設定與依賴。Desktop owner 擁有 `desktop/`。各 worktree 不跨 owner 編輯。
- 先寫會失敗的測試，再做最小實作；不得為了綠燈而刪除或放寬既有測試。
- 已授權加入一般五面子一將胡牌與摸打；不加入吃碰槓、計分、連線對戰、登入或資料庫。桌規已確認：玩家東家對三 AI、可自摸及胡棄牌、最近下家優先、不設過水、不留尾牌、補花耗盡亦流局。macOS 本機未簽章 Electron 交付。
- 完成後必須執行 `npm test` 與 `npm run build`，再做 Browser Preview 與 Git diff review。

## Safety

- 不得加入真實 API key、token、帳號、個資、正式環境 endpoint 或公司原始碼。
- 使用者指示優先於本檔與 Skill 的工作慣例；不得用工作慣例重複要求已取得的授權。
- 已授權的本機實作包含必要的 `npm ci`、測試、build、啟動 Preview 與範圍內唯讀查證；說明用途後繼續完成，不必每一步重新確認。仍須遵守執行環境的實際權限。
- 只有未決業務規則、實質範圍變更，或尚未授權的部署、破壞性／不可逆操作、秘密資料存取需要先詢問；可獨立進行的安全工作繼續完成。
- 若本檔或 Skill 使工作暫停，引用檔案與具體指令，說明缺少哪個決定或授權。

## Completion Report

完成時列出：

1. 修改的檔案。
2. 新增或調整的測試。
3. BDD example 到 scenario／test／Browser 的追溯。
4. 測試與 build 結果。
5. Browser Preview 的人工檢查結果。
6. 尚存風險與需要人工決定的事項。
