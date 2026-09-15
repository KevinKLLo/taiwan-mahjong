import type { ActionEnvelope, GameAction, GameConfig, PlayerId, PlayerView } from './contracts/game';

export interface GameEngine<State> {
  createGame(config: GameConfig): State;
  getPlayerView(state: State, playerId: PlayerId): PlayerView;
  getLegalActions(state: State, playerId: PlayerId): GameAction[];
  applyAction(state: State, envelope: ActionEnvelope):
    {ok:true;state:State} | {ok:false;state:State;error:string};
}

export function createSession<State>(
  engine: GameEngine<State>,
  choose: (view:PlayerView, actions:GameAction[])=>GameAction,
  render: (view:PlayerView)=>void,
  showError: (message:string)=>void,
  delay = 650,
) {
  let state:State;
  let generation=0;
  let timer:ReturnType<typeof setTimeout> | undefined;
  let destroyed=false;
  const cancel=()=>{ if(timer!==undefined) clearTimeout(timer); timer=undefined; };
  const publish=()=>{
    cancel();
    const view=engine.getPlayerView(state,'east');
    render(view);
    if(view.actingPlayer && view.actingPlayer!=='east' && view.phase!=='finished') {
      const epoch=generation;
      const actor=view.actingPlayer;
      timer=setTimeout(()=>{
        timer=undefined;
        if(destroyed || epoch!==generation) return;
        const aiView=engine.getPlayerView(state,actor);
        const actions=engine.getLegalActions(state,actor);
        if(actions.length===0) { showError('電腦目前沒有合法動作，請重新開局。'); return; }
        const result=engine.applyAction(state,{gameId:aiView.gameId,revision:aiView.revision,action:choose(aiView,actions)});
        if(!result.ok) { showError(`電腦動作失敗：${result.error}`); return; }
        state=result.state;
        publish();
      },delay);
    }
  };
  return {
    newGame(config:Omit<GameConfig,'gameId'>) {
      if(destroyed) return;
      if(!Number.isSafeInteger(config.seed) || config.seed<1) {showError('Seed 必須是大於 0 的安全整數。');return;}
      cancel();
      generation++;
      state=engine.createGame({...config,gameId:`game-${generation}`});
      publish();
    },
    dispatch(envelope:ActionEnvelope) {
      if(destroyed) return;
      if(envelope.action.playerId!=='east') {showError('只能操作自己的手牌。');return;}
      const result=engine.applyAction(state,envelope);
      if(!result.ok) {showError(`無法執行此動作：${result.error}`);return;}
      state=result.state;
      publish();
    },
    destroy() {destroyed=true;generation++;cancel();},
  };
}
