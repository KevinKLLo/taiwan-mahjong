## Context

動機見 proposal.md。現有 rules.ts 只接受 seed，依座位逐家發牌、遇花立即從尾端補牌；main.ts 寫死花牌標籤，表單只有 seed 與開局按鈕。既有四個測試涵蓋花牌牌組、張數、補花及重現性。本變更跨越規則與 UI，需定義一致的模式傳遞方式。

## Goals / Non-Goals

**Goals:** 以最小參數擴充保留既有呼叫與有花結果，讓每次 render 使用完整 RoundState。

**Non-Goals:** 不重寫洗牌或配牌順序，不新增套件、狀態管理框架或計台規則。

## Decisions

1. RuleMode 增加 `no-flowers`，buildWall 與 dealInitialHands 增加第二參數 mode，預設 `flowers`。相較改成必要參數，可保留現有呼叫與測試；有花分支保留原牌組順序和亂數消耗。
2. 無花模式在洗牌前排除花牌，發牌直接取普通牌；相較洗牌後濾除，牌組語意清楚，且不觸發補花。回傳正確 ruleMode、notes 與空 flowers。
3. 在表單新增原生 checkbox 搭配「使用花牌」label 與 switch 外觀，保留鍵盤和焦點行為。相較自製按鈕，無須重建鍵盤語意。
4. 提案預設：切換立即使用 seed 欄位的有效值重開；初始有花、重新載入回到預設，不做持久化。submit 和 change 共用既有 seed 檢查；失敗時保留牌局並還原開關。這是 UI 行為選擇，非新增麻將桌規。
5. renderRound 以 round.ruleMode 更新標籤及說明；無花牌區顯示「無花牌模式，不使用花牌」。更新首頁僅支援花牌的舊文案與 seed 重現提示。

## Risks / Trade-offs

- 花牌分支改動導致 seed 結果漂移 → 修改前記錄代表性 seeds 的完整牌局作回歸依據。
- 開關與畫面模式不同步 → 成功後統一由 RoundState 呈現，失敗恢復開關。
- 原始配牌不同於實際牌桌 → 本次保留既有流程，避免擴大範圍。
- UI 未有自動化框架 → 以具體 Browser 驗收覆蓋切換、鍵盤與錯誤路徑。

## Example Mapping

| Rule | Example／Scenario | 驗證位置 |
| --- | --- | --- |
| 模式決定牌組 | 有花牌牌組／無花牌牌組 | Vitest：完整牌組計數 |
| 起手張數與補花 | 無花牌發牌完成 | Vitest：seed 42、71 張剩餘 |
| 起手張數與補花 | 有花牌補牌完成／連續補到花牌 | Vitest：選定可重現連續補花 seed，確認花牌及總張數守恆 |
| 可重現且相容 | 重複同模式牌局／預設花牌相容 | Vitest：兩模式 seed 1234 與修改前 baseline |
| 開關同步 | 關閉及重新開啟花牌／所選模式重新開局 | Browser：往返切換、改 seed 提交 |
| 開關同步 | 鍵盤操作／無效 seed 下切換 | Browser：Tab、Space、空白和 0 |

Questions：無待決麻將業務規則；以上 UI 預設供提案 review。

## Migration Plan

提案確認後先補失敗測試，再實作規則與 UI。執行測試、build、Browser 驗收及 Git diff review；無資料遷移。需要回復時可還原本次實作 commit。
