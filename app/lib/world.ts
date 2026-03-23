// ═══════════════════════════════════════════════════════════
// WORLD GENERATION — Seeded PRNG for shared world
// ═══════════════════════════════════════════════════════════

import { MW, MH, TILES, GUARDS, BIOME_ZONES, VILLAGES, type GameNode, type Gate, type Village, type GameWorld } from './constants';

function makeRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function genWorld(seed: number): GameWorld {
  const rng = makeRng(seed);
  const m: string[][] = Array.from({ length: MH }, () => Array(MW).fill("g"));
  const nodes: GameNode[] = [];
  const gates: Gate[] = [];
  const villages: Village[] = [];

  const S = (x: number, y: number, t: string) => {
    if (x >= 0 && x < MW && y >= 0 && y < MH) m[y][x] = t;
  };
  const D = (a: number, b: number, c: number, d: number) => Math.sqrt((a - c) ** 2 + (b - d) ** 2);

  const Z = { ...BIOME_ZONES };

  // Biome fills
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const dg = D(x, y, Z.garrigue.cx, Z.garrigue.cy);
      const dc = D(x, y, Z.calanques.cx, Z.calanques.cy);
      const dm = D(x, y, Z.mines.cx, Z.mines.cy);
      const ds = D(x, y, Z.mer.cx, Z.mer.cy);
      const dr = D(x, y, Z.restanques.cx, Z.restanques.cy);
      const rv = rng();

      if (dr <= Z.restanques.r) {
        S(x, y, dr > Z.restanques.r - 1.2 ? "rw" : rv < 0.1 ? "lv" : "rs");
      } else if (dg <= Z.garrigue.r) {
        S(x, y, rv < 0.12 ? "t" : rv < 0.2 ? "tg" : rv < 0.26 ? "fl" : rv < 0.32 ? "lv" : "g");
      } else if (dc <= Z.calanques.r) {
        const edge = dc > Z.calanques.r - 2;
        S(x, y, edge ? "cl" : rv < 0.15 ? "r" : rv < 0.3 ? "s" : rv < 0.35 ? "w" : "s");
      } else if (dm <= Z.mines.r) {
        const edge = dm > Z.mines.r - 1.5;
        S(x, y, edge ? "mw" : rv < 0.12 ? "mw" : "mf");
      } else if (ds <= Z.mer.r) {
        const center = ds < 4;
        S(x, y, center ? "dw" : rv < 0.08 ? "dk" : rv < 0.3 ? "cf" : ds > Z.mer.r - 2 ? "s" : "cf");
      } else {
        S(x, y, rv < 0.08 ? "t" : rv < 0.15 ? "tg" : rv < 0.03 ? "r" : "g");
      }
    }
  }

  // Paths between biomes
  const drawP = (x1: number, y1: number, x2: number, y2: number) => {
    let cx = x1, cy = y1;
    while (cx !== x2 || cy !== y2) {
      const tile = m[cy]?.[cx];
      if (tile && !TILES[tile]?.w && tile !== "gt") S(cx, cy, "p");
      else if (tile === "g" || tile === "tg") S(cx, cy, "p");
      if (rng() < 0.6 && cx !== x2) cx += cx < x2 ? 1 : -1;
      else if (cy !== y2) cy += cy < y2 ? 1 : -1;
      else cx += cx < x2 ? 1 : -1;
    }
  };
  drawP(Z.garrigue.cx, Z.garrigue.cy, 25, 19);
  drawP(Z.calanques.cx, Z.calanques.cy, 25, 19);
  drawP(Z.mines.cx, Z.mines.cy, 25, 31);
  drawP(Z.mer.cx, Z.mer.cy, 25, 31);
  drawP(25, 19, 25, 25);
  drawP(25, 25, 25, 31);

  // Gates
  const addGate = (x: number, y: number, b: string) => {
    S(x, y, "gt");
    gates.push({ x, y, b });
  };
  addGate(25, 18, "calanques");
  addGate(20, 25, "mines");
  addGate(30, 25, "mer");
  addGate(Z.restanques.cx, Z.restanques.cy - Z.restanques.r, "restanques");
  addGate(Z.restanques.cx, Z.restanques.cy + Z.restanques.r, "restanques");

  // Villages
  const addVillage = (x: number, y: number, name: string, items: { sell: string; cost: string[] }[]) => {
    S(x, y, "vi"); S(x + 1, y, "vi"); S(x, y + 1, "vi"); S(x + 1, y + 1, "vi");
    villages.push({ x, y, name, items });
  };
  for (const v of VILLAGES) {
    addVillage(v.x, v.y, v.name, v.items);
  }

  // Resource nodes
  const addNodes = (biome: string, zone: { cx: number; cy: number; r: number }, res: string[], cnt: number) => {
    for (let i = 0; i < cnt; i++) {
      let tries = 0;
      while (tries < 60) {
        const x = zone.cx + Math.floor((rng() - 0.5) * zone.r * 1.6);
        const y = zone.cy + Math.floor((rng() - 0.5) * zone.r * 1.6);
        if (x >= 0 && x < MW && y >= 0 && y < MH && TILES[m[y][x]]?.w && !nodes.find((n) => n.x === x && n.y === y)) {
          const r = res[Math.floor(rng() * res.length)];
          const guard = rng() < 0.4;
          nodes.push({ x, y, biome, res: r, guard: guard ? GUARDS[biome] : null, done: false });
          break;
        }
        tries++;
      }
    }
  };
  addNodes("garrigue", Z.garrigue, ["branche", "herbe", "lavande"], 15);
  addNodes("calanques", Z.calanques, ["pierre", "coquillage", "sel"], 12);
  addNodes("mines", Z.mines, ["fer", "ocre", "cristal"], 10);
  addNodes("mer", Z.mer, ["poisson", "perle", "corail"], 10);
  addNodes("restanques", Z.restanques, ["cristal", "perle", "ocre"], 5);

  // Boss nodes
  Object.entries(Z).forEach(([b, z]) => {
    nodes.push({ x: z.cx, y: z.cy, biome: b, res: null, guard: GUARDS[b], boss: true, done: false });
  });

  return { m, nodes, gates, villages, Z, spawn: { x: Z.garrigue.cx, y: Z.garrigue.cy - 4 } };
}
