// ═══════════════════════════════════════════════════════════
// WORLD GENERATION — 5 biomes séparés 100×100
// Chaque biome a ses propres tiles, nodes, villages, portails
// ═══════════════════════════════════════════════════════════

import { TILES, GUARDS, BIOME_MOBS, FORTRESSES, CAMP_POS, monsterHp, monsterAtk, type GameNode, type Gate, type Village, type GameWorld } from './constants';

// v5.0: Maps are now 150×150 (up from 100×100) per CDC spec
const MW = 150;
const MH = 150;

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
  const center = 75; // center of 150×150 map

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
  drawPath(10, center, 140, center); // horizontal
  drawPath(center, 10, center, 140); // vertical
  drawPath(30, 30, 120, 120); // diagonal

  // Portals (gates on edges)
  const portalDefs = PORTALS[biomeId] || [];
  for (const p of portalDefs) {
    let gx = center, gy = center;
    if (p.side === "N") { gx = center; gy = 1; }
    if (p.side === "S") { gx = center; gy = 148; }
    if (p.side === "E") { gx = 148; gy = center; }
    if (p.side === "W") { gx = 1; gy = center; }
    S(gx, gy, "gt");
    gates.push({ x: gx, y: gy, b: p.target });
    drawPath(center, center, gx, gy);
  }
  // Restanques portal (if not restanques)
  if (biomeId !== "restanques") {
    const rx = biomeId === "garrigue" ? 140 : biomeId === "calanques" ? 140 : biomeId === "mines" ? 10 : 10;
    const ry = biomeId === "garrigue" ? 140 : biomeId === "calanques" ? 10 : biomeId === "mines" ? 140 : 140;
    S(rx, ry, "gt");
    gates.push({ x: rx, y: ry, b: "restanques" });
    drawPath(center, center, rx, ry);
  }

  // Villages (scaled positions for 150×150)
  const bVillages = BIOME_VILLAGES[biomeId] || [];
  for (const vdef of bVillages) {
    // Scale village positions to 150×150 (original was for 100×100)
    const v = { ...vdef, x: Math.floor(vdef.x * 1.5), y: Math.floor(vdef.y * 1.5) };
    S(v.x, v.y, "vi"); S(v.x + 1, v.y, "vi"); S(v.x, v.y + 1, "vi"); S(v.x + 1, v.y + 1, "vi");
    villages.push(v);
    drawPath(center, center, v.x, v.y);
  }

  // Resource nodes in CLUSTERS (groups of similar resources)
  const res = BIOME_RES[biomeId] || ["branche"];
  const mobs = BIOME_MOBS[biomeId] || BIOME_MOBS.garrigue;

  // More clusters for the bigger map: 12-18
  const clusterCount = 12 + Math.floor(rng() * 7);
  for (let ci = 0; ci < clusterCount; ci++) {
    const clusterRes = res[Math.floor(rng() * res.length)];
    const cx = 15 + Math.floor(rng() * 120);
    const cy = 15 + Math.floor(rng() * 120);
    const clusterSize = 5 + Math.floor(rng() * 4); // 5-8 nodes per cluster
    const radius = 4 + Math.floor(rng() * 3); // radius 4-6
    for (let ni = 0; ni < clusterSize; ni++) {
      const angle = rng() * Math.PI * 2;
      const dist = rng() * radius;
      const x = Math.round(cx + Math.cos(angle) * dist);
      const y = Math.round(cy + Math.sin(angle) * dist);
      if (x < 2 || x > 147 || y < 2 || y > 147) continue;
      if (!TILES[m[y][x]]?.w || nodes.find(n => n.x === x && n.y === y)) continue;
      let guard = null;
      if (rng() < 0.3) {
        const mob = mobs[Math.floor(rng() * mobs.length)];
        guard = { n: mob.n, e: mob.e, hp: monsterHp(mob.lv), d: `${mob.e} ${mob.n} attaque !` };
      }
      nodes.push({ x, y, biome: biomeId, res: clusterRes, guard, done: false });
    }
  }

  // Scatter individual resources (15-20)
  const scatterCount = 15 + Math.floor(rng() * 6);
  for (let i = 0; i < scatterCount; i++) {
    let tries = 0;
    while (tries < 80) {
      const x = 5 + Math.floor(rng() * 140);
      const y = 5 + Math.floor(rng() * 140);
      if (TILES[m[y][x]]?.w && !nodes.find((n) => n.x === x && n.y === y)) {
        const r = res[Math.floor(rng() * res.length)];
        const hasGuard = rng() < 0.25;
        let guard = null;
        if (hasGuard) {
          const mob = mobs[Math.floor(rng() * mobs.length)];
          const mobHp = Math.ceil(4 + mob.lv * 2.5 + Math.pow(mob.lv, 1.3));
          guard = { n: mob.n, e: mob.e, hp: mobHp, d: `${mob.e} ${mob.n} attaque !` };
        }
        nodes.push({ x, y, biome: biomeId, res: r, guard, done: false });
        break;
      }
      tries++;
    }
  }

  // Roaming monsters — 80-100 per biome, distributed by distance from center
  // CDC: 0-20 radius = 0 monsters (safe), 20-50 = nv1-2, 50-90 = nv2-3, 90-120 = nv3-4, 120+ = nv4-5
  const monsterCount = 80 + Math.floor(rng() * 20);
  for (let i = 0; i < monsterCount; i++) {
    let tries = 0;
    while (tries < 60) {
      const x = 5 + Math.floor(rng() * 140);
      const y = 5 + Math.floor(rng() * 140);
      const distFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
      // No monsters within 20 tiles of center (safe zone)
      if (distFromCenter < 20) { tries++; continue; }
      if (TILES[m[y][x]]?.w && !nodes.find((n) => n.x === x && n.y === y)) {
        // Select mob based on distance
        let mobIdx: number;
        if (distFromCenter < 50) mobIdx = Math.min(1, mobs.length - 1); // nv1-2
        else if (distFromCenter < 90) mobIdx = Math.min(Math.floor(rng() * 2) + 1, mobs.length - 1); // nv2-3
        else if (distFromCenter < 120) mobIdx = Math.min(Math.floor(rng() * 2) + 2, mobs.length - 1); // nv3-4
        else mobIdx = mobs.length - 1; // nv4+
        const mob = mobs[mobIdx];
        const mhp = monsterHp(mob.lv);
        nodes.push({ x, y, biome: biomeId, res: null, guard: { n: mob.n, e: mob.e, hp: mhp, d: `${mob.e} ${mob.n} attaque !` }, done: false });
        break;
      }
      tries++;
    }
  }

  // Boss in FORTRESS (far corner from center)
  const fort = FORTRESSES[biomeId];
  if (fort) {
    // Scale fortress position to 150×150
    const fx = Math.min(140, Math.floor(fort.x * 1.5));
    const fy = Math.min(140, Math.floor(fort.y * 1.5));
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { S(fx + dx, fy + dy, tiles.path); }
    drawPath(center, center, fx, fy);
    nodes.push({ x: fx, y: fy, biome: biomeId, res: null, guard: GUARDS[biomeId], boss: true, done: false });
  }

  // Camp / Maison de Mélanie (position 75,75 = center of 150×150 map)
  const spawn = { x: center, y: center };
  if (biomeId === "garrigue") {
    S(center, center, "camp");
    // Safe zone around camp
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const sx = center + dx, sy = center + dy;
      if (sx >= 0 && sx < MW && sy >= 0 && sy < MH && m[sy][sx] !== "camp") {
        S(sx, sy, tiles.path);
      }
    }
  }

  return { m, nodes, gates, villages, Z: { [biomeId]: { cx: center, cy: center, r: 70 } }, spawn };
}

// Legacy function — generates garrigue as default
export function genWorld(seed: number): GameWorld {
  return genBiome(seed, "garrigue");
}
