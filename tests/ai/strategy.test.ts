import { describe, expect, it } from 'vitest';
import { chooseAction } from '../../src/ai/strategy';
import { createGame, getPlayerView } from '../../src/mahjong/game';
import type { GameAction } from '../../src/contracts/game';

describe('AI: deterministic own-view decisions',()=>{
  const view=getPlayerView(createGame({seed:42,ruleMode:'no-flowers',gameId:'ai'}),'east');
  it('takes a legal win before any discard',()=>{
    const win:GameAction={type:'win',playerId:'east'};
    expect(chooseAction(view,[...view.legalActions,win])).toEqual(win);
  });
  it('keeps connected tiles and sheds an isolated honor with a stable ID tie-break',()=>{
    const own=structuredClone(view);
    own.players[0].hand=[{id:'a',code:'B1'},{id:'b',code:'B2'},{id:'z',code:'WE'},{id:'c',code:'WS'}];
    const actions:GameAction[]=own.players[0].hand.map(t=>({type:'discard',playerId:'east',tileId:t.id}));
    const original=structuredClone(own);
    expect(chooseAction(own,actions)).toEqual({type:'discard',playerId:'east',tileId:'c'});
    expect(chooseAction(own,[...actions].reverse())).toEqual(chooseAction(own,actions));
    expect(own).toEqual(original);
  });
  it('handles a pass-only response and explicitly rejects an empty action list',()=>{
    const pass:GameAction={type:'pass',playerId:'east'};
    expect(chooseAction(view,[pass])).toEqual(pass);
    expect(()=>chooseAction(view,[])).toThrow('AI 沒有合法動作');
  });
});
