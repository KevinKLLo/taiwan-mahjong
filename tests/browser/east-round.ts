// Development-only terminal fixtures; never imported by the production entry.
import '../../src/styles.css';
import {mountGame} from '../../src/ui/game';
import {mountOpening} from '../../src/ui/opening';
import {createMatchSession} from '../../src/match-session';
import {createGame,getPlayerView,getLegalActions,applyAction} from '../../src/mahjong/game';
import {chooseAction} from '../../src/ai/strategy';
import type {GameOutcome} from '../../src/contracts/game';

const controls=document.querySelector<HTMLElement>('#controls')!,root=document.querySelector<HTMLElement>('#app')!;
controls.innerHTML='<p>開發驗收 fixture：下一手結束原因可指定；非正式遊戲。</p><label>下一手結果 <select id="outcome"><option value="dealer">莊家胡牌</option><option value="draw">流局</option><option value="guest">閒家西家胡牌</option></select></label><button id="restart">重設驗收圈</button>';
let opening:ReturnType<typeof mountOpening>|undefined;
const openingRoot=document.createElement('div'),gameRoot=document.createElement('div');root.append(openingRoot,gameRoot);
const ui=mountGame(gameRoot,{onAction:e=>controller.dispatch(e),onNewGame:c=>controller.newMatch(c),onNextRound:id=>controller.nextRound(id)});
const controller=createMatchSession({createGame(config){
  const state=createGame(config),mode=(document.querySelector('#outcome') as HTMLSelectElement).value;
  const outcome:GameOutcome=mode==='draw'?{kind:'draw',reason:'驗收 fixture：流局'}:{kind:'self-draw',winner:mode==='dealer'?'east':'west',reason:'驗收 fixture：指定胡牌結果'};
  return {...state,phase:'finished' as const,outcome};
},getPlayerView,getLegalActions,applyAction},chooseAction,view=>{
  opening?.destroy();opening=undefined;openingRoot.hidden=true;gameRoot.hidden=false;ui.render(view);
},message=>ui.showError(message),request=>{
  opening?.destroy();openingRoot.hidden=false;gameRoot.hidden=true;
  opening=mountOpening(openingRoot,request.config,request.accept,request.seating,request.title);
});
const reset=()=>controller.newMatch({seed:615,ruleMode:'no-flowers'});
document.querySelector('#restart')!.addEventListener('click',reset);reset();
window.addEventListener('pagehide',()=>{controller.destroy();opening?.destroy();ui.destroy();},{once:true});
