import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSession } from '../src/session';
import { makeFixture } from '../src/contracts/fixtures';
import type { ActionEnvelope, GameConfig, PlayerView, PlayerId, GameAction } from '../src/contracts/game';

function setup() {
  const render = vi.fn();
  const error = vi.fn();
  const apply = vi.fn((state: PlayerView, envelope: ActionEnvelope) => {
    if (envelope.gameId !== state.gameId || envelope.revision !== state.revision) return {ok:false as const, state, error:'STALE_ACTION'};
    const next = {...state, revision:state.revision+1, actingPlayer:'south' as const, currentPlayer:'south' as const};
    return {ok:true as const,state:next};
  });
  const engine = {
    createGame: (config:GameConfig) => ({...makeFixture(),...config}),
    getPlayerView: (state:PlayerView, playerId:PlayerId) => ({...state,viewer:playerId}),
    getLegalActions: (_state:PlayerView, playerId:PlayerId):GameAction[] => [{type:'discard',playerId,tileId:'fixture-0'}],
    applyAction: apply,
  };
  const session = createSession(engine, (_view, actions)=>actions[0], render, error, 100);
  session.newGame({seed:42,ruleMode:'no-flowers'});
  return {session,render,error,apply};
}

describe('牌局協調器',()=>{
  afterEach(()=>vi.useRealTimers());
  it('初始 render 且只接受玩家自己的動作',()=>{
    const {session,render,error,apply}=setup();
    const view=render.mock.calls[0][0] as PlayerView;
    session.dispatch({gameId:view.gameId,revision:0,action:{type:'discard',playerId:'south',tileId:'fixture-0'}});
    expect(apply).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    session.destroy();
  });
  it('重開取消舊 AI 工作且拒絕舊局動作',()=>{
    vi.useFakeTimers();
    const {session,render,apply,error}=setup();
    const view=render.mock.calls[0][0] as PlayerView;
    const envelope:ActionEnvelope={gameId:view.gameId,revision:0,action:{type:'discard',playerId:'east',tileId:'fixture-0'}};
    session.dispatch(envelope);
    expect(vi.getTimerCount()).toBe(1);
    session.newGame({seed:43,ruleMode:'flowers'});
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(200);
    expect(apply).toHaveBeenCalledTimes(1);
    session.dispatch(envelope);
    expect(error).toHaveBeenCalled();
    expect((render.mock.lastCall![0] as PlayerView).seed).toBe(43);
    session.destroy();
  });
  it('有效出牌後自動推進 AI，destroy 清理排程',()=>{
    vi.useFakeTimers();
    const {session,render,apply}=setup();
    const view=render.mock.calls[0][0] as PlayerView;
    session.dispatch({gameId:view.gameId,revision:0,action:{type:'discard',playerId:'east',tileId:'fixture-0'}});
    vi.advanceTimersByTime(100);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.lastCall![1].action.playerId).toBe('south');
    session.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
