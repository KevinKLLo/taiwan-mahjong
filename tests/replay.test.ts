import { expect, it } from 'vitest';
import { createGame, applyAction, getPlayerView, getLegalActions } from '../src/mahjong/game';
import { chooseAction } from '../src/ai/strategy';

it('seed 9 no-flowers replay ends with north self-draw', () => {
  let state = createGame({seed:9,ruleMode:'no-flowers',gameId:'game-2'});
  const east:string[]=[];
  for(let i=0;i<200 && state.phase!=='finished';i++) {
    const actor=getPlayerView(state,'east').actingPlayer!;
    const action=chooseAction(getPlayerView(state,actor),getLegalActions(state,actor));
    if(actor==='east') east.push(action.type==='discard' ? state.players[0].hand.find(t=>t.id===action.tileId)!.code : action.type);
    const result=applyAction(state,{gameId:state.gameId,revision:state.revision,action});
    if(!result.ok) throw Error(result.error);
    state=result.state;
  }
  expect(east).toEqual(['DR','D3','C9','DW','WW','DR','DG','WN','WE']);
  expect(state.outcome).toMatchObject({kind:'self-draw',winner:'north'});
  expect(state.revision).toBe(36);
});
