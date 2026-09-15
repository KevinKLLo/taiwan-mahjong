import { createSeededRandom, shuffle } from "./random";
import {
  FLOWER_TILE_CODES,
  NORMAL_TILE_CODES,
  type FlowerTileCode,
  type NormalTileCode,
  type TileCode,
  isFlower,
  sortTiles,
} from "./tiles";

export type RuleMode = "flowers" | "no-flowers";
export type Seat = "east" | "south" | "west" | "north";

export interface PlayerHand {
  seat: Seat;
  label: string;
  tiles: NormalTileCode[];
  flowers: FlowerTileCode[];
}

export interface RoundState {
  ruleMode: RuleMode;
  seed: number;
  players: PlayerHand[];
  wallRemaining: number;
  notes: string[];
}

const SEATS: readonly Seat[] = ["east", "south", "west", "north"];
const SEAT_LABELS: Record<Seat, string> = {
  east: "東家",
  south: "南家",
  west: "西家",
  north: "北家",
};

export function buildWall(seed: number, mode: RuleMode = "flowers"): TileCode[] {
  const wall: TileCode[] = [];

  for (const code of NORMAL_TILE_CODES) {
    wall.push(code, code, code, code);
  }
  if (mode === "flowers") wall.push(...FLOWER_TILE_CODES);

  return shuffle(wall, createSeededRandom(seed));
}

function drawPlayableTile(
  wall: TileCode[],
): { tile: NormalTileCode; flowers: FlowerTileCode[] } {
  const flowers: FlowerTileCode[] = [];

  while (wall.length > 0) {
    const tile = wall.shift();
    if (!tile) {
      break;
    }
    if (!isFlower(tile)) {
      return { tile, flowers };
    }

    flowers.push(tile);
    while (wall.length > 0) {
      const replacement = wall.pop();
      if (!replacement) {
        break;
      }
      if (isFlower(replacement)) {
        flowers.push(replacement);
      } else {
        return { tile: replacement, flowers };
      }
    }
  }

  throw new Error("牌牆已空，無法完成補花");
}

export function dealInitialHands(seed: number, mode: RuleMode = "flowers"): RoundState {
  const wall = buildWall(seed, mode);
  const players: PlayerHand[] = [];

  for (const seat of SEATS) {
    const targetCount = seat === "east" ? 17 : 16;
    const tiles: NormalTileCode[] = [];
    const flowers: FlowerTileCode[] = [];

    while (tiles.length < targetCount) {
      const draw = mode === "flowers"
        ? drawPlayableTile(wall)
        : { tile: wall.shift() as NormalTileCode, flowers: [] };
      tiles.push(draw.tile);
      flowers.push(...draw.flowers);
    }

    players.push({
      seat,
      label: SEAT_LABELS[seat],
      tiles: sortTiles(tiles),
      flowers: sortTiles(flowers),
    });
  }

  return {
    ruleMode: mode,
    seed,
    players,
    wallRemaining: wall.length,
    notes: [
      mode === "flowers"
        ? "花牌會移出手牌，並由牌牆尾端補進一張非花牌。"
        : "無花牌模式使用 136 張普通牌，不使用花牌，也不執行補花。",
      "東家起手 17 張，其餘三家各 16 張。",
    ],
  };
}

export function validateRound(round: RoundState): string[] {
  const problems: string[] = [];

  for (const player of round.players) {
    const expected = player.seat === "east" ? 17 : 16;
    if (player.tiles.length !== expected) {
      problems.push(`${player.label}應有 ${expected} 張手牌`);
    }
    if (player.tiles.some(isFlower)) {
      problems.push(`${player.label}手牌中仍有花牌`);
    }
  }

  return problems;
}
