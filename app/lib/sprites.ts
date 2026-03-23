// ═══════════════════════════════════════════════════════════
// SPRITE MAPPING — positions dans chaque spritesheet
// Utilise background-position en pourcentage pour cropper
// ═══════════════════════════════════════════════════════════

// Helper: pour une grille CxR, la position % du sprite (col, row)
// Formula: x = col/(cols-1)*100, y = row/(rows-1)*100
function pct(col: number, row: number, cols: number, rows: number): [string, string] {
  return [
    cols <= 1 ? "50%" : `${(col / (cols - 1)) * 100}%`,
    rows <= 1 ? "50%" : `${(row / (rows - 1)) * 100}%`,
  ];
}

// ─── CHARACTER SPRITES ───
// 4 colonnes (directions) × 2 lignes (Jisse top, Mélanie bottom)
// Sheets: chars-idle.png, chars-walk1.png, chars-walk2.png, chars-walk3.png
// Directions: 0=left, 1=front, 2=right, 3=back
export type Direction = "left" | "down" | "right" | "up";
const DIR_COL: Record<Direction, number> = { left: 0, down: 1, right: 2, up: 3 };

export function getCharSprite(player: "jisse" | "melanie", dir: Direction, walkFrame: number): {
  src: string;
  bgPos: string;
  bgSize: string;
} {
  const row = player === "jisse" ? 0 : 1;
  const col = DIR_COL[dir];
  const sheets = ["/sprites/chars-idle.png", "/sprites/chars-walk1.png", "/sprites/chars-walk2.png", "/sprites/chars-walk3.png"];
  const sheet = sheets[walkFrame % sheets.length];
  const [px, py] = pct(col, row, 4, 2);
  return { src: sheet, bgPos: `${px} ${py}`, bgSize: "400% 200%" };
}

// ─── TILE SPRITES ───
// Chaque biome a une grille 4×4 de tiles
// Mapping: type de tile → position dans la grille du biome
export const TILE_SHEETS: Record<string, string> = {
  garrigue: "/sprites/tiles-garrigue.png",
  calanques: "/sprites/tiles-calanques.png",
  mines: "/sprites/tiles-mines.png",
  mer: "/sprites/tiles-mer.png",
  restanques: "/sprites/tiles-restanques.png",
};

// Tile code → (biome, col, row) dans la spritesheet 4×4
const TILE_MAP: Record<string, { biome: string; col: number; row: number }> = {
  // Garrigue
  g:   { biome: "garrigue", col: 0, row: 0 },   // herbe
  tg:  { biome: "garrigue", col: 1, row: 0 },   // herbe haute
  p:   { biome: "garrigue", col: 2, row: 0 },   // chemin
  fl:  { biome: "garrigue", col: 3, row: 0 },   // fleurs
  lv:  { biome: "garrigue", col: 0, row: 1 },   // lavande
  t:   { biome: "garrigue", col: 2, row: 1 },   // arbre
  r:   { biome: "garrigue", col: 0, row: 2 },   // petit rocher
  vi:  { biome: "garrigue", col: 3, row: 3 },   // village (terre)
  // Calanques
  s:   { biome: "calanques", col: 0, row: 0 },   // sable
  w:   { biome: "calanques", col: 1, row: 0 },   // eau peu profonde
  cl:  { biome: "calanques", col: 2, row: 1 },  // falaise
  dk:  { biome: "calanques", col: 2, row: 2 },  // dock bois
  // Mines
  mf:  { biome: "mines", col: 0, row: 0 },      // sol mine
  mw:  { biome: "mines", col: 1, row: 0 },      // mur mine
  // Mer
  cf:  { biome: "mer", col: 2, row: 0 },        // fond marin
  dw:  { biome: "mer", col: 3, row: 0 },        // eau profonde
  // Restanques
  rs:  { biome: "restanques", col: 0, row: 0 },  // sol pierre
  rw:  { biome: "restanques", col: 1, row: 1 },  // mur restanque
  gt:  { biome: "restanques", col: 0, row: 2 },  // porte/arche
  camp: { biome: "garrigue", col: 2, row: 0 },   // camp (uses path tile)
};

export function getTileSprite(tileCode: string): { src: string; bgPos: string; bgSize: string } | null {
  const mapping = TILE_MAP[tileCode];
  if (!mapping) return null;
  const sheet = TILE_SHEETS[mapping.biome];
  if (!sheet) return null;
  const [px, py] = pct(mapping.col, mapping.row, 4, 4);
  return { src: sheet, bgPos: `${px} ${py}`, bgSize: "400% 400%" };
}

// ─── MONSTER SPRITES ───
// 4 monstres en ligne (1536x1024): sanglier, mouette, tarasque, mistral
const MONSTER_COL: Record<string, number> = {
  garrigue: 0,   // sanglier
  calanques: 1,  // mouette/aigle
  mines: 2,      // tarasque
  restanques: 3, // mistral
};

export function getMonsterSprite(biome: string): { src: string; bgPos: string; bgSize: string } | null {
  const col = MONSTER_COL[biome];
  if (col === undefined) return null;
  const [px] = pct(col, 0, 4, 1);
  return { src: "/sprites/monsters.png", bgPos: `${px} 50%`, bgSize: "400% 100%" };
}

// ─── GEM SPRITES ───
// 6 gemmes en ligne (1536x1024): rouge, bleu, vert, jaune, violet, cyan
export function getGemSprite(gemId: number): { src: string; bgPos: string; bgSize: string } {
  const [px] = pct(gemId, 0, 6, 1);
  return { src: "/sprites/gems.png", bgPos: `${px} 50%`, bgSize: "600% 100%" };
}

// ─── ITEM SPRITES ───
// 4×4 grid (1024x1024) — mapping ressource → position
const ITEM_MAP: Record<string, { col: number; row: number }> = {
  branche:    { col: 0, row: 0 },
  lavande:    { col: 1, row: 0 },
  pierre:     { col: 2, row: 0 },
  coquillage: { col: 3, row: 0 },
  sel:        { col: 0, row: 1 },
  fer:        { col: 1, row: 1 },  // ore
  poisson:    { col: 2, row: 1 },
  corail:     { col: 3, row: 1 },
  potion:     { col: 0, row: 2 },
  herbe:      { col: 1, row: 2 },  // using blue potion/hammer slot... approximate
  ocre:       { col: 2, row: 3 },  // fossil-like
  cristal:    { col: 2, row: 3 },  // crystal
  perle:      { col: 0, row: 3 },  // olive/pearl
  pain:       { col: 1, row: 3 },  // pinecone-ish
};

export function getItemSprite(resId: string): { src: string; bgPos: string; bgSize: string } | null {
  const mapping = ITEM_MAP[resId];
  if (!mapping) return null;
  const [px, py] = pct(mapping.col, mapping.row, 4, 4);
  return { src: "/sprites/items.png", bgPos: `${px} ${py}`, bgSize: "400% 400%" };
}

// ─── TOOL SPRITES ───
// 5 outils en ligne (3072x1024): baton, pioche, serpe, filet, cle
const TOOL_COL: Record<string, number> = {
  baton: 0, pioche: 1, serpe: 2, filet: 3, cle: 4,
};

export function getToolSprite(toolId: string): { src: string; bgPos: string; bgSize: string } | null {
  const col = TOOL_COL[toolId];
  if (col === undefined) return null;
  const [px] = pct(col, 0, 5, 1);
  return { src: "/sprites/tools.png", bgPos: `${px} 50%`, bgSize: "500% 100%" };
}

// ─── VILLAGE SPRITES ───
// 2×2 grid (1024x1024)
export function getVillageSprite(villageIndex: number): { src: string; bgPos: string; bgSize: string } {
  const col = villageIndex % 2;
  const row = Math.floor(villageIndex / 2);
  const [px, py] = pct(col, row, 2, 2);
  return { src: "/sprites/villages.png", bgPos: `${px} ${py}`, bgSize: "200% 200%" };
}

// ─── CAMP SPRITE ───
export const CAMP_SPRITE = "/sprites/camp.png";
