# Codex AI-Assisted Engineering Workshop Starter

## 桌面單局 MVP

目前整合分支已提供一人對三個 AI 的台灣十六張麻將：有花／無花、摸打、一般胡牌與流局。玩家固定東家／莊家，不提供吃碰槓、計台、連莊或存檔。多人可胡時最近下家優先，不設過水、不保留尾牌。

```bash
npm ci
npm run preflight
npm test
npm run build
npm run dev
```

macOS 本機桌面啟動與打包：

```bash
npm exec --no -- install-electron
npm run desktop
npm run desktop:package
```

打包產物位於 `release/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app`（Intel 電腦使用 x64）。此為本機未簽章產物，不代表已公證或可公開發布。封裝詳情見 `docs/desktop/README.md`。

操作：點選自己的牌後按「確認出牌」；有合法胡牌時顯示「胡牌／過」或「自摸」。牌局設定可選規則與進階 seed，進行中重開會要求確認。完整驗收狀態見 `openspec/changes/desktop-playable-mvp/verification.md`。

以下保留工作坊 starter 的背景與原始課程說明。

這是數字科技四小時工程師工作坊的學員 Starter。專案使用 TypeScript、Vite 與 Vitest，呈現一個可重現牌局的台灣麻將 HTML5 小工具。

Starter 只實作花牌玩法。課堂會用 OpenSpec／SDD 固定意圖與邊界、用 BDD 具體例子對齊行為、用 TDD 建立可重跑證據，再由 Codex 協助加入無花牌玩法，最後以 Git diff、Browser Preview、CI 與部署流程驗證。本課不另外安裝 Cucumber；OpenSpec scenario 與 Vitest 承接 BDD 的 Formulation 與 Automation。

## 課前啟動

建議使用 Node.js 24 LTS。Locked toolchain 支援 Node.js 22.12+、24.x 或 26+；不要使用已 EOL 的 23／25 分支。

```bash
npm ci
npm run preflight
npm test
npm run build
```

預期結果：

```txt
4 tests passed
vite build completed
```

## 本機畫面

```bash
npm run dev
```

打開終端機顯示的本機網址，預設通常是：

```txt
http://127.0.0.1:5173
```

## OpenSpec

本 Starter 故意沒有預先建立 `openspec/`，由學員在課堂中執行：

```bash
npx openspec init --tools codex
```

OpenSpec 在 Codex 使用 Skill 形式。初始化後確認實際輸出的 Skill 路徑，並在 Skills 面板確認已載入；未出現再重開專案。官方目前使用 `.agents/skills/` 作為 repo discovery 路徑。OpenSpec 版本的 profile 會影響產生的 Skills，請以初始化輸出為準。

本專案另附 `$workshop-bdd-tdd`，用來先檢查 Rule／Example／Question 與 scenario 追溯，再把已確認的 OpenSpec change 依照 TDD 順序實作。自訂名稱不使用 OpenSpec 管理的 `openspec-*` 前綴。

若電腦有舊版 OpenSpec，先檢查並備份自訂過的 legacy prompts；`init`／`update` 會嘗試遷移並清理舊檔。2026-09-05 實測 1.12.0 的 core profile 產生 6 個 `.agents/skills/openspec-*` Skills；Starter 本身不預先產生 change。

## 專案結構

```txt
src/mahjong/        麻將牌與規則邏輯
src/main.ts         畫面互動與渲染
src/styles.css      介面樣式
tests/              Vitest 測試
.agents/skills/     本課自訂 Codex Skill
AGENTS.md           專案規則與安全邊界
COURSE_TASK.md      本次課堂需求與驗收條件
```

Skill discovery 官方依據（2026-09-05）：https://learn.chatgpt.com/docs/build-skills
