"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CLASSES, PlayerClass } from "../data/classes";
import { sounds } from "../lib/sounds";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const TILE = 32;
const BASE_SPEED = 2;
const WORLD_W = 150;
const WORLD_H = 150;
const HOME_W = 100;
const HOME_H = 100;
const PLAYER_HITBOX = 16;
const FPS = 60;
const FRAME_MS = 1000 / FPS;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type TileType =
  | "grass" | "tall_grass" | "path" | "tree" | "rock" | "water"
  | "village" | "gate" | "fortress" | "camp" | "sand" | "dark_ground"
  | "stone_floor" | "arena";

type BiomeId = "garrigue" | "calanques" | "mines" | "mer" | "restanques";

interface Monster {
  id: number;
  x: number; y: number;
  emoji: string;
  name: string;
  lvl: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  biome: BiomeId;
  alive: boolean;
  xpReward: number;
  sousReward: number;
}

interface ResourceNode {
  id: number;
  x: number; y: number;
  type: string;
  emoji: string;
  hp: number;
  maxHp: number;
  biome: BiomeId;
  alive: boolean;
}

interface NPC {
  id: number;
  x: number; y: number;
  emoji: string;
  name: string;
  type: "shop" | "quest" | "info";
  biome: BiomeId;
}

interface InvItem {
  id: string;
  qty: number;
}

type GamePhase = "world" | "home" | "combat" | "shop" | "dialogue";

// Puyo gem colors
const GEM_COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#F1C40F", "#9B59B6", "#E67E22"];
const GEM_EMOJIS = ["\u2764", "\u25C6", "\u2605", "\u25CF", "\u25B2", "\u25A0"];
type GemCell = number | null; // 0-5 color index, null = empty

// ═══════════════════════════════════════════════════════════════
// SEEDED RNG
// ═══════════════════════════════════════════════════════════════
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ═══════════════════════════════════════════════════════════════
// BIOME DEFINITIONS
// ═══════════════════════════════════════════════════════════════
interface BiomeDef {
  id: BiomeId;
  name: string;
  grassColor: string;
  accentColor: string;
  pathColor: string;
  treeColor: string;
  rockColor: string;
  waterColor: string;
  cx: number; cy: number; // center in world coords
  radius: number;
  monsters: { emoji: string; name: string; minLvl: number; maxLvl: number; atk: number; def: number }[];
  resources: { type: string; emoji: string }[];
}

const BIOMES: Record<BiomeId, BiomeDef> = {
  garrigue: {
    id: "garrigue", name: "Garrigue",
    grassColor: "#8FBE4A", accentColor: "#A4D65E", pathColor: "#C8B464",
    treeColor: "#3D6B1E", rockColor: "#888", waterColor: "#4FA4C7",
    cx: 75, cy: 75, radius: 35,
    monsters: [
      { emoji: "\uD83D\uDC17", name: "Sanglier", minLvl: 1, maxLvl: 3, atk: 2, def: 1 },
      { emoji: "\uD83E\uDD82", name: "Scorpion", minLvl: 2, maxLvl: 4, atk: 3, def: 1 },
      { emoji: "\uD83D\uDC0D", name: "Serpent", minLvl: 1, maxLvl: 3, atk: 2, def: 0 },
      { emoji: "\uD83E\uDD85", name: "Aigle", minLvl: 3, maxLvl: 5, atk: 4, def: 1 },
    ],
    resources: [
      { type: "herb", emoji: "\uD83C\uDF3F" },
      { type: "wood", emoji: "\uD83E\uDEB5" },
      { type: "stone", emoji: "\uD83E\uDEA8" },
    ],
  },
  calanques: {
    id: "calanques", name: "Calanques",
    grassColor: "#E8D5A3", accentColor: "#F0E4BF", pathColor: "#D4C090",
    treeColor: "#6B8E4E", rockColor: "#B0A080", waterColor: "#1B9AD4",
    cx: 130, cy: 40, radius: 25,
    monsters: [
      { emoji: "\uD83E\uDD80", name: "Crabe", minLvl: 3, maxLvl: 5, atk: 3, def: 3 },
      { emoji: "\uD83D\uDC19", name: "Poulpe", minLvl: 4, maxLvl: 6, atk: 4, def: 2 },
      { emoji: "\uD83E\uDD88", name: "Requin", minLvl: 5, maxLvl: 7, atk: 5, def: 2 },
    ],
    resources: [
      { type: "shell", emoji: "\uD83D\uDC1A" },
      { type: "coral", emoji: "\uD83E\uDE78" },
      { type: "pearl", emoji: "\u26AA" },
    ],
  },
  mines: {
    id: "mines", name: "Mines",
    grassColor: "#5C4033", accentColor: "#6B4E3D", pathColor: "#4A3628",
    treeColor: "#3A2A1A", rockColor: "#666", waterColor: "#2A5040",
    cx: 30, cy: 130, radius: 25,
    monsters: [
      { emoji: "\uD83E\uDDA7", name: "Chauve-souris", minLvl: 4, maxLvl: 6, atk: 3, def: 1 },
      { emoji: "\uD83D\uDC80", name: "Squelette", minLvl: 5, maxLvl: 7, atk: 5, def: 3 },
      { emoji: "\uD83D\uDC7B", name: "Spectre", minLvl: 6, maxLvl: 8, atk: 6, def: 2 },
    ],
    resources: [
      { type: "iron", emoji: "\u2699\uFE0F" },
      { type: "gem", emoji: "\uD83D\uDC8E" },
      { type: "coal", emoji: "\u26AB" },
    ],
  },
  mer: {
    id: "mer", name: "Mer",
    grassColor: "#1B6E8A", accentColor: "#2080A0", pathColor: "#1A5F78",
    treeColor: "#0D4A5A", rockColor: "#4A6A7A", waterColor: "#0E4D8A",
    cx: 130, cy: 130, radius: 25,
    monsters: [
      { emoji: "\uD83D\uDC20", name: "Poisson-lune", minLvl: 5, maxLvl: 7, atk: 4, def: 3 },
      { emoji: "\uD83E\uDDAD", name: "Phoque", minLvl: 6, maxLvl: 8, atk: 5, def: 4 },
      { emoji: "\uD83D\uDC33", name: "Baleine", minLvl: 8, maxLvl: 10, atk: 7, def: 5 },
    ],
    resources: [
      { type: "algae", emoji: "\uD83C\uDF3F" },
      { type: "driftwood", emoji: "\uD83E\uDEB5" },
      { type: "salt", emoji: "\uD83E\uDDC2" },
    ],
  },
  restanques: {
    id: "restanques", name: "Restanques",
    grassColor: "#C4A874", accentColor: "#D4B884", pathColor: "#AA9060",
    treeColor: "#5A7A3A", rockColor: "#9A8A6A", waterColor: "#5A8AA0",
    cx: 30, cy: 40, radius: 25,
    monsters: [
      { emoji: "\uD83D\uDC3A", name: "Loup", minLvl: 3, maxLvl: 5, atk: 4, def: 2 },
      { emoji: "\uD83E\uDD89", name: "Hibou", minLvl: 4, maxLvl: 6, atk: 3, def: 2 },
      { emoji: "\uD83D\uDC3B", name: "Ours", minLvl: 6, maxLvl: 9, atk: 6, def: 4 },
    ],
    resources: [
      { type: "vine", emoji: "\uD83C\uDF47" },
      { type: "clay", emoji: "\uD83E\uDEAF" },
      { type: "lavender", emoji: "\uD83C\uDF3B" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// WORLD GENERATION
// ═══════════════════════════════════════════════════════════════
function getBiomeAt(tx: number, ty: number): BiomeId {
  let closest: BiomeId = "garrigue";
  let minDist = Infinity;
  for (const b of Object.values(BIOMES)) {
    const d = Math.hypot(tx - b.cx, ty - b.cy);
    if (d < minDist) { minDist = d; closest = b.id; }
  }
  return closest;
}

function generateWorld(seed: number) {
  const rng = mulberry32(seed);
  const tiles: TileType[][] = [];
  const biomeMap: BiomeId[][] = [];

  // Generate base terrain
  for (let y = 0; y < WORLD_H; y++) {
    tiles[y] = [];
    biomeMap[y] = [];
    for (let x = 0; x < WORLD_W; x++) {
      const biome = getBiomeAt(x, y);
      biomeMap[y][x] = biome;
      const r = rng();
      if (r < 0.05) tiles[y][x] = "tree";
      else if (r < 0.08) tiles[y][x] = "rock";
      else if (r < 0.10) tiles[y][x] = "water";
      else if (r < 0.18) tiles[y][x] = "tall_grass";
      else if (r < 0.22) tiles[y][x] = "path";
      else tiles[y][x] = "grass";
    }
  }

  // Place camp at center
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = 75 + dx, ty = 75 + dy;
      if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
        tiles[ty][tx] = "camp";
      }
    }
  }

  // Place paths from center outward (cross pattern)
  for (let i = 0; i < WORLD_W; i++) {
    if (tiles[75]?.[i] && tiles[75][i] !== "camp") tiles[75][i] = "path";
    if (tiles[i]?.[75] && tiles[i][75] !== "camp") tiles[i][75] = "path";
  }

  // Place villages (2 per biome-ish)
  const villageLocs: { x: number; y: number }[] = [];
  const biomeKeys = Object.keys(BIOMES) as BiomeId[];
  for (const bk of biomeKeys) {
    const b = BIOMES[bk];
    for (let v = 0; v < 2; v++) {
      const angle = rng() * Math.PI * 2;
      const dist = 8 + rng() * (b.radius - 12);
      const vx = Math.round(b.cx + Math.cos(angle) * dist);
      const vy = Math.round(b.cy + Math.sin(angle) * dist);
      if (vx > 2 && vx < WORLD_W - 2 && vy > 2 && vy < WORLD_H - 2) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            tiles[vy + dy][vx + dx] = "village";
          }
        }
        villageLocs.push({ x: vx, y: vy });
      }
    }
  }

  // Place fortress in each biome (boss arena)
  const fortressLocs: { x: number; y: number; biome: BiomeId }[] = [];
  for (const bk of biomeKeys) {
    const b = BIOMES[bk];
    const angle = rng() * Math.PI * 2;
    const dist = b.radius * 0.7;
    const fx = Math.round(b.cx + Math.cos(angle) * dist);
    const fy = Math.round(b.cy + Math.sin(angle) * dist);
    if (fx > 3 && fx < WORLD_W - 3 && fy > 3 && fy < WORLD_H - 3) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          tiles[fy + dy][fx + dx] = "fortress";
        }
      }
      fortressLocs.push({ x: fx, y: fy, biome: bk });
    }
  }

  // Place gates between biomes
  const gatePairs: [BiomeId, BiomeId][] = [
    ["garrigue", "calanques"], ["garrigue", "mines"],
    ["garrigue", "restanques"], ["garrigue", "mer"],
  ];
  for (const [a, ba] of gatePairs) {
    const bA = BIOMES[a], bB = BIOMES[ba];
    const gx = Math.round((bA.cx + bB.cx) / 2);
    const gy = Math.round((bA.cy + bB.cy) / 2);
    if (gx > 1 && gx < WORLD_W - 1 && gy > 1 && gy < WORLD_H - 1) {
      tiles[gy][gx] = "gate";
      tiles[gy][gx - 1] = "path";
      tiles[gy][gx + 1] = "path";
    }
  }

  // Place arena tile near camp
  tiles[73][75] = "arena";

  // Generate monsters
  const monsters: Monster[] = [];
  let mId = 0;
  for (const bk of biomeKeys) {
    const b = BIOMES[bk];
    const count = 80 + Math.floor(rng() * 21); // 80-100
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 3 + rng() * (b.radius - 5);
      const mx = Math.round(b.cx + Math.cos(angle) * dist);
      const my = Math.round(b.cy + Math.sin(angle) * dist);
      if (mx < 0 || mx >= WORLD_W || my < 0 || my >= WORLD_H) continue;
      if (tiles[my][mx] === "tree" || tiles[my][mx] === "rock" || tiles[my][mx] === "water"
        || tiles[my][mx] === "camp" || tiles[my][mx] === "village" || tiles[my][mx] === "fortress") continue;
      const mdef = b.monsters[Math.floor(rng() * b.monsters.length)];
      const distFromCenter = Math.hypot(mx - b.cx, my - b.cy);
      const lvlBonus = Math.floor(distFromCenter / 10);
      const lvl = mdef.minLvl + Math.min(lvlBonus, mdef.maxLvl - mdef.minLvl);
      const mhp = 8 + lvl * 3;
      monsters.push({
        id: mId++, x: mx, y: my,
        emoji: mdef.emoji, name: mdef.name,
        lvl, hp: mhp, maxHp: mhp,
        atk: mdef.atk + lvl, def: mdef.def + Math.floor(lvl / 2),
        biome: bk, alive: true,
        xpReward: lvl * 10,
        sousReward: 5 + lvl * 3,
      });
    }
  }

  // Generate resources
  const resources: ResourceNode[] = [];
  let rId = 0;
  for (const bk of biomeKeys) {
    const b = BIOMES[bk];
    const clusterCount = 5 + Math.floor(rng() * 4); // 5-8
    for (let c = 0; c < clusterCount; c++) {
      const angle = rng() * Math.PI * 2;
      const dist = 5 + rng() * (b.radius - 8);
      const cx2 = Math.round(b.cx + Math.cos(angle) * dist);
      const cy2 = Math.round(b.cy + Math.sin(angle) * dist);
      const rdef = b.resources[Math.floor(rng() * b.resources.length)];
      const nodeCount = 5 + Math.floor(rng() * 4);
      for (let n = 0; n < nodeCount; n++) {
        const nx = cx2 + Math.round((rng() - 0.5) * 6);
        const ny = cy2 + Math.round((rng() - 0.5) * 6);
        if (nx < 0 || nx >= WORLD_W || ny < 0 || ny >= WORLD_H) continue;
        if (tiles[ny][nx] === "tree" || tiles[ny][nx] === "rock" || tiles[ny][nx] === "water"
          || tiles[ny][nx] === "camp") continue;
        resources.push({
          id: rId++, x: nx, y: ny,
          type: rdef.type, emoji: rdef.emoji,
          hp: 3, maxHp: 3,
          biome: bk, alive: true,
        });
      }
    }
  }

  // Generate NPCs
  const npcs: NPC[] = [];
  let nId = 0;
  for (const vl of villageLocs) {
    const biome = getBiomeAt(vl.x, vl.y);
    npcs.push({
      id: nId++, x: vl.x, y: vl.y - 1,
      emoji: "\uD83D\uDC71", name: "Marchand",
      type: "shop", biome,
    });
    npcs.push({
      id: nId++, x: vl.x + 1, y: vl.y,
      emoji: "\uD83E\uDDD9", name: "Ancien",
      type: "quest", biome,
    });
  }
  // Camp NPC
  npcs.push({
    id: nId++, x: 76, y: 75,
    emoji: "\uD83C\uDFD5\uFE0F", name: "Feu de camp",
    type: "info", biome: "garrigue",
  });

  return { tiles, biomeMap, monsters, resources, npcs, fortressLocs, villageLocs };
}

// ═══════════════════════════════════════════════════════════════
// TILE COLORS
// ═══════════════════════════════════════════════════════════════
function getTileColor(tile: TileType, biome: BiomeId): string {
  const b = BIOMES[biome];
  switch (tile) {
    case "grass": return b.grassColor;
    case "tall_grass": return b.accentColor;
    case "path": return b.pathColor;
    case "tree": return b.treeColor;
    case "rock": return b.rockColor;
    case "water": return b.waterColor;
    case "village": return "#D4A574";
    case "gate": return "#FFD700";
    case "fortress": return "#8B0000";
    case "camp": return "#F4A460";
    case "sand": return "#E8D5A3";
    case "dark_ground": return "#3A2A1A";
    case "stone_floor": return "#A09080";
    case "arena": return "#CC4444";
    default: return b.grassColor;
  }
}

function getTileEmoji(tile: TileType): string | null {
  switch (tile) {
    case "tree": return "\uD83C\uDF33";
    case "rock": return "\uD83E\uDEA8";
    case "village": return "\uD83C\uDFE0";
    case "gate": return "\uD83D\uDEAA";
    case "fortress": return "\uD83C\uDFF0";
    case "camp": return "\uD83D\uDD25";
    case "arena": return "\u2694\uFE0F";
    case "tall_grass": return "\uD83C\uDF3E";
    default: return null;
  }
}

function isBlocked(tile: TileType): boolean {
  return tile === "tree" || tile === "rock" || tile === "water";
}

// ═══════════════════════════════════════════════════════════════
// PUYO COMBAT ENGINE (inline)
// ═══════════════════════════════════════════════════════════════
const PUYO_COLS = 6;
const PUYO_ROWS = 12;

function createEmptyGrid(): GemCell[][] {
  return Array.from({ length: PUYO_ROWS }, () => Array(PUYO_COLS).fill(null));
}

function cloneGrid(g: GemCell[][]): GemCell[][] {
  return g.map(r => [...r]);
}

function applyGravity(grid: GemCell[][]): GemCell[][] {
  const g = cloneGrid(grid);
  for (let c = 0; c < PUYO_COLS; c++) {
    const col: GemCell[] = [];
    for (let r = PUYO_ROWS - 1; r >= 0; r--) {
      if (g[r][c] !== null) col.push(g[r][c]);
    }
    for (let r = PUYO_ROWS - 1; r >= 0; r--) {
      g[r][c] = col.length > 0 ? col.shift()! : null;
    }
  }
  return g;
}

function findMatches(grid: GemCell[][]): Set<string> {
  const matched = new Set<string>();
  const visited = new Set<string>();

  function flood(r: number, c: number, color: number, group: string[]) {
    const key = `${r},${c}`;
    if (visited.has(key)) return;
    if (r < 0 || r >= PUYO_ROWS || c < 0 || c >= PUYO_COLS) return;
    if (grid[r][c] !== color) return;
    visited.add(key);
    group.push(key);
    flood(r - 1, c, color, group);
    flood(r + 1, c, color, group);
    flood(r, c - 1, color, group);
    flood(r, c + 1, color, group);
  }

  for (let r = 0; r < PUYO_ROWS; r++) {
    for (let c = 0; c < PUYO_COLS; c++) {
      if (grid[r][c] === null) continue;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      const group: string[] = [];
      flood(r, c, grid[r][c]!, group);
      if (group.length >= 4) {
        group.forEach(k => matched.add(k));
      }
    }
  }
  return matched;
}

function resolveChains(grid: GemCell[][]): { grid: GemCell[][]; totalCleared: number; chains: number } {
  let g = cloneGrid(grid);
  let totalCleared = 0;
  let chains = 0;
  let loopGuard = 0;

  while (loopGuard < 20) {
    loopGuard++;
    g = applyGravity(g);
    const matches = findMatches(g);
    if (matches.size === 0) break;
    chains++;
    totalCleared += matches.size;
    for (const key of matches) {
      const [r, c] = key.split(",").map(Number);
      g[r][c] = null;
    }
  }
  return { grid: g, totalCleared, chains };
}

// ═══════════════════════════════════════════════════════════════
// GAME COMPONENT (inner, uses searchParams)
// ═══════════════════════════════════════════════════════════════
function GameInner() {
  const params = useSearchParams();
  const playerName = params.get("player") || "Aventurier";
  const classId = (params.get("class") || "paladin") as keyof typeof CLASSES;
  const sessionId = params.get("session") || "default";
  const playerClass: PlayerClass = CLASSES[classId] || CLASSES.paladin;

  // ─── Core state ───
  const [pos, setPos] = useState({ x: 75 * TILE, y: 75 * TILE });
  const [hp, setHp] = useState(playerClass.startHp);
  const [maxHp, setMaxHp] = useState(playerClass.startHp);
  const [lvl, setLvl] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpNext, setXpNext] = useState(50);
  const [sous, setSous] = useState(playerClass.startSous);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [bagSize] = useState(8);
  const [currentBiome, setCurrentBiome] = useState<BiomeId>("garrigue");
  const [inHome, setInHome] = useState(classId === "artisane");
  const [phase, setPhase] = useState<GamePhase>(classId === "artisane" ? "home" : "world");
  const [timeOfDay, setTimeOfDay] = useState(0.3); // 0-1, 0.25=dawn, 0.5=noon, 0.75=dusk, 0=midnight
  const [dayCount, setDayCount] = useState(1);

  // ─── Movement ───
  const joystickRef = useRef({ dx: 0, dy: 0 });
  const touchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [vpSize, setVpSize] = useState({ w: 800, h: 600 });

  // ─── World data ───
  const worldData = useMemo(() => {
    const seed = hashStr(sessionId);
    return generateWorld(seed);
  }, [sessionId]);

  const [monsters, setMonsters] = useState<Monster[]>(worldData.monsters);
  const [resources, setResources] = useState<ResourceNode[]>(worldData.resources);

  // ─── Combat state ───
  const [combatMonster, setCombatMonster] = useState<Monster | null>(null);
  const [playerGrid, setPlayerGrid] = useState<GemCell[][]>(createEmptyGrid());
  const [enemyGrid, setEnemyGrid] = useState<GemCell[][]>(createEmptyGrid());
  const [fallingPair, setFallingPair] = useState<{ c1: number; c2: number; col: number; row: number; rot: number } | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [playerCombatHp, setPlayerCombatHp] = useState(0);
  const [enemyCombatHp, setEnemyCombatHp] = useState(0);
  const [combatTurn, setCombatTurn] = useState(0);
  const combatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── UI state ───
  const [showInventory, setShowInventory] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [notification, setNotification] = useState("");
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [volIcon, setVolIcon] = useState("\uD83D\uDD0A");

  // ─── Stats ───
  const stats = useMemo(() => {
    const base = playerClass.baseStats;
    const lvlBonus = lvl - 1;
    return {
      atk: base.atk + lvlBonus,
      def: base.def + Math.floor(lvlBonus / 2),
      mag: base.mag + Math.floor(lvlBonus / 2),
      vit: base.vit + Math.floor(lvlBonus / 3),
    };
  }, [playerClass, lvl]);

  // ─── Notify ───
  const notify = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(""), 3000);
  }, []);

  // ─── Initialize sounds ───
  useEffect(() => {
    sounds.init();
  }, []);

  // ─── Viewport resize ───
  useEffect(() => {
    const update = () => {
      setVpSize({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ─── Day/night cycle ───
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(t => {
        const next = t + 0.0002;
        if (next >= 1) {
          setDayCount(d => d + 1);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ─── XP / Level up ───
  const gainXp = useCallback((amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      if (next >= xpNext) {
        setLvl(l => l + 1);
        setMaxHp(mh => mh + 3);
        setHp(h => h + 3);
        setXpNext(xn => Math.floor(xn * 1.5));
        sounds.levelUp();
        notify(`Niveau ${lvl + 1} !`);
        return next - xpNext;
      }
      return next;
    });
  }, [xpNext, lvl, notify]);

  // ═══════════════════════════════════════════════════════════
  // GAME LOOP — pixel movement
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== "world") return;

    let animId: number;
    let lastTime = 0;
    let stepAccum = 0;

    const loop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      const { dx, dy } = joystickRef.current;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        const speed = BASE_SPEED * playerClass.speedMult;
        const frames = delta / FRAME_MS;
        const moveX = dx * speed * frames;
        const moveY = dy * speed * frames;

        setPos(prev => {
          let nx = prev.x + moveX;
          let ny = prev.y + moveY;

          // Clamp to world bounds
          nx = Math.max(PLAYER_HITBOX / 2, Math.min(WORLD_W * TILE - PLAYER_HITBOX / 2, nx));
          ny = Math.max(PLAYER_HITBOX / 2, Math.min(WORLD_H * TILE - PLAYER_HITBOX / 2, ny));

          // Collision check: check 4 corners of hitbox
          const halfHB = PLAYER_HITBOX / 2;
          const corners = [
            { cx: nx - halfHB, cy: ny - halfHB },
            { cx: nx + halfHB, cy: ny - halfHB },
            { cx: nx - halfHB, cy: ny + halfHB },
            { cx: nx + halfHB, cy: ny + halfHB },
          ];

          for (const corner of corners) {
            const tx = Math.floor(corner.cx / TILE);
            const ty = Math.floor(corner.cy / TILE);
            if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) {
              return prev; // out of bounds
            }
            if (isBlocked(worldData.tiles[ty][tx])) {
              // Try sliding along axes
              const txOld = Math.floor((prev.x + (corner.cx - nx)) / TILE);
              const tyOld = Math.floor((prev.y + (corner.cy - ny)) / TILE);
              // blocked, revert
              return prev;
            }
          }

          // Step sound
          stepAccum += Math.hypot(moveX, moveY);
          if (stepAccum > TILE * 0.8) {
            stepAccum = 0;
            const ptx = Math.floor(nx / TILE);
            const pty = Math.floor(ny / TILE);
            const biome = worldData.biomeMap[pty]?.[ptx] || "garrigue";
            if (biome === "calanques") sounds.stepSand();
            else if (biome === "mines" || biome === "restanques") sounds.stepStone();
            else sounds.stepGrass();
          }

          return { x: nx, y: ny };
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, playerClass.speedMult, worldData]);

  // ─── Update current biome ───
  useEffect(() => {
    const tx = Math.floor(pos.x / TILE);
    const ty = Math.floor(pos.y / TILE);
    if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
      const b = worldData.biomeMap[ty][tx];
      if (b !== currentBiome) {
        setCurrentBiome(b);
        sounds.playBiomeMusic(b);
        notify(`Biome: ${BIOMES[b].name}`);
      }
    }
  }, [pos, currentBiome, worldData, notify]);

  // ─── Monster collision check ───
  useEffect(() => {
    if (phase !== "world") return;
    const checkInterval = setInterval(() => {
      const px = pos.x, py = pos.y;
      for (const m of monsters) {
        if (!m.alive) continue;
        const mx = m.x * TILE + TILE / 2;
        const my = m.y * TILE + TILE / 2;
        const dist = Math.hypot(px - mx, py - my);
        if (dist < TILE * 1.2) {
          startCombat(m);
          break;
        }
      }
    }, 200);
    return () => clearInterval(checkInterval);
  }, [phase, pos, monsters]);

  // ─── Resource interaction ───
  const tryHarvest = useCallback(() => {
    const px = pos.x, py = pos.y;
    for (const r of resources) {
      if (!r.alive) continue;
      const rx = r.x * TILE + TILE / 2;
      const ry = r.y * TILE + TILE / 2;
      const dist = Math.hypot(px - rx, py - ry);
      if (dist < TILE * 1.5) {
        const dmg = playerClass.harvestPerTap;
        setResources(prev => prev.map(res => {
          if (res.id !== r.id) return res;
          const newHp = res.hp - dmg;
          if (newHp <= 0) {
            sounds.harvestDone();
            // Add to inventory
            setInventory(inv => {
              const existing = inv.find(i => i.id === r.type);
              if (existing) {
                return inv.map(i => i.id === r.type ? { ...i, qty: i.qty + 1 } : i);
              }
              if (inv.length < bagSize) {
                return [...inv, { id: r.type, qty: 1 }];
              }
              notify("Sac plein !");
              return inv;
            });
            notify(`+1 ${r.emoji} ${r.type}`);
            return { ...res, hp: 0, alive: false };
          }
          sounds.stepStone();
          return { ...res, hp: newHp };
        }));
        return;
      }
    }
  }, [pos, resources, playerClass.harvestPerTap, bagSize, notify]);

  // ─── Tile interaction (camp, village, gate, etc) ───
  const interactTile = useCallback(() => {
    const tx = Math.floor(pos.x / TILE);
    const ty = Math.floor(pos.y / TILE);
    if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return;
    const tile = worldData.tiles[ty][tx];

    if (tile === "camp") {
      setHp(maxHp);
      notify("Repos au camp ! PV restaures.");
      sounds.uiOpen();
    } else if (tile === "village") {
      notify("Village ! Parlez aux PNJ.");
      sounds.uiOpen();
    } else if (tile === "gate") {
      notify("Porte de biome !");
      sounds.unlock();
    } else if (tile === "arena") {
      notify("Arene PvP ! (bientot)");
      sounds.locked();
    } else {
      tryHarvest();
    }
  }, [pos, worldData, maxHp, notify, tryHarvest]);

  // ═══════════════════════════════════════════════════════════
  // COMBAT
  // ═══════════════════════════════════════════════════════════
  const startCombat = useCallback((monster: Monster) => {
    if (phase !== "world") return;
    sounds.enemyAlert();
    setPhase("combat");
    setCombatMonster(monster);
    setPlayerGrid(createEmptyGrid());
    setEnemyGrid(createEmptyGrid());
    setPlayerCombatHp(hp);
    setEnemyCombatHp(monster.hp);
    setCombatLog([`Combat contre ${monster.emoji} ${monster.name} Nv.${monster.lvl} !`]);
    setCombatTurn(0);

    // Spawn first falling pair
    spawnNewPair();
  }, [phase, hp]);

  const spawnNewPair = useCallback(() => {
    setFallingPair({
      c1: Math.floor(Math.random() * 6),
      c2: Math.floor(Math.random() * 6),
      col: 2, row: 0, rot: 0,
    });
  }, []);

  // ─── Puyo controls ───
  const movePuyo = useCallback((dir: "left" | "right" | "rotate" | "drop") => {
    if (!fallingPair || phase !== "combat") return;

    setFallingPair(prev => {
      if (!prev) return null;
      const p = { ...prev };

      // Get second gem position based on rotation
      const getSecondPos = (rot: number) => {
        switch (rot % 4) {
          case 0: return { dr: -1, dc: 0 }; // above
          case 1: return { dr: 0, dc: 1 };  // right
          case 2: return { dr: 1, dc: 0 };  // below
          case 3: return { dr: 0, dc: -1 }; // left
          default: return { dr: -1, dc: 0 };
        }
      };

      if (dir === "left") {
        const newCol = p.col - 1;
        const s = getSecondPos(p.rot);
        const sc = newCol + s.dc;
        if (newCol >= 0 && sc >= 0 && newCol < PUYO_COLS && sc < PUYO_COLS) {
          p.col = newCol;
        }
      } else if (dir === "right") {
        const newCol = p.col + 1;
        const s = getSecondPos(p.rot);
        const sc = newCol + s.dc;
        if (newCol < PUYO_COLS && sc < PUYO_COLS && sc >= 0) {
          p.col = newCol;
        }
      } else if (dir === "rotate") {
        const newRot = (p.rot + 1) % 4;
        const s = getSecondPos(newRot);
        const sc = p.col + s.dc;
        const sr = p.row + s.dr;
        if (sc >= 0 && sc < PUYO_COLS && sr >= 0 && sr < PUYO_ROWS) {
          p.rot = newRot;
        }
      } else if (dir === "drop") {
        // Hard drop
        const s = getSecondPos(p.rot);
        let maxDrop = PUYO_ROWS;
        // Find lowest position
        for (let r = p.row; r < PUYO_ROWS; r++) {
          const sr = r + s.dr;
          if (r >= PUYO_ROWS || sr >= PUYO_ROWS || sr < 0) { maxDrop = r - 1; break; }
          if (playerGrid[r][p.col] !== null) { maxDrop = r - 1; break; }
          if (playerGrid[sr]?.[p.col + s.dc] !== null) { maxDrop = r - 1; break; }
          maxDrop = r;
        }
        p.row = Math.max(0, maxDrop);
      }
      return p;
    });
  }, [fallingPair, phase, playerGrid]);

  // ─── Puyo fall tick ───
  useEffect(() => {
    if (phase !== "combat" || !fallingPair) return;

    const getSecondPos = (rot: number) => {
      switch (rot % 4) {
        case 0: return { dr: -1, dc: 0 };
        case 1: return { dr: 0, dc: 1 };
        case 2: return { dr: 1, dc: 0 };
        case 3: return { dr: 0, dc: -1 };
        default: return { dr: -1, dc: 0 };
      }
    };

    const tick = setInterval(() => {
      setFallingPair(prev => {
        if (!prev) return null;
        const nextRow = prev.row + 1;
        const s = getSecondPos(prev.rot);
        const sr = nextRow + s.dr;
        const sc = prev.col + s.dc;

        // Check if can fall further
        const blocked =
          nextRow >= PUYO_ROWS ||
          sr >= PUYO_ROWS ||
          (playerGrid[nextRow]?.[prev.col] !== null) ||
          (sr >= 0 && playerGrid[sr]?.[sc] !== null);

        if (blocked) {
          // Place gems
          const newGrid = cloneGrid(playerGrid);
          if (prev.row >= 0 && prev.row < PUYO_ROWS) {
            newGrid[prev.row][prev.col] = prev.c1;
          }
          const s2r = prev.row + s.dr;
          const s2c = prev.col + s.dc;
          if (s2r >= 0 && s2r < PUYO_ROWS && s2c >= 0 && s2c < PUYO_COLS) {
            newGrid[s2r][s2c] = prev.c2;
          }

          // Resolve chains
          const result = resolveChains(newGrid);
          setPlayerGrid(result.grid);

          if (result.totalCleared > 0) {
            sounds.gemMatch(result.chains);
            const damage = Math.floor(result.totalCleared * result.chains * playerClass.combatBonus * (1 + stats.atk * 0.1));
            setEnemyCombatHp(ehp => {
              const newEhp = Math.max(0, ehp - damage);
              setCombatLog(log => [...log.slice(-5), `Combo x${result.chains} ! ${damage} degats !`]);
              if (newEhp <= 0) {
                // Victory
                setTimeout(() => endCombatVictory(), 500);
              }
              return newEhp;
            });

            // Enemy sends garbage
            if (result.chains >= 2) {
              setCombatLog(log => [...log.slice(-5), `Chain x${result.chains} !`]);
            }
          }

          setCombatTurn(t => t + 1);

          // Enemy attacks periodically
          if (combatTurn > 0 && combatTurn % 3 === 0) {
            const eDmg = Math.max(1, (combatMonster?.atk || 2) - stats.def);
            setPlayerCombatHp(php => {
              const newPhp = Math.max(0, php - eDmg);
              setCombatLog(log => [...log.slice(-5), `${combatMonster?.emoji} attaque ! -${eDmg} PV`]);
              sounds.combatHit();
              if (newPhp <= 0) {
                setTimeout(() => endCombatDefeat(), 500);
              }
              return newPhp;
            });
          }

          // Spawn next pair
          setTimeout(() => spawnNewPair(), 300);
          return null;
        }

        return { ...prev, row: nextRow };
      });
    }, 600);

    return () => clearInterval(tick);
  }, [phase, fallingPair, playerGrid, combatTurn, combatMonster, playerClass.combatBonus, stats, spawnNewPair]);

  const endCombatVictory = useCallback(() => {
    if (!combatMonster) return;
    sounds.combatVictory();
    setMonsters(prev => prev.map(m => m.id === combatMonster.id ? { ...m, alive: false } : m));
    gainXp(combatMonster.xpReward);
    setSous(s => s + combatMonster.sousReward);
    setHp(playerCombatHp);
    notify(`Victoire ! +${combatMonster.xpReward} XP, +${combatMonster.sousReward} sous`);
    setPhase("world");
    setCombatMonster(null);
    setFallingPair(null);
  }, [combatMonster, gainXp, notify, playerCombatHp]);

  const endCombatDefeat = useCallback(() => {
    sounds.combatDefeat();
    setHp(Math.max(1, Math.floor(maxHp / 2)));
    setSous(s => Math.max(0, s - 10));
    setPos({ x: 75 * TILE, y: 75 * TILE }); // respawn at camp
    notify("K.O. ! Retour au camp...");
    setPhase("world");
    setCombatMonster(null);
    setFallingPair(null);
  }, [maxHp, notify]);

  const fleeCombat = useCallback(() => {
    sounds.uiClose();
    setHp(playerCombatHp);
    setPhase("world");
    setCombatMonster(null);
    setFallingPair(null);
    notify("Fuite !");
  }, [playerCombatHp, notify]);

  // ═══════════════════════════════════════════════════════════
  // JOYSTICK HANDLERS
  // ═══════════════════════════════════════════════════════════
  const onJoystickStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    touchIdRef.current = t.identifier;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    joystickRef.current = { dx: 0, dy: 0 };
  }, []);

  const onJoystickMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchIdRef.current) {
        const cx = joystickCenterRef.current.x;
        const cy = joystickCenterRef.current.y;
        let dx = (t.clientX - cx) / 50;
        let dy = (t.clientY - cy) / 50;
        const mag = Math.hypot(dx, dy);
        if (mag > 1) { dx /= mag; dy /= mag; }
        joystickRef.current = { dx, dy };
      }
    }
  }, []);

  const onJoystickEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        joystickRef.current = { dx: 0, dy: 0 };
      }
    }
  }, []);

  // ─── Keyboard movement ───
  const keysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (phase !== "world") return;
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      updateKeyboardJoystick();
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      updateKeyboardJoystick();
    };
    const updateKeyboardJoystick = () => {
      let dx = 0, dy = 0;
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a") || keysRef.current.has("q")) dx -= 1;
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) dx += 1;
      if (keysRef.current.has("ArrowUp") || keysRef.current.has("w") || keysRef.current.has("z")) dy -= 1;
      if (keysRef.current.has("ArrowDown") || keysRef.current.has("s")) dy += 1;
      const mag = Math.hypot(dx, dy);
      if (mag > 0) { dx /= mag; dy /= mag; }
      joystickRef.current = { dx, dy };
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      keysRef.current.clear();
      joystickRef.current = { dx: 0, dy: 0 };
    };
  }, [phase]);

  // ─── Keyboard for combat ───
  useEffect(() => {
    if (phase !== "combat") return;
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") movePuyo("left");
      else if (e.key === "ArrowRight") movePuyo("right");
      else if (e.key === "ArrowUp") movePuyo("rotate");
      else if (e.key === "ArrowDown") movePuyo("drop");
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [phase, movePuyo]);

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════
  const cameraPx = useMemo(() => ({
    x: pos.x - vpSize.w / 2,
    y: pos.y - vpSize.h / 2,
  }), [pos, vpSize]);

  const visibleTiles = useMemo(() => {
    const startTx = Math.max(0, Math.floor(cameraPx.x / TILE) - 1);
    const startTy = Math.max(0, Math.floor(cameraPx.y / TILE) - 1);
    const endTx = Math.min(WORLD_W - 1, Math.ceil((cameraPx.x + vpSize.w) / TILE) + 1);
    const endTy = Math.min(WORLD_H - 1, Math.ceil((cameraPx.y + vpSize.h) / TILE) + 1);
    return { startTx, startTy, endTx, endTy };
  }, [cameraPx, vpSize]);

  // Night overlay opacity
  const nightOpacity = useMemo(() => {
    // 0.0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    if (timeOfDay < 0.2) return 0.5;
    if (timeOfDay < 0.3) return 0.5 - (timeOfDay - 0.2) * 5; // dawn
    if (timeOfDay < 0.7) return 0;
    if (timeOfDay < 0.8) return (timeOfDay - 0.7) * 5; // dusk
    return 0.5;
  }, [timeOfDay]);

  const timeIcon = useMemo(() => {
    if (timeOfDay < 0.25 || timeOfDay > 0.8) return "\uD83C\uDF19";
    if (timeOfDay < 0.35) return "\uD83C\uDF05";
    if (timeOfDay < 0.7) return "\u2600\uFE0F";
    return "\uD83C\uDF07";
  }, [timeOfDay]);

  // ═══════════════════════════════════════════════════════════
  // COMBAT TOUCH CONTROLS
  // ═══════════════════════════════════════════════════════════
  const combatTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onCombatTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    combatTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const onCombatTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!combatTouchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - combatTouchRef.current.x;
    const dy = t.clientY - combatTouchRef.current.y;
    const dt = Date.now() - combatTouchRef.current.time;
    combatTouchRef.current = null;

    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
      movePuyo("rotate");
    } else if (Math.abs(dx) > Math.abs(dy)) {
      movePuyo(dx > 0 ? "right" : "left");
    } else {
      movePuyo(dy > 0 ? "drop" : "rotate");
    }
  }, [movePuyo]);

  // ═══════════════════════════════════════════════════════════
  // RENDER — HOME SCREEN
  // ═══════════════════════════════════════════════════════════
  if (phase === "home") {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "linear-gradient(135deg, #F5E6D0, #E8D5B0)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace", color: "#333", position: "relative",
      }}>
        <div style={{ fontSize: 48 }}>{playerClass.emoji}</div>
        <h1 style={{ fontSize: 24, margin: "12px 0" }}>Maison de {playerName}</h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>Artisane - Jardin & Atelier</p>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 8,
        }}>
          {["\uD83C\uDF3B Jardin", "\uD83D\uDD28 Atelier", "\uD83D\uDCE6 Stock",
            "\uD83D\uDECF\uFE0F Repos", "\uD83D\uDCDC Recettes", "\uD83D\uDEAA Sortir"].map(label => (
            <button
              key={label}
              onClick={() => {
                sounds.uiClick();
                if (label.includes("Sortir")) {
                  setPhase("world");
                  setInHome(false);
                } else if (label.includes("Repos")) {
                  setHp(maxHp);
                  notify("PV restaures !");
                } else {
                  notify("Bientot disponible !");
                }
              }}
              style={{
                padding: "12px 4px", background: "#FFF8F0", border: "2px solid #C4A874",
                borderRadius: 8, fontSize: 11, cursor: "pointer", textAlign: "center",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* HUD bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 40,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
          padding: "0 12px", gap: 12, color: "#fff", fontSize: 12,
        }}>
          <span>{playerClass.emoji} {playerName}</span>
          <span>Nv.{lvl}</span>
          <span style={{ color: "#F44" }}>{"\u2764\uFE0F"} {hp}/{maxHp}</span>
          <span>{"\u2600\uFE0F"} {sous}</span>
        </div>

        {notification && (
          <div style={{
            position: "absolute", top: 50, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.8)", color: "#fff", padding: "8px 16px",
            borderRadius: 8, fontSize: 13, whiteSpace: "nowrap",
          }}>{notification}</div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER — COMBAT SCREEN (Puyo Puyo)
  // ═══════════════════════════════════════════════════════════
  if (phase === "combat" && combatMonster) {
    const cellSize = Math.min(Math.floor((vpSize.w * 0.65) / PUYO_COLS), Math.floor((vpSize.h - 150) / PUYO_ROWS));
    const smallCell = Math.floor(cellSize * 0.45);

    const getSecondPos = (rot: number) => {
      switch (rot % 4) {
        case 0: return { dr: -1, dc: 0 };
        case 1: return { dr: 0, dc: 1 };
        case 2: return { dr: 1, dc: 0 };
        case 3: return { dr: 0, dc: -1 };
        default: return { dr: -1, dc: 0 };
      }
    };

    return (
      <div
        style={{
          width: "100vw", height: "100vh", background: "#1A1A2E",
          display: "flex", flexDirection: "column", fontFamily: "monospace", color: "#fff",
          position: "relative", overflow: "hidden", touchAction: "none",
        }}
        onTouchStart={onCombatTouchStart}
        onTouchEnd={onCombatTouchEnd}
      >
        {/* Combat HUD */}
        <div style={{
          height: 50, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", background: "rgba(0,0,0,0.5)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11 }}>{playerClass.emoji} {playerName} Nv.{lvl}</div>
            <div style={{
              height: 8, background: "#333", borderRadius: 4, overflow: "hidden", marginTop: 2,
            }}>
              <div style={{
                height: "100%", width: `${(playerCombatHp / maxHp) * 100}%`,
                background: playerCombatHp / maxHp > 0.3 ? "#4CAF50" : "#F44",
                transition: "width 0.3s",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#aaa" }}>{playerCombatHp}/{maxHp} PV</div>
          </div>
          <div style={{ margin: "0 16px", fontSize: 18 }}>VS</div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 11 }}>{combatMonster.emoji} {combatMonster.name} Nv.{combatMonster.lvl}</div>
            <div style={{
              height: 8, background: "#333", borderRadius: 4, overflow: "hidden", marginTop: 2,
            }}>
              <div style={{
                height: "100%", width: `${(enemyCombatHp / combatMonster.maxHp) * 100}%`,
                background: enemyCombatHp / combatMonster.maxHp > 0.3 ? "#E74C3C" : "#F44",
                transition: "width 0.3s",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#aaa" }}>{enemyCombatHp}/{combatMonster.maxHp} PV</div>
          </div>
        </div>

        {/* Grids container */}
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "8px 4px", gap: 8,
        }}>
          {/* Player grid (main) */}
          <div style={{
            border: "2px solid #444",
            width: cellSize * PUYO_COLS + 4,
            height: cellSize * PUYO_ROWS + 4,
            position: "relative", background: "#0D0D1A",
          }}>
            {/* Placed gems */}
            {playerGrid.map((row, r) =>
              row.map((cell, c) => {
                if (cell === null) return null;
                return (
                  <div key={`${r}-${c}`} style={{
                    position: "absolute",
                    left: c * cellSize + 2,
                    top: r * cellSize + 2,
                    width: cellSize - 2,
                    height: cellSize - 2,
                    borderRadius: "50%",
                    background: GEM_COLORS[cell],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: Math.floor(cellSize * 0.5),
                    boxShadow: `0 0 6px ${GEM_COLORS[cell]}`,
                  }}>
                    {GEM_EMOJIS[cell]}
                  </div>
                );
              })
            )}

            {/* Falling pair */}
            {fallingPair && (
              <>
                <div style={{
                  position: "absolute",
                  left: fallingPair.col * cellSize + 2,
                  top: fallingPair.row * cellSize + 2,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  borderRadius: "50%",
                  background: GEM_COLORS[fallingPair.c1],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: Math.floor(cellSize * 0.5),
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: `0 0 8px ${GEM_COLORS[fallingPair.c1]}`,
                  zIndex: 2,
                }}>
                  {GEM_EMOJIS[fallingPair.c1]}
                </div>
                {(() => {
                  const s = getSecondPos(fallingPair.rot);
                  const sr = fallingPair.row + s.dr;
                  const sc = fallingPair.col + s.dc;
                  if (sr < 0 || sr >= PUYO_ROWS || sc < 0 || sc >= PUYO_COLS) return null;
                  return (
                    <div style={{
                      position: "absolute",
                      left: sc * cellSize + 2,
                      top: sr * cellSize + 2,
                      width: cellSize - 2,
                      height: cellSize - 2,
                      borderRadius: "50%",
                      background: GEM_COLORS[fallingPair.c2],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: Math.floor(cellSize * 0.5),
                      border: "2px solid rgba(255,255,255,0.3)",
                      boxShadow: `0 0 8px ${GEM_COLORS[fallingPair.c2]}`,
                      zIndex: 2,
                    }}>
                      {GEM_EMOJIS[fallingPair.c2]}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Grid lines */}
            {Array.from({ length: PUYO_COLS + 1 }).map((_, i) => (
              <div key={`vc${i}`} style={{
                position: "absolute", left: i * cellSize + 1, top: 0,
                width: 1, height: "100%", background: "rgba(255,255,255,0.05)",
              }} />
            ))}
            {Array.from({ length: PUYO_ROWS + 1 }).map((_, i) => (
              <div key={`hr${i}`} style={{
                position: "absolute", top: i * cellSize + 1, left: 0,
                height: 1, width: "100%", background: "rgba(255,255,255,0.05)",
              }} />
            ))}
          </div>

          {/* Enemy grid (preview, smaller) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{
              border: "1px solid #333",
              width: smallCell * PUYO_COLS + 2,
              height: smallCell * PUYO_ROWS + 2,
              position: "relative", background: "#0D0D1A",
            }}>
              {enemyGrid.map((row, r) =>
                row.map((cell, c) => {
                  if (cell === null) return null;
                  return (
                    <div key={`e${r}-${c}`} style={{
                      position: "absolute",
                      left: c * smallCell + 1,
                      top: r * smallCell + 1,
                      width: smallCell - 1,
                      height: smallCell - 1,
                      borderRadius: "50%",
                      background: GEM_COLORS[cell],
                      opacity: 0.7,
                    }} />
                  );
                })
              )}
            </div>

            {/* Combat log */}
            <div style={{
              width: smallCell * PUYO_COLS + 2,
              fontSize: 9, color: "#aaa", lineHeight: 1.3,
              maxHeight: 80, overflow: "hidden",
            }}>
              {combatLog.slice(-4).map((msg, i) => (
                <div key={i} style={{ opacity: 0.5 + i * 0.15 }}>{msg}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Combat controls */}
        <div style={{
          height: 80, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "0 12px", background: "rgba(0,0,0,0.5)",
        }}>
          <button onClick={() => movePuyo("left")} style={combatBtnStyle}>{"\u25C0"}</button>
          <button onClick={() => movePuyo("rotate")} style={combatBtnStyle}>{"\uD83D\uDD04"}</button>
          <button onClick={() => movePuyo("drop")} style={combatBtnStyle}>{"\u25BC"}</button>
          <button onClick={() => movePuyo("right")} style={combatBtnStyle}>{"\u25B6"}</button>
          <div style={{ width: 16 }} />
          <button onClick={fleeCombat} style={{
            ...combatBtnStyle, background: "#8B0000", fontSize: 10,
          }}>{"\uD83C\uDFC3"} Fuir</button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER — WORLD MAP
  // ═══════════════════════════════════════════════════════════
  const { startTx, startTy, endTx, endTy } = visibleTiles;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        position: "relative", background: "#000", fontFamily: "monospace",
        touchAction: "none", userSelect: "none",
      }}
    >
      {/* World layer */}
      <div style={{
        position: "absolute",
        transform: `translate(${-cameraPx.x}px, ${-cameraPx.y}px)`,
        width: WORLD_W * TILE,
        height: WORLD_H * TILE,
      }}>
        {/* Tiles */}
        {(() => {
          const tileEls: React.ReactNode[] = [];
          for (let ty = startTy; ty <= endTy; ty++) {
            for (let tx = startTx; tx <= endTx; tx++) {
              const tile = worldData.tiles[ty]?.[tx];
              if (!tile) continue;
              const biome = worldData.biomeMap[ty][tx];
              const color = getTileColor(tile, biome);
              const emoji = getTileEmoji(tile);
              tileEls.push(
                <div
                  key={`t${tx}_${ty}`}
                  style={{
                    position: "absolute",
                    left: tx * TILE,
                    top: ty * TILE,
                    width: TILE,
                    height: TILE,
                    background: color,
                  }}
                >
                  {emoji && (
                    <span style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: TILE * 0.6, lineHeight: 1, pointerEvents: "none",
                      opacity: tile === "tall_grass" ? 0.4 : 0.8,
                    }}>
                      {emoji}
                    </span>
                  )}
                </div>
              );
            }
          }
          return tileEls;
        })()}

        {/* Resources */}
        {resources.filter(r => r.alive &&
          r.x >= startTx && r.x <= endTx && r.y >= startTy && r.y <= endTy
        ).map(r => (
          <div
            key={`r${r.id}`}
            onClick={() => tryHarvest()}
            style={{
              position: "absolute",
              left: r.x * TILE + 4,
              top: r.y * TILE + 4,
              width: TILE - 8,
              height: TILE - 8,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: TILE * 0.55, cursor: "pointer",
            }}
          >
            {r.emoji}
          </div>
        ))}

        {/* Monsters */}
        {monsters.filter(m => m.alive &&
          m.x >= startTx - 1 && m.x <= endTx + 1 && m.y >= startTy - 1 && m.y <= endTy + 1
        ).map(m => (
          <div
            key={`m${m.id}`}
            style={{
              position: "absolute",
              left: m.x * TILE + 2,
              top: m.y * TILE + 2,
              width: TILE - 4,
              height: TILE - 4,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(200,60,60,0.5), rgba(150,30,30,0.8))`,
              border: "2px solid rgba(255,80,80,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: TILE * 0.55,
              zIndex: 5,
            }}
          >
            {m.emoji}
            <span style={{
              position: "absolute", top: -6, right: -4,
              background: "#F44", color: "#fff", borderRadius: 6,
              padding: "0 3px", fontSize: 8, fontWeight: "bold",
            }}>
              {m.lvl}
            </span>
          </div>
        ))}

        {/* NPCs */}
        {worldData.npcs.filter(n =>
          n.x >= startTx - 1 && n.x <= endTx + 1 && n.y >= startTy - 1 && n.y <= endTy + 1
        ).map(n => (
          <div
            key={`n${n.id}`}
            onClick={() => {
              const dist = Math.hypot(pos.x - (n.x * TILE + TILE / 2), pos.y - (n.y * TILE + TILE / 2));
              if (dist < TILE * 2) {
                sounds.uiOpen();
                notify(`${n.emoji} ${n.name}: "Bienvenue, ${playerName} !"`);
              }
            }}
            style={{
              position: "absolute",
              left: n.x * TILE + 2,
              top: n.y * TILE + 2,
              width: TILE - 4,
              height: TILE - 4,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(100,180,255,0.5), rgba(60,120,200,0.8))`,
              border: "2px solid rgba(100,200,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: TILE * 0.55,
              cursor: "pointer",
              zIndex: 6,
            }}
          >
            {n.emoji}
          </div>
        ))}

        {/* Player */}
        <div style={{
          position: "absolute",
          left: pos.x - TILE * 0.5,
          top: pos.y - TILE * 0.5,
          width: TILE,
          height: TILE,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,100,0.8), rgba(200,180,60,0.9))`,
          border: "3px solid #FFD700",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: TILE * 0.6,
          zIndex: 10,
          boxShadow: "0 0 12px rgba(255,215,0,0.5)",
          transition: "left 0.016s linear, top 0.016s linear",
        }}>
          {playerClass.emoji}
        </div>
      </div>

      {/* Night overlay */}
      {nightOpacity > 0 && (
        <div style={{
          position: "absolute", inset: 0,
          background: `rgba(0,0,30,${nightOpacity})`,
          pointerEvents: "none", zIndex: 15,
        }} />
      )}

      {/* ═══ HUD ═══ */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 44,
        background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
        padding: "0 8px", gap: 8, color: "#fff", fontSize: 11,
        zIndex: 20, backdropFilter: "blur(4px)",
      }}>
        {/* Clock */}
        <span style={{ minWidth: 50 }}>{timeIcon} J{dayCount}</span>

        {/* HP bar */}
        <div style={{ flex: 1, maxWidth: 120 }}>
          <div style={{ fontSize: 9, marginBottom: 1 }}>
            {playerClass.emoji} Nv.{lvl} {playerName}
          </div>
          <div style={{
            height: 8, background: "#333", borderRadius: 4, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(hp / maxHp) * 100}%`,
              background: hp / maxHp > 0.5 ? "#4CAF50" : hp / maxHp > 0.25 ? "#FFA000" : "#F44",
              transition: "width 0.3s",
            }} />
          </div>
          <div style={{ fontSize: 8, color: "#aaa" }}>{hp}/{maxHp}</div>
        </div>

        {/* XP bar */}
        <div style={{ flex: 1, maxWidth: 80 }}>
          <div style={{ fontSize: 8, color: "#aaa" }}>XP</div>
          <div style={{
            height: 5, background: "#333", borderRadius: 3, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${(xp / xpNext) * 100}%`,
              background: "#7B68EE",
            }} />
          </div>
          <div style={{ fontSize: 8, color: "#888" }}>{xp}/{xpNext}</div>
        </div>

        {/* Sous */}
        <span style={{ color: "#FFD700" }}>{"\u2600\uFE0F"} {sous}</span>

        {/* Biome */}
        <span style={{
          background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4,
          fontSize: 9,
        }}>
          {BIOMES[currentBiome].name}
        </span>

        {/* Settings */}
        <button
          onClick={() => {
            const icon = sounds.cycleVolume();
            setVolIcon(sounds.getVolIcon());
          }}
          style={{
            background: "none", border: "none", color: "#fff", fontSize: 16,
            cursor: "pointer", padding: "2px 4px",
          }}
        >
          {volIcon}
        </button>

        {/* Minimap toggle */}
        <button
          onClick={() => { setShowMinimap(v => !v); sounds.uiClick(); }}
          style={{
            background: "none", border: "none", color: "#fff", fontSize: 14,
            cursor: "pointer", padding: "2px 4px",
          }}
        >
          {"\uD83D\uDDFA\uFE0F"}
        </button>

        {/* Inventory toggle */}
        <button
          onClick={() => { setShowInventory(v => !v); sounds.uiClick(); }}
          style={{
            background: "none", border: "none", color: "#fff", fontSize: 14,
            cursor: "pointer", padding: "2px 4px",
          }}
        >
          {"\uD83C\uDF92"}
        </button>
      </div>

      {/* ═══ MINIMAP ═══ */}
      {showMinimap && (
        <div style={{
          position: "absolute", top: 50, right: 8, width: 150, height: 150,
          background: "rgba(0,0,0,0.8)", border: "2px solid #555", borderRadius: 4,
          zIndex: 25, overflow: "hidden",
        }}>
          <canvas
            ref={(canvas) => {
              if (!canvas) return;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              canvas.width = 150;
              canvas.height = 150;
              // Draw biome blobs
              for (let y = 0; y < WORLD_H; y++) {
                for (let x = 0; x < WORLD_W; x++) {
                  const biome = worldData.biomeMap[y][x];
                  ctx.fillStyle = BIOMES[biome].grassColor;
                  ctx.fillRect(x, y, 1, 1);
                }
              }
              // Draw player
              const px = Math.floor(pos.x / TILE);
              const py = Math.floor(pos.y / TILE);
              ctx.fillStyle = "#FFD700";
              ctx.fillRect(px - 1, py - 1, 3, 3);
            }}
          />
        </div>
      )}

      {/* ═══ INVENTORY PANEL ═══ */}
      {showInventory && (
        <div style={{
          position: "absolute", top: 50, left: 8, width: 200, maxHeight: vpSize.h - 100,
          background: "rgba(0,0,0,0.9)", border: "2px solid #666", borderRadius: 8,
          padding: 12, zIndex: 25, color: "#fff", fontSize: 12,
          overflowY: "auto",
        }}>
          <div style={{ fontWeight: "bold", marginBottom: 8, borderBottom: "1px solid #444", paddingBottom: 4 }}>
            {"\uD83C\uDF92"} Inventaire ({inventory.length}/{bagSize})
          </div>
          {inventory.length === 0 && (
            <div style={{ color: "#666", fontStyle: "italic" }}>Vide</div>
          )}
          {inventory.map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between",
              padding: "4px 0", borderBottom: "1px solid #222",
            }}>
              <span>{item.id}</span>
              <span style={{ color: "#aaa" }}>x{item.qty}</span>
            </div>
          ))}

          <div style={{ marginTop: 12, borderTop: "1px solid #444", paddingTop: 8 }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Stats</div>
            <div>ATK: {stats.atk} | DEF: {stats.def}</div>
            <div>MAG: {stats.mag} | VIT: {stats.vit}</div>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATION ═══ */}
      {notification && (
        <div style={{
          position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.85)", color: "#fff", padding: "8px 20px",
          borderRadius: 8, fontSize: 13, whiteSpace: "nowrap",
          zIndex: 30, border: "1px solid rgba(255,255,255,0.15)",
          animation: "fadeIn 0.3s",
        }}>
          {notification}
        </div>
      )}

      {/* ═══ JOYSTICK ═══ */}
      <div
        onTouchStart={onJoystickStart}
        onTouchMove={onJoystickMove}
        onTouchEnd={onJoystickEnd}
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "2px solid rgba(255,255,255,0.25)",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          border: "2px solid rgba(255,255,255,0.5)",
          transform: `translate(${joystickRef.current.dx * 30}px, ${joystickRef.current.dy * 30}px)`,
        }} />
      </div>

      {/* ═══ ACTION BUTTON ═══ */}
      <button
        onClick={interactTile}
        onTouchStart={(e) => { e.preventDefault(); interactTile(); }}
        style={{
          position: "absolute",
          bottom: 40,
          right: 32,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(100,200,100,0.3)",
          border: "3px solid rgba(100,255,100,0.5)",
          color: "#fff",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        {"\u270B"}
      </button>

      {/* Home button for artisane */}
      {classId === "artisane" && (
        <button
          onClick={() => {
            setPhase("home");
            setInHome(true);
            sounds.uiOpen();
          }}
          style={{
            position: "absolute",
            bottom: 40,
            right: 108,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(200,168,116,0.3)",
            border: "2px solid rgba(200,168,116,0.5)",
            color: "#fff",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          {"\uD83C\uDFE0"}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMBAT BUTTON STYLE
// ═══════════════════════════════════════════════════════════════
const combatBtnStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 12,
  background: "rgba(255,255,255,0.1)",
  border: "2px solid rgba(255,255,255,0.3)",
  color: "#fff",
  fontSize: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

// ═══════════════════════════════════════════════════════════════
// PAGE WRAPPER (Suspense for useSearchParams)
// ═══════════════════════════════════════════════════════════════
export default function GamePage() {
  return (
    <Suspense fallback={
      <div style={{
        width: "100vw", height: "100vh",
        background: "#1A1A2E", color: "#fff",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "monospace",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2694\uFE0F"}</div>
        <div style={{ fontSize: 18 }}>Chargement des Restanques...</div>
        <div style={{
          marginTop: 16, width: 200, height: 4,
          background: "#333", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            width: "60%", height: "100%", background: "#FFD700",
            animation: "pulse 1s infinite",
          }} />
        </div>
      </div>
    }>
      <GameInner />
    </Suspense>
  );
}
