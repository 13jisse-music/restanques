// ═══════════════════════════════════════════════════════════
// PIXEL CRAWLER SPRITE SYSTEM
// Player: 64×64 frames, horizontal sheets
// Mobs idle: 32×32 frames (4 frames), Mobs run: 64×64 (6 frames)
// Bonfire: 64×384 vertical (6 frames stacked)
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

// ─── PLAYER SPRITE ───
// Walk sheets: 384×64 = 6 frames of 64×64
// Idle sheets: 256×64 = 4 frames of 64×64
const PLAYER_FRAME = 64;

export function playerSprite(
  action: "walk" | "idle",
  dir: Direction,
  frame: number,
  size: number,
  isMelanie: boolean
): React.CSSProperties {
  // Map direction to sheet file + flip
  const dirMap: Record<Direction, { file: string; flip: boolean }> = {
    down:  { file: "down", flip: false },
    up:    { file: "up", flip: false },
    right: { file: "side", flip: false },
    left:  { file: "side", flip: true },
  };
  const { file, flip } = dirMap[dir];
  const totalFrames = action === "walk" ? 6 : 4;
  const f = frame % totalFrames;
  const scale = size / PLAYER_FRAME;

  return {
    width: size,
    height: size,
    backgroundImage: `url(/sprites/player/${action}-${file}.png)`,
    backgroundPosition: `-${f * PLAYER_FRAME * scale}px 0`,
    backgroundSize: `${totalFrames * size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transform: flip ? "scaleX(-1)" : "none",
    filter: isMelanie ? "hue-rotate(280deg) saturate(1.3)" : "none",
  } as React.CSSProperties;
}

// ─── MOB SPRITES ───
// Idle: 128×32 = 4 frames of 32×32
// Run: 384×64 = 6 frames of 64×64
const MOB_IDLE_FRAME = 32;
const MOB_RUN_FRAME = 64;

export const MOB_SHEETS: Record<string, { idle: string; run: string }> = {
  garrigue:   { idle: "/sprites/mobs/orc-idle.png", run: "/sprites/mobs/orc-run.png" },
  calanques:  { idle: "/sprites/mobs/rogue-idle.png", run: "/sprites/mobs/orc-run.png" },
  mines:      { idle: "/sprites/mobs/warrior-idle.png", run: "/sprites/mobs/warrior-run.png" },
  mer:        { idle: "/sprites/mobs/mage-idle.png", run: "/sprites/mobs/mage-run.png" },
  restanques: { idle: "/sprites/mobs/shaman-idle.png", run: "/sprites/mobs/shaman-run.png" },
};

export function mobSprite(
  biome: string,
  chasing: boolean,
  frame: number,
  size: number
): React.CSSProperties {
  const sheets = MOB_SHEETS[biome] || MOB_SHEETS.garrigue;
  if (chasing) {
    // Run sheet: 6 frames of 64×64
    const f = frame % 6;
    const scale = size / MOB_RUN_FRAME;
    return {
      width: size,
      height: size,
      backgroundImage: `url(${sheets.run})`,
      backgroundPosition: `-${f * MOB_RUN_FRAME * scale}px 0`,
      backgroundSize: `${6 * size}px ${size}px`,
      backgroundRepeat: "no-repeat",
      imageRendering: "pixelated",
    } as React.CSSProperties;
  }
  // Idle sheet: 4 frames of 32×32
  const f = frame % 4;
  const scale = size / MOB_IDLE_FRAME;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${sheets.idle})`,
    backgroundPosition: `-${f * MOB_IDLE_FRAME * scale}px 0`,
    backgroundSize: `${4 * size}px ${size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  } as React.CSSProperties;
}

// ─── BONFIRE ───
// 64×384 = 6 frames stacked vertically (each 64×64)
const FIRE_FRAME = 64;

export function bonfireSprite(frame: number, size: number): React.CSSProperties {
  const f = frame % 6;
  const scale = size / FIRE_FRAME;
  return {
    width: size,
    height: size,
    backgroundImage: "url(/sprites/env/bonfire.png)",
    backgroundPosition: `0 -${f * FIRE_FRAME * scale}px`,
    backgroundSize: `${size}px ${6 * size}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  } as React.CSSProperties;
}
