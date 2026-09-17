import { describe, expect, it } from 'vitest';
import { countFrom, createOpening, wallOpening } from '../src/mahjong/opening';
import { createGame, getPlayerView } from '../src/mahjong/game';
import { buildWall } from '../src/mahjong/rules';
import { PLAYER_IDS } from '../src/contracts/game';

describe('骰子開局',()=>{
  it('跨多組 seed 對照實際起莊、開門與人類門風，公開 view 無法修改內部狀態',()=>{
    const viewers=new Set<string>();
    for(let seed=1;seed<=80;seed++) {
      const f=createOpening({seed,ruleMode:'no-flowers'});
      const before=f.view();before.stage='ready';expect(f.view().stage).toBe('seat-roll');
      f.roll();const draw=f.view();expect(draw.firstDraw).toBe((draw.rolls[0].total-1)%4);
      expect(draw.cards.filter(c=>c.owner===null).every(c=>c.wind===null)).toBe(true);
      f.drawWind(draw.cards.findIndex(c=>c.owner===null));f.roll();
      const dealer=f.view();
      expect(dealer.rolls[1].roller).toBe(dealer.seats.indexOf('east'));
      expect(dealer.seats[dealer.dealer!]).toBe(PLAYER_IDS[(dealer.rolls[1].total-1)%4]);
      f.roll();const v=f.view(),config=f.gameConfig();
      const dealerIndex=PLAYER_IDS.indexOf(v.seats[v.dealer!]!);
      expect(v.opening!.wallSeat).toBe((dealerIndex+v.rolls[2].total-1)%4);
      expect(config.viewer).toBe(PLAYER_IDS[(PLAYER_IDS.indexOf(v.seats[0]!)-dealerIndex+4)%4]);
      viewers.add(config.viewer!);
    }
    expect(viewers.size).toBe(4);
  });
  it('本人算 1，數位逆時針，5 回本人、6 到下一位',()=>{
    for(let i=0;i<4;i++) {expect(countFrom(i,5)).toBe(i);expect(countFrom(i,6)).toBe((i+1)%4);}
  });
  it('三次分段擲骰、抽風牌隱藏與可重現',()=>{
    function run() {
      const flow=createOpening({seed:42,ruleMode:'no-flowers'});
      expect(flow.view().cards.every(c=>c.wind===null)).toBe(true);
      expect(()=>flow.gameConfig()).toThrow();
      flow.roll();
      expect(flow.view().stage).toBe('wind-draw');
      expect(flow.view().rolls).toHaveLength(1);
      flow.drawWind(flow.view().cards.findIndex(c=>c.owner===null));
      expect(new Set(flow.view().seats)).toHaveLength(4);
      flow.roll();
      expect(flow.view().stage).toBe('wall-roll');
      expect(flow.view().rolls).toHaveLength(2);
      expect(()=>flow.gameConfig()).toThrow();
      flow.roll();
      expect(flow.view().stage).toBe('ready');
      const v=flow.view();
      expect(v.rolls).toHaveLength(3);
      expect(v.rolls[2].roller).toBe(v.dealer);
      for(const roll of v.rolls) {expect(roll.dice).toHaveLength(3); expect(roll.dice.every(d=>d>=1&&d<=6)).toBe(true);}
      expect(()=>flow.roll()).toThrow();
      expect(()=>flow.drawWind(0)).toThrow();
      return {view:v,config:flow.gameConfig()};
    }
    expect(run()).toEqual(run());
  });
  it('17 墩遇 18 跨邊；18 墩恰好走完本邊',()=>{
    // 莊家抓位東；18 選中南牆。牆順序東北西南，南後接東。
    expect(wallOpening('no-flowers',0,18)).toMatchObject({wallSeat:1,startSeat:0,skippedStacks:1,wallStart:2,crossed:true});
    expect(wallOpening('flowers',0,18)).toMatchObject({wallSeat:1,startSeat:0,skippedStacks:0,wallStart:0,crossed:true});
    expect(wallOpening('no-flowers',0,3).wallStart).toBe(74);
    expect(()=>wallOpening('flowers',0,19)).toThrow();
  });
  it('開門影響實際四張分輪發牌，非莊家人類仍有正確手牌與名稱',()=>{
    const base={seed:42,ruleMode:'no-flowers' as const,gameId:'opening',viewer:'west' as const};
    const wall=buildWall(base.seed,base.ruleMode);
    const state=createGame({...base,wallStart:2});
    expect(state.players.map(p=>p.hand.length)).toEqual([17,16,16,16]);
    expect(state.players[0].hand.slice(0,4).map(t=>t.code)).toEqual(wall.slice(2,6));
    expect(state.players[1].hand.slice(0,4).map(t=>t.code)).toEqual(wall.slice(6,10));
    expect(state.players[0].hand[4].code).toBe(wall[18]);
    expect(state.players[0].hand.at(-1)!.code).toBe(wall[66]);
    expect(state.players[0].name).not.toContain('你');
    expect(state.players[2].name).toContain('你');
    expect(getPlayerView(state,'west').players.filter(p=>p.hand!==null).map(p=>p.id)).toEqual(['west']);
    expect(createGame({...base,wallStart:4}).players[0].hand).not.toEqual(state.players[0].hand);
  });
  it('所有開門位置全牌守恆，花牌補到 17/16，非法位置拒絕',()=>{
    for(const ruleMode of ['flowers','no-flowers'] as const) for(let seed=1;seed<=30;seed++) {
      const total=ruleMode==='flowers'?144:136;
      const state=createGame({seed,ruleMode,gameId:'g',wallStart:(seed*2)%total});
      const tiles=[...state.wall,...state.players.flatMap(p=>[...p.hand,...p.flowers])];
      expect(tiles).toHaveLength(total);expect(new Set(tiles.map(t=>t.id)).size).toBe(total);
      expect(state.players.map(p=>p.hand.length)).toEqual([17,16,16,16]);
    }
    for(const wallStart of [-2,1,136,NaN]) expect(()=>createGame({seed:1,ruleMode:'no-flowers',gameId:'g',wallStart})).toThrow();
  });
});
