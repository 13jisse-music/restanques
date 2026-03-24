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
  // 8 nouveaux sorts
  { r: ["branche", "ocre", "herbe"], c: { n: "Brasier", d: "-2 PV/tour 3t", e: "🔥", color: COLORS.orange, pow: 2 } },
  { r: ["sel", "coquillage"], c: { n: "Gel", d: "Bloque 2 col 2t", e: "❄️", color: COLORS.sky, pow: 0 } },
  { r: ["cristal", "perle"], c: { n: "Miroir", d: "Renvoie 50% 2t", e: "🪞", color: COLORS.crystal, pow: 0 } },
  { r: ["fer", "ocre", "cristal"], c: { n: "Confusion", d: "Auto-attaque 1t", e: "🔄", color: COLORS.violet, pow: 0 } },
  { r: ["corail", "perle", "cristal"], c: { n: "Malédiction", d: "-1 ATK permanent", e: "💀", color: "#333", pow: 0 } },
  { r: ["lavande", "lavande", "cristal"], c: { n: "Lumière", d: "×2 si jour", e: "☀️", color: COLORS.sun, pow: 6 } },
  { r: ["fer", "fer", "ocre"], c: { n: "Ombre sort", d: "×2 si nuit", e: "🌙", color: "#2D2D4A", pow: 6 } },
  { r: ["pierre", "pierre", "herbe"], c: { n: "Ralentissement", d: "1 tour/2 3t", e: "⏳", color: COLORS.stone, pow: 0 } },
];

// Monstres normaux par biome (patrouille)
export const BIOME_MOBS: Record<string, { n: string; e: string; lv: number }[]> = {
  garrigue:   [{ n: "Rat", e: "🐀", lv: 1 }, { n: "Lapin", e: "🐇", lv: 2 }, { n: "Abeille", e: "🐝", lv: 3 }, { n: "Renard", e: "🦊", lv: 4 }],
  calanques:  [{ n: "Crabe", e: "🦀", lv: 5 }, { n: "Goéland", e: "🐦", lv: 6 }, { n: "Méduse", e: "🪼", lv: 7 }, { n: "Bernard", e: "🐚", lv: 8 }],
  mines:      [{ n: "Chauve-souris", e: "🦇", lv: 10 }, { n: "Scorpion", e: "🦂", lv: 11 }, { n: "Golem", e: "🪨", lv: 12 }, { n: "Araignée", e: "🕷️", lv: 13 }],
  mer:        [{ n: "Poisson-globe", e: "🐡", lv: 15 }, { n: "Requin", e: "🦈", lv: 16 }, { n: "Anguille", e: "⚡", lv: 17 }, { n: "Poulpe", e: "🐙", lv: 18 }],
  restanques: [{ n: "Spectre", e: "👻", lv: 20 }, { n: "Golem ancien", e: "🗿", lv: 21 }, { n: "Gardien", e: "⚔️", lv: 22 }, { n: "Tourbillon", e: "🌪️", lv: 23 }],
};

// Forteresses boss (positions fixes, pas de patrouille)
export const FORTRESSES: Record<string, { x: number; y: number; name: string }> = {
  garrigue:   { x: 85, y: 85, name: "Tanière du Sanglier" },
  calanques:  { x: 15, y: 85, name: "Nid de la Mouette" },
  mines:      { x: 85, y: 15, name: "Caverne de la Tarasque" },
  mer:        { x: 15, y: 15, name: "Abysse de la Pieuvre" },
  restanques: { x: 50, y: 50, name: "Trône du Mistral" },
};

export const GUARDS: Record<string, { n: string; e: string; hp: number; atk: number; d: string }> = {
  garrigue: { n: "Sanglier Ancien", e: "🐗", hp: 50, atk: 12, d: "GRRR ! Mes collines !" },
  calanques: { n: "Mouette Géante", e: "🦅", hp: 80, atk: 18, d: "CRIII ! Mes falaises !" },
  mines: { n: "Tarasque", e: "🐉", hp: 120, atk: 25, d: "Ces mines m'appartiennent..." },
  mer: { n: "Pieuvre Géante", e: "🦑", hp: 180, atk: 35, d: "Mes tentacules gardent ces trésors !" },
  restanques: { n: "Le Mistral", e: "🌪️", hp: 300, atk: 50, d: "JE SUIS LE MISTRAL !" },
};

// Monster stats by level (exponential scaling)
export function monsterHp(lv: number): number {
  if (lv <= 1) return 8;
  if (lv <= 4) return 8 + (lv - 1) * 5; // 8, 13, 18, 23
  if (lv <= 8) return 28 + (lv - 5) * 4; // 28, 32, 36, 40
  if (lv <= 13) return 40 + (lv - 8) * 5; // 40, 45, 50, 55, 60
  if (lv <= 18) return 60 + (lv - 13) * 5; // 60, 65, 70, 75, 80, 85
  return 85 + (lv - 18) * 7; // 85, 92, 99, 106, 113, 120
}
export function monsterAtk(lv: number): number {
  if (lv <= 1) return 2;
  if (lv <= 4) return 2 + lv; // 3, 4, 5, 6
  if (lv <= 8) return 7 + (lv - 5); // 7, 8, 9, 10
  if (lv <= 13) return 12 + (lv - 9); // 12, 13, 14, 15, 16
  if (lv <= 18) return 18 + (lv - 14); // 18, 19, 20, 21, 22
  return 25 + (lv - 19) * 2; // 25, 27, 29, 31, 33, 35
}

// Night monster variants
export const NIGHT_MOBS: Record<string, { n: string; e: string; lv: number }> = {
  garrigue: { n: "Hibou", e: "🦉", lv: 4 },
  calanques: { n: "Chauve-souris", e: "🦇", lv: 8 },
  mer: { n: "Calmar", e: "🦑", lv: 18 },
  restanques: { n: "Spectre noir", e: "👻", lv: 23 },
};

// Torch recipe
export const TORCH_RECIPE = { branche: 2, herbe: 1 };

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

export const MW = 100;
export const MH = 100;
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

// Fortress keys — needed to enter boss fortress
export const FORTRESS_KEYS: Record<string, string> = {
  garrigue: "cle_taniere",
  calanques: "cle_nid",
  mines: "cle_caverne",
  mer: "cle_abysses",
  restanques: "cle", // the Clé Ancienne (craftable)
};

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

// ═══ GARDEN (Artisane) ═══
export interface GardenPlot { seed: string | null; plantedAt: number; growTime: number }
export const GARDEN_SEEDS: Record<string, { name: string; emoji: string; growTime: number; yields: string }> = {
  herbe:       { name: "Herbe fraîche", emoji: "🌿", growTime: 120, yields: "herbe_fraiche" },
  lavande:     { name: "Lavande pure", emoji: "💜", growTime: 180, yields: "lavande_pure" },
  champignon:  { name: "Champignon", emoji: "🍄", growTime: 300, yields: "champignon" },
  baies:       { name: "Baies dorées", emoji: "🫐", growTime: 240, yields: "baies" },
};

// ═══ CUISINE (Artisane) ═══
export const RECIPES_CUISINE: { name: string; emoji: string; recipe: Record<string, number>; buff: { stat: string; value: number; duration: number }; desc: string }[] = [
  { name: "Ragoût provençal", emoji: "🍖", recipe: { herbe_fraiche: 2, poisson: 1 }, buff: { stat: "atk", value: 3, duration: 300 }, desc: "ATK +3 pendant 5 min" },
  { name: "Élixir de vie", emoji: "🧪", recipe: { champignon: 1, baies: 2 }, buff: { stat: "hp", value: 15, duration: 0 }, desc: "Soigne 15 PV" },
  { name: "Bouillon fortifiant", emoji: "🛡️", recipe: { herbe_fraiche: 1, baies: 1 }, buff: { stat: "def", value: 3, duration: 300 }, desc: "DEF +3 pendant 5 min" },
  { name: "Infusion magique", emoji: "✨", recipe: { lavande_pure: 2, champignon: 1 }, buff: { stat: "mag", value: 5, duration: 300 }, desc: "MAG +5 pendant 5 min" },
];

// ═══ FUSION ═══
export const FUSION_RESULTS: Record<string, { name: string; emoji: string; value: string }> = {
  herbe: { name: "Herbe concentrée", emoji: "🌿✨", value: "herbe_conc" },
  pierre: { name: "Pierre taillée", emoji: "🪨✨", value: "pierre_taillee" },
  cristal: { name: "Cristal pur", emoji: "💎✨", value: "cristal_pur" },
  lavande: { name: "Essence de lavande", emoji: "💜✨", value: "essence_lavande" },
};
