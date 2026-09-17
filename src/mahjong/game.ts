import { PLAYER_IDS, type ActionEnvelope, type GameAction, type GameConfig, type GameOutcome, type Meld, type Phase, type PlayerId, type PlayerView, type Tile } from '../contracts/game';
import { buildWall } from './rules';
import { isFlower } from './tiles';
import { isWinningHand } from './win';

export interface GamePlayer {
  id: PlayerId; name: string; hand: Tile[]; flowers: Tile[]; discards: Tile[]; melds: Meld[];
}
/** Private engine state. UI and AI receive only getPlayerView(). */
export interface GameState extends GameConfig {
  revision: number; phase: Phase; currentPlayer: PlayerId; players: GamePlayer[]; wall: Tile[];
  responders: PlayerId[];
  claimQueue: GameAction[][];
  pendingKan: { playerId: PlayerId; tile: Tile; meldIndex: number } | null;
  canSelfKan: boolean;
  lastDiscard: { playerId: PlayerId; tile: Tile } | null;
  drawnTileId: string | null; outcome: GameOutcome | null;
}
const names: Record<PlayerId,string>={east:'東家',south:'南家',west:'西家',north:'北家'};
const playerFor=(s:GameState,id:PlayerId)=>s.players.find(p=>p.id===id)!;
const nextPlayer=(id:PlayerId)=>PLAYER_IDS[(PLAYER_IDS.indexOf(id)+1)%4];
const others=(id:PlayerId)=>[1,2,3].map(n=>PLAYER_IDS[(PLAYER_IDS.indexOf(id)+n)%4]);
const wins=(p:GamePlayer,extra?:Tile)=>isWinningHand([...p.hand,...(extra?[extra]:[])].map(t=>t.code),p.melds.length);

function draw(s:GameState,p:GamePlayer,tail=false):Tile|undefined {
  let tile=tail?s.wall.pop():s.wall.shift();
  while(tile && isFlower(tile.code)) { p.flowers.push(tile); tile=s.wall.pop(); }
  if(tile) p.hand.push(tile);
  return tile;
}
function drawTurn(s:GameState,tail=false):void {
  const tile=draw(s,playerFor(s,s.currentPlayer),tail);
  s.drawnTileId=tile?.id??null; s.canSelfKan=true;
  if(tile) s.phase='awaiting-discard';
  else { s.phase='finished'; s.outcome={kind:'draw',reason:'牌牆已空，無牌可摸或補花，本局流局。'}; }
}
export function createGame(config:GameConfig):GameState {
  if(!Number.isInteger(config.seed)||config.seed<0||config.seed>0xffffffff) throw Error('seed 必須為 0 至 4294967295 的整數');
  if(config.ruleMode!=='flowers'&&config.ruleMode!=='no-flowers') throw Error('不支援的規則模式');
  if(!config.gameId) throw Error('缺少 gameId');
  if(config.viewer!==undefined&&!PLAYER_IDS.includes(config.viewer)) throw Error('玩家門風無效');
  const wallSize=config.ruleMode==='flowers'?144:136;
  if(config.wallStart!==undefined&&(!Number.isInteger(config.wallStart)||config.wallStart<0||config.wallStart>=wallSize||config.wallStart%2!==0)) throw Error('開門位置無效');
  const s:GameState={...config,revision:0,phase:'awaiting-discard',currentPlayer:'east',
    players:PLAYER_IDS.map(id=>({id,name:`${names[id]}${id===(config.viewer??'east')?'（你）':' AI'}`,hand:[],flowers:[],discards:[],melds:[]})),
    wall:buildWall(config.seed,config.ruleMode).map((code,i)=>({code,id:`${config.gameId}:tile:${i}`})),
    responders:[],claimQueue:[],pendingKan:null,canSelfKan:true,lastDiscard:null,drawnTileId:null,outcome:null};
  if(config.wallStart!==undefined) {
    s.wall=[...s.wall.slice(config.wallStart),...s.wall.slice(0,config.wallStart)];
    for(let round=0;round<4;round++) for(const p of s.players) for(let tile=0;tile<4;tile++) draw(s,p);
    draw(s,s.players[0]);
  } else for(const p of s.players) for(let i=0;i<(p.id==='east'?17:16);i++) draw(s,p);
  return s;
}

function claims(s:GameState,from:PlayerId,tile:Tile):GameAction[][] {
  const queue:GameAction[][]=[];
  for(const id of others(from)) {
    const matching=playerFor(s,id).hand.filter(t=>t.code===tile.code);
    const actions:GameAction[]=[];
    if(matching.length>=2) actions.push({type:'pon',playerId:id});
    if(matching.length===3 && nextPlayer(from)!==id) actions.push({type:'open-kan',playerId:id});
    if(actions.length) queue.push(actions);
  }
  if(/^[BCD][1-9]$/.test(tile.code)) {
    const id=nextPlayer(from), hand=playerFor(s,id).hand, rank=Number(tile.code[1]);
    const actions:GameAction[]=[];
    for(let start=Math.max(1,rank-2);start<=Math.min(7,rank);start++) {
      const needed=[start,start+1,start+2].filter(n=>n!==rank).map(n=>hand.find(t=>t.code===`${tile.code[0]}${n}`));
      if(needed.every(Boolean)) actions.push({type:'chi',playerId:id,tileIds:needed.map(t=>t!.id)});
    }
    if(actions.length) queue.push(actions);
  }
  return queue;
}

export function getLegalActions(s:GameState,id:PlayerId):GameAction[] {
  if(s.phase==='finished' || !PLAYER_IDS.includes(id)) return [];
  if(s.phase==='awaiting-win-response') return s.responders[0]===id?[{type:'win',playerId:id},{type:'pass',playerId:id}]:[];
  if(s.phase==='awaiting-meld-response') return s.claimQueue[0]?.[0].playerId===id?[...structuredClone(s.claimQueue[0]),{type:'pass',playerId:id}]:[];
  if(s.currentPlayer!==id) return [];
  const p=playerFor(s,id);
  const actions:GameAction[]=p.hand.map(t=>({type:'discard',playerId:id,tileId:t.id}));
  if(s.canSelfKan && wins(p)) actions.unshift({type:'win',playerId:id});
  if(s.canSelfKan) {
    for(const code of new Set(p.hand.map(t=>t.code))) {
      const matching=p.hand.filter(t=>t.code===code);
      if(matching.length===4) actions.push({type:'closed-kan',playerId:id,tileId:matching[0].id});
    }
    for(const m of p.melds.filter(m=>m.type==='pon')) {
      const tile=p.hand.find(t=>t.code===m.tiles[0].code);
      if(tile) actions.push({type:'added-kan',playerId:id,tileId:tile.id});
    }
  }
  return actions;
}

function finishAddedKan(s:GameState):void {
  const pending=s.pendingKan!, p=playerFor(s,pending.playerId);
  const [tile]=p.hand.splice(p.hand.findIndex(t=>t.id===pending.tile.id),1);
  p.melds[pending.meldIndex].tiles.push(tile); p.melds[pending.meldIndex].type='added-kan';
  s.pendingKan=null; s.responders=[]; s.currentPlayer=p.id; s.lastDiscard=null;
  drawTurn(s,true);
}
function continueResponses(s:GameState):void {
  if(s.responders.length) s.phase='awaiting-win-response';
  else if(s.pendingKan) finishAddedKan(s);
  else if(s.claimQueue.length) s.phase='awaiting-meld-response';
  else { s.currentPlayer=nextPlayer(s.currentPlayer); drawTurn(s); }
}
/** Full payload comparison: forged meld tile IDs must never be accepted. */
export function sameAction(a:GameAction,b:GameAction):boolean {
  if(a.type!==b.type || a.playerId!==b.playerId) return false;
  if('tileId' in a) return 'tileId' in b && a.tileId===b.tileId;
  if(a.type==='chi') return b.type==='chi' && Array.isArray(b.tileIds) && a.tileIds.length===b.tileIds.length && [...a.tileIds].sort().every((id,i)=>id===[...b.tileIds].sort()[i]);
  return true;
}
export function applyAction(s:GameState,envelope:ActionEnvelope):{ok:true;state:GameState}|{ok:false;error:string;state:GameState} {
  if(envelope.gameId!==s.gameId) return {ok:false,error:'牌局已變更，請使用目前牌局。',state:s};
  if(envelope.revision!==s.revision) return {ok:false,error:'動作已過期，請依最新牌局操作。',state:s};
  const a=envelope.action;
  if(!getLegalActions(s,a.playerId).some(c=>sameAction(c,a))) return {ok:false,error:'目前無法執行此動作。',state:s};
  const n=structuredClone(s),p=playerFor(n,a.playerId); n.revision++;
  if(a.type==='win') {
    if(n.phase==='awaiting-win-response') {
      const source=n.pendingKan??n.lastDiscard!, from=playerFor(n,source.playerId);
      const zone=n.pendingKan?from.hand:from.discards;
      zone.splice(zone.findIndex(t=>t.id===source.tile.id),1); p.hand.push(source.tile);
      n.outcome={kind:'discard-win',winner:p.id,from:from.id,reason:`${p.name}${n.pendingKan?'搶槓胡牌':'胡牌'}，${from.name}放槍。`};
    } else n.outcome={kind:'self-draw',winner:p.id,reason:`${p.name}自摸胡牌。`};
    n.phase='finished'; n.responders=[]; n.claimQueue=[]; n.pendingKan=null; n.drawnTileId=null;
  } else if(a.type==='pass') {
    if(n.phase==='awaiting-win-response') n.responders.shift(); else n.claimQueue.shift();
    continueResponses(n);
  } else if(a.type==='discard') {
    const [tile]=p.hand.splice(p.hand.findIndex(t=>t.id===a.tileId),1); p.discards.push(tile);
    n.lastDiscard={playerId:p.id,tile}; n.drawnTileId=null; n.canSelfKan=false;
    n.responders=others(p.id).filter(id=>wins(playerFor(n,id),tile));
    n.claimQueue=claims(n,p.id,tile); continueResponses(n);
  } else if(a.type==='added-kan') {
    const tile=p.hand.find(t=>t.id===a.tileId)!;
    n.pendingKan={playerId:p.id,tile,meldIndex:p.melds.findIndex(m=>m.type==='pon'&&m.tiles[0].code===tile.code)};
    n.drawnTileId=null; n.lastDiscard=null;
    n.responders=others(p.id).filter(id=>wins(playerFor(n,id),tile));
    continueResponses(n);
  } else if(a.type==='closed-kan') {
    const code=p.hand.find(t=>t.id===a.tileId)!.code;
    const tiles=p.hand.filter(t=>t.code===code); p.hand=p.hand.filter(t=>t.code!==code);
    p.melds.push({type:'closed-kan',tiles}); n.lastDiscard=null; drawTurn(n,true);
  } else {
    const discard=n.lastDiscard!, from=playerFor(n,discard.playerId);
    const selected=a.type==='chi'?a.tileIds:p.hand.filter(t=>t.code===discard.tile.code).slice(0,a.type==='pon'?2:3).map(t=>t.id);
    const tiles=p.hand.filter(t=>selected.includes(t.id)); p.hand=p.hand.filter(t=>!selected.includes(t.id));
    from.discards.splice(from.discards.findIndex(t=>t.id===discard.tile.id),1); tiles.push(discard.tile);
    p.melds.push({type:a.type,tiles:tiles.sort((a,b)=>a.code.localeCompare(b.code)),from:from.id});
    n.currentPlayer=p.id; n.responders=[]; n.claimQueue=[]; n.lastDiscard=null; n.drawnTileId=null; n.canSelfKan=false;
    if(a.type==='open-kan') drawTurn(n,true); else n.phase='awaiting-discard';
  }
  return {ok:true,state:n};
}

export function getPlayerView(s:GameState,viewer:PlayerId):PlayerView {
  const actingPlayer=s.phase==='finished'?null:s.phase==='awaiting-win-response'?s.responders[0]:s.phase==='awaiting-meld-response'?s.claimQueue[0][0].playerId:s.currentPlayer;
  return structuredClone({gameId:s.gameId,revision:s.revision,seed:s.seed,ruleMode:s.ruleMode,viewer,openingSummary:s.openingSummary,
    phase:s.phase,currentPlayer:s.currentPlayer,actingPlayer,
    players:s.players.map(p=>({...p,hand:p.id===viewer||s.phase==='finished'?p.hand:null,handCount:p.hand.length,
      melds:p.melds.map(m=>({...m,tiles:m.type==='closed-kan'&&p.id!==viewer&&s.phase!=='finished'?null:m.tiles}))})),
    wallRemaining:s.wall.length,lastDiscard:s.lastDiscard,
    pendingKan:s.pendingKan?{playerId:s.pendingKan.playerId,tile:s.pendingKan.tile}:null,
    drawnTileId:viewer===s.currentPlayer?s.drawnTileId:null,legalActions:getLegalActions(s,viewer),outcome:s.outcome,
    message:s.outcome?.reason??(s.phase==='awaiting-win-response'?`等待${names[actingPlayer!]}選擇${s.pendingKan?'搶槓胡':'胡牌'}或過。`:s.phase==='awaiting-meld-response'?`等待${names[actingPlayer!]}選擇吃、碰、槓或過。`:`輪到${names[s.currentPlayer]}出牌。`)});
}
