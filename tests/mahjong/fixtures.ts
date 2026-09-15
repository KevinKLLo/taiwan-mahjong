import { createGame, type GameState } from '../../src/mahjong/game';
import type { GameConfig, PlayerId, Tile } from '../../src/contracts/game';
import type { TileCode } from '../../src/mahjong/tiles';
import { isFlower } from '../../src/mahjong/tiles';

/** Test-only forced initial hands; uses real unique tiles and preserves the complete deck. */
export function gameWithHands(hands: Partial<Record<PlayerId, TileCode[]>>, config: GameConfig = {seed:42,ruleMode:'no-flowers',gameId:'fixture'}):GameState {
  const state=createGame(config);
  const pool:Tile[]=[...state.wall,...state.players.flatMap(p=>[...p.hand,...p.flowers])];
  for(const player of state.players) { player.hand=[]; player.flowers=[]; }
  // Reserve every requested hand before filling unspecified seats.
  for(const player of state.players) {
    for(const code of hands[player.id]??[]) {
      if(isFlower(code)) throw new Error('Fixture hand cannot contain a flower');
      const index=pool.findIndex(tile=>tile.code===code);
      if(index<0) throw new Error(`Fixture exceeds available copies of ${code}`);
      player.hand.push(pool.splice(index,1)[0]);
    }
  }
  for(const player of state.players) {
    const target=player.id==='east'?17:16;
    if(player.hand.length>target) throw new Error('Fixture hand exceeds initial hand count');
    while(player.hand.length<target) {
      const index=pool.findIndex(tile=>!isFlower(tile.code));
      if(index<0) throw new Error('Fixture ran out of normal tiles');
      player.hand.push(pool.splice(index,1)[0]);
    }
  }
  state.wall=pool;
  return state;
}
