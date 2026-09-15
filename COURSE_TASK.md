# 課堂任務：加入無花牌規則

## 使用者需求

目前遊戲只支援台灣麻將的花牌玩法。請新增「無花牌」模式，讓使用者在開始牌局前選擇規則。

## 驗收條件

- 花牌模式維持 144 張牌，8 張花牌被移到各玩家的花牌區並從牌牆尾端補牌。
- 無花牌模式使用 136 張普通牌，不得出現花牌，也不執行補花。
- 兩種模式都維持東家 17 張、其餘三家各 16 張。
- 相同模式與 seed 必須產生相同結果。
- UI 必須清楚顯示目前規則，切換規則後重新開局。
- 既有花牌規則測試不得退步。

## Non-goals

- 不做胡牌判斷與聽牌提示。
- 不做番台與分數計算。
- 不做吃、碰、槓、摸打回合。
- 不做多人連線、登入、儲存牌局或後端 API。

## 建議工作方式

1. 先請 Codex 閱讀專案，不修改。
2. 初始化 OpenSpec，使用 OpenSpec Propose 建立 `add-no-flower-rule`。
3. 人工 review artifacts，尤其是驗收條件與 non-goals。
4. 用 Example Mapping 列出 Story／Rules／Examples／Questions；先解決會改變可觀察行為的問題。
5. 將已合意 Example 追溯到 OpenSpec scenario、Vitest 與 Browser 驗收點。
6. 使用 `$workshop-bdd-tdd` 先建立失敗測試，再做最小實作。
7. 跑測試與 build，開 Browser Preview，最後看 Git diff。
