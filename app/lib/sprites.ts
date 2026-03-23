// ═══════════════════════════════════════════════════════════
// KENNEY SPRITE MAPPING — tilemap_packed.png
// town.png = 192x176 (12 cols × 11 rows, 16x16 tiles)
// dungeon.png = 192x176 (12 cols × 11 rows, 16x16 tiles)
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

const COLS = 12;
const ROWS = 11;

export function kenney(sheet: "town" | "dungeon", col: number, row: number, displaySize: number) {
  return {
    backgroundImage: `url(/sprites/${sheet}.png)`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    backgroundSize: `${COLS * displaySize}px ${ROWS * displaySize}px`,
    backgroundRepeat: "no-repeat" as const,
    imageRendering: "pixelated" as const,
  };
}

// ─── TILE MAP ───
// Mapping corrigé d'après inspection visuelle de town.png :
// Row 0: herbe claire(0), herbe(1), herbe jaune(2), terre(3), chemin(4), sable(5), pierre(6), ...
// Row 1: sapin(0), arbre vert(1), buisson(2), fleurs blanches(3), fleurs violettes(4), plante(5), arbre automne(6-8), ...
// Row 2: eau claire(0), eau(1), eau profonde(2), bord eau(3-5), rocher(6), falaise(7), ...
// Row 3: maison toit(0), mur(1), ...

interface TileSprite { sheet: "town" | "dungeon"; col: number; row: number; }

export const TILE_SPRITES: Record<string, TileSprite> = {
  // ── Garrigue ──
  g:    { sheet: "town", col: 0, row: 0 },   // herbe claire
  tg:   { sheet: "town", col: 2, row: 0 },   // herbe jaune/haute
  p:    { sheet: "town", col: 3, row: 0 },   // chemin terre
  fl:   { sheet: "town", col: 3, row: 1 },   // fleurs blanches
  lv:   { sheet: "town", col: 4, row: 1 },   // fleurs violettes = lavande
  t:    { sheet: "town", col: 1, row: 1 },   // arbre vert (PAS le sapin sombre !)
  r:    { sheet: "town", col: 6, row: 2 },   // rocher

  // ── Calanques ──
  s:    { sheet: "town", col: 5, row: 0 },   // sable
  w:    { sheet: "town", col: 0, row: 2 },   // eau claire
  cl:   { sheet: "town", col: 7, row: 2 },   // falaise
  dk:   { sheet: "town", col: 3, row: 0 },   // dock/terre

  // ── Mines (dungeon) ──
  mf:   { sheet: "dungeon", col: 1, row: 0 }, // sol mine (brun)
  mw:   { sheet: "dungeon", col: 3, row: 1 }, // mur mine

  // ── Mer ──
  cf:   { sheet: "town", col: 1, row: 2 },   // eau moyenne
  dw:   { sheet: "town", col: 2, row: 2 },   // eau profonde

  // ── Restanques ──
  rs:   { sheet: "town", col: 6, row: 0 },   // sol pierre clair
  rw:   { sheet: "town", col: 0, row: 4 },   // mur pierre
  gt:   { sheet: "dungeon", col: 3, row: 5 }, // porte

  // ── Village ──
  vi:   { sheet: "town", col: 0, row: 3 },   // maison

  // ── Camp ──
  camp: { sheet: "town", col: 0, row: 0 },   // même herbe (le 🔥 se met par-dessus)
};
