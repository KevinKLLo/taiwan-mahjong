import './styles.css';
import { createGame, getPlayerView, getLegalActions, applyAction } from './mahjong/game';
import { chooseAction } from './ai/strategy';
import { mountGame } from './ui/game';
import { createSession } from './session';
import { mountOpening } from './ui/opening';
import type { GameConfig } from './contracts/game';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('頁面缺少遊戲容器。');
const openingRoot=document.createElement('div');
const gameRoot=document.createElement('div');
root.append(openingRoot,gameRoot);
let opening:ReturnType<typeof mountOpening>|undefined;
const ui = mountGame(gameRoot, {
  onAction: envelope => session.dispatch(envelope),
  onNewGame: config => beginOpening(config),
});
const session = createSession(
  { createGame, getPlayerView, getLegalActions, applyAction },
  chooseAction,
  view => ui.render(view),
  message => ui.showError(message),
);
function beginOpening(config:Pick<GameConfig,'seed'|'ruleMode'>) {
  session.pause();gameRoot.hidden=true;openingRoot.hidden=false;opening?.destroy();
  opening=mountOpening(openingRoot,config,ready=>{
    opening?.destroy();opening=undefined;openingRoot.hidden=true;gameRoot.hidden=false;
    session.newGame(ready);
  });
}
beginOpening({seed:20260915,ruleMode:'flowers'});
function dispose() { session.destroy(); opening?.destroy(); ui.destroy(); }
window.addEventListener('pagehide', dispose, {once:true});
if (import.meta.hot) import.meta.hot.dispose(dispose);
