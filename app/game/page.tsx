"use client";
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CLASSES } from "../data/classes";
import {
  BIOMES, BIOME_ORDER, MONSTERS, BOSSES, RES, BIOME_RES,
  SPELLS, EQUIPMENT, RECIPES, TOOLS, SEEDS, SHOP_ITEMS,
  NPCS, STORY, PORTALS, FORTRESS_POS, BAG_SIZES,
} from "../data/game-data";
import { sounds } from "../lib/sounds";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
interface Pos { x: number; y: number }
interface MapTile { biome: string; type: "ground"|"path"|"block"|"water"|"resource"|"portal"|"npc"|"fortress"|"home"; resId?: string; resHp?: number; portalTo?: string; npcId?: string }
interface Mob { id: string; mId: string; x: number; y: number; hp: number; maxHp: number; atk: number; lv: number; drops: string[]; sous: [number,number]; emoji: string; name: string; dir: number; moveT: number; isBoss?: boolean }
interface PuyoGem { color: number; x: number; y: number; matched?: boolean; falling?: boolean }
interface CombatState { enemy: Mob; grid: PuyoGem[][]; playerHp: number; enemyHp: number; turn: number; combo: number; msg: string; phase: "play"|"resolve"|"win"|"lose"; selected: Pos|null; animating: boolean }
interface FloatMsg { id: number; x: number; y: number; text: string; color: string; t: number }

// ═══════════════════════════════════════════════════════
// SEEDED RNG
// ═══════════════════════════════════════════════════════
function mkRng(s: number) {
  let v = s;
  return () => { v = (v * 16807 + 0) % 2147483647; return (v - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════
// MAP GENERATION 150×150
// ═══════════════════════════════════════════════════════
const MAP_W = 150, MAP_H = 150;
const TILE_PX = 32;
const GEM_COLORS = ["🔴","🔵","🟢","🟡","🟣","🟠"];

function genMap(seed: number): MapTile[][] {
  const rng = mkRng(seed);
  const map: MapTile[][] = Array.from({length: MAP_H}, () => Array.from({length: MAP_W}, () => ({ biome: "garrigue", type: "ground" as const })));

  // Biome zones (roughly quadrant-based + center)
  const biomeZones: {id:string;cx:number;cy:number;r:number}[] = [
    {id:"garrigue",cx:37,cy:37,r:50},
    {id:"calanques",cx:112,cy:37,r:50},
    {id:"mines",cx:37,cy:112,r:50},
    {id:"mer",cx:112,cy:112,r:50},
    {id:"restanques",cx:75,cy:75,r:25},
  ];

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      let minD = 999, best = "garrigue";
      for (const z of biomeZones) {
        const d = Math.sqrt((x - z.cx) ** 2 + (y - z.cy) ** 2) - z.r * (0.8 + rng() * 0.4);
        if (d < minD) { minD = d; best = z.id; }
      }
      map[y][x].biome = best;

      // Random terrain
      const r = rng();
      if (r < 0.08) map[y][x].type = "block";
      else if (r < 0.12) map[y][x].type = "path";
      else if (r < 0.18) {
        const res = BIOME_RES[best];
        if (res) {
          const rid = res[Math.floor(rng() * res.length)];
          map[y][x].type = "resource";
          map[y][x].resId = rid;
          map[y][x].resHp = RES[rid]?.hp ?? 10;
        }
      }
    }
  }

  // Paths between biomes
  const pathPairs: [Pos,Pos][] = [
    [{x:37,y:37},{x:75,y:75}], [{x:112,y:37},{x:75,y:75}],
    [{x:37,y:112},{x:75,y:75}], [{x:112,y:112},{x:75,y:75}],
    [{x:37,y:37},{x:112,y:37}], [{x:37,y:37},{x:37,y:112}],
    [{x:112,y:37},{x:112,y:112}],
  ];
  for (const [a, b] of pathPairs) {
    let cx = a.x, cy = a.y;
    for (let i = 0; i < 300; i++) {
      if (Math.abs(cx - b.x) > Math.abs(cy - b.y)) cx += cx < b.x ? 1 : -1;
      else cy += cy < b.y ? 1 : -1;
      if (rng() < 0.3) { cx += rng() < 0.5 ? 1 : -1; }
      cx = Math.max(1, Math.min(MAP_W - 2, Math.round(cx)));
      cy = Math.max(1, Math.min(MAP_H - 2, Math.round(cy)));
      if (map[cy][cx].type !== "portal" && map[cy][cx].type !== "npc") {
        map[cy][cx].type = "path";
        if (rng() < 0.4 && cx + 1 < MAP_W) map[cy][cx + 1].type = "path";
        if (rng() < 0.4 && cy + 1 < MAP_H) map[cy + 1][cx].type = "path";
      }
    }
  }

  // Portals
  for (const [biome, portals] of Object.entries(PORTALS)) {
    for (const p of portals) {
      const zone = biomeZones.find(z => z.id === biome)!;
      let px = zone.cx, py = zone.cy;
      if (p.side === "N") py = zone.cy - 30;
      if (p.side === "S") py = zone.cy + 30;
      if (p.side === "E") px = zone.cx + 30;
      if (p.side === "W") px = zone.cx - 30;
      px = Math.max(2, Math.min(MAP_W - 3, px));
      py = Math.max(2, Math.min(MAP_H - 3, py));
      map[py][px] = { biome, type: "portal", portalTo: p.target };
    }
  }

  // NPCs
  for (const npc of NPCS) {
    const zone = biomeZones.find(z => z.id === npc.biome)!;
    let nx = zone.cx + Math.floor(rng() * 20 - 10);
    let ny = zone.cy + Math.floor(rng() * 20 - 10);
    nx = Math.max(2, Math.min(MAP_W - 3, nx));
    ny = Math.max(2, Math.min(MAP_H - 3, ny));
    map[ny][nx] = { biome: npc.biome, type: "npc", npcId: npc.id };
  }

  // Fortress (boss rooms)
  for (const [biome, pos] of Object.entries(FORTRESS_POS)) {
    const fx = Math.max(2, Math.min(MAP_W - 3, pos.x));
    const fy = Math.max(2, Math.min(MAP_H - 3, pos.y));
    map[fy][fx] = { biome, type: "fortress" };
  }

  // Home (center garrigue)
  map[35][35] = { biome: "garrigue", type: "home" };

  // Borders = blocks
  for (let i = 0; i < MAP_W; i++) { map[0][i].type = "block"; map[MAP_H-1][i].type = "block"; }
  for (let i = 0; i < MAP_H; i++) { map[i][0].type = "block"; map[i][MAP_W-1].type = "block"; }

  return map;
}

// ═══════════════════════════════════════════════════════
// SPAWN MOBS
// ═══════════════════════════════════════════════════════
function spawnMobs(map: MapTile[][], seed: number): Mob[] {
  const rng = mkRng(seed + 7777);
  const mobs: Mob[] = [];
  let mid = 0;
  for (let y = 5; y < MAP_H - 5; y += 4) {
    for (let x = 5; x < MAP_W - 5; x += 4) {
      if (rng() > 0.15) continue;
      const tile = map[y][x];
      if (tile.type !== "ground" && tile.type !== "path") continue;
      const pool = MONSTERS[tile.biome];
      if (!pool || pool.length === 0) continue;
      const m = pool[Math.floor(rng() * pool.length)];
      mobs.push({
        id: `m${mid++}`, mId: m.id, x: x * TILE_PX, y: y * TILE_PX,
        hp: m.hp, maxHp: m.hp, atk: m.atk, lv: m.lv, drops: m.drops,
        sous: m.sous, emoji: m.emoji, name: m.name, dir: rng() * Math.PI * 2, moveT: 0,
      });
    }
  }
  return mobs;
}

// ═══════════════════════════════════════════════════════
// PUYO GRID HELPERS
// ═══════════════════════════════════════════════════════
const PUYO_W = 6, PUYO_H = 8;

function mkGrid(): PuyoGem[][] {
  const g: PuyoGem[][] = [];
  for (let y = 0; y < PUYO_H; y++) {
    g[y] = [];
    for (let x = 0; x < PUYO_W; x++) {
      g[y][x] = { color: Math.floor(Math.random() * 5), x, y };
    }
  }
  // Remove initial matches
  for (let pass = 0; pass < 5; pass++) {
    for (let y = 0; y < PUYO_H; y++) for (let x = 0; x < PUYO_W; x++) {
      if (x >= 2 && g[y][x].color === g[y][x-1].color && g[y][x].color === g[y][x-2].color)
        g[y][x].color = (g[y][x].color + 1) % 5;
      if (y >= 2 && g[y][x].color === g[y-1][x].color && g[y][x].color === g[y-2][x].color)
        g[y][x].color = (g[y][x].color + 1) % 5;
    }
  }
  return g;
}

function findMatches(grid: PuyoGem[][]): Set<string> {
  const matched = new Set<string>();
  for (let y = 0; y < PUYO_H; y++) for (let x = 0; x < PUYO_W; x++) {
    if (x + 2 < PUYO_W && grid[y][x].color === grid[y][x+1].color && grid[y][x].color === grid[y][x+2].color) {
      matched.add(`${x},${y}`); matched.add(`${x+1},${y}`); matched.add(`${x+2},${y}`);
    }
    if (y + 2 < PUYO_H && grid[y][x].color === grid[y+1][x].color && grid[y][x].color === grid[y+2][x].color) {
      matched.add(`${x},${y}`); matched.add(`${x},${y+1}`); matched.add(`${x},${y+2}`);
    }
  }
  return matched;
}

function applyGravity(grid: PuyoGem[][]): PuyoGem[][] {
  const ng: PuyoGem[][] = Array.from({length: PUYO_H}, (_, y) => Array.from({length: PUYO_W}, (_, x) => ({color: -1, x, y})));
  for (let x = 0; x < PUYO_W; x++) {
    let wy = PUYO_H - 1;
    for (let y = PUYO_H - 1; y >= 0; y--) {
      if (grid[y][x].color >= 0) { ng[wy][x].color = grid[y][x].color; wy--; }
    }
    for (let y = wy; y >= 0; y--) ng[y][x].color = Math.floor(Math.random() * 5);
  }
  return ng;
}

function swapGems(grid: PuyoGem[][], a: Pos, b: Pos): PuyoGem[][] {
  const ng = grid.map(row => row.map(g => ({...g})));
  const tmp = ng[a.y][a.x].color;
  ng[a.y][a.x].color = ng[b.y][b.x].color;
  ng[b.y][b.x].color = tmp;
  return ng;
}

// ═══════════════════════════════════════════════════════
// MAIN GAME COMPONENT
// ═══════════════════════════════════════════════════════
export default function GamePageWrapper() {
  return <Suspense fallback={<div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",color:"#DAA520",fontSize:18}}>Chargement...</div>}><GameInner /></Suspense>;
}

function GameInner() {
  const params = useSearchParams();
  const router = useRouter();
  const playerName = params.get("player") || "Héros";
  const playerClassId = params.get("class") || "paladin";
  const sessionId = params.get("session") || "";
  const playerClass = CLASSES[playerClassId] || CLASSES.paladin;

  // ─── STATE ───
  const [seed] = useState(() => Date.now());
  const mapRef = useRef<MapTile[][]|null>(null);
  const mobsRef = useRef<Mob[]>([]);
  const [px, setPx] = useState(35 * TILE_PX);
  const [py, setPy] = useState(35 * TILE_PX);
  const [bag, setBag] = useState<Record<string, number>>({});
  const [bagSize] = useState(BAG_SIZES[0]);
  const [hp, setHp] = useState(playerClass.hp);
  const [maxHp] = useState(playerClass.hp);
  const [sous, setSous] = useState(playerClass.sous);
  const [lv, setLv] = useState(1);
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState({...playerClass.baseStats});
  const [equip, setEquip] = useState<Record<string, string>>({});
  const [spells, setSpells] = useState<string[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [dayPhase, setDayPhase] = useState<"day"|"dusk"|"night"|"dawn">("day");
  const [combat, setCombat] = useState<CombatState|null>(null);
  const [panel, setPanel] = useState<"none"|"bag"|"craft"|"npc"|"shop"|"story"|"map"|"menu">("none");
  const [npcDialog, setNpcDialog] = useState<{name:string;emoji:string;text:string;quest?:string}|null>(null);
  const [storyText, setStoryText] = useState<string[]>([]);
  const [storyIdx, setStoryIdx] = useState(0);
  const [floats, setFloats] = useState<FloatMsg[]>([]);
  const [volume, setVolume] = useState(1);
  const [showMinimap, setShowMinimap] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joystickRef = useRef<{active:boolean;dx:number;dy:number;tid:number|null}>({active:false,dx:0,dy:0,tid:null});
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const lastTRef = useRef(0);
  const floatIdRef = useRef(0);

  // ─── INIT MAP ───
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = genMap(seed);
      mobsRef.current = spawnMobs(mapRef.current, seed);
    }
    sounds.init();
    // Show intro story
    setStoryText(STORY.intro);
    setPanel("story");
    setStoryIdx(0);
  }, [seed]);

  // ─── DAY/NIGHT CYCLE ───
  useEffect(() => {
    const iv = setInterval(() => {
      setGameTime(t => {
        const nt = t + 1;
        const cycle = nt % 600; // 10 min cycle
        if (cycle < 300) setDayPhase("day");
        else if (cycle < 375) setDayPhase("dusk");
        else if (cycle < 525) setDayPhase("night");
        else setDayPhase("dawn");
        return nt;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ─── KEYBOARD ───
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // ─── HELPERS ───
  const addFloat = useCallback((x: number, y: number, text: string, color: string) => {
    const id = floatIdRef.current++;
    setFloats(f => [...f, {id, x, y, text, color, t: Date.now()}]);
    setTimeout(() => setFloats(f => f.filter(m => m.id !== id)), 1000);
  }, []);

  const addToBag = useCallback((item: string, qty = 1) => {
    setBag(b => {
      const total = Object.values(b).reduce((s, v) => s + v, 0);
      if (total >= bagSize) return b;
      return {...b, [item]: (b[item] || 0) + qty};
    });
  }, [bagSize]);

  const gainXp = useCallback((amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      const need = lv * 20;
      if (next >= need) {
        setLv(l => l + 1);
        setHp(h => Math.min(h + 5, maxHp + lv * 5));
        setStats(s => ({...s, atk: s.atk + 1, def: s.def + (Math.random() < 0.5 ? 1 : 0)}));
        sounds.lvlUp();
        addFloat(px, py, `Niveau ${lv + 1}!`, "#FFD700");
        return next - need;
      }
      return next;
    });
  }, [lv, maxHp, px, py, addFloat]);

  // ─── GET CURRENT BIOME ───
  const currentBiome = useMemo(() => {
    if (!mapRef.current) return "garrigue";
    const tx = Math.floor(px / TILE_PX);
    const ty = Math.floor(py / TILE_PX);
    if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) return mapRef.current[ty][tx].biome;
    return "garrigue";
  }, [px, py]);

  // ─── MUSIC ───
  useEffect(() => {
    if (combat) { sounds.playMusic("combat"); return; }
    const b = BIOMES[currentBiome];
    if (b) sounds.playMusic(b.music);
  }, [currentBiome, combat]);

  // ─── MAIN GAME LOOP ───
  useEffect(() => {
    if (combat || panel !== "none") return;
    const map = mapRef.current;
    if (!map) return;

    let running = true;
    const loop = (time: number) => {
      if (!running) return;
      const dt = lastTRef.current ? (time - lastTRef.current) / 1000 : 0.016;
      lastTRef.current = time;

      // Player movement
      let dx = 0, dy = 0;
      const spd = playerClass.speed * 120 * dt;
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if (keys.has("arrowup") || keys.has("z") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;

      // Joystick
      const joy = joystickRef.current;
      if (joy.active) { dx += joy.dx; dy += joy.dy; }

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / len) * spd;
        dy = (dy / len) * spd;

        const nx = px + dx, ny = py + dy;
        const tx = Math.floor(nx / TILE_PX), ty = Math.floor(ny / TILE_PX);
        if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
          const tile = map[ty][tx];
          if (tile.type !== "block" && tile.type !== "water") {
            setPx(nx); setPy(ny);
            if (frameRef.current % 12 === 0) sounds.step();

            // Check tile interactions
            if (tile.type === "resource" && tile.resId && tile.resHp && tile.resHp > 0) {
              if (frameRef.current % 20 === 0) {
                tile.resHp -= playerClass.harvestTap;
                if (tile.resHp <= 0) {
                  addToBag(tile.resId);
                  sounds.harvest();
                  addFloat(nx, ny - 20, `+1 ${RES[tile.resId]?.emoji || ""}`, "#4CAF50");
                  tile.type = "ground";
                  tile.resId = undefined;
                }
              }
            }

            if (tile.type === "portal" && tile.portalTo) {
              const target = tile.portalTo;
              const tz = [{id:"garrigue",cx:37,cy:37},{id:"calanques",cx:112,cy:37},{id:"mines",cx:37,cy:112},{id:"mer",cx:112,cy:112},{id:"restanques",cx:75,cy:75}];
              const z = tz.find(z => z.id === target);
              if (z) { setPx(z.cx * TILE_PX); setPy(z.cy * TILE_PX); sounds.open(); addFloat(z.cx * TILE_PX, z.cy * TILE_PX, `→ ${BIOMES[target]?.name}`, "#FFD700"); }
            }

            if (tile.type === "npc" && tile.npcId) {
              const npc = NPCS.find(n => n.id === tile.npcId);
              if (npc && frameRef.current % 60 === 0) {
                sounds.open();
                setNpcDialog({name: npc.name, emoji: npc.emoji, text: npc.quest, quest: npc.quest});
                setPanel("npc");
              }
            }

            if (tile.type === "fortress") {
              const boss = BOSSES[tile.biome];
              if (boss && frameRef.current % 60 === 0) {
                startCombat({
                  id: "boss_" + tile.biome, mId: "boss", x: px, y: py,
                  hp: boss.hp, maxHp: boss.hp, atk: boss.atk, lv: boss.lv,
                  drops: [boss.drop], sous: [boss.sous, boss.sous],
                  emoji: boss.emoji, name: boss.name, dir: 0, moveT: 0, isBoss: true,
                });
              }
            }
          }
        }
      }

      // Mob movement + collision
      const mobs = mobsRef.current;
      for (const mob of mobs) {
        if (mob.hp <= 0) continue;
        mob.moveT += dt;
        if (mob.moveT > 2) {
          mob.dir = Math.random() * Math.PI * 2;
          mob.moveT = 0;
        }
        const mx = mob.x + Math.cos(mob.dir) * 30 * dt;
        const my = mob.y + Math.sin(mob.dir) * 30 * dt;
        const mtx = Math.floor(mx / TILE_PX), mty = Math.floor(my / TILE_PX);
        if (mtx > 0 && mtx < MAP_W - 1 && mty > 0 && mty < MAP_H - 1 && map[mty][mtx].type !== "block") {
          mob.x = mx; mob.y = my;
        } else { mob.dir += Math.PI; }

        // Collision with player
        const ddx = mob.x - px, ddy = mob.y - py;
        if (ddx * ddx + ddy * ddy < 900) { // ~30px
          startCombat(mob);
          break;
        }
      }

      frameRef.current++;
      draw();
      if (running) requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat, panel, px, py, playerClass]);

  // ─── DRAW ───
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs || !mapRef.current) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);

    const map = mapRef.current;
    const camX = px - W / 2, camY = py - H / 2;
    const startTX = Math.max(0, Math.floor(camX / TILE_PX) - 1);
    const startTY = Math.max(0, Math.floor(camY / TILE_PX) - 1);
    const endTX = Math.min(MAP_W, Math.ceil((camX + W) / TILE_PX) + 1);
    const endTY = Math.min(MAP_H, Math.ceil((camY + H) / TILE_PX) + 1);

    // Draw tiles
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = map[ty][tx];
        const biome = BIOMES[tile.biome] || BIOMES.garrigue;
        const sx = tx * TILE_PX - camX, sy = ty * TILE_PX - camY;

        switch (tile.type) {
          case "ground": ctx.fillStyle = (tx + ty) % 2 === 0 ? biome.colors.ground : biome.colors.alt; break;
          case "path": ctx.fillStyle = biome.colors.path; break;
          case "block": ctx.fillStyle = biome.colors.block; break;
          case "water": ctx.fillStyle = "#2471A3"; break;
          default: ctx.fillStyle = biome.colors.ground;
        }
        ctx.fillRect(sx, sy, TILE_PX, TILE_PX);

        // Draw special tiles
        if (tile.type === "resource" && tile.resId) {
          ctx.font = "20px serif";
          ctx.textAlign = "center";
          ctx.fillText(RES[tile.resId]?.emoji || "?", sx + TILE_PX / 2, sy + TILE_PX / 2 + 6);
        }
        if (tile.type === "portal") {
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.fillText("🌀", sx + TILE_PX / 2, sy + TILE_PX / 2 + 7);
        }
        if (tile.type === "npc" && tile.npcId) {
          const npc = NPCS.find(n => n.id === tile.npcId);
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.fillText(npc?.emoji || "❓", sx + TILE_PX / 2, sy + TILE_PX / 2 + 7);
        }
        if (tile.type === "fortress") {
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.fillText("🏰", sx + TILE_PX / 2, sy + TILE_PX / 2 + 7);
        }
        if (tile.type === "home") {
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.fillText("🏠", sx + TILE_PX / 2, sy + TILE_PX / 2 + 7);
        }
      }
    }

    // Draw mobs
    for (const mob of mobsRef.current) {
      if (mob.hp <= 0) continue;
      const mx = mob.x - camX, my = mob.y - camY;
      if (mx < -40 || mx > W + 40 || my < -40 || my > H + 40) continue;
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.fillText(mob.emoji, mx, my + 8);
      // HP bar
      const hpRatio = mob.hp / mob.maxHp;
      ctx.fillStyle = "#333";
      ctx.fillRect(mx - 14, my - 18, 28, 4);
      ctx.fillStyle = hpRatio > 0.5 ? "#4CAF50" : hpRatio > 0.25 ? "#FF9800" : "#F44336";
      ctx.fillRect(mx - 14, my - 18, 28 * hpRatio, 4);
    }

    // Draw player
    const ppx = W / 2, ppy = H / 2;
    ctx.font = "28px serif";
    ctx.textAlign = "center";
    ctx.fillText(playerClass.emoji, ppx, ppy + 8);
    // Player name
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText(playerName, ppx, ppy - 18);
    ctx.fillText(playerName, ppx, ppy - 18);

    // Night overlay
    if (dayPhase === "night") {
      ctx.fillStyle = "rgba(0,0,30,0.4)";
      ctx.fillRect(0, 0, W, H);
    } else if (dayPhase === "dusk" || dayPhase === "dawn") {
      ctx.fillStyle = "rgba(0,0,30,0.2)";
      ctx.fillRect(0, 0, W, H);
    }
  }, [px, py, dayPhase, playerClass, playerName]);

  // ─── START COMBAT ───
  const startCombat = useCallback((mob: Mob) => {
    if (combat) return;
    sounds.hit();
    setCombat({
      enemy: mob,
      grid: mkGrid(),
      playerHp: hp,
      enemyHp: mob.hp,
      turn: 0,
      combo: 0,
      msg: `${mob.emoji} ${mob.name} apparaît !`,
      phase: "play",
      selected: null,
      animating: false,
    });
  }, [combat, hp]);

  // ─── COMBAT: SELECT GEM ───
  const combatSelect = useCallback((x: number, y: number) => {
    if (!combat || combat.phase !== "play" || combat.animating) return;
    if (combat.selected) {
      const s = combat.selected;
      const dx = Math.abs(s.x - x), dy = Math.abs(s.y - y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        // Swap
        let ng = swapGems(combat.grid, s, {x, y});
        let matches = findMatches(ng);
        if (matches.size === 0) {
          // Swap back
          setCombat({...combat, selected: null, msg: "Pas de match !"});
          return;
        }
        // Resolve chain
        let totalDmg = 0, combo = 0;
        const resolve = () => {
          matches = findMatches(ng);
          if (matches.size === 0) {
            // Enemy attacks back
            const eDmg = Math.max(1, combat.enemy.atk - stats.def);
            const newPHp = combat.playerHp - eDmg;
            if (newPHp <= 0) {
              setCombat({...combat, grid: ng, playerHp: 0, enemyHp: combat.enemyHp - totalDmg, phase: "lose", combo, msg: "💀 K.O.", selected: null, animating: false});
              sounds.defeat();
              return;
            }
            setCombat({...combat, grid: ng, playerHp: newPHp, enemyHp: Math.max(0, combat.enemyHp - totalDmg), turn: combat.turn + 1, combo, msg: totalDmg > 0 ? `💥 ${totalDmg} dmg ! (${combo}×)` : "", selected: null, animating: false});
            return;
          }
          combo++;
          const matchDmg = matches.size * (stats.atk + stats.mag) * playerClass.combatMul * (1 + combo * 0.25);
          totalDmg += Math.round(matchDmg);
          sounds.gemMatch(combo);

          // Clear matches
          for (const key of matches) {
            const [mx, my] = key.split(",").map(Number);
            ng[my][mx].color = -1;
          }
          ng = applyGravity(ng);

          // Check win
          if (combat.enemyHp - totalDmg <= 0) {
            const drop = combat.enemy.drops[Math.floor(Math.random() * combat.enemy.drops.length)];
            const sGain = combat.enemy.sous[0] + Math.floor(Math.random() * (combat.enemy.sous[1] - combat.enemy.sous[0]));
            addToBag(drop);
            setSous(s => s + sGain);
            gainXp(combat.enemy.lv * 5);
            sounds.victory();
            // Remove mob
            const mi = mobsRef.current.findIndex(m => m.id === combat.enemy.id);
            if (mi >= 0) mobsRef.current[mi].hp = 0;
            setCombat({...combat, grid: ng, enemyHp: 0, combo, phase: "win", msg: `🎉 Victoire ! +${RES[drop]?.emoji || drop} +${sGain}💰`, selected: null, animating: false});
            return;
          }

          setTimeout(resolve, 300);
        };
        setCombat({...combat, grid: ng, animating: true, selected: null});
        setTimeout(resolve, 200);
      } else {
        setCombat({...combat, selected: {x, y}});
      }
    } else {
      setCombat({...combat, selected: {x, y}});
    }
  }, [combat, stats, playerClass, addToBag, gainXp]);

  // ─── COMBAT END ───
  const endCombat = useCallback(() => {
    if (combat) {
      if (combat.phase === "lose") {
        setHp(Math.max(1, Math.floor(maxHp / 2)));
        setSous(s => Math.max(0, s - 20));
        setPx(35 * TILE_PX);
        setPy(35 * TILE_PX);
      } else {
        setHp(combat.playerHp);
      }
    }
    setCombat(null);
  }, [combat, maxHp]);

  // ─── CRAFT ───
  const doCraft = useCallback((recipeId: string) => {
    if (!playerClass.canCraft && playerClassId !== "paladin") return;
    const allRecipes = [...EQUIPMENT.map(e => ({id: e.id, recipe: e.recipe, type: "equip" as const})), ...RECIPES.map(r => ({id: r.id, recipe: r.recipe, type: "recipe" as const})), ...Object.entries(TOOLS).map(([k, v]) => ({id: k, recipe: v.recipe, type: "tool" as const}))];
    const rec = allRecipes.find(r => r.id === recipeId);
    if (!rec) return;
    // Check materials
    for (const [item, qty] of Object.entries(rec.recipe)) {
      if ((bag[item] || 0) < qty) { addFloat(px, py, "Matériaux insuffisants", "#F44336"); return; }
    }
    // Craft fail check
    if (Math.random() < playerClass.craftFail) { addFloat(px, py, "Craft raté !", "#F44336"); sounds.locked(); return; }
    // Consume
    const nb = {...bag};
    for (const [item, qty] of Object.entries(rec.recipe)) nb[item] = (nb[item] || 0) - qty;
    setBag(nb);
    if (rec.type === "equip") {
      const eq = EQUIPMENT.find(e => e.id === recipeId)!;
      setEquip(prev => ({...prev, [eq.slot]: eq.id}));
      setStats(s => {
        const ns = {...s};
        for (const [k, v] of Object.entries(eq.stats)) ns[k as keyof typeof ns] += v;
        return ns;
      });
      sounds.equip();
    } else if (rec.type === "recipe") {
      const r = RECIPES.find(r => r.id === recipeId)!;
      if (r.effect.stat === "hp") setHp(h => Math.min(maxHp + lv * 5, h + r.effect.val));
      addToBag(recipeId);
    } else {
      addToBag(recipeId);
    }
    sounds.craft();
    addFloat(px, py, "Craft réussi !", "#4CAF50");
  }, [bag, playerClass, playerClassId, px, py, addFloat, addToBag, maxHp, lv]);

  // ─── RESIZE CANVAS ───
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ─── TOUCH JOYSTICK ───
  const joystickStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const j = joystickRef.current;
    j.active = true;
    const cx = t.clientX, cy = t.clientY;
    const el = e.currentTarget.getBoundingClientRect();
    const ox = cx - el.left - el.width / 2;
    const oy = cy - el.top - el.height / 2;
    const len = Math.sqrt(ox * ox + oy * oy);
    if (len > 5) { j.dx = ox / len; j.dy = oy / len; }
  }, []);

  const joystickMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const j = joystickRef.current;
    if (!j.active) return;
    const el = e.currentTarget.getBoundingClientRect();
    const ox = t.clientX - el.left - el.width / 2;
    const oy = t.clientY - el.top - el.height / 2;
    const len = Math.sqrt(ox * ox + oy * oy);
    if (len > 5) { j.dx = ox / len; j.dy = oy / len; } else { j.dx = 0; j.dy = 0; }
  }, []);

  const joystickEnd = useCallback(() => {
    const j = joystickRef.current;
    j.active = false; j.dx = 0; j.dy = 0;
  }, []);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  const biomeName = BIOMES[currentBiome]?.name || "?";
  const biomeEmoji = BIOMES[currentBiome]?.emoji || "?";

  return (
    <div style={{position:"fixed",inset:0,background:"#000",overflow:"hidden",touchAction:"none"}}>
      {/* CANVAS */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}} />

      {/* HUD TOP */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(rgba(0,0,0,.7),transparent)",pointerEvents:"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:13,color:"#FFF"}}>{playerClass.emoji} {playerName}</span>
          <span style={{fontSize:12,color:"#4CAF50"}}>❤️{hp}/{maxHp + lv * 5}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>Lv{lv}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>💰{sous}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:11,color:"#CCC"}}>{biomeEmoji} {biomeName}</span>
          <span style={{fontSize:11,color:"#AAA"}}>{dayPhase === "day" ? "☀️" : dayPhase === "night" ? "🌙" : "🌅"}</span>
        </div>
      </div>

      {/* XP BAR */}
      <div style={{position:"absolute",top:32,left:10,right:10,zIndex:10,height:3,background:"rgba(255,255,255,.15)",borderRadius:2}}>
        <div style={{height:"100%",background:"#FFD700",borderRadius:2,width:`${(xp / (lv * 20)) * 100}%`,transition:"width .3s"}} />
      </div>

      {/* HUD BOTTOM BUTTONS */}
      {!combat && panel === "none" && (
        <div style={{position:"absolute",bottom:10,right:10,zIndex:10,display:"flex",flexDirection:"column",gap:6}}>
          <button onClick={() => { sounds.click(); setPanel("bag"); }} style={hudBtn}>🎒</button>
          <button onClick={() => { sounds.click(); setPanel("craft"); }} style={hudBtn}>🔨</button>
          <button onClick={() => { sounds.click(); setPanel("map"); }} style={hudBtn}>🗺️</button>
          <button onClick={() => { sounds.click(); setPanel("menu"); }} style={hudBtn}>⚙️</button>
        </div>
      )}

      {/* JOYSTICK */}
      {!combat && panel === "none" && (
        <div
          onTouchStart={joystickStart} onTouchMove={joystickMove} onTouchEnd={joystickEnd}
          style={{position:"absolute",bottom:20,left:20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.12)",border:"2px solid rgba(255,255,255,.2)",zIndex:10,touchAction:"none"}}
        >
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,.25)"}} />
        </div>
      )}

      {/* MINIMAP */}
      {showMinimap && !combat && panel === "none" && (
        <MiniMap map={mapRef.current} px={px} py={py} />
      )}

      {/* FLOATING MESSAGES */}
      {floats.map(f => (
        <div key={f.id} style={{position:"absolute",left:f.x - px + (canvasRef.current?.width || 0) / 2,top:f.y - py + (canvasRef.current?.height || 0) / 2 - 30,color:f.color,fontSize:14,fontWeight:"bold",pointerEvents:"none",animation:"dmgFloat 1s forwards",zIndex:50,textShadow:"0 1px 3px #000"}}>
          {f.text}
        </div>
      ))}

      {/* ══════ COMBAT SCREEN ══════ */}
      {combat && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn .3s"}}>
          {/* Enemy info */}
          <div style={{textAlign:"center",marginBottom:10}}>
            <div style={{fontSize:40}}>{combat.enemy.emoji}</div>
            <div style={{color:"#FFF",fontSize:14,fontWeight:"bold"}}>{combat.enemy.name} Lv{combat.enemy.lv}</div>
            <div style={{width:160,height:8,background:"#333",borderRadius:4,margin:"4px auto"}}>
              <div style={{height:"100%",background:combat.enemyHp > combat.enemy.maxHp * 0.3 ? "#F44336" : "#D32F2F",borderRadius:4,width:`${(combat.enemyHp / combat.enemy.maxHp) * 100}%`,transition:"width .3s"}} />
            </div>
            <div style={{color:"#F88",fontSize:11}}>❤️ {combat.enemyHp}/{combat.enemy.maxHp}</div>
          </div>

          {/* Message */}
          {combat.msg && <div style={{color:"#FFD700",fontSize:13,marginBottom:8,textAlign:"center",padding:"0 20px"}}>{combat.msg}</div>}

          {/* Puyo Grid */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},42px)`,gridTemplateRows:`repeat(${PUYO_H},42px)`,gap:2,background:"rgba(255,255,255,.05)",padding:6,borderRadius:10,border:"2px solid rgba(255,255,255,.1)"}}>
            {combat.grid.map((row, y) => row.map((gem, x) => (
              <button
                key={`${x}-${y}`}
                onClick={() => combatSelect(x, y)}
                style={{
                  width:42,height:42,borderRadius:8,border: combat.selected?.x === x && combat.selected?.y === y ? "3px solid #FFD700" : "1px solid rgba(255,255,255,.1)",
                  background: gem.color >= 0 ? [`#E53935`,`#1E88E5`,`#43A047`,`#FDD835`,`#8E24AA`,`#FF6D00`][gem.color] : "#222",
                  fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"transform .15s",transform: combat.selected?.x === x && combat.selected?.y === y ? "scale(1.15)" : "scale(1)",
                }}
              >
                {gem.color >= 0 ? GEM_COLORS[gem.color] : ""}
              </button>
            )))}
          </div>

          {/* Player HP in combat */}
          <div style={{marginTop:10,textAlign:"center"}}>
            <div style={{color:"#4CAF50",fontSize:13}}>❤️ {combat.playerHp}/{maxHp + lv * 5}</div>
            <div style={{width:160,height:8,background:"#333",borderRadius:4,margin:"4px auto"}}>
              <div style={{height:"100%",background:"#4CAF50",borderRadius:4,width:`${(combat.playerHp / (maxHp + lv * 5)) * 100}%`,transition:"width .3s"}} />
            </div>
          </div>

          {/* Win/Lose buttons */}
          {(combat.phase === "win" || combat.phase === "lose") && (
            <button onClick={endCombat} style={{marginTop:14,padding:"12px 40px",background:combat.phase === "win" ? "linear-gradient(135deg,#6B8E23,#556B2F)" : "linear-gradient(135deg,#8B0000,#5C0000)",color:"#FFF",border:"2px solid #DAA520",borderRadius:12,fontSize:16,fontWeight:"bold",cursor:"pointer"}}>
              {combat.phase === "win" ? "🎉 Continuer" : "💀 Respawn"}
            </button>
          )}
        </div>
      )}

      {/* ══════ PANELS ══════ */}
      {panel === "bag" && (
        <Panel title="🎒 Inventaire" onClose={() => setPanel("none")}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {Object.entries(bag).filter(([,v]) => v > 0).map(([id, qty]) => (
              <div key={id} style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:8,textAlign:"center",fontSize:12,color:"#FFF"}}>
                <div style={{fontSize:22}}>{RES[id]?.emoji || TOOLS[id]?.emoji || "📦"}</div>
                <div>{RES[id]?.name || TOOLS[id]?.name || id}</div>
                <div style={{color:"#FFD700"}}>×{qty}</div>
              </div>
            ))}
            {Object.keys(bag).filter(k => bag[k] > 0).length === 0 && <div style={{gridColumn:"1/-1",textAlign:"center",color:"#888",padding:20}}>Inventaire vide</div>}
          </div>
          <div style={{fontSize:11,color:"#888",marginTop:8,textAlign:"center"}}>{Object.values(bag).reduce((s,v)=>s+v,0)}/{bagSize} slots</div>
        </Panel>
      )}

      {panel === "craft" && (
        <Panel title="🔨 Artisanat" onClose={() => setPanel("none")}>
          {!playerClass.canCraft && playerClassId === "paladin" ? (
            <div style={{color:"#F88",textAlign:"center",padding:20}}>Le Paladin ne peut pas crafter !</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
              {[...Object.entries(TOOLS).map(([k,v]) => ({id:k,name:v.name,emoji:v.emoji,recipe:v.recipe})), ...EQUIPMENT.map(e => ({id:e.id,name:e.name,emoji:e.emoji,recipe:e.recipe})), ...RECIPES.map(r => ({id:r.id,name:r.name,emoji:r.emoji,recipe:r.recipe}))].map(r => {
                const canMake = Object.entries(r.recipe).every(([item, qty]) => (bag[item] || 0) >= qty);
                return (
                  <button key={r.id} onClick={() => canMake && doCraft(r.id)} style={{padding:10,background:canMake ? "rgba(76,175,80,.2)" : "rgba(255,255,255,.05)",border: canMake ? "1px solid #4CAF50" : "1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#FFF",cursor:canMake ? "pointer" : "default",opacity:canMake ? 1 : 0.5,textAlign:"left",fontSize:13}}>
                    <span style={{fontSize:18,marginRight:6}}>{r.emoji}</span>{r.name}
                    <div style={{fontSize:10,color:"#AAA",marginTop:2}}>{Object.entries(r.recipe).map(([i,q]) => `${RES[i]?.emoji||i}×${q}`).join(" ")}</div>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {panel === "npc" && npcDialog && (
        <Panel title={`${npcDialog.emoji} ${npcDialog.name}`} onClose={() => { setPanel("none"); setNpcDialog(null); }}>
          <div style={{color:"#E8D5A3",fontSize:14,lineHeight:1.6,padding:10}}>{npcDialog.text}</div>
        </Panel>
      )}

      {panel === "map" && (
        <Panel title="🗺️ Carte" onClose={() => setPanel("none")}>
          <BigMap map={mapRef.current} px={px} py={py} />
        </Panel>
      )}

      {panel === "menu" && (
        <Panel title="⚙️ Menu" onClose={() => setPanel("none")}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={() => { setVolume(sounds.cycleVol()); }} style={menuBtn}>{sounds.volIcon()} Volume</button>
            <button onClick={() => setShowMinimap(m => !m)} style={menuBtn}>🗺️ Minimap: {showMinimap ? "ON" : "OFF"}</button>
            <div style={{fontSize:12,color:"#888",textAlign:"center",marginTop:10}}>
              {playerClass.emoji} {playerName} | Lv{lv} | {biomeEmoji} {biomeName}
              <br/>ATK:{stats.atk} DEF:{stats.def} MAG:{stats.mag} VIT:{stats.vit}
            </div>
            <button onClick={() => { sounds.close(); router.push("/"); }} style={{...menuBtn,background:"rgba(139,0,0,.3)",borderColor:"#F44"}}>🚪 Quitter</button>
          </div>
        </Panel>
      )}

      {panel === "story" && storyText.length > 0 && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30}} onClick={() => {
          if (storyIdx < storyText.length - 1) setStoryIdx(i => i + 1);
          else { setPanel("none"); setStoryText([]); }
        }}>
          <div style={{maxWidth:360,color:"#E8D5A3",fontSize:18,lineHeight:1.8,textAlign:"center",fontStyle:"italic",animation:"fadeIn .5s"}}>
            {storyText[storyIdx]}
          </div>
          <div style={{color:"#888",fontSize:12,marginTop:20}}>
            {storyIdx < storyText.length - 1 ? "Touchez pour continuer..." : "Touchez pour commencer"}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════
const hudBtn: React.CSSProperties = {
  width:44,height:44,borderRadius:12,background:"rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.15)",
  color:"#FFF",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
};

const menuBtn: React.CSSProperties = {
  padding:"12px 16px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",
  borderRadius:10,color:"#FFF",fontSize:14,cursor:"pointer",textAlign:"left",
};

function Panel({title, onClose, children}: {title:string; onClose:()=>void; children:React.ReactNode}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{background:"linear-gradient(#2A1A0A,#1A0A00)",border:"2px solid #DAA520",borderRadius:14,padding:16,maxWidth:360,width:"92%",maxHeight:"80vh",overflowY:"auto",animation:"panelOpen .3s"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{color:"#DAA520",fontSize:16,fontWeight:"bold"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MiniMap({map, px, py}: {map:MapTile[][]|null; px:number; py:number}) {
  const cvs = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!cvs.current || !map) return;
    const ctx = cvs.current.getContext("2d");
    if (!ctx) return;
    const s = 100;
    ctx.clearRect(0, 0, s, s);
    const scale = s / MAP_W;
    for (let y = 0; y < MAP_H; y += 3) {
      for (let x = 0; x < MAP_W; x += 3) {
        const t = map[y][x];
        const b = BIOMES[t.biome];
        ctx.fillStyle = t.type === "block" ? b?.colors.block || "#333" : b?.colors.ground || "#666";
        ctx.fillRect(x * scale, y * scale, 3 * scale, 3 * scale);
      }
    }
    // Player dot
    ctx.fillStyle = "#FF0";
    ctx.fillRect((px / TILE_PX) * scale - 2, (py / TILE_PX) * scale - 2, 4, 4);
  }, [map, px, py]);
  return <canvas ref={cvs} width={100} height={100} style={{position:"absolute",top:38,right:10,zIndex:10,borderRadius:8,border:"1px solid rgba(255,255,255,.2)",opacity:.8}} />;
}

function BigMap({map, px, py}: {map:MapTile[][]|null; px:number; py:number}) {
  const cvs = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!cvs.current || !map) return;
    const ctx = cvs.current.getContext("2d");
    if (!ctx) return;
    const s = 300;
    ctx.clearRect(0, 0, s, s);
    const scale = s / MAP_W;
    for (let y = 0; y < MAP_H; y += 2) {
      for (let x = 0; x < MAP_W; x += 2) {
        const t = map[y][x];
        const b = BIOMES[t.biome];
        ctx.fillStyle = t.type === "block" ? b?.colors.block || "#333" : t.type === "path" ? b?.colors.path || "#AA8" : b?.colors.ground || "#666";
        ctx.fillRect(x * scale, y * scale, 2 * scale + 1, 2 * scale + 1);
      }
    }
    // Portals
    ctx.fillStyle = "#00FFFF";
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (map[y][x].type === "portal") ctx.fillRect(x * scale - 1, y * scale - 1, 4, 4);
    }
    // Player
    ctx.fillStyle = "#FF0";
    ctx.beginPath();
    ctx.arc((px / TILE_PX) * scale, (py / TILE_PX) * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [map, px, py]);
  return <canvas ref={cvs} width={300} height={300} style={{width:"100%",borderRadius:8,border:"1px solid rgba(255,255,255,.15)"}} />;
}
