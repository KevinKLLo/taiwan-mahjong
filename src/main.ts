import './styles.css';
import { createGame, getPlayerView, getLegalActions, applyAction } from './mahjong/game';
import { chooseAction } from './ai/strategy';
import { mountGame } from './ui/game';
import { createMatchSession } from './match-session';
import { mountOpening } from './ui/opening';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('頁面缺少遊戲容器。');
const openingRoot=document.createElement('div');
const gameRoot=document.createElement('div');
root.append(openingRoot,gameRoot);
let opening:ReturnType<typeof mountOpening>|undefined;
const ui = mountGame(gameRoot, {
  onAction: envelope => session.dispatch(envelope),
  onNewGame: config => session.newMatch(config),
  onNextRound: gameId => session.nextRound(gameId),
});
const session = createMatchSession(
  { createGame, getPlayerView, getLegalActions, applyAction },
  chooseAction,
  view => {
    opening?.destroy();opening=undefined;openingRoot.hidden=true;gameRoot.hidden=false;ui.render(view);
  },
  message => ui.showError(message),
  request => {
    gameRoot.hidden=true;openingRoot.hidden=false;opening?.destroy();
    opening=mountOpening(openingRoot,request.config,request.accept,request.seating,request.title);
  },
);
session.newMatch({seed:20260915,ruleMode:'flowers'});
function dispose() { session.destroy(); opening?.destroy(); ui.destroy(); }
window.addEventListener('pagehide', dispose, {once:true});
if (import.meta.hot) import.meta.hot.dispose(dispose);
