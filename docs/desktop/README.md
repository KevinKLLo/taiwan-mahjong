# macOS 桌面版

使用 Electron，沿用 lockfile 的工具版本。交付目標是目前 macOS 的原生 CPU 架構（`process.arch`），本機未簽章、未公證版本；不代表已可公開發布。

## 建置與啟動

在專案根目錄使用符合 package.json engines 的 Node.js：

```sh
npm ci
npm run preflight
npm test
npm run desktop
```

`desktop` 先 build，再以 `electron desktop/main.cjs` 開啟內附 `dist`。不需要執行 Vite server。修改前端後重新執行此命令以更新畫面。

```sh
npm run desktop:package
```

產物：`release/Taiwan Mahjong-darwin-arm64/Taiwan Mahjong.app`（Intel 電腦為 `darwin-x64`）。從 Finder 開啟 `.app`。再次打包時若產物已存在，先將舊產物移到其他位置；打包腳本不覆寫既有產物。若系統阻擋未簽章應用，應依 macOS 正常安全性介面處理，本專案不移除 quarantine 或停用 Gatekeeper。

腳本使用系統 temporary directory 建立獨立 staging，僅複製 `dist/`、`desktop/main.cjs`、`desktop/policy.cjs` 和最小 package metadata，再以 ASAR 打包。輸出 staging 路徑供診斷，未包含 repository、原始測試、開發依賴或打包程式。Electron binary 在首次打包可能需要下載；完成後的 app 不需要網路。

## 原生邊界

- 只有 `app://mahjong/` 的內附資源可載入，資源檢查涵蓋路徑穿越與 symlink。
- 啟用 sandbox、context isolation、web security；關閉 Node integration、webview 與 DevTools，沒有 preload 或 IPC bridge。
- CSP 禁止網路連線、inline scripts、frames、plugins 和表單提交。
- 拒絕權限要求、下載、新視窗與遠端導覽。本版無外部連結功能。
- 不啟動伺服器或 child process；關閉唯一視窗即退出。支援最小尺寸 800 × 600、最小化與還原。

## Scenario 追溯與驗收

| Rule / Example | OpenSpec scenario | 自動測試 | 整合人工驗收 |
| --- | --- | --- | --- |
| 任意遠端 URL 或越界路徑不能讀入遊戲 | desktop-runtime／不可信導覽 | security.test.ts：本機資源、非法來源及編碼穿越 | 實際視窗不出現遠端內容 |
| renderer 無 Node 與 preload 能力 | desktop-runtime／不可信導覽 | security.test.ts：隔離設定 | 由整合者檢查實際 app |
| 無 server 也能開局、終局、再開局 | desktop-runtime／打包後遊玩 | npm run build；打包 | 停止 dev server，啟動 app 完成一局 |
| 視窗縮放、最小化、還原、退出 | desktop-runtime／打包後遊玩 | minWidth/minHeight 設定測試 | 800 × 600 操作，最小化還原狀態不變，退出後程序消失 |

Desktop 分支 Red 證據：新增測試因缺少 policy.cjs 失敗；Green：15 tests 通過，build 通過。實際 `.app` 啟動、遊玩與生命週期驗收由整合者在最終 UI/Core 合併後記錄，不以政策單元測試代替人工結果。

官方依據：[Electron security](https://www.electronjs.org/docs/latest/tutorial/security)、[protocol API](https://www.electronjs.org/docs/latest/api/protocol)、[Electron Packager](https://github.com/electron/packager)。
