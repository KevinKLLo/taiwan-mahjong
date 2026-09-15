import { describe, expect, it } from "vitest";

import { buildWall, dealInitialHands, validateRound } from "../src/mahjong/rules";
import { FLOWER_TILE_CODES, NORMAL_TILE_CODES, isFlower } from "../src/mahjong/tiles";

describe("雙模式規則", () => {
  it("連續補到花牌仍從尾端補到普通牌", () => {
    const seed = Array.from({ length: 10000 }, (_, i) => i + 1).find((value) => {
      const wall = buildWall(value);
      return isFlower(wall[0]) && isFlower(wall[143]) && !isFlower(wall[142]);
    });
    expect(seed).toBeDefined();
    const wall = buildWall(seed!);
    const round = dealInitialHands(seed!);
    expect(round.players[0].flowers).toEqual(expect.arrayContaining([wall[0], wall[143]]));
    expect(round.players[0].tiles).toContain(wall[142]);
    expect(validateRound(round)).toEqual([]);
    expect(round.wallRemaining + 65 + round.players.flatMap((p) => p.flowers).length).toBe(144);
  });
  it("無花牌牌組只有 136 張普通牌", () => {
    const wall = buildWall(42, "no-flowers");
    expect(wall).toHaveLength(136);
    expect(wall.some(isFlower)).toBe(false);
    for (const code of NORMAL_TILE_CODES) {
      expect(wall.filter((tile) => tile === code)).toHaveLength(4);
    }
  });
  it("無花牌發牌完成且不從尾端補牌", () => {
    const round = dealInitialHands(42, "no-flowers");
    expect(round.ruleMode).toBe("no-flowers");
    expect(round.players.map((p) => p.tiles.length)).toEqual([17, 16, 16, 16]);
    expect(round.players.flatMap((p) => p.flowers)).toEqual([]);
    expect(round.players.flatMap((p) => p.tiles).some(isFlower)).toBe(false);
    expect(round.wallRemaining).toBe(71);
    expect(validateRound(round)).toEqual([]);
  });
  it.each(["flowers", "no-flowers"] as const)("%s 相同 seed 可重現", (mode) => {
    expect(dealInitialHands(1234, mode)).toEqual(dealInitialHands(1234, mode));
  });
});

describe("台灣麻將花牌規則 baseline", () => {
  it.each([1, 42, 1234, 20260915])("保留 seed %i 的完整花牌 baseline", (seed) => {
    expect(dealInitialHands(seed)).toMatchSnapshot();
  });
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
