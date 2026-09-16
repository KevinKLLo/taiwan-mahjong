import { expect, it } from 'vitest';
import { applyAction, getLegalActions, getPlayerView, createGame, type GameState } from '../../src/mahjong/game';
import { type GameAction, type PlayerId } from '../../src/contracts/game';
import { isWinningHand } from '../../src/mahjong/win';
import { chooseAction } from '../../src/ai/strategy';
import { gameWithHands } from './fixtures';

const act = (s:GameState,a:GameAction) => {
  const r=applyAction(s,{gameId:s.gameId,revision:s.revision,action:a});
  expect(r.ok).toBe(true); return r.state;
};
const discard=(s:GameState,code:string) => act(s,{type:'discard',playerId:s.currentPlayer,tileId:s.players.find(p=>p.id===s.currentPlayer)!.hand.find(t=>t.code===code)!.id});
function until(s:GameState,id:PlayerId,type:string) {
  for(let i=0;i<20;i++) {
    if(getLegalActions(s,id).some(a=>a.type===type)) return s;
    const actor=getPlayerView(s,'east').actingPlayer!;
    const pass=getLegalActions(s,actor).find(a=>a.type==='pass');
    if(!pass) break;
    s=act(s,pass);
  }
  throw Error(`Missing ${id} ${type}`);
}
const ids=(s:GameState)=>[...s.wall,...s.players.flatMap(p=>[...p.hand,...p.flowers,...p.discards,...p.melds.flatMap(m=>m.tiles)])].map(t=>t.id).sort();

it('吃僅上家，提供所有順子選擇，吃後直接出牌且搬移實體牌',()=>{
  let s=gameWithHands({east:['C3'],south:['C1','C2','C4','C5']});
  const before=ids(s), wall=s.wall.length;
  s=until(discard(s,'C3'),'south','chi');
  const actions=getLegalActions(s,'south').filter(a=>a.type==='chi');
  expect(actions).toHaveLength(3);
  expect(getLegalActions(s,'west').some(a=>a.type==='chi')).toBe(false);
  s=act(s,actions[1]);
  expect(s.players[1].melds[0]).toMatchObject({type:'chi',from:'east'});
  expect(s.players[1].melds[0].tiles.map(t=>t.code).sort()).toEqual(['C2','C3','C4']);
  expect(s.players[1].hand).toHaveLength(14);
  expect(s.wall).toHaveLength(wall);
  expect(s.currentPlayer).toBe('south'); expect(s.drawnTileId).toBeNull();
  expect(ids(s)).toEqual(before);
});
it('碰可取任意三家，明槓不可取上家但可取對家與下家',()=>{
  for(const from of ['east','west','north'] as PlayerId[]) {
    let s=gameWithHands({[from]:['DR'],south:['DR','DR','DR']});
    s.currentPlayer=from;
    s=until(discard(s,'DR'),'south','pon');
    const legal=getLegalActions(s,'south');
    expect(legal.some(a=>a.type==='open-kan')).toBe(from!=='east');
    const forged={type:'open-kan',playerId:'south'} as GameAction;
    if(from==='east') expect(applyAction(s,{gameId:s.gameId,revision:s.revision,action:forged})).toMatchObject({ok:false,state:s});
    s=act(s,legal.find(a=>a.type==='pon')!);
    expect(s.players[1].melds[0].type).toBe('pon');
    expect(s.currentPlayer).toBe('south');
  }
});
it('胡優先於碰，碰優先於吃；高優先權過後才開放下一階段',()=>{
  let s=gameWithHands({east:['C3'],south:['C2','C4'],west:['C3','C3'],north:'B1 B2 B3 B4 B5 B6 D1 D2 D3 WE WE WE DR DR DR C3'.split(' ')});
  s=discard(s,'C3');
  expect(getPlayerView(s,'east').actingPlayer).toBe('north');
  expect(getLegalActions(s,'west')).toEqual([]);
  s=act(s,{type:'pass',playerId:'north'});
  expect(getPlayerView(s,'east').actingPlayer).toBe('west');
  s=act(s,{type:'pass',playerId:'west'});
  expect(getLegalActions(s,'south').some(a=>a.type==='chi')).toBe(true);
});
it('暗槓尾補連續花，對手只看牌背，終局才揭露',()=>{
  let s=gameWithHands({east:['C1','C1','C1','C1']},{seed:42,ruleMode:'flowers',gameId:'kan'});
  const before=ids(s);
  const flower=s.wall.findIndex(t=>t.code==='F1'); s.wall.push(s.wall.splice(flower,1)[0]);
  const tail=s.wall.at(-2)!;
  const a=getLegalActions(s,'east').find(a=>a.type==='closed-kan')!;
  expect(a).toBeDefined(); s=act(s,a);
  expect(s.players[0].flowers.some(t=>t.code==='F1')).toBe(true);
  expect(s.drawnTileId).toBe(tail.id);
  expect(s.players[0].hand).toHaveLength(14);
  expect(getPlayerView(s,'south').players[0].melds[0].tiles).toBeNull();
  expect(ids(s)).toEqual(before);
  s.phase='finished';
  expect(getPlayerView(s,'south').players[0].melds[0].tiles).toHaveLength(4);
});
it('明槓尾補後可自摸，已副露面子計入五面子一將',()=>{
  expect(isWinningHand('B1 B2 B3 B4 B5 B6 C1 C2 C3 D1 D2 D3 DR DR'.split(' '),1)).toBe(true);
  let s=gameWithHands({east:['DG'],west:'DG DG DG B1 B2 B3 B4 B5 B6 C1 C2 C3 D1 D2 D3 DR'.split(' ')});
  const i=s.wall.findIndex(t=>t.code==='DR'); s.wall.push(s.wall.splice(i,1)[0]);
  s=until(discard(s,'DG'),'west','open-kan');
  s=act(s,getLegalActions(s,'west').find(a=>a.type==='open-kan')!);
  expect(getLegalActions(s,'west').some(a=>a.type==='win')).toBe(true);
  expect(act(s,{type:'win',playerId:'west'}).outcome?.kind).toBe('self-draw');
});
it('加槓搶胡前不補牌，被搶保留碰組且牌守恆；全過才補',()=>{
  let s=gameWithHands({east:['C3','C3','C3','C3'],south:'B1 B2 B3 B4 B5 B6 D1 D2 D3 WE WE WE DR DR C1 C2'.split(' ')});
  const p=s.players[0], meld=p.hand.filter(t=>t.code==='C3').slice(0,3);
  p.hand=p.hand.filter(t=>!meld.includes(t)); p.melds=[{type:'pon',tiles:meld,from:'north'}];
  const before=ids(s), wall=s.wall.length;
  const added=getLegalActions(s,'east').find(a=>a.type==='added-kan')!;
  expect(added).toBeDefined(); s=act(s,added);
  expect(s.phase).toBe('awaiting-win-response'); expect(s.wall).toHaveLength(wall);
  const won=act(s,{type:'win',playerId:'south'});
  expect(won.outcome?.reason).toContain('搶槓'); expect(won.players[0].melds[0].type).toBe('pon');
  expect(ids(won)).toEqual(before);
  const passed=act(s,{type:'pass',playerId:'south'});
  expect(passed.players[0].melds[0].type).toBe('added-kan');
  expect(passed.wall).toHaveLength(wall-1); expect(ids(passed)).toEqual(before);
});
it('完整 AI 牌局保持副露張數、守恆、合法動作與有限終局',()=>{
  for(const ruleMode of ['flowers','no-flowers'] as const) for(const seed of [1,9,42,98,1234]) {
    let s=createGame({seed,ruleMode,gameId:'simulation'}); const before=ids(s);
    for(let i=0;i<700 && s.phase!=='finished';i++) {
      const actor=getPlayerView(s,'east').actingPlayer!;
      const view=getPlayerView(s,actor), actions=getLegalActions(s,actor);
      s=act(s,chooseAction(view,actions)); expect(ids(s)).toEqual(before);
      if(s.phase==='awaiting-discard') for(const p of s.players) expect(p.hand.length+3*p.melds.length).toBe(p.id===s.currentPlayer?17:16);
    }
    expect(s.phase).toBe('finished');
  }
});
it('偽造吃牌 IDs、重複 IDs 及 stale action 不改變原狀態；全過才正常摸牌',()=>{
  let s=gameWithHands({east:['C3'],south:['C2','C4']});
  s=until(discard(s,'C3'),'south','chi');
  const original=structuredClone(s), action=getLegalActions(s,'south').find(a=>a.type==='chi')!;
  if(action.type!=='chi') throw Error('Missing chi');
  for(const tileIds of [['fake','fake'],[action.tileIds[0],action.tileIds[0]],[]]) {
    const r=applyAction(s,{gameId:s.gameId,revision:s.revision,action:{...action,tileIds}});
    expect(r.ok).toBe(false); expect(r.state).toBe(s); expect(s).toEqual(original);
  }
  expect(applyAction(s,{gameId:s.gameId,revision:s.revision-1,action}).ok).toBe(false);
  const next=act(s,{type:'pass',playerId:'south'});
  expect(next.currentPlayer).toBe('south'); expect(next.wall.length).toBe(s.wall.length-1);
});
it('字牌不能吃，北家棄牌只允許東家吃，吃碰後不允許自槓',()=>{
  let s=gameWithHands({north:['C3'],east:['C2','C4','B1','B1','B1','B1']});
  s.currentPlayer='north'; s=until(discard(s,'C3'),'east','chi');
  s=act(s,getLegalActions(s,'east').find(a=>a.type==='chi')!);
  expect(getLegalActions(s,'east').every(a=>a.type==='discard')).toBe(true);
  s=gameWithHands({east:['WE'],south:['WS','WW']});
  s=discard(s,'WE');
  expect(s.claimQueue.flat().some(a=>a.type==='chi')).toBe(false);
});
it('槓後尾端全是花牌，無普通牌可補則流局且花牌歸屬正確',()=>{
  let s=gameWithHands({east:['C1','C1','C1','C1']},{seed:42,ruleMode:'flowers',gameId:'empty'});
  s.wall=[{id:'f1',code:'F1'},{id:'f2',code:'F2'}];
  s=act(s,getLegalActions(s,'east').find(a=>a.type==='closed-kan')!);
  expect(s.outcome?.kind).toBe('draw'); expect(s.wall).toEqual([]);
  expect(s.players[0].flowers.map(t=>t.id)).toEqual(['f2','f1']);
  expect(s.players[0].melds[0].tiles).toHaveLength(4);
});
