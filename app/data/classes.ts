import type { PlayerStats } from "../lib/constants";

export interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseStats: PlayerStats;
  startingSous: number;
  perks: string[];
  combatBonus: number;
  harvestSpeed: number;
  doubleLoot: number;
  detectRange: number;
  canCraft: boolean;
  canGarden: boolean;
  canCook: boolean;
  craftFailChance: number;
  hidden: boolean;
}

export const CLASSES: Record<string, PlayerClass> = {
  paladin: {
    id: "paladin",
    name: "Paladin",
    emoji: "🎸",
    description: "Combat + Exploration. Ne craft pas.",
    baseStats: { atk: 3, def: 1, mag: 0, vit: 2 },
    startingSous: 50,
    perks: ["Dégâts ×1.2", "Voit monstres à 6 cases", "Rage: combo ×3 → ATK ×1.5", "XP combat +25%"],
    combatBonus: 1.2,
    harvestSpeed: 1.0,
    doubleLoot: 0,
    detectRange: 6,
    canCraft: false,
    canGarden: false,
    canCook: false,
    craftFailChance: 0,
    hidden: false,
  },
  artisane: {
    id: "artisane",
    name: "Artisane",
    emoji: "🎨",
    description: "Maison + Jardin + Craft tout. Fragile dehors.",
    baseStats: { atk: 1, def: 1, mag: 2, vit: 1 },
    startingSous: 100,
    perks: ["Récolte -3/tap", "+50% loot", "Graines 50% drop", "Jardin ×2", "Puzzle 4×4", "10% recette secrète"],
    combatBonus: 1.0,
    harvestSpeed: 0.33,
    doubleLoot: 0.5,
    detectRange: 4,
    canCraft: true,
    canGarden: true,
    canCook: true,
    craftFailChance: 0,
    hidden: false,
  },
  ombre: {
    id: "ombre",
    name: "Ombre",
    emoji: "🌙",
    description: "Autonome. Fait tout, moins bien. 10% échec craft.",
    baseStats: { atk: 2, def: 0, mag: 1, vit: 3 },
    startingSous: 75,
    perks: ["Vitesse ×1.5", "Discrétion: détecté à 3 cases", "Critique 15% ×3", "Voit nuit à 5 cases"],
    combatBonus: 1.0,
    harvestSpeed: 0.8,
    doubleLoot: 0,
    detectRange: 3,
    canCraft: true,
    canGarden: true,
    canCook: true,
    craftFailChance: 0.1,
    hidden: false,
  },
  // Backward compat alias
  aventurier: {
    id: "paladin",
    name: "Paladin",
    emoji: "🎸",
    description: "Combat + Exploration. Ne craft pas.",
    baseStats: { atk: 3, def: 1, mag: 0, vit: 2 },
    startingSous: 50,
    perks: ["Dégâts ×1.2", "Voit monstres à 6 cases", "Rage: combo ×3 → ATK ×1.5", "XP combat +25%"],
    combatBonus: 1.2,
    harvestSpeed: 1.0,
    doubleLoot: 0,
    detectRange: 6,
    canCraft: false,
    canGarden: false,
    canCook: false,
    craftFailChance: 0,
    hidden: false,
  },
};
