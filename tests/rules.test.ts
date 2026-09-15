import { describe, expect, it } from "vitest";

import { buildWall, dealInitialHands, validateRound } from "../src/mahjong/rules";
import { FLOWER_TILE_CODES, NORMAL_TILE_CODES, isFlower } from "../src/mahjong/tiles";

describe("台灣麻將花牌規則 baseline", () => {
  it("建立 144 張牌牆", () => {
    const wall = buildWall(42);

    expect(wall).toHaveLength(144);
    expect(wall.filter(isFlower)).toHaveLength(8);
    for (const code of NORMAL_TILE_CODES) {
      expect(wall.filter((tile) => tile === code)).toHaveLength(4);
    }
    for (const code of FLOWER_TILE_CODES) {
      expect(wall.filter((tile) => tile === code)).toHaveLength(1);
    }
  });

  it("東家 17 張，其餘三家 16 張", () => {
    const round = dealInitialHands(20260915);

    expect(round.players.map((player) => player.tiles.length)).toEqual([17, 16, 16, 16]);
  });

  it("花牌移到花牌區，手牌只留下普通牌", () => {
    const round = dealInitialHands(1);

    expect(round.players.flatMap((player) => player.flowers).length).toBeGreaterThan(0);
    expect(round.players.flatMap((player) => player.tiles).some(isFlower)).toBe(false);
    expect(validateRound(round)).toEqual([]);
  });

  it("相同 seed 可以重現相同牌局", () => {
    expect(dealInitialHands(1234)).toEqual(dealInitialHands(1234));
  });
});
