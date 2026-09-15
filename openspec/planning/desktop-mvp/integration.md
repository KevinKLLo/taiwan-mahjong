# Integrator：介面與整合

## Ownership

依 README.md 的唯一可寫範圍。負責組装，不重複實作規則、AI 或 UI；其他 worktree 若需要共用修改，提出 contract change 由此 owner 處理。

## Proposed contracts

以下是介面草案；先提交型別與 fixture 再分支，所有 owner 使用同一版本。

```ts
type Phase = 'awaiting-discard' | 'awaiting-win-response' | 'finished';
type GameAction =
  | { type: 'discard'; playerId: string; tileId: string }
  | { type: 'win'; playerId: string }
  | { type: 'pass'; playerId: string };

createGame(config: GameConfig): GameState;
getLegalActions(state: GameState, playerId: string): GameAction[];
applyAction(state: GameState, action: GameAction): ActionResult;
getPlayerView(state: GameState, playerId: string): PlayerView;
chooseAction(view: PlayerView, legalActions: GameAction[]): GameAction;
mountGame(root: HTMLElement, handlers: UIHandlers): GameUI;
// GameUI.render(view)、GameUI.destroy()
```

- GameConfig：花牌模式、seed、座位、已確認 RulePolicy。尚未確認的 policy 不填假定預設。
- 每張牌使用唯一 tileId 與牌面 code，避免四張同牌無法指定出哪張；不要破壞現有 TileCode 的起手 API。
- GameState 只存在協調器／Core；包含手牌、牌牆與回應狀態。不得傳给 UI 或 AI。
- PlayerView：自己的牌、他人的暗牌張數、公共花牌、牌河、回合、模式、牌牆剩餘、可見終局資訊、revision。
- ActionResult：成功則回傳新 state；失敗有穩定錯誤碼，原 state 不變。非法出牌、非本人回合、過期 revision 不得推進牌局。
- 回應階段由 Core 決定合法動作與優先權；UI 和 AI 都不能自行宣布勝利或跳過等待者。
- 協調器將 AI 決策轉成相同 action；非同步 UI 操作附 revision，重開局清除待執行 AI 工作，避免舊回合污染新局。

## Requirements and scenarios

### Requirement: 唯一狀態來源

協調器 SHALL 僅透過 Core 推進遊戲，並以 PlayerView render。

#### Scenario: 過期操作
- WHEN 新局建立後收到舊局的 AI 動作或重複出牌
- THEN 動作被拒絕或丟棄，新局牌數與回合不變

### Requirement: 共用依賴與入口

Integrator SHALL 維護唯一 lockfile、入口與 script；各分支交付的模組不改動共用入口。

#### Scenario: 三模組接合
- WHEN 合併 Core、UI 與 Desktop 的已驗收提交
- THEN npm ci、npm test、npm run build 與選定桌面 build script 成功；桌面中能完成一局

## Tasks and acceptance

- [ ] 確認 README.md 六項決定，更新正式 OpenSpec artifacts 與 AGENTS.md 的新範圍。
- [ ] 提交共用 contracts 與 fixtures：玩家出牌、等待對手、胡牌回應、自摸、流局；各 fixture 通過型別檢查。
- [ ] 實作入口與 AI 排程，驗證非本人、重複、過期動作皆不改變牌局。
- [ ] 逐步整合，記錄 scenario → test／Browser／桌面驗收的 traceability。
- [ ] 在實際打包產物以固定 fixtures 驗證胡牌與流局，並用正常 seed 跑完整遊戲循環。

## Handoff

交付整合 commit、測試與建置結果、產物位置、平台版本及可重現的驗收步驟。未經使用者要求，不自動發布或 archive。
