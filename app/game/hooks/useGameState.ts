// ═══════════════════════════════════════════════════════════
// RESTANQUES v5.0 — Centralized Game State
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from "react";

export type EquipSlot = "arme" | "armure" | "amulette" | "bottes";

export interface PlayerStats {
  atk: number;
  def: number;
  mag: number;
  vit: number;
}

export interface Buff {
  stat: string;
  value: number;
  until: number;
}

export interface SpellOwned {
  id: string;
  level: number; // 1, 2, or 3
}

export interface GardenPlot {
  seed: string | null;
  plantedAt: number;
  growTime: number;
}

export interface QuestState {
  id: string;
  type: "main" | "secondary" | "artisane";
  title: string;
  progress: Record<string, number>;
  target: Record<string, number>;
  done: boolean;
  biome: string;
}

export interface GameState {
  // Identity
  playerName: string;
  classId: string; // 'paladin' | 'artisane' | 'ombre'
  sessionId: string | null;
  playerId: string | null;

  // Position
  x: number;
  y: number;
  currentBiome: string;
  inHome: boolean;
  inDungeon: string; // '' or dungeon seed

  // Stats
  hp: number;
  maxHp: number;
  lvl: number;
  xp: number;
  baseStats: PlayerStats;
  sous: number;

  // Inventory
  bagSize: number;
  inventory: { id: string; qty: number }[];

  // Equipment
  equipment: Record<EquipSlot, string | null>;
  ownedEquip: string[];

  // Spells
  spellsOwned: SpellOwned[];
  spellsEquipped: [string, string, string]; // 3 slots

  // Home (Artisane)
  garden: GardenPlot[];
  shopInventory: { id: string; qty: number; price: number }[];
  homeStorage: { id: string; qty: number }[];

  // Progression
  tools: string[];
  questsMain: QuestState[];
  questsSide: QuestState[];
  questsArtisane: QuestState[];
  bossesDefeated: string[];
  demibossesDefeated: string[];
  storiesSeen: string[];
  unlockedBiomes: string[];
  dungeonCleared: string[];
  bestiary: string[]; // monster IDs discovered
  keyFragments: Record<string, number>; // biome -> fragment count (0-3)

  // State
  buffs: Buff[];
  debuffs: string[];
  torches: number;
  torchActive: boolean;
  torchEnd: number;
  fatigueUntil: number;
  introSeen: boolean;
  ngPlus: number;
  active: boolean;

  // Day/Night
  timeOfDay: number; // 0-1 cycle (15 min)

  // UI
  notifications: { id: number; text: string; time: number }[];
}

export function createInitialState(
  playerName: string,
  classId: string,
  startingSous: number,
  baseStats: PlayerStats,
): GameState {
  return {
    playerName,
    classId,
    sessionId: null,
    playerId: null,

    x: 75,
    y: 75,
    currentBiome: "garrigue",
    inHome: classId === "artisane",
    inDungeon: "",

    hp: 15,
    maxHp: 15,
    lvl: 1,
    xp: 0,
    baseStats: { ...baseStats },
    sous: startingSous,

    bagSize: 8,
    inventory: [],

    equipment: { arme: null, armure: null, amulette: null, bottes: null },
    ownedEquip: [],

    spellsOwned: [],
    spellsEquipped: ["", "", ""],

    garden: Array.from({ length: 16 }, () => ({ seed: null, plantedAt: 0, growTime: 0 })),
    shopInventory: [],
    homeStorage: [],

    tools: [],
    questsMain: [],
    questsSide: [],
    questsArtisane: [],
    bossesDefeated: [],
    demibossesDefeated: [],
    storiesSeen: [],
    unlockedBiomes: ["garrigue"],
    dungeonCleared: [],
    bestiary: [],
    keyFragments: {},

    buffs: [],
    debuffs: [],
    torches: 0,
    torchActive: false,
    torchEnd: 0,
    fatigueUntil: 0,
    introSeen: false,
    ngPlus: 0,
    active: true,

    timeOfDay: 0.2,

    notifications: [],
  };
}

// ─── LEVEL UP LOGIC ───
export function getLevelUpStats(
  classId: string,
  currentStats: PlayerStats,
): PlayerStats {
  const ns = { ...currentStats };
  if (classId === "paladin") {
    ns.atk += 1;
    if (Math.random() < 0.5) ns.def += 1;
    if (Math.random() < 0.25) ns.vit += 1;
  } else if (classId === "artisane") {
    ns.mag += 1;
    if (Math.random() < 0.5) ns.def += 1;
    if (Math.random() < 0.25) ns.vit += 1;
  } else {
    // ombre
    ns.vit += 1;
    if (Math.random() < 0.5) ns.atk += 1;
    if (Math.random() < 0.25) ns.mag += 1;
  }
  return ns;
}

// ─── TOTAL STATS (base + equipment + buffs) ───
export function getTotalStats(
  baseStats: PlayerStats,
  equipment: Record<EquipSlot, string | null>,
  equipmentData: { id: string; stats: Partial<PlayerStats> }[],
  buffs: Buff[],
): PlayerStats {
  const total = { ...baseStats };
  // Add equipment stats
  for (const slot of Object.values(equipment)) {
    if (!slot) continue;
    const eq = equipmentData.find((e) => e.id === slot);
    if (eq) {
      if (eq.stats.atk) total.atk += eq.stats.atk;
      if (eq.stats.def) total.def += eq.stats.def;
      if (eq.stats.mag) total.mag += eq.stats.mag;
      if (eq.stats.vit) total.vit += eq.stats.vit;
    }
  }
  // Add active buffs
  const now = Date.now();
  for (const buff of buffs) {
    if (buff.until > 0 && buff.until < now) continue;
    if (buff.stat === "all") {
      total.atk += buff.value;
      total.def += buff.value;
      total.mag += buff.value;
      total.vit += buff.value;
    } else if (buff.stat in total) {
      total[buff.stat as keyof PlayerStats] += buff.value;
    }
  }
  return total;
}

// ─── XP NEEDED ───
export function xpNeeded(level: number): number {
  return level * 50;
}

// ─── DEATH PENALTY ───
export function deathPenalty(state: GameState): Partial<GameState> {
  return {
    hp: Math.ceil(state.maxHp * 0.5),
    sous: Math.max(0, state.sous - Math.floor(state.sous * 0.1)),
    fatigueUntil: Date.now() + 120000, // 2 minutes
    inHome: true,
    inDungeon: "",
  };
}

// ─── INVENTORY HELPERS ───
export function addToInventory(
  inventory: { id: string; qty: number }[],
  itemId: string,
  qty: number,
  bagSize: number,
): { inventory: { id: string; qty: number }[]; overflow: number } {
  const existing = inventory.find((i) => i.id === itemId);
  if (existing) {
    existing.qty += qty;
    return { inventory: [...inventory], overflow: 0 };
  }
  // Count unique item types (slots used)
  const slotsUsed = inventory.length;
  if (slotsUsed >= bagSize) {
    return { inventory, overflow: qty };
  }
  return {
    inventory: [...inventory, { id: itemId, qty }],
    overflow: 0,
  };
}

export function removeFromInventory(
  inventory: { id: string; qty: number }[],
  itemId: string,
  qty: number,
): { inventory: { id: string; qty: number }[]; success: boolean } {
  const existing = inventory.find((i) => i.id === itemId);
  if (!existing || existing.qty < qty) {
    return { inventory, success: false };
  }
  if (existing.qty === qty) {
    return {
      inventory: inventory.filter((i) => i.id !== itemId),
      success: true,
    };
  }
  existing.qty -= qty;
  return { inventory: [...inventory], success: true };
}

export function hasItems(
  inventory: { id: string; qty: number }[],
  recipe: Record<string, number>,
): boolean {
  for (const [itemId, needed] of Object.entries(recipe)) {
    const have = inventory.find((i) => i.id === itemId)?.qty || 0;
    if (have < needed) return false;
  }
  return true;
}

export function consumeRecipe(
  inventory: { id: string; qty: number }[],
  recipe: Record<string, number>,
): { id: string; qty: number }[] | null {
  // Check first
  if (!hasItems(inventory, recipe)) return null;
  let inv = [...inventory.map((i) => ({ ...i }))];
  for (const [itemId, needed] of Object.entries(recipe)) {
    const item = inv.find((i) => i.id === itemId)!;
    item.qty -= needed;
    if (item.qty <= 0) inv = inv.filter((i) => i.id !== itemId);
  }
  return inv;
}

// ─── MOVEMENT SPEED ───
export function getMoveSpeed(classId: string, hasBoots: boolean): number {
  let speed = 2; // base: 2 pixels per frame
  if (hasBoots) speed *= 1.3;
  if (classId === "ombre") speed *= 1.5;
  return speed;
}

// ─── DAY/NIGHT CYCLE ───
export function getDayPhase(t: number): "dawn" | "day" | "dusk" | "night" {
  if (t < 0.15) return "dawn";
  if (t < 0.45) return "day";
  if (t < 0.55) return "dusk";
  return "night";
}

export function getVisibility(
  phase: ReturnType<typeof getDayPhase>,
  torchActive: boolean,
  classId: string,
  biomeAlwaysNight?: boolean,
): number {
  if (biomeAlwaysNight && !torchActive) return 3;
  if (torchActive) return 7;
  if (phase === "day") return 999; // unlimited
  if (phase === "dawn" || phase === "dusk") return 8;
  // Night
  if (classId === "ombre") return 5;
  return 3;
}
