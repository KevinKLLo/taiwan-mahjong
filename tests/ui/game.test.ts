// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountGame } from '../../src/ui/game';
import type { PlayerView } from '../../src/contracts/game';

function fixture(): PlayerView {
  return {
    gameId: 'test', revision: 4, seed: 42, ruleMode: 'flowers', viewer: 'east',
    phase: 'awaiting-discard', currentPlayer: 'east', actingPlayer: 'east', wallRemaining: 71,
    players: ['east', 'south', 'west', 'north'].map((id) => ({
      id: id as 'east', name: id, handCount: 16,
      hand: id === 'east' ? [{ id: 'one', code: 'B1' }, { id: 'two', code: 'B1' }] : null,
      flowers: [], discards: [], melds: [],
    })),
    drawnTileId: 'two', lastDiscard: null, outcome: null, message: '請出牌',
    legalActions: [{type: 'discard', playerId: 'east', tileId: 'one'}, {type: 'discard', playerId: 'east', tileId: 'two'}],
  };
}
describe('可見牌桌與操作', () => {
  let root: HTMLElement;
  beforeEach(() => { document.body.innerHTML = '<main id="app"></main>'; root = document.querySelector('#app')!; });
  it('吃牌各組合獨立送出 IDs，副露含來源，重複點擊不重送', () => {
    const onAction=vi.fn(), ui=mountGame(root,{onAction,onNewGame:vi.fn()});
    const view=fixture();
    view.phase='awaiting-meld-response';
    view.players[0].hand=[{id:'a',code:'C1'},{id:'b',code:'C2'},{id:'c',code:'C4'}];
    view.players[1].melds=[{type:'pon',from:'west',tiles:[{id:'p1',code:'DR'},{id:'p2',code:'DR'},{id:'p3',code:'DR'}]}];
    view.lastDiscard={playerId:'north',tile:{id:'d',code:'C3'}};
    view.legalActions=[{type:'chi',playerId:'east',tileIds:['a','b']},{type:'chi',playerId:'east',tileIds:['b','c']},{type:'pass',playerId:'east'}];
    ui.render(view);
    const buttons=root.querySelectorAll<HTMLButtonElement>('[data-meld-action]');
    expect(buttons).toHaveLength(2);
    expect(buttons[1].textContent).toContain('二萬'); expect(buttons[1].textContent).toContain('四萬');
    expect(root.querySelector('[aria-label="南家副露"]')?.textContent).toContain('西家');
    buttons[1].click(); buttons[1].click();
    expect(onAction).toHaveBeenCalledExactlyOnceWith({gameId:'test',revision:4,action:view.legalActions[1]});
  });
  it('顯示三種槓按鈕；搶槓畫面提示第四張；暗槓不顯牌面',()=>{
    const ui=mountGame(root,{onAction:vi.fn(),onNewGame:vi.fn()}),view=fixture();
    view.legalActions=[{type:'closed-kan',playerId:'east',tileId:'one'},{type:'added-kan',playerId:'east',tileId:'two'},{type:'open-kan',playerId:'east'}];
    view.pendingKan={playerId:'south',tile:{id:'kan',code:'C3'}};
    view.players[1].melds=[{type:'closed-kan',tiles:null}];
    ui.render(view);
    expect(root.textContent).toContain('暗槓'); expect(root.textContent).toContain('加槓'); expect(root.textContent).toContain('明槓');
    expect(root.querySelector('[aria-label="南家副露"]')?.querySelectorAll('.tile-back')).toHaveLength(4);
    expect(root.textContent).toContain('搶槓');
  });
  it('選牌出牌：同牌唯一 ID、revision，未更新前只提交一次', () => {
    const onAction = vi.fn(); const ui = mountGame(root, { onAction, onNewGame: vi.fn() });
    ui.render(fixture());
    expect(root.querySelectorAll('[data-tile-id]')).toHaveLength(2);
    (root.querySelector('[data-tile-id="two"]') as HTMLButtonElement).click();
    const discard = root.querySelector('[data-action="discard"]') as HTMLButtonElement;
    discard.click(); discard.click();
    expect(onAction).toHaveBeenCalledExactlyOnceWith({gameId: 'test', revision: 4, action: {type: 'discard', playerId: 'east', tileId: 'two'}});
    ui.render(fixture());
    expect((root.querySelector('[data-action="discard"]') as HTMLButtonElement).disabled).toBe(true);
  });
  it('等待對手時停用手牌且不揭露對手暗牌', () => {
    const ui = mountGame(root, {onAction: vi.fn(), onNewGame: vi.fn()});
    ui.render({...fixture(), actingPlayer: 'south', currentPlayer: 'south', legalActions: []});
    expect(root.querySelectorAll('.tile-back')).toHaveLength(48);
    expect((root.querySelector('[data-tile-id]') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('[data-action="discard"]')).toBeNull();
  });
  it('合法胡與過傳送目前回應者動作；流局顯示原因與新局', () => {
    const onAction = vi.fn(); const ui = mountGame(root, {onAction, onNewGame: vi.fn()});
    ui.render({...fixture(), phase: 'awaiting-win-response', legalActions: [{type: 'win', playerId: 'east'}, {type: 'pass', playerId: 'east'}], lastDiscard: {playerId: 'north', tile: {id: 'last', code: 'DR'}}});
    expect(root.textContent).toContain('北家');
    (root.querySelector('[data-action="pass"]') as HTMLButtonElement).click();
    expect(onAction.mock.calls[0][0].action.type).toBe('pass');
    ui.render({...fixture(), revision: 5, phase: 'finished', actingPlayer: null, legalActions: [], outcome: {kind: 'draw', reason: '牌牆已空'}});
    expect(root.textContent).toContain('牌牆已空');
    expect(root.querySelector('[data-new-game]')).not.toBeNull();
  });
  it('取消重開保留牌局與原規則；確認後提交新設定', () => {
    const onNewGame = vi.fn(); const ui = mountGame(root, {onAction: vi.fn(), onNewGame});
    ui.render(fixture());
    (root.querySelector('[data-settings]') as HTMLButtonElement).click();
    (root.querySelector('#use-flowers') as HTMLInputElement).checked = false;
    (root.querySelector('[data-start]') as HTMLButtonElement).click();
    expect(root.querySelector('[role="alertdialog"]')).not.toBeNull();
    (root.querySelector('[data-cancel]') as HTMLButtonElement).click();
    expect(onNewGame).not.toHaveBeenCalled();
    expect(root.querySelector('[data-mode]')?.textContent).toContain('有花牌');
    (root.querySelector('[data-settings]') as HTMLButtonElement).click();
    (root.querySelector('#use-flowers') as HTMLInputElement).checked = false;
    (root.querySelector('[data-start]') as HTMLButtonElement).click();
    (root.querySelector('[data-confirm]') as HTMLButtonElement).click();
    expect(onNewGame).toHaveBeenCalledExactlyOnceWith({seed: 42, ruleMode: 'no-flowers'});
  });
});
