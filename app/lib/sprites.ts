// ═══════════════════════════════════════════════════════════
// SPRITE SYSTEM — FULL EMOJI (no external sprite files)
// Tout est rendu en CSS + emoji pour fiabilité maximale.
// Quand on aura des sprites custom → sprites/custom/ + mise à jour ici.
// ═══════════════════════════════════════════════════════════

export type Direction = "left" | "down" | "right" | "up";

// ─── PLAYER CIRCLE ───
export function playerCircle(emoji: string, color1: string, color2: string, size: number): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: "50%",
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    border: "2px solid #F4D03F",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.floor(size * 0.45),
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
    lineHeight: 1,
  } as React.CSSProperties;
}

export const PLAYER_STYLES: Record<string, { emoji: string; c1: string; c2: string }> = {
  jisse:   { emoji: "🎸", c1: "#4A6E1F", c2: "#2D4A0F" },
  melanie: { emoji: "🎨", c1: "#8E4466", c2: "#5C2D42" },
  ombre:   { emoji: "🌙", c1: "#2D2D4A", c2: "#1A1A2E" },
};

// ─── NPC CIRCLE ───
export function npcCircle(emoji: string, size: number): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: "50%",
    background: "linear-gradient(135deg, #2196F3, #1565C0)",
    border: "2px solid #FFF",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.floor(size * 0.5),
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    lineHeight: 1,
  } as React.CSSProperties;
}

// ─── ITEMS (DALL-E spritesheet if available, else emoji) ───
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

// Item emoji fallback
export const ITEM_EMOJI: Record<string, string> = {
  branche: "🪵", herbe: "🌿", lavande: "💜", pierre: "🪨",
  coquillage: "🐚", sel: "🧂", fer: "⛏️", ocre: "🟠",
  cristal: "💎", poisson: "🐟", perle: "⚪", corail: "🪸",
  pain: "🍞", potion: "🧪", cle: "🗝️", sac: "🎒",
};

// ─── GEM CSS GRADIENTS ───
export const GEM_STYLES = [
  { light: "#C4A0FF", dark: "#6B4EAE", glow: "#9B7EDE" },
  { light: "#A0D860", dark: "#4A6E1F", glow: "#7A9E3F" },
  { light: "#FF7070", dark: "#A92F2F", glow: "#D94F4F" },
  { light: "#70B0FF", dark: "#2A60A9", glow: "#4A90D9" },
  { light: "#FFE070", dark: "#C4A01F", glow: "#F4D03F" },
  { light: "#FFB050", dark: "#B64E02", glow: "#E67E22" },
];

// ─── BOSS EMOJIS ───
export const BOSS_EMOJI: Record<string, string> = {
  garrigue: "🐗", calanques: "🦅", mines: "🐉", mer: "🦑", restanques: "🌪️",
};

// ─── NATURE EMOJIS ───
export const NATURE_EMOJI: Record<string, string> = {
  t: "🌳", r: "🪨", fl: "🌸", lv: "💜",
};
