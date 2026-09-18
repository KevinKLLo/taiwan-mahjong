import { PLAYER_IDS, type GameConfig, type GameOutcome, type PlayerId } from '../contracts/game';
import type { MatchView, Seating } from '../contracts/match';
import { validateSeating } from './opening';

export interface MatchState extends MatchView, Seating { ruleMode: GameConfig['ruleMode'] }
export function createMatch(config:Pick<GameConfig,'seed'|'ruleMode'>,seating:Seating):MatchState {
  validateSeating(seating);
  if(!Number.isInteger(config.seed)||config.seed<1||config.seed>0xffffffff) throw Error('Seed 無效');
  if(config.ruleMode!=='flowers'&&config.ruleMode!=='no-flowers') throw Error('規則模式無效');
  return {baseSeed:config.seed,ruleMode:config.ruleMode,seats:[...seating.seats],dealer:seating.dealer,
    dealerChanges:0,continuations:0,roundNumber:1,status:'playing',next:null,history:[]};
}
function identity(m:MatchState,wind:PlayerId):number {
  return m.seats.indexOf(PLAYER_IDS[(PLAYER_IDS.indexOf(m.seats[m.dealer])+PLAYER_IDS.indexOf(wind))%4]);
}
export function finishRound(m:MatchState,gameId:string,outcome:GameOutcome):MatchState {
  if(m.history.some(h=>h.gameId===gameId)) return m;
  if(m.status!=='playing') throw Error('本局已結束');
  if(!gameId||!['draw','self-draw','discard-win'].includes(outcome.kind)) throw Error('結果無效');
  if(outcome.kind!=='draw'&&(!outcome.winner||!PLAYER_IDS.includes(outcome.winner))) throw Error('缺少胡牌者');
  if(outcome.kind==='discard-win'&&(!outcome.from||!PLAYER_IDS.includes(outcome.from)||outcome.from===outcome.winner)) throw Error('放槍來源無效');
  const stays=outcome.kind==='draw'||outcome.winner==='east';
  const complete=!stays&&m.dealerChanges===3;
  return {...m,status:complete?'complete':'between-rounds',
    next:complete?null:{dealer:stays?m.dealer:identity(m,'south'),dealerChanges:m.dealerChanges+(stays?0:1),continuations:stays?m.continuations+1:0},
    history:[...m.history,{gameId,roundNumber:m.roundNumber,dealer:m.dealer,dealerChanges:m.dealerChanges,continuations:m.continuations,
      kind:outcome.kind,...(outcome.kind!=='draw'?{winner:identity(m,outcome.winner!)}:{}),
      ...(outcome.kind==='discard-win'?{from:identity(m,outcome.from!)}:{})}]};
}
export function advanceRound(m:MatchState):MatchState {
  if(m.status!=='between-rounds'||!m.next) throw Error('目前不可開始下一局');
  return {...m,...m.next,roundNumber:m.roundNumber+1,status:'playing',next:null};
}
export function roundConfig(m:MatchState):Pick<GameConfig,'seed'|'ruleMode'> {
  return {seed:((m.baseSeed-1+(m.roundNumber-1)*104729)%0xffffffff)+1,ruleMode:m.ruleMode};
}
export function matchView(m:MatchState):MatchView {
  const {seats:_,ruleMode:__,...view}=m;
  return structuredClone(view);
}
