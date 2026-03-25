// ═══ 3 CLASSES — CDC Part 2 ═══
export interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  baseStats: { atk: number; def: number; mag: number; vit: number };
  startHp: number;
  startSous: number;
  combatBonus: number;
  speedMult: number;
  detectRange: number;
  canCraft: boolean;
  craftFail: number;
  harvestPerTap: number;
  levelUp: { always: string; chance50: string; chance25: string };
}

export const CLASSES: Record<string, PlayerClass> = {
  paladin: {
    id: "paladin", name: "Paladin", emoji: "🎸",
    desc: "Explore + Combat. Ne craft pas. Achète chez Mélanie.",
    baseStats: { atk: 3, def: 1, mag: 0, vit: 2 },
    startHp: 15, startSous: 50,
    combatBonus: 1.2, speedMult: 1.0, detectRange: 6,
    canCraft: false, craftFail: 0, harvestPerTap: 1,
    levelUp: { always: "atk", chance50: "def", chance25: "vit" },
  },
  artisane: {
    id: "artisane", name: "Artisane", emoji: "🎨",
    desc: "Maison + Jardin + Craft tout. Fragile dehors.",
    baseStats: { atk: 1, def: 1, mag: 2, vit: 1 },
    startHp: 15, startSous: 100,
    combatBonus: 1.0, speedMult: 1.0, detectRange: 4,
    canCraft: true, craftFail: 0, harvestPerTap: 3,
    levelUp: { always: "mag", chance50: "def", chance25: "vit" },
  },
  ombre: {
    id: "ombre", name: "Ombre", emoji: "🌙",
    desc: "Autonome. Fait tout, 10% échec craft.",
    baseStats: { atk: 2, def: 0, mag: 1, vit: 3 },
    startHp: 15, startSous: 75,
    combatBonus: 1.0, speedMult: 1.5, detectRange: 3,
    canCraft: true, craftFail: 0.1, harvestPerTap: 2,
    levelUp: { always: "vit", chance50: "atk", chance25: "mag" },
  },
};
