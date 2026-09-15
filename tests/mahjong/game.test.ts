import { describe, it, expect } from 'vitest';
import { createGame, applyAction, getLegalActions, getPlayerView, type GameState } from '../../src/mahjong/game';
import { isWinningHand } from '../../src/mahjong/win';
import { chooseAction } from '../../src/ai/strategy';
import { dealInitialHands } from '../../src/mahjong/rules';
import { sortTiles, type TileCode } from '../../src/mahjong/tiles';
import { PLAYER_IDS, type GameAction, type Tile } from '../../src/contracts/game';
import { gameWithHands } from './fixtures';

const config = { seed: 42, ruleMode: 'no-flowers' as const, gameId: 'test' };
const codes = (text: string): TileCode[] => text.split(' ');
const winning = codes('B1 B2 B3 B4 B5 B6 C1 C2 C3 D7 D8 D9 WE WE WE DR DR');
const tiles = (list: TileCode[], prefix: string): Tile[] => list.map((code, i) => ({ id: `${prefix}-${i}`, code }));
function act(state: GameState, action: GameAction): GameState {
  const result = applyAction(state, { gameId: state.gameId, revision: state.revision, action });
  expect(result.ok).toBe(true);
  return result.state;
}
function allTiles(state: GameState) {
  return [...state.wall, ...state.players.flatMap(p => [...p.hand, ...p.flowers, ...p.discards])];
}
function responseFixture(): GameState {
  return gameWithHands({
    east:['DR'], south:winning.slice(0,-1),
    west:codes('B7 B8 B9 C4 C5 C6 D1 D2 D3 WN WN WN DG DG DG DR'),
    north:['DR'],
  },config);
}
const discardDR=(state:GameState,playerId:'east'|'north'):GameAction=>({type:'discard',playerId,tileId:state.players.find(p=>p.id===playerId)!.hand.find(t=>t.code==='DR')!.id});

describe('single-round-game: 一般胡牌', () => {
  it('accepts five melds and pair, rejects honors sequences, flowers and missing tiles', () => {
    expect(isWinningHand(winning)).toBe(true);
    expect(isWinningHand([...winning.slice(0, 12), 'WE', 'WS', 'WW', 'DR', 'DR'])).toBe(false);
    expect(isWinningHand([...winning.slice(0, -1), 'F1'])).toBe(false);
    expect(isWinningHand(winning.slice(1))).toBe(false);
  });
  it('tries another pair when the first pair blocks a valid decomposition', () => {
    expect(isWinningHand(codes('B1 B1 B1 B2 B2 B2 B3 B3 B3 B4 B5 B6 B7 B8 B9 DR DR'))).toBe(true);
    expect(isWinningHand(codes('B1 B1 B1 B2 B3 B4 B4 B4 B5 B6 B7 B8 B9 DR DR DR DR'))).toBe(false);
    // Four copies is the physical maximum; impossible duplicate counts cannot win.
    expect(isWinningHand(codes('B1 B1 B1 B1 B2 B2 B2 B3 B3 B3 B4 B4 B4 B4 B4 B4 DR'))).toBe(false);
    expect(isWinningHand(codes('B1 B1 B1 B2 B2 B2 B3 B3 B3 B4 B4 B4 B5 B5 C1 C2 C3'))).toBe(true);
    // Choosing B1 as the pair fails. B4 pair permits 111, 222, 333, 123, 345.
    expect(isWinningHand(codes('B1 B1 B1 B1 B2 B2 B2 B2 B3 B3 B3 B3 B4 B4 B4 B4 B5'))).toBe(true);
  });
});

describe('single-round-game: 無花開局與出牌 / 非法或過期動作', () => {
  it.each(['flowers', 'no-flowers'] as const)('preserves the original %s deal', ruleMode => {
    const state = createGame({ ...config, ruleMode });
    const old = dealInitialHands(42, ruleMode);
    expect(state.players.map(p => p.hand.length)).toEqual([17,16,16,16]);
    expect(state.players.map(p => sortTiles(p.hand.map(t => t.code)))).toEqual(old.players.map(p => p.tiles));
    expect(state.wall.length).toBe(old.wallRemaining);
    expect(new Set(allTiles(state).map(t => t.id)).size).toBe(ruleMode === 'flowers' ? 144 : 136);
  });
  it('moves a discard to its river and draws from the front for the next seat', () => {
    const state = createGame(config);
    const before = structuredClone(state);
    const next = act(state, { type: 'discard', playerId: 'east', tileId: state.players[0].hand[0].id });
    expect(state).toEqual(before);
    expect(next.wall.length).toBe(70);
    expect(next.currentPlayer).toBe('south');
    expect(next.players.map(p => p.hand.length)).toEqual([16,17,16,16]);
    expect(next.players[1].hand).toContainEqual(state.wall[0]);
    expect(next.drawnTileId).toBe(state.wall[0].id);
  });
  it('rejects wrong seat, missing tile, stale revision and old game without mutations', () => {
    const state = createGame(config);
    const original = structuredClone(state);
    const action = getLegalActions(state, 'east')[0];
    const requests = [
      { gameId: state.gameId, revision: 1, action },
      { gameId: 'old', revision: 0, action },
      { gameId: state.gameId, revision: 0, action: {type:'discard',playerId:'south',tileId:state.players[1].hand[0].id} as GameAction },
      { gameId: state.gameId, revision: 0, action: {type:'discard',playerId:'east',tileId:'absent'} as GameAction },
      { gameId: state.gameId, revision: 0, action: {type:'win',playerId:'east'} as GameAction },
    ];
    for (const request of requests) {
      const result = applyAction(state, request);
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
      expect(state).toEqual(original);
    }
  });
});

describe('single-round-game: 多人可胡 / 終局', () => {
  it('offers nearest responder first, then farther responder after pass, without drawing', () => {
    let state = responseFixture();
    const wallSize = state.wall.length;
    state = act(state, discardDR(state,'east'));
    expect(state.phase).toBe('awaiting-win-response');
    expect(getLegalActions(state,'south').map(a=>a.type)).toEqual(['win','pass']);
    expect(getLegalActions(state,'west')).toEqual([]);
    state = act(state, {type:'pass',playerId:'south'});
    expect(state.wall.length).toBe(wallSize);
    expect(getLegalActions(state,'west').map(a=>a.type)).toEqual(['win','pass']);
    const count = allTiles(state).length;
    state = act(state, {type:'win',playerId:'west'});
    expect(state.outcome).toMatchObject({kind:'discard-win',winner:'west',from:'east'});
    expect(allTiles(state)).toHaveLength(count);
    expect(new Set(allTiles(state).map(t=>t.id)).size).toBe(count);
    expect(state.players[2].hand).toHaveLength(17);
    expect(state.players[0].discards).toHaveLength(0);
    expect(getLegalActions(state,'west')).toEqual([]);
    expect(applyAction(state,{gameId:state.gameId,revision:state.revision,action:{type:'pass',playerId:'west'}}).ok).toBe(false);
  });
  it('draws for next seat only after all eligible responders pass', () => {
    let state = responseFixture();
    state = act(state,discardDR(state,'east'));
    state = act(state,{type:'pass',playerId:'south'});
    state = act(state,{type:'pass',playerId:'west'});
    expect(state.phase).toBe('awaiting-discard');
    expect(state.currentPlayer).toBe('south');
    expect(state.wall).toHaveLength(70);
  });
  it('does not apply furiten after a pass, and orders responders across the north/east boundary', () => {
    let state = responseFixture();
    state = act(state,discardDR(state,'east'));
    state = act(state,{type:'pass',playerId:'south'});
    state = act(state,{type:'pass',playerId:'west'});
    // South and west discard their new draws, preserving their waiting hands.
    state=act(state,{type:'discard',playerId:'south',tileId:state.drawnTileId!});
    state=act(state,{type:'discard',playerId:'west',tileId:state.drawnTileId!});
    state = act(state,discardDR(state,'north'));
    expect(getLegalActions(state,'south').map(a=>a.type)).toEqual(['win','pass']);
    expect(act(state,{type:'win',playerId:'south'}).outcome).toMatchObject({kind:'discard-win',winner:'south',from:'north'});
  });
  it('accepts self-draw and does not require winning instead of discarding', () => {
    const state = createGame(config);
    state.players[0].hand = tiles(winning,'win');
    expect(getLegalActions(state,'east').some(a=>a.type==='discard')).toBe(true);
    expect(act(state,{type:'win',playerId:'east'}).outcome).toMatchObject({kind:'self-draw',winner:'east'});
  });
  it.each(([[], [{id:'last-flower',code:'F1'}], [{id:'front-flower',code:'F1'},{id:'tail-flower',code:'F2'}]] as Tile[][]).map(wall=>({wall})))('exhaustion including chained flowers ends safely ($wall)', ({wall}) => {
    const state = createGame({...config,ruleMode:'flowers'});
    state.wall = wall;
    const next = act(state,{type:'discard',playerId:'east',tileId:state.players[0].hand[0].id});
    expect(next.phase).toBe('finished');
    expect(next.outcome?.kind).toBe('draw');
    expect(next.wall).toEqual([]);
    expect(next.players[1].flowers).toEqual(expect.arrayContaining(wall));
    expect(next.players[1].hand).toHaveLength(16);
  });
  it('takes chained flower replacement from the tail, not the normal front', () => {
    const state = createGame({...config,ruleMode:'flowers'});
    state.wall = tiles(['F1','B1','C9','F2'],'wall');
    const next = act(state,{type:'discard',playerId:'east',tileId:state.players[0].hand[0].id});
    expect(next.wall.map(t=>t.code)).toEqual(['B1']);
    expect(next.players[1].hand.at(-1)?.code).toBe('C9');
    expect(next.players[1].flowers.slice(-2).map(t=>t.code)).toEqual(['F1','F2']);
  });
});

describe('single-round-game: AI 與資訊隔離 / 完整模擬', () => {
  it('returns detached views containing only own hand and no wall tiles', () => {
    const state = createGame(config);
    for (const viewer of PLAYER_IDS) {
      const view = getPlayerView(state,viewer);
      expect(view.players.filter(p=>p.id!==viewer).every(p=>p.hand===null)).toBe(true);
      expect(JSON.stringify(view)).not.toContain(state.wall[0].id);
      const own = view.players.find(p=>p.id===viewer)!;
      own.hand![0].code='F1';
      expect(state.players.find(p=>p.id===viewer)!.hand[0].code).not.toBe('F1');
      if (viewer!=='east') expect(view.drawnTileId).toBe(null);
    }
  });
  it.each(['flowers','no-flowers'] as const)('finishes deterministic %s games with conservation at every step', ruleMode => {
    for (const seed of [1,42,1234,20260915,98]) {
      let state=createGame({...config,seed,ruleMode});
      let replay=createGame({...config,seed,ruleMode});
      const ids=allTiles(state).map(t=>t.id).sort();
      let steps=0;
      while(state.phase!=='finished' && steps++<400) {
        const player=PLAYER_IDS.find(p=>getLegalActions(state,p).length)!;
        const view=getPlayerView(state,player);
        const action=chooseAction(view,view.legalActions);
        expect(view.legalActions).toContainEqual(action);
        expect(chooseAction(view,view.legalActions)).toEqual(action);
        state=act(state,action); replay=act(replay,action);
        expect(allTiles(state).map(t=>t.id).sort()).toEqual(ids);
        if(state.phase==='awaiting-discard') expect(state.players.map(p=>p.hand.length)).toEqual(PLAYER_IDS.map(p=>p===state.currentPlayer?17:16));
      }
      expect(state.phase).toBe('finished');
      expect(replay).toEqual(state);
      expect(getPlayerView(state,'east').players.every(p=>p.hand!==null)).toBe(true);
    }
  });
});
