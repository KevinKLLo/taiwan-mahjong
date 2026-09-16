import { PLAYER_IDS, type PlayerView, type Tile } from './game';

const codes = ['B1','B2','B3','B4','B5','B6','C1','C2','C3','D7','D8','D9','WE','WE','WE','DR','DR'];
const hand = codes.map((code, i) => ({ id: `fixture-${i}`, code })) as Tile[];
export function makeFixture(kind: 'discard' | 'waiting' | 'response' | 'self-draw' | 'draw' = 'discard'): PlayerView {
  const finished = kind === 'draw';
  const response = kind === 'response';
  const actingPlayer = finished ? null : kind === 'waiting' ? 'south' : 'east';
  return {
    gameId: 'fixture', revision: 0, seed: 42, ruleMode: 'no-flowers', viewer: 'east',
    phase: finished ? 'finished' : response ? 'awaiting-win-response' : 'awaiting-discard',
    currentPlayer: response ? 'north' : actingPlayer ?? 'east', actingPlayer,
    players: PLAYER_IDS.map((id, i) => ({ id, name: ['你 · 東家','南家','西家','北家'][i], handCount: i === 0 && !response && kind !== 'waiting' && !finished ? 17 : 16,
      hand: i === 0 ? hand.slice(0, response || kind === 'waiting' || finished ? 16 : 17)
        : finished ? hand.slice(0,16).map(tile=>({...tile,id:`${id}-${tile.id}`})) : null, flowers: [], discards: [], melds: [] })),
    wallRemaining: finished ? 0 : 71,
    lastDiscard: response ? { playerId: 'north', tile: {id:'discard',code:'DR'} } : null,
    drawnTileId: response || kind === 'waiting' || finished ? null : 'fixture-16',
    legalActions: finished || kind === 'waiting' ? [] : response ? [{type:'win',playerId:'east'},{type:'pass',playerId:'east'}]
      : [...hand.map(tile=>({type:'discard' as const,playerId:'east' as const,tileId:tile.id})), ...(kind === 'self-draw' ? [{type:'win' as const,playerId:'east' as const}] : [])],
    outcome: finished ? {kind:'draw',reason:'牌牆已空，本局流局。'} : null,
    message: finished ? '本局流局' : response ? '可以胡牌，或選擇過。' : '請選一張牌後確認出牌。',
  };
}
