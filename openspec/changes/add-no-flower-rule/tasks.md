## 1. 規則驗收與失敗測試

- [x] 1.1 確認 proposal、spec、design 與 Example Mapping，記錄 review 結果及每個 scenario 的測試或 Browser 驗收名稱。
- [x] 1.2 修改規則前記錄代表性 seeds 的完整花牌牌局；新增預設模式相容及連續補花測試，確認既有四個測試仍通過且基準來自改動前結果。
- [x] 1.3 新增無花牌 136 張且每種普通牌四張、17/16/16/16 手牌、花牌區全空、剩餘 71 張與兩模式重現性測試；執行 npm test，確認新模式測試因功能尚未實作而失敗並記錄原因。

## 2. 模式與介面實作

- [x] 2.1 擴充 RuleMode、buildWall、dealInitialHands 與 notes，保留預設 flowers 與原始亂數行為；執行 npm test 驗證新測試與 baseline 全數通過。
- [x] 2.2 新增具 label、可見焦點與鍵盤操作的「使用花牌」開關，串接切換及 submit；以 Browser 確認預設開啟、切換立即重開且使用輸入 seed。
- [x] 2.3 依 RoundState 更新模式名稱、花牌區與提示文案，並在無效 seed 時保留牌局且還原開關；以 Browser 確認往返切換、空白與 0 錯誤路徑不造成狀態不一致。

## 3. 整合驗收

- [x] 3.1 執行 npm test 與 npm run build，記錄全部通過結果並確認沒有放寬或刪除既有測試。
- [x] 3.2 完成 Browser 驗收：兩模式切換、改 seed 開局、Tab/Space、窄螢幕與無效 seed；將實際結果逐項回填 Example Mapping 的追溯記錄。
- [x] 3.3 檢查 Git diff，確認修改限於本次模式、UI 與測試範圍；整理檔案、scenario 證據與尚存限制供 review。
