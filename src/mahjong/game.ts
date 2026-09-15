import { PLAYER_IDS, type ActionEnvelope, type GameAction, type GameConfig, type GameOutcome, type Phase, type PlayerId, type PlayerView, type Tile } from '../contracts/game';
import { buildWall } from './rules';
import { isFlower } from './tiles';
import { isWinningHand } from './win';

export interface GamePlayer {
  id: PlayerId;
  name: string;
  hand: Tile[];
  flowers: Tile[];
  discards: Tile[];
}
/** Internal engine state. Pass getPlayerView() results, never this object, to UI or AI. */
export interface GameState extends GameConfig {
  revision: number;
  phase: Phase;
  currentPlayer: PlayerId;
  players: GamePlayer[];
  wall: Tile[];
  responders: PlayerId[];
  lastDiscard: {playerId: PlayerId; tile: Tile} | null;
  drawnTileId: string | null;
  outcome: GameOutcome | null;
}
const names: Record<PlayerId,string>={east:'東家（你）',south:'南家 AI',west:'西家 AI',north:'北家 AI'};
const playerFor=(state:GameState,id:PlayerId) => state.players.find(p=>p.id===id)!;
const nextPlayer=(id:PlayerId) => PLAYER_IDS[(PLAYER_IDS.indexOf(id)+1)%4];

function draw(state: GameState, player: GamePlayer): Tile | undefined {
  let tile=state.wall.shift();
  while(tile && isFlower(tile.code)) {
    player.flowers.push(tile);
    tile=state.wall.pop();
  }
  if(tile) player.hand.push(tile);
  return tile;
}

export function createGame(config: GameConfig): GameState {
  if (!Number.isInteger(config.seed) || config.seed<0 || config.seed>0xffffffff) throw new Error('seed 必須為 0 至 4294967295 的整數');
  if(config.ruleMode!=='flowers' && config.ruleMode!=='no-flowers') throw new Error('不支援的規則模式');
  if(!config.gameId) throw new Error('缺少 gameId');
  const state:GameState={
    ...config, revision:0, phase:'awaiting-discard',currentPlayer:'east',
    players:PLAYER_IDS.map(id=>({id,name:names[id],hand:[],flowers:[],discards:[]})),
    wall:buildWall(config.seed,config.ruleMode).map((code,i)=>({code,id:`${config.gameId}:tile:${i}`})),
    responders:[],lastDiscard:null,drawnTileId:null,outcome:null,
  };
  for(const player of state.players) {
    const count=player.id==='east'?17:16;
    for(let i=0;i<count;i++) draw(state,player);
  }
  return state;
}

export function getLegalActions(state:GameState,playerId:PlayerId):GameAction[] {
  if(state.phase==='finished') return [];
  if(state.phase==='awaiting-win-response') return state.responders[0]===playerId
    ? [{type:'win',playerId},{type:'pass',playerId}]:[];
  if(state.currentPlayer!==playerId) return [];
  const hand=playerFor(state,playerId).hand;
  const actions:GameAction[]=hand.map(tile=>({type:'discard',playerId,tileId:tile.id}));
  if(isWinningHand(hand.map(t=>t.code))) actions.unshift({type:'win',playerId});
  return actions;
}

function advance(state:GameState):void {
  state.currentPlayer=nextPlayer(state.currentPlayer);
  state.responders=[];
  const tile=draw(state,playerFor(state,state.currentPlayer));
  state.drawnTileId=tile?.id??null;
  if(!tile) {
    state.phase='finished';
    state.outcome={kind:'draw',reason:'牌牆已空，無牌可摸或補花，本局流局。'};
  } else state.phase='awaiting-discard';
}

export function applyAction(state:GameState,envelope:ActionEnvelope):{ok:true;state:GameState}|{ok:false;error:string;state:GameState} {
  if(envelope.gameId!==state.gameId) return {ok:false,error:'牌局已變更，請使用目前牌局。',state};
  if(envelope.revision!==state.revision) return {ok:false,error:'動作已過期，請依最新牌局操作。',state};
  const action=envelope.action;
  const legal=getLegalActions(state,action.playerId).some(candidate=>candidate.type===action.type &&
    (candidate.type!=='discard' || (action.type==='discard' && candidate.tileId===action.tileId)));
  if(!legal) return {ok:false,error:'目前無法執行此動作。',state};
  const next=structuredClone(state);
  next.revision++;
  const player=playerFor(next,action.playerId);
  if(action.type==='win') {
    if(next.phase==='awaiting-win-response') {
      const discard=next.lastDiscard!;
      const from=playerFor(next,discard.playerId);
      // Move the claimed tile; lastDiscard is metadata, never a second owning zone.
      from.discards.splice(from.discards.findIndex(t=>t.id===discard.tile.id),1);
      player.hand.push(discard.tile);
      next.outcome={kind:'discard-win',winner:player.id,from:from.id,reason:`${player.name}胡牌，${from.name}放槍。`};
    } else next.outcome={kind:'self-draw',winner:player.id,reason:`${player.name}自摸胡牌。`};
    next.phase='finished'; next.responders=[]; next.drawnTileId=null;
  } else if(action.type==='pass') {
    next.responders.shift();
    if(!next.responders.length) advance(next);
  } else {
    const index=player.hand.findIndex(t=>t.id===action.tileId);
    const [tile]=player.hand.splice(index,1);
    player.discards.push(tile);
    next.lastDiscard={playerId:player.id,tile};
    next.drawnTileId=null;
    let responder=nextPlayer(player.id);
    while(responder!==player.id) {
      if(isWinningHand([...playerFor(next,responder).hand.map(t=>t.code),tile.code])) next.responders.push(responder);
      responder=nextPlayer(responder);
    }
    if(next.responders.length) next.phase='awaiting-win-response';
    else advance(next);
  }
  return {ok:true,state:next};
}

export function getPlayerView(state:GameState,viewer:PlayerId):PlayerView {
  const actingPlayer=state.phase==='finished'?null:state.phase==='awaiting-win-response'?state.responders[0]:state.currentPlayer;
  return structuredClone({
    gameId:state.gameId,revision:state.revision,seed:state.seed,ruleMode:state.ruleMode,viewer,
    phase:state.phase,currentPlayer:state.currentPlayer,actingPlayer,
    players:state.players.map(player=>({...player,hand:player.id===viewer || state.phase==='finished'?player.hand:null,handCount:player.hand.length})),
    wallRemaining:state.wall.length,lastDiscard:state.lastDiscard,
    drawnTileId:viewer===state.currentPlayer?state.drawnTileId:null,
    legalActions:getLegalActions(state,viewer),outcome:state.outcome,
    message:state.outcome?.reason ?? (state.phase==='awaiting-win-response'?`等待${names[actingPlayer!]}選擇胡牌或過。`:`輪到${names[state.currentPlayer]}出牌。`),
  });
}
