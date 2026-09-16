// Development-only fixture page; not imported by the production entry or bundled desktop app.
import '../../src/styles.css';
import { mountGame } from '../../src/ui/game';
import { applyAction, getLegalActions, getPlayerView, type GameState } from '../../src/mahjong/game';
import { gameWithHands } from '../mahjong/fixtures';
import type { GameAction, PlayerId } from '../../src/contracts/game';

let state:GameState;
const root=document.querySelector<HTMLElement>('#app')!;
const ui=mountGame(root,{onAction(envelope){
  const result=applyAction(state,envelope);
  if(result.ok) {state=result.state;ui.render(getPlayerView(state,'east'));}
  else ui.showError(result.error);
},onNewGame(){load('吃牌組合');}});
function act(action:GameAction) {
  const result=applyAction(state,{gameId:state.gameId,revision:state.revision,action});
  if(!result.ok) throw Error(result.error);
  state=result.state;
}
function response(from:PlayerId,code:string) {
  const source=state.players.find(p=>p.id===from)!;
  source.hand.push(state.players[0].hand.pop()!);
  state.currentPlayer=from;
  act({type:'discard',playerId:from,tileId:source.hand.find(t=>t.code===code)!.id});
  for(let i=0;i<12;i++) {
    const actor=getPlayerView(state,'east').actingPlayer!;
    if(actor==='east'&&state.phase==='awaiting-meld-response') return;
    const pass=getLegalActions(state,actor).find(a=>a.type==='pass');
    if(!pass) return;
    act(pass);
  }
}
function load(name:string) {
  if(name==='吃牌組合') {
    state=gameWithHands({east:['C1','C2','C4','C5'],north:['C3']});response('north','C3');
  } else if(name==='明槓') {
    state=gameWithHands({east:['DR','DR','DR'],south:['DR']});response('south','DR');
  } else {
    state=gameWithHands({east:['C3','C3','C3','C3']});
    if(name==='加槓') {
      const p=state.players[0],tiles=p.hand.filter(t=>t.code==='C3').slice(0,3);
      p.hand=p.hand.filter(t=>!tiles.includes(t));p.melds=[{type:'pon',from:'west',tiles}];
    }
  }
  ui.render(getPlayerView(state,'east'));
}
for(const name of ['吃牌組合','明槓','暗槓','加槓']) {
  const button=document.createElement('button');button.textContent=name;
  button.addEventListener('click',()=>load(name));document.querySelector('#fixtures')!.append(button);
}
load('吃牌組合');
