// ═══════════════════════════════════════════════════════════
// WORLD GENERATION — 5 biomes séparés 100×100
// Chaque biome a ses propres tiles, nodes, villages, portails
// ═══════════════════════════════════════════════════════════

import { MW, MH, TILES, GUARDS, VILLAGES, CAMP_POS, type GameNode, type Gate, type Village, type GameWorld } from './constants';

function makeRng(seed: number) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

// Biome-specific tile palettes
const BIOME_TILES: Record<string, { main: string; alt: string; deco1: string; deco2: string; path: string; block: string }> = {
  garrigue:   { main: "g", alt: "tg", deco1: "fl", deco2: "lv", path: "p", block: "t" },
  calanques:  { main: "s", alt: "s", deco1: "cl", deco2: "w", path: "p", block: "r" },
  mines:      { main: "mf", alt: "mf", deco1: "mw", deco2: "mf", path: "p", block: "mw" },
  mer:        { main: "cf", alt: "cf", deco1: "dw", deco2: "cf", path: "dk", block: "dw" },
  restanques: { main: "rs", alt: "rs", deco1: "rw", deco2: "lv", path: "p", block: "rw" },
};

// Biome resources
const BIOME_RES: Record<string, string[]> = {
  garrigue: ["branche", "herbe", "lavande"],
  calanques: ["pierre", "coquillage", "sel"],
  mines: ["fer", "ocre", "cristal"],
  mer: ["poisson", "perle", "corail"],
  restanques: ["cristal", "perle", "ocre"],
};

// Portal connections: biome → [{target biome, side, needTool}]
const PORTALS: Record<string, { target: string; side: "N" | "S" | "E" | "W"; needTool: string | null }[]> = {
  garrigue:   [{ target: "calanques", side: "E", needTool: "baton" }, { target: "mines", side: "S", needTool: "pioche" }],
  calanques:  [{ target: "garrigue", side: "W", needTool: null }, { target: "mer", side: "S", needTool: "filet" }],
  mines:      [{ target: "garrigue", side: "N", needTool: null }, { target: "mer", side: "E", needTool: "filet" }],
  mer:        [{ target: "calanques", side: "N", needTool: null }, { target: "mines", side: "W", needTool: null }],
  restanques: [], // accessed via special portals from all biomes
};

// Villages per biome (2 each)
const BIOME_VILLAGES: Record<string, { x: number; y: number; name: string; items: { sell: string; cost: string[] }[] }[]> = {
  garrigue: [
    { x: 25, y: 25, name: "Hameau du Thym", items: [{ sell: "pain", cost: ["branche"] }, { sell: "potion", cost: ["lavande", "herbe"] }] },
    { x: 75, y: 30, name: "Bastide du Romarin", items: [{ sell: "potion", cost: ["branche", "herbe"] }, { sell: "pain", cost: ["lavande"] }] },
  ],
  calanques: [
    { x: 30, y: 30, name: "Port des Embruns", items: [{ sell: "potion", cost: ["sel", "coquillage"] }, { sell: "pain", cost: ["pierre"] }] },
    { x: 70, y: 60, name: "Cabanon des Vagues", items: [{ sell: "pain", cost: ["coquillage"] }, { sell: "potion", cost: ["pierre", "sel"] }] },
  ],
  mines: [
    { x: 30, y: 40, name: "Forge d'Ocre", items: [{ sell: "potion", cost: ["fer"] }, { sell: "pain", cost: ["ocre"] }] },
    { x: 65, y: 70, name: "Taverne du Mineur", items: [{ sell: "pain", cost: ["fer"] }, { sell: "potion", cost: ["ocre", "cristal"] }] },
  ],
  mer: [
    { x: 35, y: 35, name: "Cabane du Pêcheur", items: [{ sell: "pain", cost: ["poisson"] }, { sell: "potion", cost: ["corail"] }] },
    { x: 70, y: 65, name: "Phare du Corail", items: [{ sell: "potion", cost: ["perle"] }, { sell: "pain", cost: ["poisson"] }] },
  ],
  restanques: [
    { x: 40, y: 40, name: "Sanctuaire Ancien", items: [{ sell: "potion", cost: ["cristal"] }, { sell: "pain", cost: ["ocre"] }] },
    { x: 60, y: 60, name: "Tour des Vents", items: [{ sell: "potion", cost: ["perle"] }, { sell: "pain", cost: ["cristal"] }] },
  ],
};

export function genBiome(seed: number, biomeId: string): GameWorld {
  const rng = makeRng(seed);
  const tiles = BIOME_TILES[biomeId] || BIOME_TILES.garrigue;
  const m: string[][] = Array.from({ length: MH }, () => Array(MW).fill(tiles.main));
  const nodes: GameNode[] = [];
  const gates: Gate[] = [];
  const villages: Village[] = [];

  const S = (x: number, y: number, t: string) => { if (x >= 0 && x < MW && y >= 0 && y < MH) m[y][x] = t; };

  // Fill terrain with variety
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const rv = rng();
      if (rv < 0.08) S(x, y, tiles.block);
      else if (rv < 0.15) S(x, y, tiles.alt);
      else if (rv < 0.20) S(x, y, tiles.deco1);
      else if (rv < 0.24) S(x, y, tiles.deco2);
    }
  }

  // Paths — cross pattern through center
  const drawPath = (x1: number, y1: number, x2: number, y2: number) => {
    let cx = x1, cy = y1;
    while (cx !== x2 || cy !== y2) {
      S(cx, cy, tiles.path);
      if (rng() < 0.6 && cx !== x2) cx += cx < x2 ? 1 : -1;
      else if (cy !== y2) cy += cy < y2 ? 1 : -1;
      else cx += cx < x2 ? 1 : -1;
    }
  };
  drawPath(5, 50, 95, 50); // horizontal
  drawPath(50, 5, 50, 95); // vertical
  drawPath(20, 20, 80, 80); // diagonal

  // Portals (gates on edges)
  const portalDefs = PORTALS[biomeId] || [];
  for (const p of portalDefs) {
    let gx = 50, gy = 50;
    if (p.side === "N") { gx = 50; gy = 1; }
    if (p.side === "S") { gx = 50; gy = 98; }
    if (p.side === "E") { gx = 98; gy = 50; }
    if (p.side === "W") { gx = 1; gy = 50; }
    S(gx, gy, "gt");
    gates.push({ x: gx, y: gy, b: p.target });
    // Clear path to portal
    drawPath(50, 50, gx, gy);
  }
  // Restanques portal (if not restanques)
  if (biomeId !== "restanques") {
    const rx = biomeId === "garrigue" ? 95 : biomeId === "calanques" ? 95 : biomeId === "mines" ? 5 : 5;
    const ry = biomeId === "garrigue" ? 95 : biomeId === "calanques" ? 5 : biomeId === "mines" ? 95 : 95;
    S(rx, ry, "gt");
    gates.push({ x: rx, y: ry, b: "restanques" });
    drawPath(50, 50, rx, ry);
  }

  // Villages
  const bVillages = BIOME_VILLAGES[biomeId] || [];
  for (const v of bVillages) {
    S(v.x, v.y, "vi"); S(v.x + 1, v.y, "vi"); S(v.x, v.y + 1, "vi"); S(v.x + 1, v.y + 1, "vi");
    villages.push(v);
    drawPath(50, 50, v.x, v.y);
  }

  // Resource nodes (30-50 per biome)
  const res = BIOME_RES[biomeId] || ["branche"];
  const nodeCount = 30 + Math.floor(rng() * 20);
  for (let i = 0; i < nodeCount; i++) {
    let tries = 0;
    while (tries < 80) {
      const x = 5 + Math.floor(rng() * 90);
      const y = 5 + Math.floor(rng() * 90);
      if (TILES[m[y][x]]?.w && !nodes.find((n) => n.x === x && n.y === y)) {
        const r = res[Math.floor(rng() * res.length)];
        const guard = rng() < 0.35;
        nodes.push({ x, y, biome: biomeId, res: r, guard: guard ? GUARDS[biomeId] : null, done: false });
        break;
      }
      tries++;
    }
  }

  // Boss at center
  nodes.push({ x: 50, y: 50, biome: biomeId, res: null, guard: GUARDS[biomeId], boss: true, done: false });

  // Camp (only in garrigue)
  const spawn = biomeId === "garrigue" ? { x: CAMP_POS.x, y: CAMP_POS.y } : { x: 50, y: 50 };
  if (biomeId === "garrigue") {
    S(CAMP_POS.x, CAMP_POS.y, "camp");
    drawPath(CAMP_POS.x, CAMP_POS.y, 50, 50);
  }

  return { m, nodes, gates, villages, Z: { [biomeId]: { cx: 50, cy: 50, r: 45 } }, spawn };
}

// Legacy function — generates garrigue as default
export function genWorld(seed: number): GameWorld {
  return genBiome(seed, "garrigue");
}
