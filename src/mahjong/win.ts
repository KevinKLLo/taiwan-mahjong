import { NORMAL_TILE_CODES, type TileCode } from './tiles';

/** Each declared meld occupies one of the five meld slots, including a four-tile kan. */
export function isWinningHand(tiles: readonly TileCode[], declaredMelds = 0): boolean {
  if (!Number.isInteger(declaredMelds) || declaredMelds < 0 || declaredMelds > 5 || tiles.length !== 17 - 3 * declaredMelds) return false;
  const counts = Array<number>(34).fill(0);
  for (const tile of tiles) {
    const index = NORMAL_TILE_CODES.indexOf(tile);
    if (index < 0 || ++counts[index] > 4) return false;
  }
  const melds = (): boolean => {
    const index = counts.findIndex(count => count > 0);
    if (index < 0) return true;
    if (counts[index] >= 3) {
      counts[index] -= 3;
      const result = melds();
      counts[index] += 3;
      if (result) return true;
    }
    if (index < 27 && index % 9 <= 6 && counts[index+1] && counts[index+2]) {
      counts[index]--; counts[index+1]--; counts[index+2]--;
      const result = melds();
      counts[index]++; counts[index+1]++; counts[index+2]++;
      if (result) return true;
    }
    return false;
  };
  for (let i=0; i<counts.length; i++) {
    if (counts[i] < 2) continue;
    counts[i]-=2;
    const result=melds();
    counts[i]+=2;
    if (result) return true;
  }
  return false;
}
