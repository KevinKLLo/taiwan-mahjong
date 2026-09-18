import {expect,it} from 'vitest';
import {createMatch,finishRound,advanceRound,roundConfig} from '../src/mahjong/match';
import {createOpening} from '../src/mahjong/opening';
import {createGame,getPlayerView,getLegalActions,applyAction} from '../src/mahjong/game';
import {chooseAction} from '../src/ai/strategy';

it.each(['flowers','no-flowers'] as const)('真實引擎跑完 %s 東風一圈，逐局清空牌河、副露與全牌守恆',ruleMode=>{
  let m=createMatch({seed:615,ruleMode},{seats:['south','east','north','west'],dealer:1});
  for(let round=1;round<=60;round++) {
    const f=createOpening(roundConfig(m),m);f.roll();
    let state=createGame({...f.gameConfig(),gameId:`round-${round}`});
    expect(state.players.map(p=>p.hand.length)).toEqual([17,16,16,16]);
    expect(state.players.every(p=>p.discards.length===0&&p.melds.length===0)).toBe(true);
    for(let step=0;step<1000&&state.phase!=='finished';step++) {
      const actor=getPlayerView(state,'east').actingPlayer!;
      const action=chooseAction(getPlayerView(state,actor),getLegalActions(state,actor));
      const result=applyAction(state,{gameId:state.gameId,revision:state.revision,action});
      expect(result.ok).toBe(true);state=result.state;
    }
    expect(state.phase).toBe('finished');
    const tiles=[...state.wall,...state.players.flatMap(p=>[...p.hand,...p.flowers,...p.discards,...p.melds.flatMap(g=>g.tiles)])];
    expect(tiles).toHaveLength(ruleMode==='flowers'?144:136);expect(new Set(tiles.map(t=>t.id)).size).toBe(tiles.length);
    m=finishRound(m,state.gameId,state.outcome!);
    if(m.status==='complete') break;
    m=advanceRound(m);
  }
  expect(m.status).toBe('complete');expect(m.history.filter(h=>h.kind!=='draw'&&h.winner!==h.dealer)).toHaveLength(4);
});
