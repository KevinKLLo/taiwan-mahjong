import {expect,it} from 'vitest';
import {createMatch,finishRound,advanceRound,roundConfig,matchView} from '../src/mahjong/match';
import {createOpening} from '../src/mahjong/opening';
import {PLAYER_IDS,type GameOutcome} from '../src/contracts/game';

const config={seed:615,ruleMode:'no-flowers' as const};
// identity 0（人類）抓南；identity 1 抓東且起莊。
const seating={seats:['south','east','north','west'] as typeof PLAYER_IDS[number][],dealer:1};
const win=(winner:typeof PLAYER_IDS[number]):GameOutcome=>({kind:'self-draw',winner,reason:'測試胡牌'});
it('莊家自摸、胡棄牌與流局都連莊，不增加下莊次數',()=>{
  let m=createMatch(config,seating);
  for(const [i,outcome] of [win('east'),{kind:'discard-win',winner:'east',from:'north',reason:'胡牌'},{kind:'draw',reason:'流局'}].entries()) {
    m=finishRound(m,`g${i}`,outcome as GameOutcome);
    expect(m.status).toBe('between-rounds');expect(m.next).toMatchObject({dealer:1,dealerChanges:0,continuations:i+1});
    m=advanceRound(m);expect(m.roundNumber).toBe(i+2);
  }
  expect(m.history).toHaveLength(3);expect(m.seats).toEqual(seating.seats);
});
it('西家胡牌由南家接莊，不是贏家；人類門風南變東',()=>{
  const initial=createMatch(config,seating);
  const ended=finishRound(initial,'g1',win('west'));
  expect(initial.history).toHaveLength(0);expect(ended.history[0].winner).toBe(3);
  expect(ended.next).toMatchObject({dealer:0,dealerChanges:1,continuations:0});
  const next=advanceRound(ended),flow=createOpening(roundConfig(next),next);
  expect(flow.view().stage).toBe('wall-roll');flow.roll();
  expect(flow.gameConfig().viewer).toBe('east');
  expect(flow.view().seats).toEqual(seating.seats);
});
it('第四任莊家仍可連莊，第四次下莊才結束，不能再續局',()=>{
  let m=createMatch(config,seating);const dealers=[1,0,3,2];
  for(let i=0;i<3;i++) {expect(m.dealer).toBe(dealers[i]);m=advanceRound(finishRound(m,`g${i}`,win('west')));}
  expect(m.dealer).toBe(2);
  m=advanceRound(finishRound(m,'g3',win('east')));
  m=advanceRound(finishRound(m,'g4',{kind:'draw',reason:'流局'}));
  expect(m.continuations).toBe(2);expect(m.dealerChanges).toBe(3);
  m=finishRound(m,'g5',win('north'));
  expect(m.status).toBe('complete');expect(m.next).toBeNull();expect(m.history).toHaveLength(6);
  expect(()=>advanceRound(m)).toThrow();expect(matchView(m).status).toBe('complete');
});
it('每局只記錄一次，未終局不可續局，非法 outcome 不改狀態',()=>{
  const m=createMatch(config,seating);expect(()=>advanceRound(m)).toThrow();
  expect(()=>finishRound(m,'bad',{kind:'self-draw',reason:'缺少贏家'})).toThrow();
  const ended=finishRound(m,'g1',win('east'));
  expect(finishRound(ended,'g1',win('east'))).toEqual(ended);
  const next=advanceRound(ended);
  expect(finishRound(next,'g1',win('east'))).toEqual(next);
  expect(ended.history).toHaveLength(1);
});
it('連莊洗牌 seed 更新且可重現，初始最大 seed 也維持合法',()=>{
  for(const seed of [1,615,4294967295]) {
    const first=createMatch({...config,seed},seating),second=advanceRound(finishRound(first,'a',win('east')));
    expect(roundConfig(first).seed).toBe(seed);expect(roundConfig(second).seed).not.toBe(seed);
    expect(roundConfig(second)).toEqual(roundConfig(advanceRound(finishRound(first,'a',win('east')))));
    expect(roundConfig(second).seed).toBeGreaterThan(0);expect(roundConfig(second).seed).toBeLessThanOrEqual(4294967295);
  }
});
