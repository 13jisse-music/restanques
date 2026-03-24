// ═══════════════════════════════════════════════════════════
// SPRITE SYSTEM — DALL-E generated + Pixel Crawler fallback
// Generated sprites: /sprites/generated/ (64×64 or 128×128, transparent bg)
// Pixel Crawler: /sprites/player/, /sprites/mobs/ (reliable animation sheets)
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

// ─── PLAYER on MAP — Pixel Crawler Body_A (reliable animation) ───
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

// ─── MOB on MAP — Pixel Crawler (reliable animation) ───
const MOB_SHEETS: Record<string, { idle: string; run: string }> = {
  garrigue: { idle: "/sprites/mobs/orc-idle.png", run: "/sprites/mobs/orc-run.png" },
  calanques: { idle: "/sprites/mobs/rogue-idle.png", run: "/sprites/mobs/orc-run.png" },
  mines: { idle: "/sprites/mobs/warrior-idle.png", run: "/sprites/mobs/warrior-run.png" },
  mer: { idle: "/sprites/mobs/mage-idle.png", run: "/sprites/mobs/mage-run.png" },
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

// ─── NPC — Pixel Crawler ───
export function npcSprite(villageIndex: number, frame: number, size: number): React.CSSProperties {
  const sheets = ["/sprites/npcs/knight.png", "/sprites/npcs/rogue.png", "/sprites/npcs/wizzard.png"];
  const src = sheets[villageIndex % sheets.length];
  const f = frame % 4;
  return { width: size, height: size, backgroundImage: `url(${src})`, backgroundPosition: `-${f * size}px 0`, backgroundSize: `${4 * size}px ${size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
}

// ─── BONFIRE — Pixel Crawler ───
export function bonfireSprite(frame: number, size: number): React.CSSProperties {
  const f = frame % 6;
  return { width: size, height: size, backgroundImage: "url(/sprites/env/bonfire.png)", backgroundPosition: `0 -${f * size}px`, backgroundSize: `${size}px ${6 * size}px`, backgroundRepeat: "no-repeat", imageRendering: "pixelated", overflow: "hidden" } as React.CSSProperties;
}

// ─── Helper: single DALL-E sprite (contain, centered) ───
function dalleSingle(src: string, size: number): React.CSSProperties {
  return {
    width: size, height: size,
    backgroundImage: `url(${src})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    imageRendering: "pixelated",
    overflow: "hidden",
  } as React.CSSProperties;
}

// ─── Helper: from spritesheet grid ───
function fromSheet(src: string, cols: number, col: number, row: number, cellSize: number, displaySize: number): React.CSSProperties {
  return {
    width: displaySize, height: displaySize,
    backgroundImage: `url(${src})`,
    backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
    backgroundSize: `${cols * displaySize}px auto`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    overflow: "hidden",
  } as React.CSSProperties;
}

// ─── MONSTER PORTRAIT (combat) — DALL-E boss sprites ───
const BOSS_SPRITES: Record<string, string> = {
  garrigue: "/sprites/generated/mob_sanglier_idle.png",
  calanques: "/sprites/generated/mob_mouette_boss_idle.png",
  mines: "/sprites/generated/mob_tarasque_idle.png",
  mer: "/sprites/generated/mob_pieuvre_idle.png",
  restanques: "/sprites/generated/mob_mistral_idle.png",
};

export function monsterPortrait(biome: string, size: number): React.CSSProperties {
  const src = BOSS_SPRITES[biome];
  if (src) return dalleSingle(src, size);
  return { width: size, height: size, fontSize: size * 0.6, display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties;
}

// ─── ITEMS — DALL-E items.png 4×4 grid ───
const ITEM_POS: Record<string, [number, number]> = {
  branche: [0, 0], herbe: [1, 0], lavande: [2, 0], pierre: [3, 0],
  coquillage: [0, 1], sel: [1, 1], fer: [2, 1], ocre: [3, 1],
  cristal: [0, 2], poisson: [1, 2], perle: [2, 2], corail: [3, 2],
  pain: [0, 3], potion: [1, 3], cle: [2, 3], sac: [3, 3],
};

export function itemSprite(itemId: string, size: number): React.CSSProperties | null {
  const pos = ITEM_POS[itemId];
  if (!pos) return null;
  return fromSheet("/sprites/generated/items.png", 4, pos[0], pos[1], 64, size);
}

// ─── GEMS — DALL-E gems.png 6×1 grid ───
export function gemSprite(gemIndex: number, size: number): React.CSSProperties {
  return fromSheet("/sprites/generated/gems.png", 6, gemIndex % 6, 0, 64, size);
}

// CSS gradient fallback for gems
export const GEM_STYLES = [
  { light: "#C4A0FF", dark: "#6B4EAE", glow: "#9B7EDE" },
  { light: "#A0D860", dark: "#4A6E1F", glow: "#7A9E3F" },
  { light: "#FF7070", dark: "#A92F2F", glow: "#D94F4F" },
  { light: "#70B0FF", dark: "#2A60A9", glow: "#4A90D9" },
  { light: "#FFE070", dark: "#C4A01F", glow: "#F4D03F" },
  { light: "#FFB050", dark: "#B64E02", glow: "#E67E22" },
];

// ─── NATURE — DALL-E nature.png 4×1 grid ───
export function natureSprite(variant: number, size: number): React.CSSProperties {
  return fromSheet("/sprites/generated/nature.png", 4, variant % 4, 0, 64, size);
}
