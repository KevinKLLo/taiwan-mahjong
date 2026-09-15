import './styles.css';
import { createGame, getPlayerView, getLegalActions, applyAction } from './mahjong/game';
import { chooseAction } from './ai/strategy';
import { mountGame } from './ui/game';
import { createSession } from './session';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('頁面缺少遊戲容器。');
const ui = mountGame(root, {
  onAction: envelope => session.dispatch(envelope),
  onNewGame: config => session.newGame(config),
});
const session = createSession(
  { createGame, getPlayerView, getLegalActions, applyAction },
  chooseAction,
  view => ui.render(view),
  message => ui.showError(message),
);
session.newGame({seed:20260915,ruleMode:'flowers'});
function dispose() { session.destroy(); ui.destroy(); }
window.addEventListener('pagehide', dispose, {once:true});
if (import.meta.hot) import.meta.hot.dispose(dispose);
