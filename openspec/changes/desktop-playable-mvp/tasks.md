## 1. 共同基底

- [ ] 1.1 固定確認桌規、contracts、fixtures 與 ownership，通過型別檢查後建立三個 worktree。

## 2. 平行實作

- [ ] 2.1 Core 先 Red 再 Green：摸打、胡牌、補花、AI、合法性與多局守恆測試通過，提交 core 分支。
- [ ] 2.2 UI 完成四方牌桌及全部狀態，操作測試與 Browser fixtures 驗收通過，提交 ui 分支。
- [ ] 2.3 Desktop 完成隔離殼、打包與權限邊界測試，提交 desktop 分支。

## 3. 整合交付

- [ ] 3.1 整合 Core／UI／Desktop，AI 排程與 stale action 測試通過。
- [ ] 3.2 npm ci、preflight、test、build、desktop package 通過，Browser 與實際桌面完成一局及重開驗收。
- [ ] 3.3 完成 diff review、驗收紀錄、提交整合結果並合併回 main，確認工作目錄乾淨。
