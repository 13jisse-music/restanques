// Shared types for Restanques game
export interface Pos { x: number; y: number }

export interface MapTile {
  biome: string;
  type: "ground"|"path"|"block"|"water"|"resource"|"portal"|"npc"|"fortress"|"home";
  resId?: string; resHp?: number; portalTo?: string; npcId?: string;
}

export interface Mob {
  id: string; mId: string; x: number; y: number;
  hp: number; maxHp: number; atk: number; lv: number;
  drops: string[]; sous: [number,number]; emoji: string;
  name: string; dir: number; moveT: number; isBoss?: boolean;
}

export interface PuyoGem { color: number; x: number; y: number; matched?: boolean; falling?: boolean }

export interface CombatState {
  enemy: Mob; grid: PuyoGem[][]; playerHp: number; enemyHp: number;
  turn: number; combo: number; msg: string;
  phase: "play"|"resolve"|"win"|"lose"; selected: Pos|null; animating: boolean;
}

export interface FloatMsg { id: number; x: number; y: number; text: string; color: string; t: number }

export interface GardenPlot {
  id: number; seedId: string|null; plantedAt: number; growTime: number;
  yields: string; qty: [number,number]; ready: boolean;
}

export interface GameState {
  bag: Record<string, number>;
  sous: number;
  hp: number; maxHp: number;
  lv: number; xp: number;
  stats: { atk: number; def: number; mag: number; vit: number };
  equip: Record<string, string>;
  spells: string[];
  spellLevels: Record<string, number>;
  garden: GardenPlot[];
  bossesDefeated: string[];
  questsDone: string[];
  unlockedRecipes: string[];
  bestiaire: string[];
  onboardingStep: number;
  newGamePlus: number;
}

export const defaultGameState = (cls: { hp: number; sous: number; baseStats: { atk: number; def: number; mag: number; vit: number } }): GameState => ({
  bag: {}, sous: cls.sous, hp: cls.hp, maxHp: cls.hp,
  lv: 1, xp: 0, stats: {...cls.baseStats}, equip: {}, spells: [],
  spellLevels: {},
  garden: Array.from({length: 16}, (_, i) => ({ id: i, seedId: null, plantedAt: 0, growTime: 0, yields: "", qty: [0,0] as [number,number], ready: false })),
  bossesDefeated: [], questsDone: [], unlockedRecipes: [],
  bestiaire: [], onboardingStep: 0, newGamePlus: 0,
});

export const TILE_PX = 32;
export const MAP_W = 150, MAP_H = 150;
export const PUYO_W = 6, PUYO_H = 8;
export const GEM_COLORS = ["🔴","🔵","🟢","🟡","🟣","🟠"];
