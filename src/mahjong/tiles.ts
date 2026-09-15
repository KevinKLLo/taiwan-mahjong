export const SUIT_TILE_CODES = [
  ...Array.from({ length: 9 }, (_, index) => `B${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `C${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `D${index + 1}`),
] as const;

export const HONOR_TILE_CODES = ["WE", "WS", "WW", "WN", "DR", "DG", "DW"] as const;
export const NORMAL_TILE_CODES = [...SUIT_TILE_CODES, ...HONOR_TILE_CODES] as const;
export const FLOWER_TILE_CODES = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"] as const;

export type NormalTileCode = (typeof NORMAL_TILE_CODES)[number];
export type FlowerTileCode = (typeof FLOWER_TILE_CODES)[number];
export type TileCode = NormalTileCode | FlowerTileCode;

const LABELS: Record<TileCode, string> = {
  B1: "一條",
  B2: "二條",
  B3: "三條",
  B4: "四條",
  B5: "五條",
  B6: "六條",
  B7: "七條",
  B8: "八條",
  B9: "九條",
  C1: "一萬",
  C2: "二萬",
  C3: "三萬",
  C4: "四萬",
  C5: "五萬",
  C6: "六萬",
  C7: "七萬",
  C8: "八萬",
  C9: "九萬",
  D1: "一筒",
  D2: "二筒",
  D3: "三筒",
  D4: "四筒",
  D5: "五筒",
  D6: "六筒",
  D7: "七筒",
  D8: "八筒",
  D9: "九筒",
  WE: "東",
  WS: "南",
  WW: "西",
  WN: "北",
  DR: "中",
  DG: "發",
  DW: "白",
  F1: "春",
  F2: "夏",
  F3: "秋",
  F4: "冬",
  F5: "梅",
  F6: "蘭",
  F7: "竹",
  F8: "菊",
};

const SORT_ORDER = new Map<TileCode, number>(
  [...NORMAL_TILE_CODES, ...FLOWER_TILE_CODES].map((code, index) => [code, index]),
);

export function tileLabel(code: TileCode): string {
  return LABELS[code];
}

export function isFlower(code: TileCode): code is FlowerTileCode {
  return (FLOWER_TILE_CODES as readonly string[]).includes(code);
}

export function sortTiles<T extends TileCode>(tiles: readonly T[]): T[] {
  return [...tiles].sort((left, right) => {
    return (SORT_ORDER.get(left) ?? 999) - (SORT_ORDER.get(right) ?? 999);
  });
}
