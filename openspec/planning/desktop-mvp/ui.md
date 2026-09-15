# UI：可操作的四方牌桌

## Ownership

擁有 src/ui/**、src/styles.css、index.html、tests/ui/**、public/ui/**。透過 mountGame／render／handlers 對接；src/main.ts 由 Integrator 串接。

## Requirements

### Requirement: 牌桌資訊清楚

UI SHALL 將玩家置下方、三位 AI 置其餘三方，顯示目前行動者、規則、牌牆剩餘、各家花牌與牌河。對手暗牌 SHALL 只顯示牌背及張數。

#### Scenario: 初始牌桌
- WHEN render 開局 PlayerView
- THEN 玩家可見自己的牌，其他人暗牌不可見，莊家與行動者清楚標示

### Requirement: 出牌確認

UI SHALL 讓玩家點選一張手牌再確認「出牌」，新摸牌與原手牌可辨識；只依合法動作顯示控制，不自行計算牌型或推進回合。

#### Scenario: 有四張同牌
- WHEN 玩家選取其中一張並確認出牌
- THEN callback 帶出該張 tileId 與目前 revision，僅送出一次；等待新 view 前防止重複提交

#### Scenario: 等待對手
- WHEN PlayerView 表示非玩家出牌階段
- THEN 出牌控制不可操作，顯示正在行動或等待回應的狀態

### Requirement: 胡牌與終局

UI SHALL 在合法時提供「胡／過」或「自摸／出牌」，不顯示吃碰槓；終局顯示勝負原因與允許揭露的牌，提供再開一局。

#### Scenario: 可胡他人棄牌
- WHEN view 提供 win 與 pass
- THEN 顯示觸發棄牌及出牌者，使用者能選胡或過

#### Scenario: 流局
- WHEN view 為流局
- THEN 顯示流局原因、停用出牌，能開新局

### Requirement: 開局設定與無障礙

UI SHALL 將規則切換置於開局設定；牌局中更改規則或重開需確認放棄本局。Seed 放進進階設定。所有牌與控制 SHALL 具可讀標籤、鍵盤焦點與可操作方式。

#### Scenario: 取消重開
- WHEN 玩家在進行中的牌局要求改規則後取消確認
- THEN 不送出重開 callback，既有畫面與模式不變

#### Scenario: 鍵盤與小視窗
- WHEN 在 1280×800、800×600 及 390×844 操作
- THEN 重要操作不被遮住，可用鍵盤選牌和確認，必要的捲動可達所有控制

## Tasks and acceptance

- [ ] 使用共用 fixtures 建立開局、等待、出牌、胡牌回應、自摸、流局及錯誤畫面。
- [ ] 先寫 callback／控制狀態測試，再加入互動；驗證選取 tileId、revision 與防重複提交。
- [ ] 以 Browser 驗收各 fixture、鍵盤、同牌選取、取消重開與窄視窗，記錄結果。
- [ ]交付 render 模組與樣式；不新增 UI 自有引擎或修改 Core。

## Dependencies

只依賴共用 PlayerView／GameAction；fixtures 讓 UI 可在 Core 完成前開發。不能依 DOM 外的完整 GameState 取得資訊。
