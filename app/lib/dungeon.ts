// ═══════════════════════════════════════════════════════════
// DONJON ALÉATOIRE — 20×20, labyrinthique, mobs + coffre
// ═══════════════════════════════════════════════════════════

import { GUARDS } from './constants';

export interface DungeonTile { walkable: boolean; type: "floor" | "wall" | "entrance" | "chest"; }
export interface DungeonMob { x: number; y: number; hp: number; biome: string; }
export interface Dungeon {
  tiles: DungeonTile[][];
  mobs: DungeonMob[];
  chestPos: { x: number; y: number };
  entrance: { x: number; y: number };
  biome: string;
  loot: string; // equip id or item id
}

function makeRng(seed: number) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

export function generateDungeon(seed: number, biome: string): Dungeon {
  const W = 20, H = 20;
  const rng = makeRng(seed);
  const tiles: DungeonTile[][] = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => ({ walkable: false, type: "wall" as const }))
  );

  // Carve rooms + corridors using random walk
  const carve = (x: number, y: number) => {
    if (x > 0 && x < W - 1 && y > 0 && y < H - 1) {
      tiles[y][x] = { walkable: true, type: "floor" };
    }
  };

  // Start from center, random walk to carve ~60% of tiles
  let cx = 10, cy = 10;
  carve(cx, cy);
  const target = Math.floor(W * H * 0.55);
  let carved = 1;
  while (carved < target) {
    const dir = Math.floor(rng() * 4);
    const nx = cx + [0, 0, -1, 1][dir];
    const ny = cy + [-1, 1, 0, 0][dir];
    if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1) {
      if (!tiles[ny][nx].walkable) carved++;
      carve(nx, ny);
      cx = nx; cy = ny;
    }
  }

  // Entrance at top
  const entrance = { x: 10, y: 1 };
  tiles[entrance.y][entrance.x] = { walkable: true, type: "entrance" };
  // Ensure path from entrance
  for (let y = 1; y <= 3; y++) carve(10, y);

  // Chest far from entrance
  let chestPos = { x: 10, y: 18 };
  // Find furthest walkable tile from entrance
  let maxDist = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x].walkable && tiles[y][x].type === "floor") {
        const d = Math.abs(x - entrance.x) + Math.abs(y - entrance.y);
        if (d > maxDist) { maxDist = d; chestPos = { x, y }; }
      }
    }
  }
  tiles[chestPos.y][chestPos.x] = { walkable: true, type: "chest" };

  // Mobs — 4-6 scattered on floor tiles
  const mobs: DungeonMob[] = [];
  const guard = GUARDS[biome];
  const mobCount = 4 + Math.floor(rng() * 3);
  let placed = 0;
  while (placed < mobCount) {
    const mx = 1 + Math.floor(rng() * (W - 2));
    const my = 1 + Math.floor(rng() * (H - 2));
    if (tiles[my][mx].walkable && tiles[my][mx].type === "floor" &&
        !(mx === entrance.x && my === entrance.y) &&
        !(mx === chestPos.x && my === chestPos.y) &&
        !mobs.find((m) => m.x === mx && m.y === my)) {
      mobs.push({ x: mx, y: my, hp: guard ? guard.hp + 4 : 10, biome });
      placed++;
    }
  }

  // Loot — rare equip based on biome
  const lootMap: Record<string, string> = {
    garrigue: "sandales", calanques: "tunique_cuir", mines: "epee_fer",
    mer: "collier_perles", restanques: "bottes_vent",
  };
  const loot = lootMap[biome] || "potion";

  return { tiles, mobs, chestPos, entrance, biome, loot };
}

// Dungeon entrance positions on the world map (2 per biome)
export const DUNGEON_ENTRANCES = [
  { x: 35, y: 60, biome: "garrigue", seed: 1001 },
  { x: 65, y: 50, biome: "garrigue", seed: 1002 },
  { x: 160, y: 45, biome: "calanques", seed: 2001 },
  { x: 140, y: 55, biome: "calanques", seed: 2002 },
  { x: 40, y: 140, biome: "mines", seed: 3001 },
  { x: 55, y: 155, biome: "mines", seed: 3002 },
  { x: 160, y: 155, biome: "mer", seed: 4001 },
  { x: 145, y: 145, biome: "mer", seed: 4002 },
  { x: 95, y: 105, biome: "restanques", seed: 5001 },
  { x: 105, y: 95, biome: "restanques", seed: 5002 },
];
