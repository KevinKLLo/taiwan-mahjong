import {afterEach,expect,it,vi} from 'vitest';
import {createMatchSession,type OpeningRequest} from '../src/match-session';
import {createOpening} from '../src/mahjong/opening';
import {makeFixture} from '../src/contracts/fixtures';
import type {GameConfig,GameOutcome,PlayerId,PlayerView} from '../src/contracts/game';

afterEach(()=>vi.useRealTimers());
function setup(outcome:GameOutcome={kind:'self-draw',winner:'west',reason:'胡牌'}) {
  vi.useFakeTimers();
  const render=vi.fn(),error=vi.fn(),open=vi.fn();
  const engine={
    createGame:(config:GameConfig)=>({...makeFixture(),...config}),
    getPlayerView:(s:PlayerView,viewer:PlayerId)=>({...s,viewer}),
    getLegalActions:(_s:PlayerView,playerId:PlayerId)=>[{type:'win' as const,playerId}],
    applyAction:(s:PlayerView,e:{gameId:string;revision:number})=> e.gameId!==s.gameId||e.revision!==s.revision?{ok:false as const,state:s,error:'stale'}:
      {ok:true as const,state:{...s,phase:'finished' as const,actingPlayer:null,revision:s.revision+1,legalActions:[],outcome}},
  };
  const controller=createMatchSession(engine,(_v,a)=>a[0],render,error,open,100);
  controller.newMatch({seed:42,ruleMode:'no-flowers'});
  const request=()=>open.mock.lastCall![0] as OpeningRequest;
  const accept=(r:OpeningRequest=request())=>{
    const seats=r.seating??{seats:['south','east','north','west'] as PlayerId[],dealer:1};
    const f=createOpening(r.config,seats);f.roll();r.accept(f.gameConfig(),seats);
  };
  return {controller,render,error,open,request,accept};
}
it('AI 莊家結束後等待下一局，換莊人類成東，重複下一局與舊動作不能跳局',()=>{
  const x=setup();x.accept();vi.advanceTimersByTime(100);
  const ended=x.render.mock.lastCall![0] as PlayerView;
  expect(ended.match?.status).toBe('between-rounds');expect(ended.match?.next?.dealer).toBe(0);
  expect(x.open).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
  x.controller.nextRound(ended.gameId);x.controller.nextRound(ended.gameId);
  expect(x.open).toHaveBeenCalledTimes(2);expect(x.request().seating?.dealer).toBe(0);
  x.accept();const playing=x.render.mock.lastCall![0] as PlayerView;
  expect(playing.viewer).toBe('east');expect(playing.match?.roundNumber).toBe(2);
  expect(playing.match?.history).toHaveLength(1);expect(playing.seed).not.toBe(ended.seed);
  x.controller.dispatch({gameId:ended.gameId,revision:ended.revision,action:{type:'win',playerId:'east'}});
  expect(x.error).toHaveBeenCalled();expect(x.render.mock.lastCall![0].match.roundNumber).toBe(2);
  x.controller.destroy();
});
it('重開與 destroy 撤銷舊開門回呼及 AI timer',()=>{
  const x=setup(),old=x.request();x.controller.newMatch({seed:99,ruleMode:'flowers'});x.accept(old);
  expect(x.render).not.toHaveBeenCalled();x.accept();expect(vi.getTimerCount()).toBe(1);
  x.controller.newMatch({seed:100,ruleMode:'flowers'});expect(vi.getTimerCount()).toBe(0);
  const pending=x.request();x.controller.destroy();x.accept(pending);
  expect(x.render).toHaveBeenCalledTimes(1);
});
it('連莊下一手重新開門且同一 accept 只啟動一次',()=>{
  const x=setup({kind:'draw',reason:'流局'});x.accept();vi.advanceTimersByTime(100);
  const ended=x.render.mock.lastCall![0] as PlayerView;x.controller.nextRound(ended.gameId);
  const r=x.request();expect(r.seating?.dealer).toBe(1);
  x.accept(r);x.accept(r);expect(x.render).toHaveBeenCalledTimes(3);
  expect(x.render.mock.lastCall![0].match.continuations).toBe(1);
  x.controller.destroy();
});
