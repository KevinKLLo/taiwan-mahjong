import type { GameAction, PlayerView } from '../contracts/game';

/** Small deterministic policy: win when possible, otherwise shed the least connected tile. */
export function chooseAction(view:PlayerView,legalActions:GameAction[]):GameAction {
  const win=legalActions.find(a=>a.type==='win');
  if(win) return win;
  const hand=view.players.find(p=>p.id===view.viewer)?.hand??[];
  const value=(tileId:string):number => {
    const tile=hand.find(t=>t.id===tileId);
    if(!tile) return Infinity;
    let score=0;
    for(const other of hand) {
      if(other.id===tile.id) continue;
      if(other.code===tile.code) score+=4;
      else if(/^[BCD][1-9]$/.test(tile.code) && tile.code[0]===other.code[0]) {
        const distance=Math.abs(Number(tile.code[1])-Number(other.code[1]));
        if(distance===1) score+=2;
        if(distance===2) score+=1;
      }
    }
    return score;
  };
  const discards=legalActions.filter((a):a is Extract<GameAction,{type:'discard'}>=>a.type==='discard');
  discards.sort((a,b)=>value(a.tileId)-value(b.tileId) || (a.tileId<b.tileId?-1:a.tileId>b.tileId?1:0));
  const action=discards[0]??legalActions[0];
  if(!action) throw new Error('AI 沒有合法動作');
  return action;
}
