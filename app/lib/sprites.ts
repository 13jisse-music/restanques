// ═══════════════════════════════════════════════════════════
// PIXEL CRAWLER — FULL SPRITE SYSTEM
// All sprites from the Pixel Crawler Free Pack
// Player 64×64 | Mobs 32×32 idle, 64×64 run | Environment 32×32 | Items 16×16
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

// Helper: crop a region from a spritesheet
function sheet(src: string, frameW: number, frameH: number, col: number, row: number, displayW: number, displayH: number, flipX = false): React.CSSProperties {
  const scaleX = displayW / frameW;
  const scaleY = displayH / frameH;
  return {
    width: displayW, height: displayH,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${col * frameW * scaleX}px -${row * frameH * scaleY}px`,
    backgroundSize: `auto`, // let it auto-scale based on display size
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flipX ? "scaleX(-1)" : "none",
  } as React.CSSProperties;
}

// Better helper using backgroundSize scaling
function sprite(src: string, frameW: number, frameH: number, totalW: number, totalH: number, col: number, row: number, displaySize: number, flipX = false): React.CSSProperties {
  const scale = displaySize / frameW;
  const scaledTotalW = totalW * scale;
  const scaledTotalH = totalH * scale;
  const scaledH = frameH * scale;
  return {
    width: displaySize, height: scaledH > displaySize ? displaySize : scaledH,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${col * displaySize}px -${row * frameH * scale}px`,
    backgroundSize: `${scaledTotalW}px ${scaledTotalH}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flipX ? "scaleX(-1)" : "none",
  } as React.CSSProperties;
}

// ─── PLAYER (64×64 frames) ───
export function playerSprite(action: "walk" | "idle", dir: Direction, frame: number, size: number, isMelanie: boolean): React.CSSProperties {
  const dirMap: Record<Direction, { file: string; flip: boolean }> = {
    down: { file: "down", flip: false }, up: { file: "up", flip: false },
    right: { file: "side", flip: false }, left: { file: "side", flip: true },
  };
  const { file, flip } = dirMap[dir];
  const totalFrames = action === "walk" ? 6 : 4;
  const f = frame % totalFrames;
  const totalW = totalFrames * 64;
  return {
    ...sprite(`/sprites/player/${action}-${file}.png`, 64, 64, totalW, 64, f, 0, size, flip),
    filter: isMelanie ? "hue-rotate(280deg) saturate(1.3)" : "none",
  } as React.CSSProperties;
}

// ─── MOBS (idle: 32×32×4 frames, run: 64×64×6 frames) ───
export const MOB_SHEETS: Record<string, { idle: string; run: string }> = {
  garrigue:   { idle: "/sprites/mobs/orc-idle.png", run: "/sprites/mobs/orc-run.png" },
  calanques:  { idle: "/sprites/mobs/rogue-idle.png", run: "/sprites/mobs/orc-run.png" },
  mines:      { idle: "/sprites/mobs/warrior-idle.png", run: "/sprites/mobs/warrior-run.png" },
  mer:        { idle: "/sprites/mobs/mage-idle.png", run: "/sprites/mobs/mage-run.png" },
  restanques: { idle: "/sprites/mobs/shaman-idle.png", run: "/sprites/mobs/shaman-run.png" },
};

export function mobSprite(biome: string, chasing: boolean, frame: number, size: number): React.CSSProperties {
  const sheets = MOB_SHEETS[biome] || MOB_SHEETS.garrigue;
  if (chasing) {
    const f = frame % 6;
    return sprite(sheets.run, 64, 64, 384, 64, f, 0, size);
  }
  const f = frame % 4;
  return sprite(sheets.idle, 32, 32, 128, 32, f, 0, size);
}

// ─── NPCs (32×32×4 frames idle) ───
const NPC_SHEETS = ["/sprites/npcs/knight.png", "/sprites/npcs/rogue.png", "/sprites/npcs/wizzard.png"];
export function npcSprite(villageIndex: number, frame: number, size: number): React.CSSProperties {
  const src = NPC_SHEETS[villageIndex % NPC_SHEETS.length];
  const f = frame % 4;
  return sprite(src, 32, 32, 128, 32, f, 0, size);
}

// ─── BONFIRE (64×384 vertical, 6 frames of 64×64) ───
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

// ─── FIRE small (128×48, 4 frames of 32×48) ───
export function fireSprite(frame: number, size: number): React.CSSProperties {
  const f = frame % 4;
  return sprite("/sprites/env/fire-sheet.png", 32, 48, 128, 48, f, 0, size);
}

// ─── FLOOR TILES (Floors_Tiles.png 400×416, 32×32 grid) ───
// Row 0: green grass variants, Row 1: brown dirt, Row 2-3: orange/gray stone
// Each row has 4 tiles (center, edge variants)
// We use the center tile (col 1) for each type
export function floorTile(tileType: string, size: number): React.CSSProperties | null {
  const map: Record<string, [number, number]> = {
    g:  [1, 1],   // green grass center
    tg: [5, 1],   // darker grass
    p:  [1, 4],   // brown dirt path
    s:  [5, 4],   // sand/light dirt
    mf: [1, 7],   // stone floor (mine)
    rs: [5, 7],   // gray stone (restanque)
    cf: [9, 1],   // blue stone (coral floor)
    dk: [9, 4],   // peach floor (dock)
  };
  const pos = map[tileType];
  if (!pos) return null;
  return sprite("/sprites/env/floors.png", 32, 32, 400, 416, pos[0], pos[1], size);
}

// ─── WATER (Water_tiles.png 400×400, 32×32) ───
export function waterTile(frame: number, size: number, deep = false): React.CSSProperties {
  // Use first 2 tiles for animation
  const col = deep ? 2 : (frame % 2);
  return sprite("/sprites/env/water.png", 32, 32, 400, 400, col, 0, size);
}

// ─── VEGETATION (400×432) ───
// Trees: top section, 32×32, rows 0-3 (4 seasonal variants per row)
// Small plants: lower section, 16×16
export function treeTile(variant: number, size: number): React.CSSProperties {
  // Use green tree variants (row 0, cols 0-3)
  const col = variant % 4;
  return sprite("/sprites/env/vegetation.png", 32, 32, 400, 432, col, 0, size);
}

export function bushTile(variant: number, size: number): React.CSSProperties {
  // Bushes in row 2-3
  return sprite("/sprites/env/vegetation.png", 32, 32, 400, 432, variant % 4, 2, size);
}

export function flowerTile(variant: number, size: number): React.CSSProperties {
  // Small flowers — row 8 area (16×16 scaled up)
  const col = variant % 6;
  return sprite("/sprites/env/vegetation.png", 16, 16, 400, 432, col, 16, size);
}

// ─── ROCKS (208×304, 32×32 primary) ───
export function rockTile(variant: number, size: number): React.CSSProperties {
  // Top rows have large rocks
  const col = variant % 3;
  return sprite("/sprites/env/rocks.png", 32, 32, 208, 304, col, 0, size);
}

// ─── RESOURCE NODES on map (Resources.png 400×400, 16×16) ───
const RES_POS: Record<string, [number, number]> = {
  branche:    [2, 0],   // stick/wood
  herbe:      [4, 0],   // plant matter
  lavande:    [6, 0],   // herb
  pierre:     [0, 2],   // stone
  coquillage: [2, 2],   // shell-like
  sel:        [4, 2],   // crystal-white
  fer:        [0, 4],   // dark ore
  ocre:       [2, 4],   // orange ore
  cristal:    [4, 4],   // blue crystal
  poisson:    [6, 2],   // fish item
  perle:      [6, 4],   // pearl
  corail:     [8, 2],   // coral
  pain:       [0, 6],   // bread/food
  potion:     [2, 6],   // potion
};

export function resourceSprite(resId: string, size: number): React.CSSProperties | null {
  const pos = RES_POS[resId];
  if (!pos) return null;
  return sprite("/sprites/env/resources.png", 16, 16, 400, 400, pos[0], pos[1], size);
}

// ─── TOOL ICONS (Tools.png 400×400, 16×16) ───
const TOOL_POS: Record<string, [number, number]> = {
  baton:  [0, 0],   // stick/club
  pioche: [2, 0],   // pickaxe
  filet:  [4, 0],   // net-like
  serpe:  [6, 0],   // blade
  cle:    [8, 0],   // key
};

export function toolSprite(toolId: string, size: number): React.CSSProperties | null {
  const pos = TOOL_POS[toolId];
  if (!pos) return null;
  return sprite("/sprites/env/tools.png", 16, 16, 400, 400, pos[0], pos[1], size);
}

// ─── VILLAGE BUILDING (Walls.png 672×800 + Roofs.png 400×400) ───
export function villageTile(size: number): React.CSSProperties {
  // Use a wall section (col 2, row 0 — window wall)
  return sprite("/sprites/env/walls.png", 32, 32, 672, 800, 2, 0, size);
}

// ─── GATE/DOOR ───
export function gateTile(size: number): React.CSSProperties {
  // Use wall with door (col 4, row 0)
  return sprite("/sprites/env/walls.png", 32, 32, 672, 800, 4, 0, size);
}

// ─── CLIFF/WALL ───
export function cliffTile(size: number): React.CSSProperties {
  return sprite("/sprites/env/walls.png", 32, 32, 672, 800, 0, 4, size);
}

// ─── MINE WALL ───
export function mineWallTile(size: number): React.CSSProperties {
  return sprite("/sprites/env/walls.png", 32, 32, 672, 800, 6, 4, size);
}

// ─── RESTANQUE WALL ───
export function restanqueWallTile(size: number): React.CSSProperties {
  return sprite("/sprites/env/walls.png", 32, 32, 672, 800, 2, 4, size);
}
