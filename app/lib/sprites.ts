// ═══════════════════════════════════════════════════════════
// SPRITE SYSTEM — CLEANED UP
// Map characters: Pixel Crawler Body_A (reliable 64×64 grids)
// Map mobs: Pixel Crawler (reliable 32×32 idle, 64×64 run)
// Combat portraits: emojis in colored circles (reliable)
// Gems: CSS gradients (reliable)
// Items overlay: ChatGPT items.png 4×4×64 (works)
// Nature overlay: ChatGPT nature.png 4×1×64 (works, forced to CELL size)
// Tiles: CSS pure colors (no sprite)
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

function fromSheet(src: string, cols: number, col: number, row: number, cellSize: number, displaySize: number, flipX = false): React.CSSProperties {
  return {
    width: displaySize,
    height: displaySize,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    backgroundSize: `${cols * displaySize}px auto`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flipX ? "scaleX(-1)" : "none",
    overflow: "hidden",
  } as React.CSSProperties;
}

// ─── PLAYER on MAP — Pixel Crawler Body_A (RELIABLE) ───
// Walk: 384×64 = 6 frames × 64×64 (walk-down.png, walk-side.png, walk-up.png)
// Idle: 256×64 = 4 frames × 64×64 (idle-down.png, idle-side.png, idle-up.png)
export function playerMapSprite(action: "walk" | "idle", dir: Direction, frame: number, size: number, isMelanie: boolean): React.CSSProperties {
  const dirMap: Record<Direction, { file: string; flip: boolean }> = {
    down: { file: "down", flip: false }, up: { file: "up", flip: false },
    right: { file: "side", flip: false }, left: { file: "side", flip: true },
  };
  const { file, flip } = dirMap[dir];
  const totalFrames = action === "walk" ? 6 : 4;
  const f = frame % totalFrames;
  return {
    width: size, height: size,
    backgroundImage: `url(/sprites/player/${action}-${file}.png)`,
    backgroundPosition: `-${f * size}px 0`,
    backgroundSize: `${totalFrames * size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flip ? "scaleX(-1)" : "none",
    filter: isMelanie ? "hue-rotate(280deg) saturate(1.3)" : "none",
    overflow: "hidden",
  } as React.CSSProperties;
}

// ─── MOB on MAP — Pixel Crawler (RELIABLE) ───
const MOB_SHEETS: Record<string, { idle: string; run: string }> = {
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
    return { width: size, height: size, backgroundImage: `url(${sheets.run})`, backgroundPosition: `-${f * size}px 0`, backgroundSize: `${6 * size}px ${size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
  }
  const f = frame % 4;
  return { width: size, height: size, backgroundImage: `url(${sheets.idle})`, backgroundPosition: `-${f * size}px 0`, backgroundSize: `${4 * size}px ${size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
}

// ─── NPC — Pixel Crawler (RELIABLE) ───
export function npcSprite(villageIndex: number, frame: number, size: number): React.CSSProperties {
  const sheets = ["/sprites/npcs/knight.png", "/sprites/npcs/rogue.png", "/sprites/npcs/wizzard.png"];
  const src = sheets[villageIndex % sheets.length];
  const f = frame % 4;
  return { width: size, height: size, backgroundImage: `url(${src})`, backgroundPosition: `-${f * size}px 0`, backgroundSize: `${4 * size}px ${size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
}

// ─── BONFIRE — Pixel Crawler vertical (RELIABLE) ───
export function bonfireSprite(frame: number, size: number): React.CSSProperties {
  const f = frame % 6;
  return { width: size, height: size, backgroundImage: "url(/sprites/env/bonfire.png)", backgroundPosition: `0 -${f * size}px`, backgroundSize: `${size}px ${6 * size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
}

// ─── ITEMS — ChatGPT items.png 4×4×64 (WORKS) ───
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

// ─── GEM COLORS for CSS gradients (NO SPRITES — they were too dark) ───
export const GEM_STYLES = [
  { light: "#C4A0FF", dark: "#6B4EAE", glow: "#9B7EDE" },
  { light: "#A0D860", dark: "#4A6E1F", glow: "#7A9E3F" },
  { light: "#FF7070", dark: "#A92F2F", glow: "#D94F4F" },
  { light: "#70B0FF", dark: "#2A60A9", glow: "#4A90D9" },
  { light: "#FFE070", dark: "#C4A01F", glow: "#F4D03F" },
  { light: "#FFB050", dark: "#B64E02", glow: "#E67E22" },
];
