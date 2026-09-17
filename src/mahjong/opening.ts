import { PLAYER_IDS, type GameConfig, type PlayerId } from '../contracts/game';
import type { RuleMode } from './rules';
import { createSeededRandom, shuffle } from './random';

export type OpeningStage = 'seat-roll' | 'wind-draw' | 'dealer-roll' | 'wall-roll' | 'ready';
export interface DiceRoll { stage: OpeningStage; roller: number; dice: number[]; total: number }
export interface WallOpening {
  wallSeat: number; startSeat: number; stacksPerSide: number;
  skippedStacks: number; wallStart: number; crossed: boolean;
}
export interface OpeningView {
  stage: OpeningStage; seed: number; ruleMode: RuleMode;
  cards: { owner: number | null; wind: PlayerId | null }[];
  seats: (PlayerId | null)[]; firstDraw: number | null; dealer: number | null;
  rolls: DiceRoll[]; opening: WallOpening | null;
}
/** Indices increase counterclockwise. The roller is count one. */
export function countFrom(start: number, total: number): number {
  if(!Number.isInteger(start)||start<0||start>3||!Number.isInteger(total)||total<1||total>18) throw Error('數位參數無效');
  return (start+total-1)%4;
}
/** Wall storage traverses east → north → west → south, from each right edge. */
export function wallOpening(mode:RuleMode, dealerSeat:number, total:number):WallOpening {
  if(total<3 || (mode!=='flowers'&&mode!=='no-flowers')) throw Error('開門參數無效');
  const wallSeat=countFrom(dealerSeat,total), stacksPerSide=mode==='flowers'?18:17;
  const wallIndex=(4-wallSeat)%4;
  const stackStart=(wallIndex*stacksPerSide+total)%(stacksPerSide*4);
  return {wallSeat,stacksPerSide,startSeat:(4-Math.floor(stackStart/stacksPerSide))%4,
    skippedStacks:stackStart%stacksPerSide,wallStart:stackStart*2,crossed:total>=stacksPerSide};
}

export function createOpening(config:Pick<GameConfig,'seed'|'ruleMode'>) {
  if(!Number.isInteger(config.seed)||config.seed<1||config.seed>0xffffffff) throw Error('Seed 無效');
  if(config.ruleMode!=='flowers'&&config.ruleMode!=='no-flowers') throw Error('規則模式無效');
  const diceRandom=createSeededRandom(config.seed^0x643c79a1);
  const winds=shuffle(PLAYER_IDS,createSeededRandom(config.seed^0x51ed270b));
  const state:OpeningView={...config,stage:'seat-roll',cards:winds.map(()=>({owner:null,wind:null})),
    seats:[null,null,null,null],firstDraw:null,dealer:null,rolls:[],opening:null};
  let drawIndex=0;
  const drawFor=(identity:number,index:number)=>{
    state.cards[index]={owner:identity,wind:winds[index]};state.seats[identity]=winds[index];drawIndex++;
  };
  const autoDraw=()=>{
    while(drawIndex<4) {
      const identity=(state.firstDraw!+drawIndex)%4;
      if(identity===0) break;
      drawFor(identity,state.cards.findIndex(c=>c.owner===null));
    }
    if(drawIndex===4) state.stage='dealer-roll';
  };
  return {
    view:():OpeningView=>structuredClone(state),
    roll() {
      if(!['seat-roll','dealer-roll','wall-roll'].includes(state.stage)) throw Error('目前不可擲骰');
      const roller=state.stage==='seat-roll'?0:state.stage==='dealer-roll'?state.seats.indexOf('east'):state.dealer!;
      const dice=Array.from({length:3},()=>1+Math.floor(diceRandom()*6));
      const total=dice.reduce((a,b)=>a+b,0);
      state.rolls.push({stage:state.stage,roller,dice,total});
      if(state.stage==='seat-roll') {
        state.firstDraw=countFrom(0,total);state.stage='wind-draw';autoDraw();
      } else if(state.stage==='dealer-roll') {
        const dealerWind=PLAYER_IDS[countFrom(0,total)];
        state.dealer=state.seats.indexOf(dealerWind);state.stage='wall-roll';
      } else {
        state.opening=wallOpening(config.ruleMode,PLAYER_IDS.indexOf(state.seats[state.dealer!]!),total);
        state.stage='ready';
      }
    },
    drawWind(index:number) {
      if(state.stage!=='wind-draw'||!Number.isInteger(index)||!state.cards[index]||state.cards[index].owner!==null) throw Error('目前不可抽這張風牌');
      drawFor(0,index);autoDraw();
    },
    gameConfig():Omit<GameConfig,'gameId'> {
      if(state.stage!=='ready') throw Error('開門尚未完成');
      const dealerSeat=PLAYER_IDS.indexOf(state.seats[state.dealer!]!);
      const viewer=PLAYER_IDS[(PLAYER_IDS.indexOf(state.seats[0]!)-dealerSeat+4)%4];
      const windLabel=(index:number)=>['東','南','西','北'][index];
      const opening=state.opening!;
      return {...config,viewer,wallStart:opening.wallStart,
        openingSummary:`抓位${windLabel(PLAYER_IDS.indexOf(state.seats[0]!))} · 本局${windLabel(PLAYER_IDS.indexOf(viewer))}家 · 開門${state.rolls[2].total}點，${windLabel(opening.wallSeat)}牆起數${opening.crossed?'（跨邊）':''}`};
    },
  };
}
