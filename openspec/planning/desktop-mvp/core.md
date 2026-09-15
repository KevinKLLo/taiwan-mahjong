# Core：摸打、胡牌與 AI

## Ownership

擁有 src/mahjong/**、src/ai/** 與對應測試，保留既有起手牌 API 與 regression snapshots。不得修改 UI、原生視窗或根目錄依賴設定。

## Requirements

### Requirement: 模式與開局相容

系統 SHALL 保留有花 144 張、無花 136 張、東家 17 張其餘 16 張；花牌另置且由尾端補牌。正常摸牌自牌牆前端取得。相同設定與動作序列 SHALL 可重現。

#### Scenario: 無花開局
- WHEN seed 42 建立無花牌局
- THEN 暗手牌數為 17／16／16／16、無花牌、牌牆剩 71 張，莊家可出牌

### Requirement: 合法摸打循環

系統 SHALL 只接受当前合法動作，出牌後先處理符合資格的胡牌回應，再推進下一位並自動摸牌。此版本 SHALL 不提供吃碰槓。

#### Scenario: 一般出牌
- WHEN 有 17 張普通手牌的當前玩家打出一張且無待處理胡牌回應
- THEN 該牌進入其牌河、手牌變 16 張，下位玩家摸牌後成為 17 張且取得出牌權

#### Scenario: 非法動作
- WHEN 非當前玩家出牌，或指定不在手中的 tileId
- THEN 返回錯誤且牌牆、手牌、牌河與回合完全不變

### Requirement: 一般胡牌辨識

待 README.md 胡牌政策確認後，系統 SHALL 辨識 17 張普通牌能否拆成五組順子／刻子與一對將眼。字牌不成順子，花牌不參與拆分；不得只用單一 greedy 拆法判斷。

#### Scenario: 一般胡牌
- WHEN 手牌為 B1/B2/B3、B4/B5/B6、C1/C2/C3、D7/D8/D9、WE/WE/WE、DR/DR
- THEN 一般胡牌判定成立

#### Scenario: 非法字牌順子
- WHEN 五組中的一組被 WE/WS/WW 取代且無其他合法分解
- THEN 一般胡牌判定不成立

#### Scenario: 棄牌胡牌與過
- WHEN 他人棄牌能使玩家組成合法 17 張胡牌
- THEN 依已確認 policy 提供胡／過；所有必要回應完成前不得讓下一家摸牌

### Requirement: 終局與牌數守恆

系統 SHALL 依已確認的胡牌優先權、過胡、流局 policy 結束牌局，終局後不再接受摸打。每張唯一牌 SHALL 恰好存在於一處；棄牌被胡時不得在總量計算中重複計入。

#### Scenario: 無牌可摸或補花
- WHEN 已達確認後的摸牌／補花停止條件
- THEN 進入流局，不產生 undefined 手牌、不無限補牌

### Requirement: AI 使用公開資訊

AI SHALL 只接收自己的 PlayerView 與合法動作；選擇合法出牌，合法胡牌時可選胡。相同輸入 SHALL 使用穩定 tie-break，便於重現。第一版不要求策略強度。

#### Scenario: AI 回合
- WHEN 傳入 AI 視角與非空合法動作清單
- THEN 回傳清單內的一個動作，輸入不含對手暗牌或剩餘牌牆內容

## Tasks and acceptance

- [ ] 先為模式、摸打、非法動作、一般胡牌與非 greedy 拆分建立失敗測試，再實作。
- [ ] 為牌牆耗尽、補花耗尽、等待胡牌、多人可胡與過胡政策建立確認後的邊界測試。
- [ ] 測試 AI 合法性、輸入隱藏資訊隔離及 deterministic replay。
- [ ] 在多個固定 seed 的完整模擬中，每步驗證唯一 tileId 守恆、回合與手牌張數，且能終局。
- [ ] npm test、npm run build 通過；交付模組與測試，不接 UI。

## Dependencies

等待 Integrator 的 contracts 與人類確認桌規；UI 不得成為 Core 測試的必要依賴。未決 policy 不自行落地。
