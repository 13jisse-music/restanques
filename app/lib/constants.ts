// ═══════════════════════════════════════════════════════════
// RESTANQUES — Game Constants
// ═══════════════════════════════════════════════════════════

export const COLORS = {
  lav: "#9B7EDE", sky: "#87CEEB", olive: "#7A9E3F", terra: "#CC7043",
  sun: "#F4D03F", stone: "#D4C5A9", earth: "#3D2B1F", honey: "#E8A317",
  sea: "#2E86AB", bg: "#F5ECD7", dark: "#1A1410", white: "#FFF8E7",
  pink: "#E88EAD", red: "#D94F4F", green: "#3D5E1A", blue: "#4A6FA5",
  mine: "#5C4033", sand: "#E8D5A3", deep: "#1B4F72", crystal: "#A8E6CF",
  gar: "#8FBE4A", cal: "#5BA3CF", merBg: "#2980B9", mineBg: "#4A3728",
  rest: "#D4A574", orange: "#E67E22", violet: "#8E44AD",
};

export const GEMS = [
  { id: 0, emoji: "💜", color: "#9B7EDE", name: "Lavande" },
  { id: 1, emoji: "🟢", color: "#7A9E3F", name: "Olive" },
  { id: 2, emoji: "🔴", color: "#D94F4F", name: "Rubis" },
  { id: 3, emoji: "🔵", color: "#4A90D9", name: "Saphir" },
  { id: 4, emoji: "🟡", color: "#F4D03F", name: "Soleil" },
  { id: 5, emoji: "🟠", color: "#E67E22", name: "Ocre" },
];

export const RES: Record<string, { n: string; e: string; b: string; c: string }> = {
  branche: { n: "Branche", e: "🪵", b: "garrigue", c: "#8B6914" },
  herbe: { n: "Herbe", e: "🌿", b: "garrigue", c: COLORS.green },
  lavande: { n: "Lavande", e: "💜", b: "garrigue", c: COLORS.lav },
  pierre: { n: "Pierre", e: "🪨", b: "calanques", c: COLORS.stone },
  coquillage: { n: "Coquillage", e: "🐚", b: "calanques", c: COLORS.pink },
  sel: { n: "Sel", e: "🧂", b: "calanques", c: "#E0E0E0" },
  fer: { n: "Fer", e: "⚙️", b: "mines", c: "#888" },
  ocre: { n: "Ocre", e: "🟠", b: "mines", c: COLORS.terra },
  cristal: { n: "Cristal", e: "💎", b: "mines", c: COLORS.crystal },
  poisson: { n: "Poisson", e: "🐟", b: "mer", c: COLORS.blue },
  perle: { n: "Perle", e: "🫧", b: "mer", c: "#E8E0F0" },
  corail: { n: "Corail", e: "🪸", b: "mer", c: COLORS.red },
  pain: { n: "Pain", e: "🥖", b: "shop", c: COLORS.sand },
  potion: { n: "Potion", e: "🧪", b: "shop", c: COLORS.lav },
};

export const TOOLS: Record<string, { n: string; e: string; r: string[]; u: string | null; d: string }> = {
  baton: { n: "Bâton", e: "🥖", r: ["branche", "branche"], u: "calanques", d: "Accès aux Calanques" },
  pioche: { n: "Pioche", e: "⛏️", r: ["pierre", "branche"], u: "mines", d: "Accès aux Mines" },
  filet: { n: "Filet", e: "🕸️", r: ["coquillage", "herbe"], u: "mer", d: "Accès à la Mer" },
  serpe: { n: "Serpe", e: "🔪", r: ["fer", "branche"], u: null, d: "Récolte améliorée" },
  cle: { n: "Clé Ancienne", e: "🗝️", r: ["cristal", "ocre", "perle"], u: "restanques", d: "Accès aux Restanques" },
};

export const CARD_RECIPES = [
  { r: ["lavande", "herbe"], c: { n: "Brume", d: "+2 dmg/combo", e: "🌫️", color: COLORS.lav, pow: 2 } },
  { r: ["pierre", "sel"], c: { n: "Bouclier", d: "-1 dmg reçu", e: "🛡️", color: COLORS.stone, pow: 1 } },
  { r: ["ocre", "cristal"], c: { n: "Éclat", d: "+3 dmg", e: "✨", color: COLORS.terra, pow: 3 } },
  { r: ["poisson", "sel"], c: { n: "Festin", d: "+5 PV", e: "🍽️", color: COLORS.olive, pow: 5 } },
  { r: ["perle", "corail"], c: { n: "Marée", d: "+4 dmg", e: "🌊", color: COLORS.deep, pow: 4 } },
  { r: ["fer", "pierre"], c: { n: "Séisme", d: "Mélange grille", e: "💥", color: COLORS.mine, pow: 0 } },
];

export const GUARDS: Record<string, { n: string; e: string; hp: number; d: string }> = {
  garrigue: { n: "Sanglier", e: "🐗", hp: 8, d: "Grrr ! Mes collines !" },
  calanques: { n: "Mouette", e: "🦅", hp: 12, d: "CRIII ! Mes falaises !" },
  mines: { n: "Tarasque", e: "🐉", hp: 18, d: "Ces mines sont à moi..." },
  mer: { n: "Pieuvre", e: "🐙", hp: 16, d: "Mes tentacules gardent ces trésors !" },
  restanques: { n: "Le Mistral", e: "🌪️", hp: 30, d: "Je suis LE MISTRAL ! Nul ne reconstruira ces restanques !" },
};

export const QUESTS_DEF = [
  { id: "q1", t: "Récolte 3 branches", need: { branche: 3 } as Record<string, number>, needTool: null as string | null, needBoss: null as string | null, xp: 10, reward: "herbe" as string | null },
  { id: "q2", t: "Récolte 2 lavandes", need: { lavande: 2 }, needTool: null, needBoss: null, xp: 15, reward: "potion" },
  { id: "q3", t: "Forge le Bâton", need: null, needTool: "baton", needBoss: null, xp: 25, reward: "pierre" },
  { id: "q4", t: "Vaincs le Sanglier", need: null, needTool: null, needBoss: "garrigue", xp: 30, reward: "potion" },
  { id: "q5", t: "Récolte 2 cristaux", need: { cristal: 2 }, needTool: null, needBoss: null, xp: 20, reward: "perle" },
  { id: "q6", t: "Forge la Clé Ancienne", need: null, needTool: "cle", needBoss: null, xp: 50, reward: "potion" },
  { id: "q7", t: "Vaincs le Mistral !", need: null, needTool: null, needBoss: "restanques", xp: 100, reward: null },
];

export const BIOME_ZONES: Record<string, { cx: number; cy: number; r: number }> = {
  garrigue:   { cx: 50,  cy: 50,  r: 35 },
  calanques:  { cx: 150, cy: 50,  r: 30 },
  mines:      { cx: 50,  cy: 150, r: 30 },
  mer:        { cx: 150, cy: 150, r: 35 },
  restanques: { cx: 100, cy: 100, r: 20 },
};

export const VILLAGES = [
  { x: 35, y: 35, name: "Hameau du Thym", items: [{ sell: "pain", cost: ["branche"] }, { sell: "potion", cost: ["lavande", "herbe"] }] },
  { x: 65, y: 35, name: "Bastide du Romarin", items: [{ sell: "potion", cost: ["branche", "herbe"] }, { sell: "pain", cost: ["lavande"] }] },
  { x: 165, y: 35, name: "Port des Embruns", items: [{ sell: "potion", cost: ["sel", "coquillage"] }, { sell: "pain", cost: ["pierre"] }] },
  { x: 135, y: 65, name: "Cabanon des Vagues", items: [{ sell: "pain", cost: ["coquillage"] }, { sell: "potion", cost: ["pierre", "sel"] }] },
  { x: 35, y: 165, name: "Forge d'Ocre", items: [{ sell: "potion", cost: ["fer"] }, { sell: "pain", cost: ["ocre"] }] },
  { x: 65, y: 135, name: "Taverne du Mineur", items: [{ sell: "pain", cost: ["fer"] }, { sell: "potion", cost: ["ocre", "cristal"] }] },
  { x: 165, y: 165, name: "Cabane du Pêcheur", items: [{ sell: "pain", cost: ["poisson"] }, { sell: "potion", cost: ["corail"] }] },
  { x: 135, y: 135, name: "Phare du Corail", items: [{ sell: "potion", cost: ["perle"] }, { sell: "pain", cost: ["poisson"] }] },
];

export const MW = 200;
export const MH = 200;
// CELL est calculé dynamiquement dans le composant

export const TILES: Record<string, { bg: string; w: number; c: string }> = {
  g: { bg: "#8FBE4A", w: 1, c: "" },
  tg: { bg: "#6D9E2A", w: 1, c: "" },
  p: { bg: "#D4B896", w: 1, c: "" },
  t: { bg: "#4A7A1A", w: 0, c: "🌳" },
  r: { bg: "#A09080", w: 0, c: "🪨" },
  w: { bg: "#4AA3DF", w: 0, c: "〰" },
  dw: { bg: "#2471A3", w: 0, c: "🌊" },
  s: { bg: "#E8D5A3", w: 1, c: "" },
  cl: { bg: "#C4A882", w: 0, c: "▓" },
  mf: { bg: "#5C4033", w: 1, c: "" },
  mw: { bg: "#3D2B1F", w: 0, c: "▓" },
  cf: { bg: "#1B6E8A", w: 1, c: "" },
  dk: { bg: "#8B7355", w: 1, c: "" },
  rs: { bg: "#C4A874", w: 1, c: "" },
  rw: { bg: "#8B7355", w: 0, c: "█" },
  gt: { bg: "#6B4226", w: 0, c: "🚪" },
  fl: { bg: "#8FBE4A", w: 1, c: "🌸" },
  lv: { bg: "#B39DDB", w: 1, c: "💜" },
  vi: { bg: "#D4B896", w: 1, c: "🏘️" },
  camp: { bg: "#8FBE4A", w: 1, c: "⛺" },
};

export const CAMP_POS = { x: 50, y: 46 };
export const CAMP_RADIUS = 2; // safe zone 5×5 around camp

export interface PlayerStats {
  atk: number;
  def: number;
  mag: number;
  vit: number;
}
export const BAG_LIMIT = 20;

// Node harvest HP by resource type
export const NODE_HP: Record<string, number> = {
  herbe: 2, lavande: 2, branche: 3, coquillage: 2, sel: 3,
  pierre: 5, fer: 6, ocre: 5, poisson: 3, perle: 4, corail: 4,
  cristal: 8,
};

// ─── EQUIPMENT ───
export type EquipSlot = "arme" | "armure" | "amulette" | "bottes";

export interface Equipment {
  id: string;
  name: string;
  emoji: string;
  slot: EquipSlot;
  stats: Partial<PlayerStats>;
  biome: string; // where to find it
  recipe: Record<string, number>; // craft recipe
}

export const EQUIPMENTS: Equipment[] = [
  // ARMES
  { id: "epee_bois", name: "Épée en bois", emoji: "🗡️", slot: "arme", stats: { atk: 2 }, biome: "garrigue", recipe: { branche: 3, pierre: 1 } },
  { id: "epee_fer", name: "Épée de fer", emoji: "⚔️", slot: "arme", stats: { atk: 5 }, biome: "mines", recipe: { fer: 3, branche: 1 } },
  { id: "trident", name: "Trident de corail", emoji: "🔱", slot: "arme", stats: { atk: 7, mag: 3 }, biome: "mer", recipe: { corail: 3, perle: 1, fer: 1 } },
  // ARMURES
  { id: "tunique_cuir", name: "Tunique de cuir", emoji: "🧥", slot: "armure", stats: { def: 2 }, biome: "garrigue", recipe: { herbe: 4, branche: 2 } },
  { id: "cotte_ecailles", name: "Cotte d'écailles", emoji: "🐟", slot: "armure", stats: { def: 5 }, biome: "mer", recipe: { coquillage: 4, fer: 2 } },
  // AMULETTES
  { id: "amulette_herbes", name: "Amulette d'herbes", emoji: "📿", slot: "amulette", stats: { mag: 2 }, biome: "garrigue", recipe: { lavande: 3, herbe: 2 } },
  { id: "collier_perles", name: "Collier de perles", emoji: "💎", slot: "amulette", stats: { mag: 5, def: 2 }, biome: "mer", recipe: { perle: 3, cristal: 1 } },
  // BOTTES
  { id: "sandales", name: "Sandales", emoji: "👡", slot: "bottes", stats: { vit: 2 }, biome: "garrigue", recipe: { herbe: 3, branche: 1 } },
  { id: "bottes_vent", name: "Bottes du Mistral", emoji: "💨", slot: "bottes", stats: { vit: 5 }, biome: "restanques", recipe: { cristal: 2, ocre: 2, perle: 1 } },
];

export function countBagItems(inv: string[]): number {
  return inv.filter((id) => id !== "pain" && id !== "potion").length;
}

export function isBagFull(inv: string[]): boolean {
  return countBagItems(inv) >= BAG_LIMIT;
}

export interface GameNode {
  x: number;
  y: number;
  biome: string;
  res: string | null;
  guard: { n: string; e: string; hp: number; d: string } | null;
  boss?: boolean;
  done: boolean;
}

export interface Gate {
  x: number;
  y: number;
  b: string;
}

export interface Village {
  x: number;
  y: number;
  name: string;
  items: { sell: string; cost: string[] }[];
}

export interface GameWorld {
  m: string[][];
  nodes: GameNode[];
  gates: Gate[];
  villages: Village[];
  Z: Record<string, { cx: number; cy: number; r: number }>;
  spawn: { x: number; y: number };
}

export interface CombatCard {
  n: string;
  d: string;
  e: string;
  color: string;
  pow: number;
}

export interface CombatState {
  grid: number[][];
  enemy: { n: string; e: string; hp: number; d: string };
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  node: GameNode;
  sel: { x: number; y: number } | null;
  combo: number;
  totalDmg: number;
  msg: string;
  won: boolean;
  lost: boolean;
  animating: boolean;
}

export interface Quest {
  id: string;
  t: string;
  need: Record<string, number> | null;
  needTool: string | null;
  needBoss: string | null;
  xp: number;
  reward: string | null;
  done: boolean;
}
