import type { ActionEnvelope, GameAction, GameConfig, PlayerView } from './contracts/game';
import type { Seating } from './contracts/match';
import { advanceRound, createMatch, finishRound, matchView, roundConfig, type MatchState } from './mahjong/match';
import { createSession, type GameEngine } from './session';

export interface OpeningRequest {
  config: Pick<GameConfig,'seed'|'ruleMode'>;
  seating?: Seating;
  title: string;
  accept(config:Omit<GameConfig,'gameId'>,seating:Seating):void;
}
export function createMatchSession<State>(
  engine:GameEngine<State>,choose:(view:PlayerView,actions:GameAction[])=>GameAction,
  render:(view:PlayerView)=>void,showError:(message:string)=>void,
  showOpening:(request:OpeningRequest)=>void,delay=650,
) {
  let match:MatchState|undefined,latest:PlayerView|undefined;
  let generation=0,pending=false,destroyed=false;
  const session=createSession(engine,choose,view=>{
    if(!match||pending||destroyed) return;
    if(view.phase==='finished'&&view.outcome) match=finishRound(match,view.gameId,view.outcome);
    latest={...view,match:matchView(match)};render(latest);
  },showError,delay);
  function open(config:Pick<GameConfig,'seed'|'ruleMode'>,seating?:Seating) {
    session.pause();pending=true;const epoch=++generation;
    showOpening({config,seating:seating?structuredClone(seating):undefined,
      title:match?`東${['一','二','三','四'][match.dealerChanges]}局 · 連莊 ${match.continuations} · 第 ${match.roundNumber} 手`:'東風一圈 · 首局抓位',
      accept(ready,seats) {
        if(destroyed||!pending||epoch!==generation) return;
        if(seating&&(ready.seed!==config.seed||ready.ruleMode!==config.ruleMode||seats.dealer!==seating.dealer||seats.seats.some((wind,i)=>wind!==seating.seats[i]))) {
          showError('續局座位或規則不符，請重新開門。');return;
        }
        if(!match) match=createMatch(ready,seats);
        pending=false;session.newGame(ready);
      },
    });
  }
  return {
    newMatch(config:Pick<GameConfig,'seed'|'ruleMode'>) {
      if(destroyed) return;
      match=undefined;latest=undefined;open(config);
    },
    nextRound(gameId:string) {
      if(destroyed||pending||!match||match.status!=='between-rounds'||latest?.gameId!==gameId||latest.phase!=='finished') return;
      match=advanceRound(match);open(roundConfig(match),{seats:match.seats,dealer:match.dealer});
    },
    dispatch(envelope:ActionEnvelope) {if(!pending&&!destroyed) session.dispatch(envelope);},
    destroy() {destroyed=true;generation++;session.destroy();},
  };
}
