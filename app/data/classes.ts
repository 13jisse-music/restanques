import type { PlayerStats } from "../lib/constants";

export interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseStats: PlayerStats;
  perks: string[];
  combatBonus: number;  // multiplier on damage
  harvestSpeed: number; // multiplier on harvest (lower = faster)
  doubleLoot: number;   // chance of double loot on craft (0-1)
  detectRange: number;  // monster detection range on minimap
  hidden: boolean;      // not selectable until unlocked
}

export const CLASSES: Record<string, PlayerClass> = {
  aventurier: {
    id: "aventurier",
    name: "L'Aventurier",
    emoji: "🎸",
    description: "Spécialiste du combat et de l'exploration",
    baseStats: { atk: 3, def: 1, mag: 0, vit: 2 },
    perks: ["Dégâts +20% en combat", "Détecte les monstres à 5 cases"],
    combatBonus: 1.2,
    harvestSpeed: 1.0,
    doubleLoot: 0,
    detectRange: 5,
    hidden: false,
  },
  artisane: {
    id: "artisane",
    name: "L'Artisane",
    emoji: "🎨",
    description: "Spécialiste du craft et de la récolte",
    baseStats: { atk: 1, def: 1, mag: 2, vit: 1 },
    perks: ["Récolte 2× plus vite", "30% de chance de double loot au craft"],
    combatBonus: 1.0,
    harvestSpeed: 0.5,
    doubleLoot: 0.3,
    detectRange: 3,
    hidden: false,
  },
  ombre: {
    id: "ombre",
    name: "L'Ombre",
    emoji: "🌙",
    description: "Maître des donjons (débloqué après la victoire)",
    baseStats: { atk: 2, def: 0, mag: 1, vit: 3 },
    perks: ["Invisible 5s après un kill", "Dégâts critiques ×3 (15%)", "Vitesse +30%"],
    combatBonus: 1.0,
    harvestSpeed: 0.8,
    doubleLoot: 0,
    detectRange: 4,
    hidden: true,
  },
};
