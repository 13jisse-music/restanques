// ═══════════════════════════════════════════════════════════
// KENNEY SPRITE MAPPING — tilemap_packed.png (192x176, 16x16 tiles, 12 cols × 11 rows)
// town.png = terrain/buildings, dungeon.png = monsters/items/dungeon
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

const TILE_SIZE = 16; // source tile size in spritesheet
const COLS = 12;      // 192 / 16

// For background-position, with a display size of Dpx and sheet of 192px wide:
// We scale the sheet so each tile = display size
// backgroundSize = (12 * D)px × (11 * D)px
// backgroundPosition = -(col * D)px -(row * D)px

export function kenney(sheet: "town" | "dungeon", col: number, row: number, displaySize: number): {
  backgroundImage: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundRepeat: string;
  imageRendering: string;
} {
  return {
    backgroundImage: `url(/sprites/${sheet}.png)`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    backgroundSize: `${COLS * displaySize}px ${11 * displaySize}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  };
}

// ─── TILE MAP: game tile code → spritesheet position ───
// Based on visual inspection of Kenney tilemap_packed.png
// town.png layout (12×11):
//   Row 0: grass variants, dirt, path
//   Row 1: trees, bushes, flowers
//   Row 2: water, sand, rocks
//   Row 3: houses, roofs
//   Row 4-5: castle/stone walls
//   Row 6-7: more buildings
//   Row 8-10: details, fences, bridges

interface TileSprite {
  sheet: "town" | "dungeon";
  col: number;
  row: number;
}

export const TILE_SPRITES: Record<string, TileSprite> = {
  // Garrigue (grass, trees, flowers)
  g:    { sheet: "town", col: 0, row: 0 },   // grass light
  tg:   { sheet: "town", col: 1, row: 0 },   // grass dark
  p:    { sheet: "town", col: 4, row: 0 },   // dirt path
  fl:   { sheet: "town", col: 3, row: 1 },   // flower
  lv:   { sheet: "town", col: 4, row: 1 },   // purple flower (lavande)
  t:    { sheet: "town", col: 0, row: 1 },   // tree
  r:    { sheet: "town", col: 6, row: 2 },   // rock

  // Calanques (sand, water, cliffs)
  s:    { sheet: "town", col: 5, row: 0 },   // sand
  w:    { sheet: "town", col: 0, row: 2 },   // water light
  cl:   { sheet: "town", col: 7, row: 2 },   // cliff/rock wall
  dk:   { sheet: "town", col: 4, row: 0 },   // dock (dirt)

  // Mines (dungeon tiles)
  mf:   { sheet: "dungeon", col: 0, row: 0 }, // mine floor
  mw:   { sheet: "dungeon", col: 4, row: 0 }, // mine wall

  // Mer (deep water, coral)
  cf:   { sheet: "town", col: 1, row: 2 },   // shallow water
  dw:   { sheet: "town", col: 2, row: 2 },   // deep water

  // Restanques (stone)
  rs:   { sheet: "town", col: 6, row: 0 },   // stone floor
  rw:   { sheet: "town", col: 0, row: 4 },   // stone wall
  gt:   { sheet: "town", col: 4, row: 5 },   // gate/door

  // Village
  vi:   { sheet: "town", col: 0, row: 3 },   // house

  // Camp
  camp: { sheet: "town", col: 2, row: 0 },   // campfire (yellow grass)
};

// ─── MONSTERS from dungeon.png ───
// Row 7-8 have character sprites
export const MONSTER_SPRITES: Record<string, TileSprite> = {
  garrigue:   { sheet: "dungeon", col: 8, row: 7 },  // creature
  calanques:  { sheet: "dungeon", col: 9, row: 7 },  // creature
  mines:      { sheet: "dungeon", col: 10, row: 7 }, // creature
  mer:        { sheet: "dungeon", col: 11, row: 7 }, // creature
  restanques: { sheet: "dungeon", col: 8, row: 8 },  // boss
};

// ─── GEM COLORS for match-3 (use dungeon items row) ───
export const GEM_SPRITES: TileSprite[] = [
  { sheet: "dungeon", col: 8, row: 9 },   // gem 0 (purple/lavande)
  { sheet: "dungeon", col: 9, row: 9 },   // gem 1 (green/olive)
  { sheet: "dungeon", col: 10, row: 9 },  // gem 2 (red/rubis)
  { sheet: "dungeon", col: 11, row: 9 },  // gem 3 (blue/saphir)
  { sheet: "dungeon", col: 8, row: 10 },  // gem 4 (yellow/soleil)
  { sheet: "dungeon", col: 9, row: 10 },  // gem 5 (orange/ocre)
];

// ─── PLAYER SPRITES ───
export const PLAYER_SPRITES: Record<string, TileSprite> = {
  jisse:   { sheet: "dungeon", col: 0, row: 7 },   // knight
  melanie: { sheet: "dungeon", col: 4, row: 7 },   // mage
};
