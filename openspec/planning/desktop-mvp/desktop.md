# Desktop：桌面殼與離線交付

## Ownership

框架尚未選定，現在先固定行為規格。擁有 desktop/**、tests/desktop/**、docs/desktop/**；依赖、build script、lockfile 交由 Integrator 修改。若選 Tauri，先更新 ownership 後才建立 src-tauri/**。

## Requirements

### Requirement: 可獨立啟動

桌面產物 SHALL 包含本機遊戲資源，正式啟動不依賴 Vite 開發伺服器或網路連線。

#### Scenario: 離線啟動
- WHEN 開發伺服器停止且網路離線後開啟打包產物
- THEN 正常顯示開局畫面，能開始遊戲

### Requirement: 視窗生命週期

桌面應用 SHALL 支援開啟、縮放、最小化、還原與退出；退出後不留下應用自行啟動的背景服務。遊戲操作僅在 renderer／前端執行，原生殼不重複實作規則。

#### Scenario: 縮放視窗
- WHEN 調整到支援的最小視窗尺寸並還原
- THEN 遊戲狀態保留、主要控制可達且無空白畫面

### Requirement: 最小原生權限

應用 SHALL 限制遠端內容、導覽及原生橋接；不向遊戲頁暴露任意檔案、shell 或 Node 執行能力。外部連結僅在明確操作時交由系統瀏覽器。

#### Scenario: 非預期導覽
- WHEN 遊戲頁要求載入非允許的遠端頁面
- THEN 不能在具原生權限的遊戲視窗內載入

### Requirement: 可重現的打包說明

交付 SHALL 記錄選定框架、目標 OS／架構、工具鏈、build 命令、產物位置與簽章狀態。未簽章產物不得描述為已完成公開發布。

#### Scenario: 本機交付
- WHEN 依 docs/desktop 指令在目標平台建置
- THEN 取得可啟動的桌面產物，且有實際離線啟動和退出驗收結果

## Tasks and acceptance

- [ ] 先確認平台、Electron／Tauri 與本機未簽章交付是否足夠，請 Integrator 固定工具鏈。
- [ ] 用占位頁完成 desktop dev 與 production resource loading，驗證不依賴 localhost。
- [ ] 配置最小原生權限及導覽限制，執行對應安全邊界測試。
- [ ] 接入整合前端產物，驗證啟動、縮放、最小化、還原、退出與重新啟動。
- [ ] 在目標 OS 實際打包並離線驗收，交付 docs/desktop 與產物位置；不自動簽章、公證或上傳。

## Dependencies

不等待 Core 即可測試殼；最終可玩驗收依賴整合前端。平台與框架未確認前，本文件不授權自行安裝工具鏈。
