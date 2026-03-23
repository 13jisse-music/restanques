"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { genWorld } from "../lib/world";
import { createGrid, findMatches, swapGems, applyGravity } from "../lib/match3";
import {
  COLORS as C, GEMS, RES, TOOLS, CARD_RECIPES, GUARDS, QUESTS_DEF,
  TILES, MW, MH, CAMP_POS, BAG_LIMIT, countBagItems, isBagFull,
  type GameWorld, type GameNode, type CombatState, type CombatCard, type Quest, type Village,
} from "../lib/constants";
import { sounds } from "../lib/sounds";
import { playerSprite, mobSprite, bonfireSprite, npcSprite, type Direction } from "../lib/sprites";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ═══ TILE COLORS by biome — rich CSS rendering ═══
const TILE_COLORS: Record<string, { bg: string; border?: string; pattern?: string }> = {
  g:  { bg: "#7BB33A" },
  tg: { bg: "#5E9A22" },
  p:  { bg: "#C9A87C", pattern: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)" },
  t:  { bg: "#3B7A18" },
  fl: { bg: "#7BB33A" },
  lv: { bg: "#9B7EDE" },
  r:  { bg: "#9E9080" },
  s:  { bg: "#E2CC9A" },
  w:  { bg: "#4AA3DF" },
  dw: { bg: "#2471A3" },
  cl: { bg: "#B0A090", border: "#8A7A6A" },
  dk: { bg: "#8B7355", pattern: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.1) 3px,rgba(0,0,0,0.1) 4px)" },
  mf: { bg: "#5C4033", pattern: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 5px)" },
  mw: { bg: "#3D2B1F", pattern: "repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(255,255,255,0.05) 4px,rgba(255,255,255,0.05) 5px)" },
  cf: { bg: "#1B8EAA" },
  rs: { bg: "#C4A874", pattern: "repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(0,0,0,0.04) 4px,rgba(0,0,0,0.04) 5px)" },
  rw: { bg: "#8B7355", pattern: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px)" },
  gt: { bg: "#6B4226" },
  vi: { bg: "#D4B896" },
  camp: { bg: "#7BB33A" },
};

// ═══ GEM STYLES — radial gradients + glow ═══
const GEM_COLORS = [
  { light: "#B89EEE", dark: "#6B4EAE", glow: "#9B7EDE" },  // lavande
  { light: "#9ABE5F", dark: "#4A6E1F", glow: "#7A9E3F" },  // olive
  { light: "#E96F6F", dark: "#A92F2F", glow: "#D94F4F" },  // rubis
  { light: "#6AB0E9", dark: "#2A60A9", glow: "#4A90D9" },  // saphir
  { light: "#F7E06F", dark: "#C4A01F", glow: "#F4D03F" },  // soleil
  { light: "#F09E42", dark: "#B64E02", glow: "#E67E22" },  // ocre
];

// ═══ UI STYLES ═══
const UI = {
  panel: { background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" } as React.CSSProperties,
  btn: (c: string, tc = "#FFF8E7", sm = false): React.CSSProperties => ({
    background: `linear-gradient(145deg, ${c}, ${c}CC)`, color: tc,
    border: "3px solid #3D2B1F", padding: sm ? "8px 12px" : "12px 18px",
    fontSize: sm ? "12px" : "14px", fontWeight: "bold",
    fontFamily: "'Courier New',monospace", cursor: "pointer",
    borderRadius: "8px", boxShadow: "2px 2px 0 #1A1410, inset 0 1px 0 rgba(255,255,255,0.2)",
    letterSpacing: "1px", userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation",
  }),
  close: { background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: "6px", padding: "4px 10px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" as const },
};

function GameContent() {
  const searchParams = useSearchParams();
  const playerParam = searchParams.get("player");
  const pName = playerParam === "melanie" ? "Mélanie" : "Jisse";
  const pEmoji = playerParam === "melanie" ? "🎨" : "🎸";
  const pColor = playerParam === "melanie" ? "#E88EAD" : "#E67E22";

  // Responsive CELL size
  const CELL = typeof window !== "undefined" && window.innerWidth < 500 ? 24 : 32;

  const [world, setWorld] = useState<GameWorld | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [inv, setInv] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [cards, setCards] = useState<CombatCard[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>(["garrigue"]);
  const [bosses, setBosses] = useState<string[]>([]);
  const [hp, setHp] = useState(20);
  const [maxHp, setMaxHp] = useState(20);
  const [xp, setXp] = useState(0);
  const [lvl, setLvl] = useState(1);
  const [quests, setQuests] = useState<Quest[]>(QUESTS_DEF.slice(0, 3).map((q) => ({ ...q, done: false })));
  const [story, setStory] = useState<string | null>(null);
  const [dialog, setDialog] = useState<GameNode | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [shop, setShop] = useState<Village | null>(null);
  const [craft, setCraft] = useState(false);
  const [bag, setBag] = useState(false);
  const [questPanel, setQuestPanel] = useState(false);
  const [craftSlots, setCraftSlots] = useState<{ id: string; idx: number }[]>([]);
  const [craftMsg, setCraftMsg] = useState("");
  const [notif, setNotif] = useState("");
  const [mmap, setMmap] = useState(false);
  const [otherPlayer, setOtherPlayer] = useState<{ x: number; y: number; name: string; emoji: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [walking, setWalking] = useState(false);
  const [lastDir, setLastDir] = useState<Direction>("down");
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [playerShaking, setPlayerShaking] = useState(false);
  const [enemyTurnMsg, setEnemyTurnMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [soundInit, setSoundInit] = useState(false);
  const [enemyPositions, setEnemyPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [alertedEnemies, setAlertedEnemies] = useState<Set<number>>(new Set());
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardsRef = useRef<CombatCard[]>([]); cardsRef.current = cards;
  const hpRef = useRef(20); hpRef.current = hp;
  const maxHpRef = useRef(20); maxHpRef.current = maxHp;
  const stepCountRef = useRef(0);

  const initSound = () => { if (!soundInit) { sounds.init(); setSoundInit(true); } };

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 2500); };

  const gainXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      const needed = lvl * 50;
      if (next >= needed) { setLvl((l) => l + 1); setMaxHp((h) => h + 3); setHp((h) => Math.min(h + 5, maxHp + 3)); notify(`⬆️ Niveau ${lvl + 1} !`); sounds.levelUp(); return next - needed; }
      return next;
    });
  }, [lvl, maxHp]);

  // ─── SUPABASE ───
  useEffect(() => {
    async function init() {
      const { data: sessions } = await supabase.from("game_sessions").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1);
      let session = sessions?.[0];
      if (!session) { const seed = Math.floor(Math.random() * 999999); const { data } = await supabase.from("game_sessions").insert({ seed, active: true }).select().single(); session = data; }
      if (!session) return;
      setSessionId(session.id);
      const w = genWorld(session.seed); setWorld(w); worldRef.current = w; setPos(w.spawn);
      if (session.collected_nodes && Array.isArray(session.collected_nodes)) { for (const idx of session.collected_nodes) { if (w.nodes[idx]) w.nodes[idx].done = true; } }
      const { data: ep } = await supabase.from("players").select("*").eq("session_id", session.id).eq("name", pName).single();
      if (ep) { setPlayerId(ep.id); setPos({ x: ep.x, y: ep.y }); setHp(ep.hp); setMaxHp(ep.max_hp); setLvl(ep.lvl); setXp(ep.xp); setInv(ep.inventory || []); setTools(ep.tools || []); setCards(ep.cards || []); setUnlocked(ep.unlocked_biomes || ["garrigue"]); setBosses(ep.bosses_defeated || []); }
      else { const { data: np } = await supabase.from("players").insert({ session_id: session.id, name: pName, emoji: pEmoji, x: w.spawn.x, y: w.spawn.y }).select().single(); if (np) setPlayerId(np.id); }
      setStory("🏔️ Un magnifique duché provençal s'élevait sur les terrasses de pierre...\n\n🌪️ Mais le Mistral, jaloux, a tout balayé.\n\n💪 Deux aventuriers partent restaurer les Restanques.\n\n🌿 Explorez la Garrigue. ⛺ Le camp 🔥 restaure vos PV !");
    }
    init();
  }, [pName, pEmoji]);

  // Sync
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!playerId) return;
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => { supabase.from("players").update({ x: pos.x, y: pos.y, hp, max_hp: maxHp, lvl, xp, inventory: inv, tools, cards, unlocked_biomes: unlocked, bosses_defeated: bosses, updated_at: new Date().toISOString() }).eq("id", playerId); }, 250);
  }, [pos, hp, maxHp, lvl, xp, inv, tools, cards, unlocked, bosses, playerId]);

  const doneRef = useRef(0);
  useEffect(() => {
    if (!sessionId || !world) return;
    const nd = world.nodes.filter((n) => n.done).length; if (nd === doneRef.current) return; doneRef.current = nd;
    const collected = world.nodes.map((n, i) => n.done ? i : -1).filter((i) => i >= 0);
    supabase.from("game_sessions").update({ collected_nodes: collected }).eq("id", sessionId);
  });

  useEffect(() => {
    if (!sessionId) return;
    const other = pName === "Jisse" ? "Mélanie" : "Jisse";
    const iv = setInterval(async () => { const { data } = await supabase.from("players").select("x,y,name,emoji").eq("session_id", sessionId).eq("name", other).single(); if (data) setOtherPlayer(data); }, 1000);
    const ch = supabase.channel(`s-${sessionId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` }, (p) => { if (p.new.collected_nodes && worldRef.current) { for (const idx of p.new.collected_nodes as number[]) { if (worldRef.current.nodes[idx]) worldRef.current.nodes[idx].done = true; } } }).subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, [sessionId, pName]);

  // Quests
  const checkQuests = useCallback(() => {
    setQuests((prev) => prev.map((q) => {
      if (q.done) return q;
      if (q.need && Object.entries(q.need).every(([item, cnt]) => inv.filter((i) => i === item).length >= cnt)) { gainXp(q.xp); if (q.reward) setInv((p) => [...p, q.reward!]); notify(`✅ ${q.t} !`); const dc = prev.filter((p) => p.done).length + 1; if (dc + 2 < QUESTS_DEF.length) { const nx = QUESTS_DEF[dc + 2]; if (nx && !prev.find((p) => p.id === nx.id)) setTimeout(() => setQuests((p) => [...p, { ...nx, done: false }]), 500); } return { ...q, done: true }; }
      if (q.needTool && tools.includes(q.needTool)) { gainXp(q.xp); if (q.reward) setInv((p) => [...p, q.reward!]); notify(`✅ ${q.t} !`); return { ...q, done: true }; }
      if (q.needBoss && bosses.includes(q.needBoss)) { gainXp(q.xp); if (q.reward) setInv((p) => [...p, q.reward!]); notify(`✅ ${q.t} !`); return { ...q, done: true }; }
      return q;
    }));
  }, [inv, tools, bosses, gainXp]);
  useEffect(() => { if (world) checkQuests(); }, [inv, tools, bosses, checkQuests, world]);

  // ─── SPRITE ANIMATION TICK ───
  useEffect(() => {
    const iv = setInterval(() => setSpriteFrame((f) => f + 1), 200);
    return () => clearInterval(iv);
  }, []);

  // ─── MOBILE ENEMIES ───
  // Initialize enemy positions from world nodes
  useEffect(() => {
    if (!world) return;
    const positions: Record<number, { x: number; y: number }> = {};
    world.nodes.forEach((node, idx) => {
      if (node.guard && !node.done) {
        positions[idx] = { x: node.x, y: node.y };
      }
    });
    setEnemyPositions(positions);
  }, [world]);

  // Enemy movement tick
  useEffect(() => {
    if (!world || combat || dialog || story) return;
    const iv = setInterval(() => {
      setEnemyPositions((prev) => {
        const next = { ...prev };
        const newAlerted = new Set<number>();
        Object.entries(next).forEach(([idxStr, ePos]) => {
          const idx = Number(idxStr);
          const node = world.nodes[idx];
          if (!node || node.done) { delete next[idx]; return; }
          const isBoss = !!node.boss;
          const distToPlayer = Math.abs(ePos.x - pos.x) + Math.abs(ePos.y - pos.y);
          const chaseRange = isBoss ? 5 : 3;
          const patrolRadius = 6;
          const chasing = distToPlayer <= chaseRange;
          if (chasing) newAlerted.add(idx);

          // Pick direction
          let dx = 0, dy = 0;
          if (chasing) {
            // Chase player
            if (Math.abs(ePos.x - pos.x) > Math.abs(ePos.y - pos.y)) {
              dx = ePos.x < pos.x ? 1 : -1;
            } else {
              dy = ePos.y < pos.y ? 1 : -1;
            }
          } else {
            // Patrol randomly (seeded by tick + idx for determinism)
            const tick = Math.floor(Date.now() / 1500);
            const seed = (tick * 7 + idx * 13) & 0xFFFF;
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            const dir = dirs[seed % 4];
            dx = dir[0]; dy = dir[1];
          }

          const nx = ePos.x + dx, ny = ePos.y + dy;
          // Check bounds + walkable + not too far from spawn
          if (nx >= 0 && nx < MW && ny >= 0 && ny < MH) {
            const tile = world.m[ny][nx];
            const walkable = TILES[tile]?.w === 1 || tile === "gt";
            const distFromSpawn = Math.abs(nx - node.x) + Math.abs(ny - node.y);
            if (walkable && distFromSpawn <= patrolRadius) {
              next[idx] = { x: nx, y: ny };
            }
          }
        });
        // Play alert sound for newly alerted enemies
        const prevAlerted = alertedEnemies;
        newAlerted.forEach((idx) => {
          if (!prevAlerted.has(idx)) sounds.enemyAlert();
        });
        setAlertedEnemies(newAlerted);
        return next;
      });
    }, 1500);
    return () => clearInterval(iv);
  }, [world, pos, combat, dialog, story]);

  // Check enemy collision with player
  const checkEnemyCollision = useCallback(() => {
    if (!world || combat || dialog) return;
    Object.entries(enemyPositions).forEach(([idxStr, ePos]) => {
      if (ePos.x === pos.x && ePos.y === pos.y) {
        const idx = Number(idxStr);
        const node = world.nodes[idx];
        if (node && !node.done && node.guard) {
          setDialog(node);
        }
      }
    });
  }, [world, pos, enemyPositions, combat, dialog]);

  useEffect(() => { checkEnemyCollision(); }, [pos, enemyPositions, checkEnemyCollision]);

  // ─── MOVEMENT ───
  const tryMove = useCallback((dx: number, dy: number) => {
    if (!world || story || dialog || combat || craft || bag || shop || questPanel) return;
    initSound();
    const dir: Direction = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
    setLastDir(dir);
    setWalking(true); if (walkTimerRef.current) clearTimeout(walkTimerRef.current); walkTimerRef.current = setTimeout(() => setWalking(false), 400);
    const nx = pos.x + dx, ny = pos.y + dy;
    if (nx < 0 || nx >= MW || ny < 0 || ny >= MH) return;
    const tile = world.m[ny][nx]; const tt = TILES[tile];
    const gate = world.gates.find((g) => g.x === nx && g.y === ny);
    if (gate) {
      const bio = gate.b; const needMap: Record<string, string> = { calanques: "baton", mines: "pioche", mer: "filet", restanques: "cle" }; const need = needMap[bio];
      if (need && !tools.includes(need)) { notify(`🚪 Il faut ${TOOLS[need].e} ${TOOLS[need].n}`); sounds.locked(); return; }
      if (!unlocked.includes(bio)) { setUnlocked((p) => [...p, bio]); sounds.unlock(); const msgs: Record<string, string> = { calanques: "🏖️ Les Calanques !", mines: "⛏️ Les Mines d'Ocre !", mer: "🌊 La Méditerranée !", restanques: "⛰️ Les Restanques !" }; if (msgs[bio]) setStory(msgs[bio]); }
    }
    if (!tt?.w && tile !== "gt") return;
    setPos({ x: nx, y: ny });
    stepCountRef.current++; if (stepCountRef.current % 2 === 0) sounds.step();
    if (nx === CAMP_POS.x && ny === CAMP_POS.y) { setHp((h) => { if (h < maxHp) { notify("⛺ PV restaurés !"); return maxHp; } return h; }); }
    const vil = world.villages.find((v) => nx >= v.x && nx <= v.x + 1 && ny >= v.y && ny <= v.y + 1); if (vil && !shop) setShop(vil);
    const node = world.nodes.find((n) => n.x === nx && n.y === ny && !n.done);
    if (node) {
      if (node.guard) { setDialog(node); }
      else if (node.res) {
        if (node.res !== "pain" && node.res !== "potion" && isBagFull(inv)) { notify("🎒 Sac plein !"); return; }
        setInv((p) => [...p, node.res!]); node.done = true; notify(`${RES[node.res].e} +1 ${RES[node.res].n}`); sounds.collect();
      }
    }
  }, [world, pos, story, dialog, combat, craft, bag, shop, questPanel, tools, unlocked, inv, maxHp]);

  const holdMove = (dx: number, dy: number) => { tryMove(dx, dy); moveRef.current = setInterval(() => tryMove(dx, dy), 160); };
  const stopMove = () => { if (moveRef.current) clearInterval(moveRef.current); moveRef.current = null; };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "a") tryMove(-1, 0); if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0); if (e.key === "ArrowUp" || e.key === "w") tryMove(0, -1); if (e.key === "ArrowDown" || e.key === "s") tryMove(0, 1); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [tryMove]);

  // ═══ COMBAT ═══
  const startCombat = (node: GameNode) => { setDialog(null); const g = node.guard || GUARDS[node.biome]; setCombat({ grid: createGrid(), enemy: { ...g }, enemyHp: g.hp, enemyMaxHp: g.hp, playerHp: hpRef.current, node, sel: null, combo: 0, totalDmg: 0, msg: "Ton tour ! Aligne 3 gemmes.", won: false, lost: false, animating: false }); setEnemyTurnMsg(""); };

  const selectGem = (x: number, y: number) => {
    setCombat((prev) => {
      if (!prev || prev.won || prev.lost || prev.animating) return prev;
      if (!prev.sel) return { ...prev, sel: { x, y } };
      const { sel } = prev; const adx = Math.abs(sel.x - x), ady = Math.abs(sel.y - y);
      if ((adx === 1 && ady === 0) || (adx === 0 && ady === 1)) {
        const ng = swapGems(prev.grid, sel.x, sel.y, x, y); const m = findMatches(ng);
        if (m.length > 0) { setTimeout(() => processMatches(ng, m, 0), 50); return { ...prev, grid: ng, sel: null, animating: true, msg: "💥 Match !" }; }
        return { ...prev, sel: null, msg: "Pas de match !" };
      }
      return { ...prev, sel: { x, y } };
    });
  };

  const processMatches = (grid: number[][], matches: { x: number; y: number }[], combo: number) => {
    const cc = cardsRef.current; const dmg = matches.length + combo * 2; const bd = cc.reduce((a, c) => a + (c.pow || 0), 0); const td = dmg + Math.floor(bd / 2);
    const cm = combo > 0 ? ` COMBO x${combo + 1} !` : "";
    const g = grid.map((r) => [...r]); matches.forEach(({ x, y }) => { g[y][x] = -1; });
    setEnemyShaking(true); setTimeout(() => setEnemyShaking(false), 400);
    sounds.gemMatch(combo);
    setTimeout(() => {
      const filled = applyGravity(g); const nm = findMatches(filled);
      setCombat((p) => {
        if (!p) return p; const newEHp = Math.max(0, p.enemyHp - td);
        if (newEHp <= 0) {
          p.node.done = true; if (p.node.boss) setBosses((prev) => [...prev, p.node.biome]); if (p.node.res) setInv((prev) => [...prev, p.node.res!]);
          const lr = Object.entries(RES).filter(([, v]) => v.b === p.node.biome).map(([k]) => k); if (lr.length > 0) setInv((prev) => [...prev, lr[Math.floor(Math.random() * lr.length)]]);
          gainXp(p.node.boss ? 50 : 15); sounds.victory();
          if (p.node.boss && p.node.biome === "restanques") setTimeout(() => { setCombat(null); setStory("🏆 LE MISTRAL EST VAINCU !\n\n🏔️ Les Restanques reprennent vie !\n👑 Souverains de Provence !\n🎸🎨 FÉLICITATIONS !"); }, 1500);
          return { ...p, grid: filled, enemyHp: 0, sel: null, combo: combo + 1, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm} VICTOIRE ! 🎉`, won: true, animating: false };
        }
        if (nm.length > 0) { setTimeout(() => processMatches(filled, nm, combo + 1), 400); return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: combo + 1, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm}`, animating: true }; }
        // Enemy turn
        const ed = Math.ceil(p.enemy.hp / 5); const sh = cc.find((c) => c.n === "Bouclier") ? 1 : 0; const rd = Math.max(1, ed - sh);
        const atks = ["charge", "frappe", "mord", "griffe", "souffle"]; setEnemyTurnMsg(`${p.enemy.e} ${p.enemy.n} ${atks[Math.floor(Math.random() * atks.length)]} !`);
        setTimeout(() => { setPlayerShaking(true); sounds.hit(); setTimeout(() => setPlayerShaking(false), 400);
          setCombat((c) => { if (!c) return c; const np = c.playerHp - rd; setHp(Math.max(0, np)); setEnemyTurnMsg("");
            if (np <= 0) return { ...c, playerHp: 0, sel: null, combo: 0, msg: `${c.enemy.e} -${rd} PV... KO ! 💀`, lost: true, animating: false };
            return { ...c, playerHp: np, sel: null, combo: 0, msg: `Ton tour ! (-${rd} PV)`, animating: false }; }); }, 800);
        return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: 0, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm}`, animating: true };
      });
    }, 300);
  };

  const endCombat = () => { setCombat((prev) => { if (prev?.lost) setHp(Math.max(5, maxHp - 5)); return null; }); setEnemyTurnMsg(""); };

  // Craft/Shop/etc
  const addSlot = (id: string, idx: number) => { if (craftSlots.length < 3 && !craftSlots.find((s) => s.idx === idx)) setCraftSlots((p) => [...p, { id, idx }]); };
  const rmSlots = () => { const idxs = craftSlots.map((s) => s.idx).sort((a, b) => b - a); setInv((p) => { const n = [...p]; idxs.forEach((i) => n.splice(i, 1)); return n; }); };
  const doCraft = () => {
    const ids = craftSlots.map((s) => s.id).sort();
    for (const [tid, tool] of Object.entries(TOOLS)) { const r = [...tool.r].sort(); if (r.length === ids.length && r.every((v, i) => v === ids[i]) && !tools.includes(tid)) { setTools((p) => [...p, tid]); rmSlots(); setCraftMsg(`✨ ${tool.e} ${tool.n} !`); setCraftSlots([]); sounds.craft(); return; } }
    for (const rec of CARD_RECIPES) { const r = [...rec.r].sort(); if (r.length === ids.length && r.every((v, i) => v === ids[i])) { setCards((p) => [...p, { ...rec.c }]); rmSlots(); setCraftMsg(`✨ ${rec.c.e} ${rec.c.n} !`); setCraftSlots([]); sounds.craft(); return; } }
    setCraftMsg("❌ Pas de recette..."); setCraftSlots([]);
  };
  const buyItem = (item: { sell: string; cost: string[] }) => { if (!item.cost.every((c) => inv.includes(c))) { notify("❌ Pas assez !"); return; } if (item.sell !== "pain" && item.sell !== "potion" && isBagFull(inv)) { notify("🎒 Plein !"); return; } const ni = [...inv]; item.cost.forEach((c) => { const i = ni.indexOf(c); if (i >= 0) ni.splice(i, 1); }); ni.push(item.sell); setInv(ni); sounds.collect(); if (item.sell === "potion") setHp((h) => Math.min(maxHp, h + 8)); if (item.sell === "pain") setHp((h) => Math.min(maxHp, h + 4)); };
  const usePotion = () => { const i = inv.indexOf("potion"); if (i >= 0) { setInv((p) => { const n = [...p]; n.splice(i, 1); return n; }); setHp((h) => Math.min(maxHp, h + 10)); notify("🧪 +10 PV !"); } else { const j = inv.indexOf("pain"); if (j >= 0) { setInv((p) => { const n = [...p]; n.splice(j, 1); return n; }); setHp((h) => Math.min(maxHp, h + 5)); } } };
  const dropItem = (idx: number) => { const item = inv[idx]; setInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); notify(`🗑️ ${RES[item]?.e} jeté`); };

  // ═══ RENDER ═══
  if (!world) return <div style={{ width: "100%", height: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>⛰️</div>Chargement...</div></div>;

  const bagCount = countBagItems(inv); const bagFull = bagCount >= BAG_LIMIT;
  const vw = Math.min(13, Math.floor((typeof window !== "undefined" ? window.innerWidth - 12 : 360) / CELL));
  const vh = Math.min(10, Math.floor(((typeof window !== "undefined" ? window.innerHeight : 700) - 240) / CELL));
  const camX = Math.max(0, Math.min(MW - vw, pos.x - Math.floor(vw / 2)));
  const camY = Math.max(0, Math.min(MH - vh, pos.y - Math.floor(vh / 2)));

  return (
    <div onClick={initSound} style={{ width: "100%", height: "100vh", background: "#1A1410", fontFamily: "'Courier New',monospace", color: "#FFF8E7", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none", position: "relative" }}>
      {/* Fond poster flouté */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/splash.png)", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(20px) brightness(0.3)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}
        @keyframes playerHit{0%,100%{transform:translateX(0)}25%{transform:translateX(4px);filter:brightness(1.5)}50%{transform:translateX(-4px)}75%{transform:translateX(2px)}}
        @keyframes pulse{0%,100%{filter:drop-shadow(0 0 4px #F4D03F)}50%{filter:drop-shadow(0 0 10px #FF6600)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
        @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-1px) scale(1.05)}}
        @keyframes enemyAtk{0%{transform:scale(1)}40%{transform:scale(1.3) translateY(-8px)}100%{transform:scale(1)}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ display: "flex", width: "100%", maxWidth: 420, justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: "linear-gradient(#5C4033, #3D2B1F)", fontSize: 11, borderBottom: "2px solid #F4D03F", flexWrap: "wrap", gap: 2 }}>
        <span style={{ textShadow: "0 0 4px #F4D03F" }}>{pEmoji} Nv.{lvl}</span>
        <span style={{ color: "#FF6666" }}>❤️{hp}/{maxHp}</span>
        <span style={{ color: bagFull ? "#FF6666" : "#D4C5A9" }}>🎒{bagCount}/{BAG_LIMIT}</span>
        <span>🏆{bosses.length}/5</span>
        {otherPlayer && <span style={{ color: "#F4D03F" }}>👥{otherPlayer.emoji}</span>}
        <button onClick={() => { setMuted(sounds.toggleMute()); }} style={{ background: "none", border: "none", color: "#F4D03F", fontSize: 14, cursor: "pointer", padding: 2 }}>{muted ? "🔇" : "🔊"}</button>
        <button onClick={() => setMmap(!mmap)} style={{ background: "none", border: "none", color: "#F4D03F", fontSize: 14, cursor: "pointer", padding: 2 }}>🗺️</button>
      </div>
      <div style={{ width: "100%", maxWidth: 420, height: 4, background: "#333" }}><div style={{ width: `${(xp / (lvl * 50)) * 100}%`, height: "100%", background: "linear-gradient(90deg, #F4D03F, #E67E22)", transition: "width 0.3s" }} /></div>

      {notif && <div style={{ position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)", ...UI.panel, padding: "8px 18px", fontSize: 13, fontWeight: "bold", zIndex: 50, color: "#3D2B1F", whiteSpace: "nowrap", border: "2px solid #8B7355" }}>{notif}</div>}

      {mmap && <div style={{ position: "fixed", top: 54, right: 4, zIndex: 40, background: "#3D2B1F", border: "2px solid #F4D03F", borderRadius: 4, padding: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${MW},2.5px)`, gap: 0 }}>
          {world.m.map((row, y) => row.map((_, x) => <div key={`m${x}${y}`} style={{ width: 2.5, height: 2.5, background: pos.x === x && pos.y === y ? "#F4D03F" : otherPlayer && Math.abs(otherPlayer.x - x) < 2 && Math.abs(otherPlayer.y - y) < 2 ? "#E88EAD" : TILES[world.m[y][x]]?.bg || "#7BB33A" }} />))}
        </div>
      </div>}

      {/* STORY / DIALOG / COMBAT / SHOP / CRAFT / BAG / QUESTS overlays */}
      {story && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ ...UI.panel, padding: 20, maxWidth: 340, color: "#3D2B1F", maxHeight: "80vh", overflow: "auto" }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 14 }}>{story}</div>
          <button style={UI.btn("#7A9E3F")} onClick={() => setStory(null)}>Continuer →</button>
        </div>
      </div>}

      {dialog && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ ...UI.panel, padding: 18, maxWidth: 320, color: "#3D2B1F", textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>{dialog.guard?.e}</div>
          <div style={{ fontSize: 16, fontWeight: "bold", margin: "6px 0" }}>{dialog.guard?.n}</div>
          <div style={{ fontSize: 12, fontStyle: "italic", marginBottom: 10, opacity: 0.8 }}>&quot;{dialog.guard?.d}&quot;</div>
          <div style={{ fontSize: 11, marginBottom: 12 }}>❤️ {dialog.guard?.hp} PV</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={UI.btn("#D94F4F")} onClick={() => startCombat(dialog)}>⚔️ Combattre</button>
            <button style={UI.btn("#8B7355")} onClick={() => setDialog(null)}>🏃 Fuir</button>
          </div>
        </div>
      </div>}

      {/* ═══ COMBAT ═══ */}
      {combat && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
        <div style={{ ...UI.panel, padding: 12, maxWidth: 380, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1, textAlign: "center", animation: playerShaking ? "playerHit 0.3s" : "none" }}>
              <div style={{ ...playerSprite("idle", "right", spriteFrame, 48, playerParam === "melanie"), margin: "0 auto", filter: (playerParam === "melanie" ? "hue-rotate(280deg) saturate(1.3)" : "") }} />
              <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 2 }}>{pName}</div>
              <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", border: "1px solid #3D2B1F", margin: "2px 0" }}>
                <div style={{ width: `${(combat.playerHp / maxHp) * 100}%`, height: "100%", background: combat.playerHp < maxHp * 0.3 ? "#D94F4F" : "linear-gradient(90deg, #7A9E3F, #5E9A22)", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 10 }}>❤️{combat.playerHp}/{maxHp}</span>
            </div>
            <div style={{ fontSize: 20, padding: "0 4px" }}>⚔️</div>
            <div style={{ flex: 1, textAlign: "center", animation: enemyShaking ? "shake 0.3s" : "none" }}>
              <div style={{ ...mobSprite(combat.node.biome, false, spriteFrame, 48), margin: "0 auto" }} />
              <div style={{ fontSize: 10, fontWeight: "bold" }}>{combat.enemy.n}</div>
              <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", border: "1px solid #3D2B1F", margin: "2px 0" }}>
                <div style={{ width: `${Math.max(0, (combat.enemyHp / combat.enemyMaxHp) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #D94F4F, #A92F2F)", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 10 }}>❤️{Math.max(0, combat.enemyHp)}/{combat.enemyMaxHp}</span>
            </div>
          </div>
          {enemyTurnMsg && <div style={{ textAlign: "center", fontSize: 14, fontWeight: "bold", color: "#fff", padding: 6, background: "linear-gradient(90deg, transparent, #D94F4FCC, transparent)", borderRadius: 4, marginBottom: 4, animation: "enemyAtk 0.6s" }}>{enemyTurnMsg}</div>}
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", marginBottom: 6, color: combat.won ? "#3D7A18" : combat.lost ? "#D94F4F" : "#3D2B1F", minHeight: 16 }}>{combat.msg}</div>

          {/* GEM GRID — CSS gemmes style Merge */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 4, width: "100%", maxWidth: 340, margin: "0 auto", padding: 8, background: "#1A1410", borderRadius: 10, border: "3px solid #F4D03F" }}>
            {combat.grid.map((row, y) => row.map((gem, x) => {
              const sel = combat.sel && combat.sel.x === x && combat.sel.y === y;
              const gc = GEM_COLORS[gem] || GEM_COLORS[0];
              return <div key={`${x}${y}`} onClick={() => selectGem(x, y)} style={{
                aspectRatio: "1", borderRadius: 10, cursor: "pointer",
                background: `radial-gradient(circle at 35% 35%, ${gc.light}, ${gc.dark})`,
                boxShadow: sel ? `0 0 12px ${gc.glow}, inset 2px 2px 4px rgba(255,255,255,0.4)` : `inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 6px rgba(0,0,0,0.4)`,
                transform: sel ? "scale(1.12)" : "scale(1)",
                border: sel ? `3px solid #F4D03F` : "2px solid rgba(0,0,0,0.2)",
                transition: "all 0.15s ease",
                position: "relative",
              }}>
                <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "20%", background: "rgba(255,255,255,0.35)", borderRadius: "50%", transform: "rotate(-20deg)" }} />
              </div>;
            }))}
          </div>

          {cards.length > 0 && !combat.won && !combat.lost && <div style={{ fontSize: 10, textAlign: "center", marginTop: 4, opacity: 0.7 }}>🃏 {cards.map((c) => c.e).join(" ")}</div>}
          {!combat.won && !combat.lost && inv.includes("potion") && <button style={{ ...UI.btn("#9B7EDE", "#FFF", true), width: "100%", marginTop: 6, textAlign: "center" }} onClick={() => { const i = inv.indexOf("potion"); if (i >= 0) { setInv((p) => { const n = [...p]; n.splice(i, 1); return n; }); setCombat((p) => p ? { ...p, playerHp: Math.min(maxHp, p.playerHp + 8), msg: "🧪 +8 PV !" } : p); setHp((h) => Math.min(maxHp, h + 8)); } }}>🧪 Potion</button>}
          {(combat.won || combat.lost) && <button style={{ ...UI.btn(combat.won ? "#7A9E3F" : "#8B7355"), width: "100%", marginTop: 8, textAlign: "center" }} onClick={endCombat}>{combat.won ? "🎉 Victoire !" : "😤 Retenter"}</button>}
        </div>
      </div>}

      {/* SHOP */}
      {shop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ ...UI.panel, padding: 16, maxWidth: 320, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: "bold" }}>🏘️ {shop.name}</span><button style={UI.close} onClick={() => setShop(null)}>✕</button></div>
          {shop.items.map((item, i) => { const res = RES[item.sell]; const ok = item.cost.every((c) => inv.includes(c)); return <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8, background: "#FFF8E7", borderRadius: 6, marginBottom: 6, border: "1px solid #D4C5A9" }}><div><span style={{ fontSize: 16 }}>{res.e}</span> <strong style={{ fontSize: 12 }}>{res.n}</strong><div style={{ fontSize: 10, opacity: 0.6 }}>{item.cost.map((c) => RES[c].e).join("+")}</div></div><button style={UI.btn(ok ? "#7A9E3F" : "#8B7355", "#FFF", true)} onClick={() => ok && buyItem(item)}>Troquer</button></div>; })}
        </div>
      </div>}

      {/* CRAFT + LIVRE DE RECETTES */}
      {craft && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 8, overflow: "auto" }}>
        <div style={{ ...UI.panel, padding: 14, maxWidth: 370, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: "bold" }}>🏺 Atelier</span><button style={UI.close} onClick={() => { setCraft(false); setCraftSlots([]); setCraftMsg(""); }}>✕</button></div>
          {/* Slots de craft */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 52, height: 52, border: "2px dashed #8B7355", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: craftSlots[i] ? RES[craftSlots[i].id]?.c + "33" : "#FFF8E7", cursor: "pointer" }} onClick={() => { if (craftSlots[i]) setCraftSlots((p) => p.filter((_, j) => j !== i)); }}>{craftSlots[i] ? RES[craftSlots[i].id]?.e : "?"}</div>)}
            <button style={UI.btn(craftSlots.length >= 2 ? "#F4D03F" : "#8B7355", "#3D2B1F", true)} onClick={() => craftSlots.length >= 2 && doCraft()}>⚒️ Forger</button>
          </div>
          {craftMsg && <div style={{ fontSize: 13, fontWeight: "bold", color: craftMsg[0] === "✨" ? "#3D7A18" : "#D94F4F", marginBottom: 8, textAlign: "center" }}>{craftMsg}</div>}
          {/* Inventaire pour craft */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxHeight: 90, overflow: "auto", marginBottom: 10 }}>
            {inv.map((id, i) => { const used = craftSlots.find((s) => s.idx === i); return <button key={i} onClick={() => !used && addSlot(id, i)} style={{ background: used ? "#ccc" : RES[id]?.c + "22", border: `2px solid ${RES[id]?.c || "#888"}`, borderRadius: 6, fontSize: 18, cursor: used ? "default" : "pointer", opacity: used ? 0.3 : 1, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{RES[id]?.e}</button>; })}
          </div>
          {/* LIVRE DE RECETTES */}
          <div style={{ background: "#FFF8E7", border: "2px solid #D4C5A9", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>📖 Livre de Recettes</div>
            <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4, color: "#5C4033" }}>🔧 Outils</div>
            {Object.entries(TOOLS).map(([tid, tool]) => {
              const owned = tools.includes(tid);
              return <div key={tid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", opacity: owned ? 0.5 : 1, borderBottom: "1px solid #E8D5A3" }}>
                <span style={{ fontSize: 18, width: 28 }}>{tool.e}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: "bold" }}>{tool.n} {owned && "✅"}</div>
                  <div style={{ fontSize: 11, color: "#8B7355" }}>{tool.r.map((r) => RES[r]?.e || r).join(" + ")} → {tool.d}</div>
                </div>
              </div>;
            })}
            <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 8, marginBottom: 4, color: "#5C4033" }}>🃏 Cartes de combat</div>
            {CARD_RECIPES.map((rec, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid #E8D5A3" }}>
              <span style={{ fontSize: 18, width: 28 }}>{rec.c.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{rec.c.n}</div>
                <div style={{ fontSize: 11, color: "#8B7355" }}>{rec.r.map((r) => RES[r]?.e || r).join(" + ")} → {rec.c.d}</div>
              </div>
            </div>)}
          </div>
        </div>
      </div>}

      {/* BAG — items groupés */}
      {bag && (() => {
        // Grouper les items par type avec compteur
        const grouped: { id: string; count: number; indices: number[] }[] = [];
        inv.forEach((id, i) => {
          const existing = grouped.find((g) => g.id === id);
          if (existing) { existing.count++; existing.indices.push(i); }
          else grouped.push({ id, count: 1, indices: [i] });
        });
        return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div style={{ ...UI.panel, padding: 14, maxWidth: 340, width: "100%", color: "#3D2B1F", maxHeight: "80vh", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: "bold" }}>🎒 Inventaire</span><button style={UI.close} onClick={() => setBag(false)}>✕</button></div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>❤️ {hp}/{maxHp} · Nv.{lvl} · XP {xp}/{lvl * 50}</div>
          <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${(xp / (lvl * 50)) * 100}%`, height: "100%", background: "linear-gradient(90deg, #F4D03F, #E67E22)" }} />
          </div>
          <div style={{ fontSize: 12, marginBottom: 8, color: bagFull ? "#D94F4F" : "#3D2B1F", fontWeight: "bold" }}>📦 Ressources: {bagCount}/{BAG_LIMIT} {bagFull ? "— PLEIN !" : ""}</div>
          {tools.length > 0 && <div style={{ marginBottom: 8, padding: 6, background: "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}><strong style={{ fontSize: 12 }}>🔧 Outils</strong>{tools.map((t) => <div key={t} style={{ fontSize: 12, padding: "2px 0" }}>{TOOLS[t].e} {TOOLS[t].n} <span style={{ fontSize: 10, color: "#8B7355" }}>— {TOOLS[t].d}</span></div>)}</div>}
          {cards.length > 0 && <div style={{ marginBottom: 8, padding: 6, background: "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}><strong style={{ fontSize: 12 }}>🃏 Cartes</strong>{cards.map((c, i) => <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>{c.e} {c.n} <span style={{ fontSize: 10, color: "#8B7355" }}>— {c.d}</span></div>)}</div>}
          <strong style={{ fontSize: 12 }}>📦 Items <span style={{ fontSize: 10, fontWeight: "normal", color: "#8B7355" }}>(tap = jeter ×1)</span></strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 6 }}>
            {grouped.map((g) => (
              <button key={g.id} onClick={() => dropItem(g.indices[g.indices.length - 1])} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: 6, background: RES[g.id]?.c + "18", border: `2px solid ${RES[g.id]?.c || "#888"}`,
                borderRadius: 8, cursor: "pointer", position: "relative", minHeight: 50,
              }}>
                <span style={{ fontSize: 22 }}>{RES[g.id]?.e}</span>
                <span style={{ fontSize: 10, fontWeight: "bold", color: "#3D2B1F" }}>×{g.count}</span>
                <span style={{ fontSize: 8, color: "#8B7355" }}>{RES[g.id]?.n}</span>
              </button>
            ))}
          </div>
          <strong style={{ fontSize: 11, display: "block", marginTop: 8 }}>⛰️ Zones</strong>
          {Object.entries({ garrigue: "🌿 Garrigue", calanques: "🏖️ Calanques", mines: "⛏️ Mines", mer: "🌊 Mer", restanques: "⛰️ Restanques" }).map(([id, n]) => <div key={id} style={{ fontSize: 11, opacity: unlocked.includes(id) ? 1 : 0.3 }}>{n} {unlocked.includes(id) ? "✅" : "🔒"}{bosses.includes(id) ? " 🏆" : ""}</div>)}
          {(inv.includes("potion") || inv.includes("pain")) && <button style={{ ...UI.btn("#9B7EDE", "#FFF", true), width: "100%", marginTop: 8, textAlign: "center" }} onClick={() => { usePotion(); setBag(false); }}>{inv.includes("potion") ? "🧪 Potion" : "🥖 Pain"}</button>}
        </div>
      </div>;
      })()}

      {/* QUESTS */}
      {questPanel && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div style={{ ...UI.panel, padding: 14, maxWidth: 340, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: "bold" }}>📋 Quêtes</span><button style={UI.close} onClick={() => setQuestPanel(false)}>✕</button></div>
          {quests.map((q, i) => <div key={i} style={{ padding: 6, background: q.done ? "#7A9E3F22" : "#FFF8E7", borderRadius: 6, marginBottom: 4, border: `1px solid ${q.done ? "#7A9E3F" : "#D4C5A9"}`, fontSize: 11, display: "flex", justifyContent: "space-between" }}><span>{q.done ? "✅" : "⬜"} {q.t}</span><span style={{ color: "#E67E22" }}>+{q.xp}XP</span></div>)}
        </div>
      </div>}

      {/* ═══ MAP ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${vw},${CELL}px)`, gap: 0, border: "4px solid #5C4033", margin: "4px 0", borderRadius: 8, boxShadow: "inset 0 0 10px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        {Array.from({ length: vh }, (_, vy) => Array.from({ length: vw }, (_, vx) => {
          const wx = camX + vx, wy = camY + vy;
          const tile = world.m[wy]?.[wx] || "g";
          const tc = TILE_COLORS[tile] || { bg: "#7BB33A" };
          const isP = pos.x === wx && pos.y === wy;
          const isOther = otherPlayer && otherPlayer.x === wx && otherPlayer.y === wy;
          const staticNode = world.nodes.find((n) => n.x === wx && n.y === wy && !n.done && !n.guard);
          const mobileEnemy = Object.entries(enemyPositions).find(([, ep]) => ep.x === wx && ep.y === wy);
          const mobileEnemyNode = mobileEnemy ? world.nodes[Number(mobileEnemy[0])] : null;
          const isAlerted = mobileEnemy ? alertedEnemies.has(Number(mobileEnemy[0])) : false;
          const gate = world.gates.find((g) => g.x === wx && g.y === wy);
          const vilIdx = world.villages.findIndex((v) => wx >= v.x && wx <= v.x + 1 && wy >= v.y && wy <= v.y + 1);
          const isCamp = wx === CAMP_POS.x && wy === CAMP_POS.y;
          const fs = Math.floor(CELL * 0.5);

          return <div key={`${vx}${vy}`} style={{
            width: CELL, height: CELL, background: tc.bg, backgroundImage: tc.pattern,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", fontSize: fs,
            boxShadow: isP ? "inset 0 0 0 2px #F4D03F" : isOther ? "inset 0 0 0 2px #E88EAD" : tc.border ? `inset 0 -2px 0 ${tc.border}` : "none",
          }} onClick={() => { const dx = wx - pos.x, dy = wy - pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) tryMove(dx, dy); }}>
            {/* PLAYER — Pixel Crawler sprite */}
            {isP ? <div style={{ ...playerSprite(walking ? "walk" : "idle", lastDir, spriteFrame, CELL, playerParam === "melanie"), zIndex: 2, filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.5))" }} />
              : isOther ? <div style={{ ...playerSprite("idle", "down", spriteFrame, CELL * 0.85, otherPlayer!.name === "Mélanie"), opacity: 0.75 }} />
                /* ENEMY — Pixel Crawler mob sprite */
                : mobileEnemyNode ? <div style={{ position: "relative" }}>
                    <div style={{ ...mobSprite(mobileEnemyNode.biome, isAlerted, spriteFrame, CELL), filter: isAlerted ? "drop-shadow(0 0 4px #D94F4F)" : "none" }} />
                    {isAlerted && <span style={{ position: "absolute", top: -4, right: -2, fontSize: 10, color: "#D94F4F", fontWeight: "bold", textShadow: "0 0 3px #000" }}>❗</span>}
                  </div>
                  /* BONFIRE — Pixel Crawler animated */
                  : isCamp ? <div style={{ ...bonfireSprite(spriteFrame, CELL), filter: "drop-shadow(0 0 6px #F4D03F)" }} />
                    /* RESOURCE NODE */
                    : staticNode && staticNode.res ? <span style={{ animation: "float 2s ease infinite", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>{RES[staticNode.res].e}</span>
                      /* GATE */
                      : gate ? <span style={{ filter: "drop-shadow(0 0 3px #F4D03F)" }}>🚪</span>
                        /* VILLAGE — NPC sprite */
                        : vilIdx >= 0 ? <div style={{ ...npcSprite(vilIdx, spriteFrame, CELL), filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
                          /* TERRAIN DECORATIONS */
                          : tile === "t" ? <span style={{ fontSize: fs + 2, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }}>🌳</span>
                            : tile === "fl" ? <span style={{ fontSize: fs - 4 }}>🌸</span>
                              : tile === "lv" ? <span style={{ fontSize: fs - 4 }}>💜</span>
                                : tile === "r" ? <span style={{ fontSize: fs - 2, opacity: 0.7 }}>🪨</span>
                                  : null}
          </div>;
        })).flat()}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", maxWidth: 420, justifyContent: "space-between", padding: "4px 8px" }}>
        <div style={{ display: "grid", gridTemplateAreas: `". u ." "l . r" ". d ."`, gap: 2 }}>
          {([["u", 0, -1, "▲"], ["l", -1, 0, "◀"], ["r", 1, 0, "▶"], ["d", 0, 1, "▼"]] as [string, number, number, string][]).map(([a, dx, dy, ch]) =>
            <button key={a} style={{ gridArea: a, width: 44, height: 44, borderRadius: 10, background: "linear-gradient(145deg, #7A9E3F, #5A7E2F)", color: "#FFF", border: "3px solid #3D5E1A", fontSize: 18, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 #2A4E10, inset 1px 1px 0 rgba(255,255,255,0.2)" }}
              onMouseDown={() => holdMove(dx, dy)} onMouseUp={stopMove} onMouseLeave={stopMove}
              onTouchStart={(e) => { e.preventDefault(); holdMove(dx, dy); }} onTouchEnd={(e) => { e.preventDefault(); stopMove(); }}
            >{ch}</button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, flex: 1, maxWidth: 200 }}>
          <button style={{ ...UI.btn("#E8A317", "#3D2B1F", true), textAlign: "center", padding: "9px 4px" }} onClick={() => { setCraftSlots([]); setCraftMsg(""); setCraft(true); }}>🏺 Craft</button>
          <button style={{ ...UI.btn(bagFull ? "#D94F4F" : "#2E86AB", "#FFF", true), textAlign: "center", padding: "9px 4px" }} onClick={() => setBag(true)}>🎒 {bagFull ? "PLEIN" : "Sac"}</button>
          <button style={{ ...UI.btn("#F4D03F", "#3D2B1F", true), textAlign: "center", padding: "9px 4px" }} onClick={() => setQuestPanel(true)}>📋 Quêtes</button>
          <button style={{ ...UI.btn("#8B7355", "#E8D5A3", true), textAlign: "center", padding: "9px 4px" }} onClick={() => { window.location.href = "/"; }}>🏠 Menu</button>
        </div>
      </div>
      </div>{/* close z-1 wrapper */}
    </div>
  );
}

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: "100%", height: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>⛰️</div>Chargement...</div></div>;
  return <Suspense fallback={<div style={{ width: "100%", height: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}>Chargement...</div>}><GameContent /></Suspense>;
}
