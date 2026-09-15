## Why

目前起手發牌工具只支援花牌規則。加入規則開關，讓使用者以同一介面體驗有花牌與無花牌的台灣十六張麻將起手牌局。

## What Changes

- 預設維持有花牌；新增「使用花牌」開關，關閉時使用無花牌模式。
- 切換後以目前有效 seed 立即重新開局，同步更新規則名稱、牌牆數量、手牌與說明。
- 有花牌使用 144 張並補花；無花牌使用 136 張且不補花，兩種模式都維持東家 17 張、其餘各 16 張。
- 同一模式與 seed 可重現結果，保留既有花牌模式行為。

## Capabilities

### New Capabilities

- `rule-mode-selection`: 規則開關、兩種牌牆與起手發牌、可重現性及畫面一致性。

### Modified Capabilities

無；目前主規格目錄尚無 capability。

## Impact

- `src/mahjong/rules.ts`：擴充模式型別、牌牆與發牌參數。
- `index.html`、`src/main.ts`、`src/styles.css`：開關、事件及模式呈現。
- `tests/rules.test.ts`：雙模式驗收與回歸測試。
- 不新增依賴。

## Non-goals

不改實際配牌順序、不加入胡牌、計台、吃碰槓、摸打回合、登入、後端或儲存牌局。
