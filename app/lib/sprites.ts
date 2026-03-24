// ═══════════════════════════════════════════════════════════
// SPRITE SYSTEM — ChatGPT spritesheets (processed by sharp)
// All sheets are regular grids with 64×64 cells (transparent bg)
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

// Generic sprite from a regular grid sheet
function fromSheet(src: string, cols: number, col: number, row: number, cellSize: number, displaySize: number, flipX = false): React.CSSProperties {
  const scale = displaySize / cellSize;
  return {
    width: displaySize,
    height: displaySize,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    backgroundSize: `${cols * displaySize}px auto`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flipX ? "scaleX(-1)" : "none",
  } as React.CSSProperties;
}

// ─── PLAYER (jisse.png / melanie.png — 4 cols × 3 rows × 64px) ───
// Row 0 = face down (4 walk frames)
// Row 1 = face side (4 walk frames) — flip for left
// Row 2 = face up (4 walk frames)
export function playerSprite(name: "jisse" | "melanie", dir: Direction, frame: number, size: number): React.CSSProperties {
  const sheet = `/sprites/game/${name}.png`;
  const f = frame % 4;
  const dirMap: Record<Direction, { row: number; flip: boolean }> = {
    down:  { row: 0, flip: false },
    right: { row: 1, flip: false },
    left:  { row: 1, flip: true },
    up:    { row: 2, flip: false },
  };
  const { row, flip } = dirMap[dir];
  return fromSheet(sheet, 4, f, row, 64, size, flip);
}

// ─── MONSTERS (monsters.png — 5 cols × 1 row × 64px) ───
// 0=sanglier, 1=mouette, 2=tarasque, 3=pieuvre, 4=mistral
const MONSTER_IDX: Record<string, number> = {
  garrigue: 0, calanques: 1, mines: 2, mer: 3, restanques: 4,
};
export function monsterSprite(biome: string, size: number): React.CSSProperties {
  return fromSheet("/sprites/game/monsters.png", 5, MONSTER_IDX[biome] ?? 0, 0, 64, size);
}

// ─── GEMS (gems.png — 6 cols × 1 row × 64px) ───
export function gemSprite(gemIdx: number, size: number): React.CSSProperties {
  return fromSheet("/sprites/game/gems.png", 6, gemIdx % 6, 0, 64, size);
}

// ─── ITEMS (items.png — 4 cols × 4 rows × 64px) ───
// (col,row): branche(0,0) herbe(1,0) lavande(2,0) pierre(3,0)
//            coquillage(0,1) sel(1,1) fer(2,1) ocre(3,1)
//            cristal(0,2) poisson(1,2) perle(2,2) corail(3,2)
//            pain(0,3) potion(1,3) cle(2,3) sac(3,3)
const ITEM_POS: Record<string, [number, number]> = {
  branche: [0, 0], herbe: [1, 0], lavande: [2, 0], pierre: [3, 0],
  coquillage: [0, 1], sel: [1, 1], fer: [2, 1], ocre: [3, 1],
  cristal: [0, 2], poisson: [1, 2], perle: [2, 2], corail: [3, 2],
  pain: [0, 3], potion: [1, 3], cle: [2, 3], sac: [3, 3],
};
export function itemSprite(itemId: string, size: number): React.CSSProperties | null {
  const pos = ITEM_POS[itemId];
  if (!pos) return null;
  return fromSheet("/sprites/game/items.png", 4, pos[0], pos[1], 64, size);
}

// ─── TOOLS (tools.png — 5 cols × 1 row × 64px) ───
// 0=bâton, 1=pioche, 2=filet, 3=serpe, 4=clé
const TOOL_IDX: Record<string, number> = { baton: 0, pioche: 1, filet: 2, serpe: 3, cle: 4 };
export function toolSprite(toolId: string, size: number): React.CSSProperties | null {
  const idx = TOOL_IDX[toolId];
  if (idx === undefined) return null;
  return fromSheet("/sprites/game/tools.png", 5, idx, 0, 64, size);
}

// ─── NATURE (nature.png — 4 cols × 1 row × 64px) ───
// 0=chêne, 1=sapin, 2=rocher, 3=buisson fleuri
export function natureSprite(variant: number, size: number): React.CSSProperties {
  return fromSheet("/sprites/game/nature.png", 4, variant % 4, 0, 64, size);
}

// Tiles sol → CSS pur, pas de sprites (les tiles ChatGPT ne sont pas seamless)
export function tileSpriteStyle(_tileCode: string, _size: number): React.CSSProperties | null {
  return null; // Always return null → fallback to CSS colors
}

// ─── BUILDINGS (buildings.png — 3 cols × 2 rows × 96px) ───
export function buildingSprite(index: number, size: number): React.CSSProperties {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return fromSheet("/sprites/game/buildings.png", 3, col, row, 96, size);
}

// ─── BONFIRE (keep Pixel Crawler bonfire — it works) ───
export function bonfireSprite(frame: number, size: number): React.CSSProperties {
  const f = frame % 6;
  const scale = size / 64;
  return {
    width: size, height: size,
    backgroundImage: "url(/sprites/env/bonfire.png)",
    backgroundPosition: `0 -${f * 64 * scale}px`,
    backgroundSize: `${size}px ${6 * size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  } as React.CSSProperties;
}

// ─── NPC (keep Pixel Crawler NPCs — they work) ───
export function npcSprite(villageIndex: number, frame: number, size: number): React.CSSProperties {
  const sheets = ["/sprites/npcs/knight.png", "/sprites/npcs/rogue.png", "/sprites/npcs/wizzard.png"];
  const src = sheets[villageIndex % sheets.length];
  const f = frame % 4;
  return fromSheet(src, 4, f, 0, 32, size);
}

// ─── MOB SPRITES (keep Pixel Crawler for map mobs — they work) ───
const MOB_SHEETS: Record<string, { idle: string; run: string }> = {
  garrigue:   { idle: "/sprites/mobs/orc-idle.png", run: "/sprites/mobs/orc-run.png" },
  calanques:  { idle: "/sprites/mobs/rogue-idle.png", run: "/sprites/mobs/orc-run.png" },
  mines:      { idle: "/sprites/mobs/warrior-idle.png", run: "/sprites/mobs/warrior-run.png" },
  mer:        { idle: "/sprites/mobs/mage-idle.png", run: "/sprites/mobs/mage-run.png" },
  restanques: { idle: "/sprites/mobs/shaman-idle.png", run: "/sprites/mobs/shaman-run.png" },
};
export function mobSprite(biome: string, chasing: boolean, frame: number, size: number): React.CSSProperties {
  const sheets = MOB_SHEETS[biome] || MOB_SHEETS.garrigue;
  if (chasing) { return fromSheet(sheets.run, 6, frame % 6, 0, 64, size); }
  return fromSheet(sheets.idle, 4, frame % 4, 0, 32, size);
}
