"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { genWorld, genBiome } from "../lib/world";
import { createGrid, findMatches, swapGems, applyGravity } from "../lib/match3";
import {
  COLORS as C, GEMS, RES, TOOLS, CARD_RECIPES, GUARDS, QUESTS_DEF, EQUIPMENTS, NODE_HP, FORTRESSES, BIOME_MOBS, FORTRESS_KEYS,
  TILES, MW, MH, CAMP_POS, CAMP_RADIUS, BAG_LIMIT, countBagItems, isBagFull,
  type GameWorld, type GameNode, type CombatState, type CombatCard, type Quest, type Village, type PlayerStats, type EquipSlot,
} from "../lib/constants";
import { sounds } from "../lib/sounds";
import {
  playerCircle, PLAYER_STYLES, npcCircle,
  itemSprite, ITEM_EMOJI, GEM_STYLES, BOSS_EMOJI,
  type Direction,
} from "../lib/sprites";
import { Joystick } from "./components/Joystick";
import { CombatScreen } from "./components/CombatScreen";
import { CharacterSheet } from "./components/CharacterSheet";
import { CampPanel } from "./components/CampPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { TopBar } from "./components/TopBar";
import { PvpArena } from "./components/PvpArena";
import { StorySequence } from "./components/StorySequence";
import { DayNightOverlay } from "./components/DayNightOverlay";
import { Minimap } from "./components/Minimap";
import { GameGuide } from "./components/GameGuide";
import { STORY, INTRO_IMAGES, STORY_IMAGES } from "../data/story";
import { NPCS, type NpcData } from "../data/npcs";
import { generateDungeon, DUNGEON_ENTRANCES, type Dungeon } from "../lib/dungeon";
import { CLASSES } from "../data/classes";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ═══ TILE COLORS by biome — rich CSS rendering ═══
const BIOME_RES_LOOT: Record<string, string[]> = {
  garrigue: ["herbe", "branche", "lavande"],
  calanques: ["coquillage", "sel", "poisson"],
  mines: ["pierre", "fer", "ocre"],
  mer: ["corail", "perle", "poisson"],
  restanques: ["cristal", "fer", "ocre"],
};

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
// GEM_STYLES imported from sprites.ts

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
  const classParam = searchParams.get("class") || (playerParam === "melanie" ? "artisane" : "aventurier");
  const playerClass = CLASSES[classParam] || CLASSES.aventurier;
  const pEmoji = playerClass.emoji;
  const pColor = playerParam === "melanie" ? "#E88EAD" : "#E67E22";

  // Fullscreen CELL — carte remplit tout l'écran
  const W = typeof window !== "undefined" ? window.innerWidth : 360;
  const H = typeof window !== "undefined" ? window.innerHeight : 700;
  const CELL = Math.floor(Math.min(W / 9, H / 13));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pvpActive, setPvpActive] = useState(false);
  const [torches, setTorches] = useState(0);
  const [torchActive, setTorchActive] = useState(false);
  const [torchEnd, setTorchEnd] = useState(0);
  const [garden, setGarden] = useState<{ seed: string | null; plantedAt: number; growTime: number }[]>(
    Array.from({ length: 16 }, () => ({ seed: null, plantedAt: 0, growTime: 0 }))
  );
  const [buffs, setBuffs] = useState<{ stat: string; value: number; until: number }[]>([]);
  const [quickMsg, setQuickMsg] = useState("");
  const [rageActive, setRageActive] = useState(false);
  const [rageTurns, setRageTurns] = useState(0);

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
  const [stats, setStats] = useState<PlayerStats>({ atk: 1, def: 0, mag: 0, vit: 1 });
  const [chest, setChest] = useState<string[]>([]);
  const [campPanel, setCampPanel] = useState<"" | "rest" | "chest" | "craft" | "equip">("");
  const [equipped, setEquipped] = useState<Record<EquipSlot, string | null>>({ arme: null, armure: null, amulette: null, bottes: null });
  const [ownedEquip, setOwnedEquip] = useState<string[]>([]);
  const [charPanel, setCharPanel] = useState(false);
  const [tutoStep, setTutoStep] = useState(-1);
  const [levelUpChoice, setLevelUpChoice] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [deathScreen, setDeathScreen] = useState(false);
  const [usedSpells, setUsedSpells] = useState<Set<string>>(new Set());
  const [spellBonus, setSpellBonus] = useState(0); // bonus dégâts temporaire (Marée)
  const [fatigueUntil, setFatigueUntil] = useState(0);
  const [mysteryPos, setMysteryPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBiome, setCurrentBiome] = useState("garrigue");
  const [biomeTransition, setBiomeTransition] = useState(false);
  const [ngPlusScreen, setNgPlusScreen] = useState(false);
  const [ngPlus, setNgPlus] = useState(0);
  const biomeCacheRef = useRef<Record<string, GameWorld>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [guideHint, setGuideHint] = useState(false);
  const [storySequence, setStorySequence] = useState<{ key: string; slides: { image?: string; text: string }[] } | null>(null);
  const [nodeHpMap, setNodeHpMap] = useState<Record<number, number>>({});
  const [activeQuests, setActiveQuests] = useState<string[]>([]);
  const [dungeon, setDungeon] = useState<Dungeon | null>(null);
  const [dungeonPos, setDungeonPos] = useState({ x: 10, y: 1 });
  const [dungeonMobsAlive, setDungeonMobsAlive] = useState<Set<number>>(new Set());
  const [dungeonChestOpened, setDungeonChestOpened] = useState<Set<number>>(new Set()); // seed set
  const [savedWorldPos, setSavedWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [dungeonPrompt, setDungeonPrompt] = useState<{ seed: number; biome: string } | null>(null);
  const [fortressPrompt, setFortressPrompt] = useState<string | null>(null); // biome id
  const [timeOfDay, setTimeOfDay] = useState(0.2); // 0-1 cycle // quest IDs accepted
  const [completedQuests, setCompletedQuests] = useState<string[]>([]); // quest IDs done
  const [talkingNpc, setTalkingNpc] = useState<NpcData | null>(null);
  const [npcDialogText, setNpcDialogText] = useState("");
  const [npcDialogFull, setNpcDialogFull] = useState("");
  const [harvestParticles, setHarvestParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardsRef = useRef<CombatCard[]>([]); cardsRef.current = cards;
  const hpRef = useRef(20); hpRef.current = hp;
  const maxHpRef = useRef(20); maxHpRef.current = maxHp;
  const stepCountRef = useRef(0);

  const initSound = () => {
    if (!soundInit) {
      sounds.init(); setSoundInit(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 2500); };

  const gainXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      const needed = lvl * 50;
      if (next >= needed) {
        setLvl((l) => l + 1); setMaxHp((h) => h + 3); setHp((h) => Math.min(h + 5, maxHp + 3)); sounds.levelUp();
        // Auto stat increase based on class
        setStats((s) => {
          const ns = { ...s };
          if (playerClass.id === "aventurier") { ns.atk += 1; if (Math.random() < 0.5) ns.def += 1; if (Math.random() < 0.25) ns.vit += 1; }
          else if (playerClass.id === "artisane") { ns.mag += 1; if (Math.random() < 0.5) ns.def += 1; if (Math.random() < 0.25) ns.vit += 1; }
          else { ns.vit += 1; if (Math.random() < 0.5) ns.atk += 1; if (Math.random() < 0.25) ns.mag += 1; }
          const gains = Object.entries(ns).filter(([k, v]) => v > s[k as keyof typeof s]).map(([k, v]) => `${k.toUpperCase()}+${v - s[k as keyof typeof s]}`).join(", ");
          notify(`⬆️ Niveau ${lvl + 1} ! ${gains}`);
          return ns;
        });
        return next - needed;
      }
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
      // Load world — use garrigue initially, will be updated after player load
      const w = genBiome(session.seed, "garrigue");
      biomeCacheRef.current["garrigue"] = w;
      setWorld(w); worldRef.current = w; setPos(w.spawn);
      if (session.collected_nodes && Array.isArray(session.collected_nodes)) { for (const idx of session.collected_nodes) { if (w.nodes[idx]) w.nodes[idx].done = true; } }
      const { data: ep } = await supabase.from("players").select("*").eq("session_id", session.id).eq("name", pName).single();
      if (ep) {
        setPlayerId(ep.id); setPos({ x: ep.x, y: ep.y }); setHp(ep.hp); setMaxHp(ep.max_hp); setLvl(ep.lvl); setXp(ep.xp); setInv(ep.inventory || []); setTools(ep.tools || []); setCards(ep.cards || []); setUnlocked(ep.unlocked_biomes || ["garrigue"]); setBosses(ep.bosses_defeated || []); setChest(ep.chest || []); if (ep.stats) setStats(ep.stats); if (ep.owned_equip) setOwnedEquip(ep.owned_equip); if (ep.equipped) setEquipped(ep.equipped); if (ep.ng_plus) setNgPlus(ep.ng_plus);
        // Restore biome
        const savedBiome = ep.current_biome || "garrigue";
        if (savedBiome !== "garrigue") {
          const bw = genBiome(session.seed + ["garrigue","calanques","mines","mer","restanques"].indexOf(savedBiome), savedBiome);
          biomeCacheRef.current[savedBiome] = bw;
          setWorld(bw); worldRef.current = bw; setCurrentBiome(savedBiome);
        }
      }
      else { const { data: np } = await supabase.from("players").insert({ session_id: session.id, name: pName, emoji: pEmoji, x: w.spawn.x, y: w.spawn.y }).select().single(); if (np) setPlayerId(np.id); }
      // Intro sequence OR tutorial (never both at once)
      if (!ep?.intro_seen) {
        setShowIntro(true);
        setTimeout(() => { sounds.init(); sounds.playIntroMusic(); }, 500);
      } else {
        if (!localStorage.getItem("restanques_tuto")) setTimeout(() => setTutoStep(0), 1500);
        setTimeout(() => sounds.playBiomeMusic("garrigue"), 1000);
      }
    }
    init();
  }, [pName, pEmoji]);

  // Sync
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!playerId) return;
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => { supabase.from("players").update({ x: pos.x, y: pos.y, hp, max_hp: maxHp, lvl, xp, inventory: inv, tools, cards, unlocked_biomes: unlocked, bosses_defeated: bosses, chest, stats, owned_equip: ownedEquip, equipped, updated_at: new Date().toISOString() }).eq("id", playerId); }, 250);
  }, [pos, hp, maxHp, lvl, xp, inv, tools, cards, unlocked, bosses, chest, stats, ownedEquip, equipped, playerId]);

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

  // ─── FATIGUE TIMER (re-render every second when fatigued) ───
  const [, setFatigueTick] = useState(0);
  useEffect(() => {
    if (fatigueUntil <= Date.now()) return;
    const iv = setInterval(() => {
      if (fatigueUntil <= Date.now()) { clearInterval(iv); notify("💪 Fatigue dissipée !"); }
      setFatigueTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [fatigueUntil]);

  // ─── DAY/NIGHT CLOCK ───
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setTimeOfDay(((Date.now() - start) % 600000) / 600000), 5000);
    return () => clearInterval(iv);
  }, []);
  const dayIcon = timeOfDay < 0.15 || timeOfDay >= 0.9 ? "🌅" : timeOfDay < 0.45 ? "☀️" : timeOfDay < 0.55 ? "🌇" : "🌙";
  const dayLabel = timeOfDay < 0.15 || timeOfDay >= 0.9 ? "Aube" : timeOfDay < 0.45 ? "Jour" : timeOfDay < 0.55 ? "Crépuscule" : "Nuit";

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
            const inCampZone = Math.abs(nx - CAMP_POS.x) <= CAMP_RADIUS && Math.abs(ny - CAMP_POS.y) <= CAMP_RADIUS;
            if (walkable && distFromSpawn <= patrolRadius && !inCampZone) {
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

  // ─── MYSTERY CHARACTER ───
  useEffect(() => {
    if (!world) return;
    const iv = setInterval(() => {
      if (Math.random() < 0.15) { // ~15% chance every 6s = ~once per 40s
        const mx = pos.x + Math.floor(Math.random() * 10) - 5;
        const my = pos.y + Math.floor(Math.random() * 8) - 4;
        if (mx >= 0 && mx < MW && my >= 0 && my < MH) {
          setMysteryPos({ x: mx, y: my });
          sounds.mystery();
          setTimeout(() => setMysteryPos(null), 3000);
        }
      }
    }, 6000);
    return () => clearInterval(iv);
  }, [world, pos]);

  // Biome music is now handled by biome transitions (no auto-detect needed)

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
      const bio = gate.b;
      const needMap: Record<string, string> = { calanques: "baton", mines: "pioche", mer: "filet", restanques: "cle" };
      const need = needMap[bio];
      if (need && !tools.includes(need)) { notify(`🚪 Il faut ${TOOLS[need].e} ${TOOLS[need].n}`); sounds.locked(); return; }
      // BIOME TRANSITION
      setBiomeTransition(true);
      setTimeout(() => {
        const sessionSeed = parseInt(sessionId?.substring(0, 8) || "12345", 16) || 12345;
        const biomeSeeds: Record<string, number> = { garrigue: sessionSeed, calanques: sessionSeed + 1, mines: sessionSeed + 2, mer: sessionSeed + 3, restanques: sessionSeed + 4 };
        let newWorld = biomeCacheRef.current[bio];
        if (!newWorld) { newWorld = genBiome(biomeSeeds[bio], bio); biomeCacheRef.current[bio] = newWorld; }
        setWorld(newWorld); worldRef.current = newWorld;
        setCurrentBiome(bio);
        // Place player at opposite edge
        const entryMap: Record<string, { x: number; y: number }> = { N: { x: 50, y: 95 }, S: { x: 50, y: 5 }, E: { x: 5, y: 50 }, W: { x: 95, y: 50 } };
        // Find which side we came from
        const portal = world.gates.find((g) => g.x === nx && g.y === ny);
        let entry = newWorld.spawn;
        if (portal) {
          // We came from a portal on the current map, enter at the opposite side of the target
          if (nx <= 5) entry = entryMap.E; // we were at west edge → enter east
          else if (nx >= 95) entry = entryMap.W;
          else if (ny <= 5) entry = entryMap.S;
          else if (ny >= 95) entry = entryMap.N;
        }
        setPos(entry);
        setEnemyPositions({});
        if (!unlocked.includes(bio)) { setUnlocked((p) => [...p, bio]); sounds.unlock(); }
        sounds.playMusic(bio);
        // Trigger biome intro story if first time
        const storyKey = bio + "_intro";
        if (STORY[storyKey] && !unlocked.includes(bio)) { setTimeout(() => triggerStory(storyKey), 500); }
        supabase.from("players").update({ current_biome: bio }).eq("id", playerId);
        setBiomeTransition(false);
      }, 600);
      return;
    }
    if (!tt?.w && tile !== "gt") return;
    setPos({ x: nx, y: ny });
    stepCountRef.current++; if (stepCountRef.current % 2 === 0) sounds.step();
    if (nx === CAMP_POS.x && ny === CAMP_POS.y) { setHp(maxHp); setCampPanel("rest"); notify("⛺ Camp — PV restaurés !"); }
    const vil = world.villages.find((v) => nx >= v.x && nx <= v.x + 1 && ny >= v.y && ny <= v.y + 1); if (vil && !shop) setShop(vil);
    // Fortress boss check — needs key
    const fort = FORTRESSES[currentBiome];
    if (fort && Math.abs(nx - fort.x) <= 1 && Math.abs(ny - fort.y) <= 1 && !bosses.includes(currentBiome)) {
      const keyNeeded = FORTRESS_KEYS[currentBiome];
      if (keyNeeded && !inv.includes(keyNeeded) && !tools.includes(keyNeeded)) {
        notify(`🔒 Il vous faut la ${keyNeeded === "cle" ? "Clé Ancienne" : "clé"} ! Parlez aux PNJs.`);
        sounds.locked(); return;
      }
      setFortressPrompt(currentBiome); return;
    }
    // Dungeon entrance check
    const dungeonEntry = DUNGEON_ENTRANCES.find((d) => d.x === nx && d.y === ny);
    if (dungeonEntry) { setDungeonPrompt({ ...dungeonEntry, seed: dungeonEntry.seed + nx * 1000 + ny }); return; }
  }, [world, pos, story, dialog, combat, craft, bag, shop, questPanel, tools, unlocked, inv, maxHp]);

  const holdMove = (dx: number, dy: number) => { tryMove(dx, dy); moveRef.current = setInterval(() => tryMove(dx, dy), 160); };
  const stopMove = () => { if (moveRef.current) clearInterval(moveRef.current); moveRef.current = null; };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "a") tryMove(-1, 0); if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0); if (e.key === "ArrowUp" || e.key === "w") tryMove(0, -1); if (e.key === "ArrowDown" || e.key === "s") tryMove(0, 1); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [tryMove]);

  // ═══ COMBAT ═══
  const startCombat = (node: GameNode) => {
    setDialog(null);
    const g = node.guard || GUARDS[node.biome];
    // NG+ buff: HP increases per ng_plus level
    const hpMult = ngPlus === 0 ? 1 : ngPlus === 1 ? 1.5 : ngPlus === 2 ? 2 : 2.5;
    const buffedHp = Math.ceil(g.hp * hpMult);
    setCombat({ grid: createGrid(), enemy: { ...g, hp: buffedHp }, enemyHp: buffedHp, enemyMaxHp: buffedHp, playerHp: hpRef.current, node, sel: null, combo: 0, totalDmg: 0, msg: ngPlus > 0 ? `⚔️ NG+${ngPlus} ! Aligne 3 gemmes.` : "Ton tour ! Aligne 3 gemmes.", won: false, lost: false, animating: false });
    setEnemyTurnMsg(""); setUsedSpells(new Set()); setSpellBonus(0);
    sounds.playCombatMusic(!!node.boss);
  };

  // ─── CAST SPELL ───
  // ─── DUNGEON ───
  const enterDungeon = (seed: number, biome: string) => {
    setSavedWorldPos({ x: pos.x, y: pos.y });
    const d = generateDungeon(seed, biome);
    setDungeon(d);
    setDungeonPos(d.entrance);
    setDungeonMobsAlive(new Set(d.mobs.map((_, i) => i)));
    setDungeonPrompt(null);
    sounds.playMusic("mines"); // dungeon music
    notify("🕳️ Vous entrez dans le donjon...");
  };

  const exitDungeon = () => {
    setDungeon(null);
    if (savedWorldPos) setPos(savedWorldPos);
    setSavedWorldPos(null);
    sounds.playMusic(currentBiome);
    notify("☀️ Vous sortez du donjon !");
  };

  // ─── NPC INTERACTION ───
  const talkToNpc = useCallback((npc: NpcData) => {
    sounds.npcTalk();
    setTalkingNpc(npc);
    const q = npc.quest;
    let text = "";
    if (completedQuests.includes(q.id)) {
      text = npc.dialogs.after;
    } else if (activeQuests.includes(q.id)) {
      // Check if quest can be completed
      let canComplete = false;
      if (q.type === "collect" && q.need) {
        canComplete = Object.entries(q.need).every(([item, cnt]) => inv.filter((i) => i === item).length >= cnt);
      }
      if (q.type === "boss" && q.needBoss) {
        canComplete = bosses.includes(q.needBoss);
      }
      if (canComplete) {
        text = npc.dialogs.complete;
        // Complete quest
        if (q.need) { Object.entries(q.need).forEach(([item, cnt]) => { for (let i = 0; i < cnt; i++) { const idx = inv.indexOf(item); if (idx >= 0) setInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); } }); }
        // Give reward
        if (q.reward.type === "item") { setInv((p) => [...p, q.reward.id]); }
        if (q.reward.type === "equip") { setOwnedEquip((p) => [...p, q.reward.id]); setEquipped((e) => { const eq = EQUIPMENTS.find((x) => x.id === q.reward.id); return eq ? { ...e, [eq.slot]: eq.id } : e; }); }
        if (q.reward.type === "tool") { setTools((p) => [...p, q.reward.id]); }
        setCompletedQuests((p) => [...p, q.id]);
        sounds.questComplete();
        notify(`${q.reward.emoji} ${q.reward.name} obtenu !`);
      } else {
        text = npc.dialogs.hint;
      }
    } else {
      // First time — greeting then quest
      text = npc.dialogs.greeting + "\n\n" + npc.dialogs.quest;
      setActiveQuests((p) => [...p, q.id]);
      sounds.questAccept();
    }
    // Typewriter effect
    setNpcDialogText("");
    setNpcDialogFull(text);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setNpcDialogText(text.substring(0, i));
      if (i % 3 === 0) sounds.npcTalk();
      if (i >= text.length) clearInterval(iv);
    }, 30);
  }, [inv, bosses, activeQuests, completedQuests]);

  // ─── TAP HARVEST ───
  const tapHarvest = useCallback((wx: number, wy: number) => {
    if (!world || combat || dialog) return;
    const dist = Math.abs(wx - pos.x) + Math.abs(wy - pos.y);
    if (dist !== 1) return; // must be adjacent

    const nodeIdx = world.nodes.findIndex((n) => n.x === wx && n.y === wy && !n.done && !n.guard);
    if (nodeIdx < 0) return;
    const node = world.nodes[nodeIdx];
    if (!node.res) return;

    // Initialize HP if not set
    const maxHp = NODE_HP[node.res] || 3;
    const currentHp = nodeHpMap[nodeIdx] ?? maxHp;

    // Damage: 1 base, +1 if matching tool
    let dmg = playerClass.harvestSpeed <= 0.5 ? 2 : 1; // Artisane = 2× harvest
    if ((node.res === "branche" || node.res === "herbe" || node.res === "lavande") && tools.includes("serpe")) dmg = 2;
    if ((node.res === "pierre" || node.res === "fer" || node.res === "ocre" || node.res === "cristal") && tools.includes("pioche")) dmg = 2;
    if ((node.res === "coquillage" || node.res === "poisson" || node.res === "perle" || node.res === "corail") && tools.includes("filet")) dmg = 2;

    const newHp = currentHp - dmg;

    // Sound
    if (node.res === "branche" || node.res === "herbe" || node.res === "lavande") sounds.harvestHerb();
    else if (node.res === "pierre" || node.res === "fer" || node.res === "ocre" || node.res === "cristal") sounds.harvestStone();
    else sounds.harvestWood();

    // Particles
    const pColor = RES[node.res]?.c || "#888";
    const pid = Date.now();
    setHarvestParticles((p) => [...p, { id: pid, x: wx, y: wy, color: pColor }]);
    setTimeout(() => setHarvestParticles((p) => p.filter((pp) => pp.id !== pid)), 600);

    if (newHp <= 0) {
      // Node destroyed — collect resource
      if (!isBagFull(inv)) {
        setInv((p) => [...p, node.res!]);
        node.done = true;
        setNodeHpMap((m) => { const n = { ...m }; delete n[nodeIdx]; return n; });
        sounds.harvestDone();
        notify(`${RES[node.res].e} +1 ${RES[node.res].n}`);
      } else {
        notify("🎒 Sac plein !");
      }
    } else {
      setNodeHpMap((m) => ({ ...m, [nodeIdx]: newHp }));
    }
  }, [world, pos, combat, dialog, nodeHpMap, tools, inv]);

  // ─── TRIGGER STORY SEQUENCE ───
  const triggerStory = useCallback((key: string) => {
    const texts = STORY[key];
    const images = STORY_IMAGES[key] || [];
    if (!texts || texts.length === 0) return;
    const slides = texts.map((text, i) => ({ text, image: images[i] }));
    setStorySequence({ key, slides });
  }, []);

  // Total stats = base + equipment bonuses
  const totalStats = useMemo(() => {
    const s = { ...stats };
    Object.values(equipped).forEach((eId) => {
      if (!eId) return;
      const eq = EQUIPMENTS.find((e) => e.id === eId);
      if (eq) { Object.entries(eq.stats).forEach(([k, v]) => { s[k as keyof PlayerStats] += v || 0; }); }
    });
    // Tool bonuses
    if (tools.includes("serpe")) s.atk += 2;
    if (tools.includes("pioche")) s.atk += 1;
    if (tools.includes("baton")) s.def += 1;
    // Fatigue penalty: -30% ATK
    if (fatigueUntil > Date.now()) s.atk = Math.max(1, Math.floor(s.atk * 0.7));
    return s;
  }, [stats, equipped, tools, fatigueUntil]);

  const castSpell = (card: CombatCard) => {
    if (!combat || combat.won || combat.lost || combat.animating || usedSpells.has(card.n)) return;
    setUsedSpells((s) => new Set(s).add(card.n));
    sounds.combatSpell();

    setCombat((p) => {
      if (!p) return p;
      switch (card.n) {
        case "Brume": {
          // Efface toutes les gemmes d'une couleur aléatoire
          const gemType = Math.floor(Math.random() * 6);
          const g = p.grid.map((r) => r.map((c) => c === gemType ? -1 : c));
          const count = p.grid.flat().filter((c) => c === gemType).length;
          const dmg = count + totalStats.atk;
          const newEHp = Math.max(0, p.enemyHp - dmg);
          setTimeout(() => {
            setCombat((c) => c ? { ...c, grid: g.map((r) => r.map((c2) => c2 === -1 ? Math.floor(Math.random() * 6) : c2)), animating: false } : c);
          }, 300);
          return { ...p, enemyHp: newEHp, msg: `🌫️ Brume ! -${dmg} dégâts`, animating: true };
        }
        case "Bouclier":
          // Annule le prochain tour ennemi (on met animating = false sans tour ennemi)
          return { ...p, msg: "🛡️ Bouclier activé ! Tour ennemi annulé." };
        case "Éclat": {
          const dmg = totalStats.atk + totalStats.mag + 3;
          const newEHp = Math.max(0, p.enemyHp - dmg);
          setEnemyShaking(true); setTimeout(() => setEnemyShaking(false), 400);
          if (newEHp <= 0) {
            p.node.done = true;
            gainXp(p.node.boss === true ? 50 : 15); sounds.victory();
            if (p.node.boss === true) {
              const biome = p.node.biome;
              setBosses((prevBosses) => {
                if (!prevBosses.includes(biome)) {
                  setTimeout(() => { setCombat(null); if (biome === "restanques") triggerStory("ending"); else triggerStory(biome + "_end"); }, 1500);
                  return [...prevBosses, biome];
                }
                return prevBosses;
              });
            }
            return { ...p, enemyHp: 0, msg: `✨ Éclat ! -${dmg} VICTOIRE ! 🎉`, won: true };
          }
          return { ...p, enemyHp: newEHp, msg: `✨ Éclat ! -${dmg} dégâts` };
        }
        case "Festin":
          const newPHp = Math.min(maxHp, p.playerHp + 5);
          setHp(newPHp);
          return { ...p, playerHp: newPHp, msg: "🍽️ Festin ! +5 PV" };
        case "Marée":
          setSpellBonus(5);
          return { ...p, msg: "🌊 Marée ! +5 dégâts au prochain match" };
        case "Séisme": {
          // Mélange toute la grille
          let newGrid: number[][];
          do { newGrid = Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 6))); } while (findMatches(newGrid).length > 0);
          return { ...p, grid: newGrid, msg: "💥 Séisme ! Grille mélangée !" };
        }
        default:
          return { ...p, msg: `${card.e} ${card.n} !` };
      }
    });
  };

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
    const cc = cardsRef.current;
    const matchBonus = matches.length <= 3 ? 0 : matches.length === 4 ? 2 : 6;
    const comboMult = combo === 0 ? 1 : combo === 1 ? 1.5 : 2;
    const dmg = matches.length + matchBonus + totalStats.atk + totalStats.mag + spellBonus;
    const bd = cc.reduce((a, c) => a + (c.pow || 0), 0);
    const rageMult = rageActive ? 1.5 : 1;
    const td = Math.floor((dmg + Math.floor(bd / 2)) * playerClass.combatBonus * comboMult * rageMult);
    if (spellBonus > 0) setSpellBonus(0); // Marée consumed
    // Aventurier rage: combo ×3+ activates rage for 2 turns
    if (combo >= 2 && (playerClass.id || playerClass) === "aventurier" && !rageActive) {
      setRageActive(true); setRageTurns(2);
    }
    if (rageActive) { setRageTurns(t => { if (t <= 1) { setRageActive(false); return 0; } return t - 1; }); }
    const cm = combo > 0 ? ` COMBO x${combo + 1} !` : "";
    const g = grid.map((r) => [...r]); matches.forEach(({ x, y }) => { g[y][x] = -1; });
    setEnemyShaking(true); setTimeout(() => setEnemyShaking(false), 400);
    sounds.gemMatch(combo);
    setTimeout(() => {
      const filled = applyGravity(g); const nm = findMatches(filled);
      setCombat((p) => {
        if (!p) return p; const newEHp = Math.max(0, p.enemyHp - td);
        if (newEHp <= 0) {
          p.node.done = true;
          // setBosses is now handled in the story trigger block below (to avoid stale closure)
          if (p.node.res) setInv((prev) => [...prev, p.node.res!]);
          // LOOT — biome-specific drops
          const biomeRes = BIOME_RES_LOOT[p.node.biome] || ["herbe"];
          const lootItems: string[] = [];
          const multiplier = p.node.boss ? 3 : 1;
          for (let li = 0; li < multiplier; li++) {
            if (Math.random() < 0.8) lootItems.push(biomeRes[0]);
            if (Math.random() < 0.5) lootItems.push(biomeRes[Math.floor(Math.random() * biomeRes.length)]);
            if (Math.random() < 0.2) lootItems.push(biomeRes[biomeRes.length - 1]);
          }
          if (p.node.boss && Math.random() < 0.8) lootItems.push(Math.random() < 0.5 ? "pain" : "potion");
          if (!isBagFull(inv)) { lootItems.forEach((l) => setInv((prev) => [...prev, l])); }
          const lootText = lootItems.length > 0 ? `\nButin : ${lootItems.map((l) => RES[l]?.e || l).join(" ")}` : "";
          gainXp(p.node.boss ? 50 : 15); sounds.victory();
          // Story transition — STRICTLY boss only, never for normal mobs
          if (p.node.boss === true) {
            const biome = p.node.biome;
            // Check bosses via current state (not stale closure)
            setBosses((prevBosses) => {
              if (!prevBosses.includes(biome)) {
                // First time beating this boss → trigger story + post-boss nav
                setTimeout(() => {
                  setCombat(null);
                  if (biome === "restanques") triggerStory("ending");
                  else {
                    triggerStory(biome + "_end");
                    // After story → show direction to portal
                    setTimeout(() => notify("🚪 Le portail vers le prochain biome est accessible !"), 3000);
                  }
                }, 1500);
                return [...prevBosses, biome];
              }
              return prevBosses;
            });
          }
          return { ...p, grid: filled, enemyHp: 0, sel: null, combo: combo + 1, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm} VICTOIRE !${lootText}`, won: true, animating: false };
        }
        if (nm.length > 0) { setTimeout(() => processMatches(filled, nm, combo + 1), 400); return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: combo + 1, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm}`, animating: true }; }
        // Enemy turn — skip if Bouclier was used this turn
        if (usedSpells.has("Bouclier")) {
          setUsedSpells((s) => { const ns = new Set(s); ns.delete("Bouclier"); return ns; }); // consume shield
          return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: 0, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm} 🛡️ Tour ennemi bloqué !`, animating: false };
        }
        const atkMult = ngPlus === 0 ? 1 : ngPlus === 1 ? 1.3 : ngPlus === 2 ? 1.6 : 2;
        const ed = Math.ceil((p.enemy.hp / 5) * atkMult); const rd = Math.max(1, ed - totalStats.def);
        const atks = ["charge", "frappe", "mord", "griffe", "souffle"]; setEnemyTurnMsg(`${p.enemy.e} ${p.enemy.n} ${atks[Math.floor(Math.random() * atks.length)]} !`);
        setTimeout(() => { setPlayerShaking(true); sounds.hit(); setTimeout(() => setPlayerShaking(false), 400);
          setCombat((c) => { if (!c) return c; const np = c.playerHp - rd; setHp(Math.max(0, np)); setEnemyTurnMsg("");
            if (np <= 0) return { ...c, playerHp: 0, sel: null, combo: 0, msg: `${c.enemy.e} -${rd} PV... KO ! 💀`, lost: true, animating: false };
            return { ...c, playerHp: np, sel: null, combo: 0, msg: `Ton tour ! (-${rd} PV)`, animating: false }; }); }, 800);
        return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: 0, totalDmg: p.totalDmg + td, msg: `💥 -${td}${cm}`, animating: true };
      });
    }, 300);
  };

  const endCombat = () => {
    setCombat((prev) => {
      if (prev?.lost) {
        setHp(Math.floor(maxHp * 0.5));
        setDeathScreen(true); sounds.playMusic("gameover");
        setFatigueUntil(Date.now() + 120000);
        setTimeout(() => {
          setDeathScreen(false);
          // Exit dungeon if inside
          if (dungeon) {
            setDungeon(null);
            if (savedWorldPos) setPos(savedWorldPos);
            setSavedWorldPos(null);
          } else {
            setPos({ x: CAMP_POS.x, y: CAMP_POS.y });
          }
          sounds.playMusic(currentBiome);
          notify("😵 Fatigue — ATK réduit pendant 2:00");
        }, 2500);
      }
      return null;
    });
    setEnemyTurnMsg("");
    sounds.stopMusic();
    sounds.playBiomeMusic(currentBiome);
  };

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
  const vw = Math.ceil(W / CELL) + 2;
  const vh = Math.ceil(H / CELL) + 2;
  const camX = Math.max(0, Math.min(MW - vw, pos.x - Math.floor(vw / 2)));
  const camY = Math.max(0, Math.min(MH - vh, pos.y - Math.floor(vh / 2)));

  return (
    <div onClick={initSound} style={{ position: "fixed", inset: 0, background: "#1A1410", fontFamily: "'Courier New',monospace", color: "#FFF8E7", overflow: "hidden", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}
        @keyframes playerHit{0%,100%{transform:translateX(0)}25%{transform:translateX(4px);filter:brightness(1.5)}50%{transform:translateX(-4px)}75%{transform:translateX(2px)}}
        @keyframes pulse{0%,100%{filter:drop-shadow(0 0 4px #F4D03F)}50%{filter:drop-shadow(0 0 10px #FF6600)}}
        @keyframes fireFlicker{0%{transform:scale(1);opacity:0.9}100%{transform:scale(1.1) translateY(-2px);opacity:1}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
        @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-1px) scale(1.05)}}
        @keyframes enemyAtk{0%{transform:scale(1)}40%{transform:scale(1.3) translateY(-8px)}100%{transform:scale(1)}}
      `}</style>

      {/* BIOME TRANSITION — black fade */}
      {biomeTransition && <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#F4D03F", fontFamily: "'Crimson Text', Georgia, serif", fontSize: 20 }}>Changement de biome...</div>}

      {/* INTRO SEQUENCE */}
      {showIntro && <StorySequence
        slides={STORY.intro.map((text, i) => ({ text, image: INTRO_IMAGES[i] }))}
        onComplete={() => {
          setShowIntro(false);
          if (playerId) supabase.from("players").update({ intro_seen: true }).eq("id", playerId);
          // Transition music: intro → silence → garrigue
          sounds.stopMusic();
          setTimeout(() => sounds.playBiomeMusic("garrigue"), 300);
          // Show guide hint after intro
          if (!localStorage.getItem("restanques_guide_hint")) {
            setTimeout(() => { setGuideHint(true); setTimeout(() => setGuideHint(false), 5000); localStorage.setItem("restanques_guide_hint", "done"); }, 1000);
          }
        }}
      />}

      {/* STORY TRANSITION (boss defeated, biome change, ending) */}
      {storySequence && <StorySequence
        slides={storySequence.slides}
        musicId={storySequence.key === "ending" ? "ending" : "story"}
        onComplete={() => {
          const key = storySequence.key;
          setStorySequence(null);
          // After ending → show NG+ option
          if (key === "ending") {
            // Show NG+ screen
            setStory(null);
            setNgPlusScreen(true);
            if (playerId) supabase.from("players").update({ ng_plus: 1 }).eq("id", playerId);
          }
          // After biome_end → trigger next biome intro
          if (key === "garrigue_end") setTimeout(() => triggerStory("calanques_intro"), 500);
          if (key === "calanques_end") setTimeout(() => triggerStory("mines_intro"), 500);
          if (key === "mines_end") setTimeout(() => triggerStory("mer_intro"), 500);
          if (key === "mer_end") setTimeout(() => triggerStory("restanques_intro"), 500);
        }}
      />}

      {/* NEW GAME+ SCREEN */}
      {ngPlusScreen && <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ ...UI.panel, padding: 24, maxWidth: 340, color: "#3D2B1F", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: "bold", fontFamily: "'Crimson Text', Georgia, serif", marginBottom: 12 }}>Félicitations !</div>
          <div style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Le Mistral est vaincu !<br/>
            Niveau {lvl} · {bosses.length} boss · {completedQuests.length} quêtes<br/>
            🌙 La classe Ombre est débloquée !
          </div>
          <button onClick={async () => {
            // NG+ : new seed, keep level/stats/equip, reset progress
            if (sessionId) {
              await supabase.from("players").delete().eq("session_id", sessionId);
              await supabase.from("game_sessions").update({ active: false }).eq("id", sessionId);
            }
            // Create new session with fresh seed
            const newSeed = Math.floor(Math.random() * 999999);
            const { data: ns } = await supabase.from("game_sessions").insert({ seed: newSeed, active: true }).select().single();
            if (ns) {
              await supabase.from("players").insert({
                session_id: ns.id, name: pName, emoji: pEmoji,
                x: CAMP_POS.x, y: CAMP_POS.y, hp: maxHp, max_hp: maxHp,
                lvl, xp, inventory: [], tools, cards, stats,
                unlocked_biomes: ["garrigue"], bosses_defeated: [],
                chest: [], owned_equip: ownedEquip, equipped,
                ng_plus: 1, current_biome: "garrigue",
              });
            }
            window.location.href = `/game?player=${playerParam}&class=${classParam}`;
          }} style={{ ...UI.btn("#7A9E3F", "#FFF"), width: "100%", marginBottom: 8 }}>
            ⚔️ New Game+ (monstres buffés !)
          </button>
          <button onClick={() => { window.location.href = "/"; }} style={{ ...UI.btn("#8B7355", "#E8D5A3"), width: "100%" }}>
            🏠 Retour au menu
          </button>
        </div>
      </div>}

      {/* DEATH SCREEN */}
      {deathScreen && <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(80,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>💀</div>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#FF6666" }}>Défaite...</div>
        <div style={{ fontSize: 12, color: "#D4C5A9", marginTop: 8 }}>Retour au camp...</div>
      </div>}

      {/* DAY/NIGHT */}
      <DayNightOverlay />

      {/* TOP BAR */}
      <TopBar pEmoji={pEmoji} lvl={lvl} currentBiome={currentBiome}
        hp={hp} maxHp={maxHp} xp={xp} inv={inv} bosses={bosses}
        otherPlayer={otherPlayer} timeOfDay={timeOfDay} fatigueUntil={fatigueUntil}
        onToggleVolume={() => { sounds.cycleVolume(); setMuted(sounds.isMuted()); sounds.uiClick(); }}
        onTutorial={() => setTutoStep(0)} onSettings={() => setSettingsOpen(true)}
      />

      {notif && <div style={{ position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)", ...UI.panel, padding: "8px 18px", fontSize: 13, fontWeight: "bold", zIndex: 50, color: "#3D2B1F", whiteSpace: "nowrap", border: "2px solid #8B7355" }}>{notif}</div>}

      {/* MINIMAP — canvas, always visible */}
      <Minimap world={world} playerPos={pos} otherPlayer={otherPlayer} enemyPositions={enemyPositions} visible={inv.includes("boussole") || ownedEquip.includes("boussole")} />

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
      {combat && <CombatScreen
        combat={combat} pName={pName} pEmoji={pEmoji} pColor={pColor} maxHp={maxHp}
        playerShaking={playerShaking} enemyShaking={enemyShaking} enemyTurnMsg={enemyTurnMsg}
        cards={cards} usedSpells={usedSpells} inv={inv}
        onSelectGem={selectGem} onCastSpell={castSpell} onEndCombat={endCombat}
        onUsePotion={() => {
          const i = inv.indexOf("potion");
          if (i >= 0) { setInv((p) => { const n = [...p]; n.splice(i, 1); return n; }); setCombat((p) => p ? { ...p, playerHp: Math.min(maxHp, p.playerHp + 8), msg: "🧪 +8 PV !" } : p); setHp((h) => Math.min(maxHp, h + 8)); }
        }}
      />}

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
      {bag && <InventoryPanel
        inv={inv} hp={hp} maxHp={maxHp} lvl={lvl} xp={xp}
        tools={tools} cards={cards} unlocked={unlocked} bosses={bosses}
        onClose={() => setBag(false)} onSetInv={setInv}
        onSetHp={setHp} onNotify={notify} onUsePotion={usePotion} onDropItem={dropItem}
      />}

      {/* QUESTS */}
      {questPanel && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div style={{ ...UI.panel, padding: 14, maxWidth: 340, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: "bold" }}>📋 Quêtes</span><button style={UI.close} onClick={() => setQuestPanel(false)}>✕</button></div>
          {quests.map((q, i) => <div key={i} style={{ padding: 6, background: q.done ? "#7A9E3F22" : "#FFF8E7", borderRadius: 6, marginBottom: 4, border: `1px solid ${q.done ? "#7A9E3F" : "#D4C5A9"}`, fontSize: 11, display: "flex", justifyContent: "space-between" }}><span>{q.done ? "✅" : "⬜"} {q.t}</span><span style={{ color: "#E67E22" }}>+{q.xp}XP</span></div>)}
        </div>
      </div>}

      {/* CAMP PANEL */}
      {campPanel && <CampPanel
        tab={campPanel} hp={hp} maxHp={maxHp} inv={inv} chest={chest}
        tools={tools} cards={cards} equipped={equipped} ownedEquip={ownedEquip}
        onSetTab={(t) => setCampPanel(t as "" | "rest" | "chest" | "craft" | "equip")} onClose={() => setCampPanel("")}
        onSetInv={setInv} onSetChest={setChest} onSetTools={setTools} onSetCards={setCards}
        onSetEquipped={setEquipped} onSetOwnedEquip={setOwnedEquip} onNotify={notify}
        playerClass={playerClass.id || "aventurier"} garden={garden} onSetGarden={setGarden}
        torches={torches} onSetTorches={setTorches}
      />}

      {/* PVP ARENA */}
      {pvpActive && sessionId && playerId && <PvpArena
        sessionId={sessionId} playerId={playerId}
        pName={pName} pEmoji={pEmoji} pColor={pColor}
        hp={hp} maxHp={maxHp} lvl={lvl} cards={cards}
        onClose={(won, xpGained) => { setPvpActive(false); setXp(x => x + xpGained); sounds.playMusic(currentBiome); }}
      />}

      {/* CHARACTER PANEL */}
      {charPanel && <CharacterSheet
        pName={pName} pEmoji={pEmoji} pColor={pColor} playerClass={playerClass}
        lvl={lvl} hp={hp} maxHp={maxHp} xp={xp}
        stats={stats} totalStats={totalStats} equipped={equipped}
        cards={cards} tools={tools} bosses={bosses} completedQuests={completedQuests}
        onClose={() => setCharPanel(false)}
      />}

      {/* Level up is now automatic (no popup) */}

      {/* TUTORIAL — big clear panel */}
      {tutoStep >= 0 && <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
        <div style={{ width: "85%", maxWidth: 340, background: "rgba(245,236,215,0.95)", border: "3px solid #5C4033", borderRadius: 14, padding: 20, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F", lineHeight: 1.6, marginBottom: 16, fontFamily: "'Courier New',monospace" }}>
            {[
              "🕹️ Utilisez le D-pad en bas à gauche pour vous déplacer",
              "🌿 Tapez sur une ressource adjacente pour la récolter",
              "⚔️ Les monstres patrouillent ! Ils vous chassent si vous êtes trop près",
              "💎 Les combats se jouent en match-3 : alignez 3 gemmes !",
              "🏠 Retournez au camp pour crafter et vous soigner",
              "🗝️ Objectif : forgez la Clé Ancienne et battez le Mistral !",
            ][tutoStep]}
          </div>
          <button onClick={() => {
            if (tutoStep < 5) setTutoStep(tutoStep + 1);
            else { setTutoStep(-1); localStorage.setItem("restanques_tuto", "done"); }
          }} style={{ width: "100%", height: 48, background: "linear-gradient(145deg, #7A9E3F, #5A7E2F)", color: "#FFF", border: "2px solid #3D5E1A", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New',monospace", boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}>
            {tutoStep < 5 ? "Suivant →" : "C'est parti ! 🎮"}
          </button>
          <button onClick={() => { setTutoStep(-1); localStorage.setItem("restanques_tuto", "done"); }} style={{ marginTop: 8, background: "none", border: "none", color: "#8B7355", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "'Courier New',monospace" }}>
            Passer le tutoriel
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === tutoStep ? "#F4D03F" : "#D4C5A9" }} />)}
          </div>
        </div>
      </div>}

      {/* FORTRESS BOSS PROMPT */}
      {fortressPrompt && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...UI.panel, padding: 20, maxWidth: 300, color: "#3D2B1F", textAlign: "center" }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>{GUARDS[fortressPrompt]?.e}</div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#D94F4F", marginBottom: 4 }}>{FORTRESSES[fortressPrompt]?.name}</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>{GUARDS[fortressPrompt]?.n} (Nv.{fortressPrompt === "restanques" ? 25 : fortressPrompt === "mer" ? 20 : fortressPrompt === "mines" ? 15 : fortressPrompt === "calanques" ? 10 : 5})</div>
          <div style={{ fontSize: 12, fontStyle: "italic", color: "#8B7355", marginBottom: 14 }}>&quot;{GUARDS[fortressPrompt]?.d}&quot;</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={UI.btn("#D94F4F", "#FFF")} onClick={() => {
              const biome = fortressPrompt;
              setFortressPrompt(null);
              const boss = world?.nodes.find((n) => n.boss === true && n.biome === biome);
              if (boss) startCombat(boss);
            }}>⚔️ Combattre</button>
            <button style={UI.btn("#8B7355", "#FFF")} onClick={() => setFortressPrompt(null)}>🚶 Pas encore</button>
          </div>
        </div>
      </div>}

      {/* DUNGEON PROMPT */}
      {dungeonPrompt && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...UI.panel, padding: 20, maxWidth: 280, color: "#3D2B1F", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🕳️</div>
          <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 8 }}>Entrée de donjon</div>
          <div style={{ fontSize: 12, marginBottom: 14, color: "#8B7355" }}>Un passage sombre s&apos;ouvre devant vous. Des bruits inquiétants s&apos;en échappent...</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={UI.btn("#D94F4F", "#FFF")} onClick={() => enterDungeon(dungeonPrompt.seed, dungeonPrompt.biome)}>⚔️ Entrer</button>
            <button style={UI.btn("#8B7355", "#FFF")} onClick={() => setDungeonPrompt(null)}>🏃 Fuir</button>
          </div>
        </div>
      </div>}

      {/* DUNGEON VIEW — viewport centered on player */}
      {dungeon && (() => {
        const dvw = Math.ceil(W / CELL) + 2;
        const dvh = Math.ceil(H / CELL) + 2;
        const dcx = Math.max(0, Math.min(20 - dvw, dungeonPos.x - Math.floor(dvw / 2)));
        const dcy = Math.max(0, Math.min(20 - dvh, dungeonPos.y - Math.floor(dvh / 2)));
        const biMobs = BIOME_MOBS[dungeon.biome] || BIOME_MOBS.garrigue;
        return <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#0A0A0A" }}>
          {/* Viewport grid */}
          <div style={{ position: "fixed", top: 0, left: 0, display: "grid", gridTemplateColumns: `repeat(${dvw},${CELL}px)`, gap: 0 }}>
            {Array.from({ length: dvh }, (_, vy) => Array.from({ length: dvw }, (_, vx) => {
              const dx = dcx + vx, dy = dcy + vy;
              if (dx < 0 || dx >= 20 || dy < 0 || dy >= 20) return <div key={`d${vx}${vy}`} style={{ width: CELL, height: CELL, background: "#000" }} />;
              const tile = dungeon.tiles[dy][dx];
              const isPlayer = dungeonPos.x === dx && dungeonPos.y === dy;
              const mobIdx = dungeon.mobs.findIndex((m) => m.x === dx && m.y === dy);
              const mobAlive = mobIdx >= 0 && dungeonMobsAlive.has(mobIdx);
              const isChest = tile.type === "chest" && !dungeonChestOpened.has(20 * dy + dx);
              const isEntrance = tile.type === "entrance";
              const fs = Math.floor(CELL * 0.5);
              return <div key={`d${vx}${vy}`} style={{
                width: CELL, height: CELL,
                background: tile.walkable ? `hsl(30, 10%, ${12 + ((dx * 3 + dy * 7) % 5)}%)` : "#0A0808",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs,
                boxShadow: isPlayer ? "inset 0 0 0 2px #F4D03F" : "none",
              }} onClick={() => {
                const ddx = dx - dungeonPos.x, ddy = dy - dungeonPos.y;
                if (Math.abs(ddx) + Math.abs(ddy) !== 1 || !tile.walkable) return;
                if (isEntrance) { exitDungeon(); return; }
                if (mobAlive) {
                  const mob = biMobs[mobIdx % biMobs.length];
                  const guard = { n: mob.n, e: mob.e, hp: dungeon.mobs[mobIdx].hp, d: `${mob.e} attaque !` };
                  setCombat({ grid: createGrid(), enemy: guard, enemyHp: guard.hp, enemyMaxHp: guard.hp, playerHp: hp, node: { x: dx, y: dy, biome: dungeon.biome, res: null, guard, done: false }, sel: null, combo: 0, totalDmg: 0, msg: "Donjon !", won: false, lost: false, animating: false });
                  setDungeonMobsAlive((s) => { const ns = new Set(s); ns.delete(mobIdx); return ns; }); sounds.playCombatMusic(); return;
                }
                if (isChest) {
                  setDungeonChestOpened((s) => new Set(s).add(20 * dy + dx));
                  const eq = EQUIPMENTS.find((e) => e.id === dungeon.loot);
                  if (eq && !ownedEquip.includes(eq.id)) { setOwnedEquip((p) => [...p, eq.id]); notify(`🎁 ${eq.emoji} ${eq.name} !`); }
                  else { setInv((p) => [...p, "potion", "potion"]); notify("🎁 2 Potions !"); }
                  sounds.questComplete(); return;
                }
                setDungeonPos({ x: dx, y: dy });
              }}>
                {isPlayer ? <div style={{ ...playerCircle(PLAYER_STYLES[classParam]?.emoji || "🎸", PLAYER_STYLES[classParam]?.c1 || "#4A6E1F", PLAYER_STYLES[classParam]?.c2 || "#2D4A0F", CELL) }} />
                  : mobAlive ? <span style={{ fontSize: Math.floor(CELL * 0.55), filter: "drop-shadow(0 0 4px #D94F4F)" }}>{biMobs[mobIdx % biMobs.length]?.e || "👾"}</span>
                    : isChest ? <span style={{ fontSize: Math.floor(CELL * 0.6), animation: "float 2s ease infinite", filter: "drop-shadow(0 0 4px #F4D03F)" }}>📦</span>
                      : isEntrance ? <span style={{ filter: "drop-shadow(0 0 3px #87CEEB)" }}>🚪</span>
                        : null}
              </div>;
            })).flat()}
          </div>
          {/* Dungeon HUD */}
          <div style={{ position: "fixed", top: 8, left: 8, zIndex: 55, background: "rgba(0,0,0,0.7)", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#FFF" }}>
            🕳️ Donjon · ❤️{hp}/{maxHp} · 👾{dungeonMobsAlive.size}
          </div>
        <button onClick={exitDungeon} style={{ position: "fixed", top: 8, right: 8, zIndex: 55, ...UI.btn("#8B7355", "#FFF", true) }}>🚪 Sortir</button>
      </div>;
      })()}

      {/* NPC DIALOG */}
      {talkingNpc && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 12px 80px" }}>
        <div style={{ ...UI.panel, padding: 16, maxWidth: 340, width: "100%", color: "#3D2B1F" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ ...npcCircle(talkingNpc.emoji, 48), flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>{talkingNpc.emoji} {talkingNpc.name}</div>
              {activeQuests.includes(talkingNpc.quest.id) && !completedQuests.includes(talkingNpc.quest.id) && <div style={{ fontSize: 10, color: "#E67E22" }}>📋 Quête active</div>}
              {completedQuests.includes(talkingNpc.quest.id) && <div style={{ fontSize: 10, color: "#7A9E3F" }}>✅ Quête terminée</div>}
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", minHeight: 60 }}>{npcDialogText}<span style={{ opacity: npcDialogText.length < npcDialogFull.length ? 1 : 0, animation: "float 1s ease infinite" }}>▌</span></div>
          <button onClick={() => {
            if (npcDialogText.length < npcDialogFull.length) { setNpcDialogText(npcDialogFull); }
            else { setTalkingNpc(null); }
          }} style={{ ...UI.btn("#7A9E3F", "#FFF", true), width: "100%", marginTop: 10 }}>
            {npcDialogText.length < npcDialogFull.length ? "Tout lire ▶" : "Fermer"}
          </button>
        </div>
      </div>}

      {/* DIRECTION INDICATORS */}
      {world && !combat && !dungeon && (() => {
        const indicators: { emoji: string; label: string; tx: number; ty: number }[] = [];
        // Camp
        if (currentBiome === "garrigue") indicators.push({ emoji: "🏡", label: "Camp", tx: CAMP_POS.x, ty: CAMP_POS.y });
        // Fortress
        const fort = FORTRESSES[currentBiome];
        if (fort && !bosses.includes(currentBiome)) indicators.push({ emoji: "🏰", label: "Boss", tx: fort.x, ty: fort.y });
        // Nearest portal
        const portal = world.gates[0];
        if (portal) indicators.push({ emoji: "🚪", label: portal.b, tx: portal.x, ty: portal.y });

        return indicators.map((ind, i) => {
          const dx = ind.tx - pos.x, dy = ind.ty - pos.y;
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist < 5) return null; // too close, don't show
          // Position on screen edge
          const angle = Math.atan2(dy, dx);
          const edgeX = Math.max(40, Math.min(W - 40, W / 2 + Math.cos(angle) * (W / 2 - 30)));
          const edgeY = Math.max(60, Math.min(H - 80, H / 2 + Math.sin(angle) * (H / 2 - 50)));
          return <div key={i} style={{ position: "fixed", left: edgeX, top: edgeY, zIndex: 15, fontSize: 11, background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 8, color: "#FFF", fontFamily: "'Courier New',monospace", pointerEvents: "none", transform: "translate(-50%,-50%)" }}>
            {ind.emoji} {dist}
          </div>;
        });
      })()}

      {/* GUIDE HINT — first time */}
      {guideHint && <div onClick={() => setGuideHint(false)} style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "rgba(245,236,215,0.95)", border: "2px solid #5C4033", borderRadius: 10, padding: "10px 16px", maxWidth: 300, textAlign: "center", fontSize: 13, color: "#3D2B1F", fontFamily: "'Courier New',monospace", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
        📖 Première fois ? Consultez le <strong>Guide</strong> dans ⚙️ Options !
      </div>}

      {/* ═══ MAP ═══ */}
      <div style={{ position: "fixed", top: 0, left: 0, display: "grid", gridTemplateColumns: `repeat(${vw},${CELL}px)`, gap: 0, zIndex: 0 }}>
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
          const inCampZone = Math.abs(wx - CAMP_POS.x) <= CAMP_RADIUS && Math.abs(wy - CAMP_POS.y) <= CAMP_RADIUS;
          const fs = Math.floor(CELL * 0.5);

          // Night visibility
          const distToPlayer = Math.abs(wx - pos.x) + Math.abs(wy - pos.y);
          const isNight = timeOfDay >= 0.55 && timeOfDay < 0.9;
          const isDusk = timeOfDay >= 0.45 && timeOfDay < 0.55;
          const nightRadius = torchActive ? 7 : 3;
          const duskRadius = 8;
          let nightOpacity = 1;
          if (isNight && !inCampZone) {
            if (distToPlayer > nightRadius) nightOpacity = 0.05;
            else if (distToPlayer > nightRadius - 2) nightOpacity = 0.3;
            else nightOpacity = 0.85;
          } else if (isDusk && !inCampZone) {
            if (distToPlayer > duskRadius) nightOpacity = 0.4;
          }

          return <div key={`${vx}${vy}`} style={{
            width: CELL, height: CELL, background: tc.bg, backgroundImage: tc.pattern,
            filter: inCampZone ? "brightness(1.15)" : undefined,
            opacity: nightOpacity,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", fontSize: fs, overflow: "hidden",
            boxShadow: isP ? `inset 0 0 0 2px #F4D03F${torchActive && isNight ? ", 0 0 12px rgba(255,150,50,0.4)" : ""}` : isOther ? "inset 0 0 0 2px #E88EAD" : tc.border ? `inset 0 -2px 0 ${tc.border}` : "none",
          }} onClick={() => {
            const dx = wx - pos.x, dy = wy - pos.y;
            if (Math.abs(dx) + Math.abs(dy) !== 1) return;
            // Check if tapping a resource node → harvest instead of move
            const tapNode = world.nodes.find((n) => n.x === wx && n.y === wy && !n.done && !n.guard && n.res);
            if (tapNode) { tapHarvest(wx, wy); return; }
            // Check if tapping a mob → dialog
            const tapMob = Object.entries(enemyPositions).find(([, ep]) => ep.x === wx && ep.y === wy);
            if (tapMob) { const mNode = world.nodes[Number(tapMob[0])]; if (mNode && mNode.guard) setDialog(mNode); return; }
            // Check if tapping a NPC → dialogue
            const tapNpc = NPCS.find((n) => n.x === wx && n.y === wy);
            if (tapNpc) { talkToNpc(tapNpc); return; }
            // Otherwise move
            tryMove(dx, dy);
          }}>
            {/* PLAYER — Pixel Crawler Body_A */}
            {isP ? <div style={{ ...playerCircle(PLAYER_STYLES[classParam]?.emoji || "🎸", PLAYER_STYLES[classParam]?.c1 || "#4A6E1F", PLAYER_STYLES[classParam]?.c2 || "#2D4A0F", CELL), zIndex: 2, animation: walking ? "bounce 0.4s ease infinite" : "none" }} />
              : isOther ? <div style={{ ...playerCircle(otherPlayer!.name === "Mélanie" ? "🎨" : "🎸", otherPlayer!.name === "Mélanie" ? "#8E4466" : "#4A6E1F", otherPlayer!.name === "Mélanie" ? "#5C2D42" : "#2D4A0F", CELL * 0.85), opacity: 0.7 }} />
                : mobileEnemyNode ? <div style={{ position: "relative" }}>
                    <div style={{ width: CELL, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.floor(CELL * 0.55), filter: isAlerted ? "drop-shadow(0 0 4px #D94F4F)" : "none" }} />
                    {isAlerted && <span style={{ position: "absolute", top: -4, right: -2, fontSize: 10, color: "#D94F4F", fontWeight: "bold", textShadow: "0 0 3px #000" }}>❗</span>}
                  </div>
                  : isCamp ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: Math.floor(CELL * 0.9) }}>🏡</span>
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: CELL * 0.5, height: CELL * 0.5, borderRadius: "50%", background: "radial-gradient(circle, #FF8800, #FF4400, transparent)", boxShadow: "0 0 8px rgba(255,100,0,0.5)", animation: "fireFlicker 0.6s infinite alternate" }} />
                    </div>
                    : staticNode && staticNode.res ? (() => {
                        const nIdx = world.nodes.indexOf(staticNode);
                        const maxHp = NODE_HP[staticNode.res!] || 3;
                        const curHp = nodeHpMap[nIdx] ?? maxHp;
                        const isAdj = Math.abs(wx - pos.x) + Math.abs(wy - pos.y) === 1;
                        const damaged = curHp < maxHp;
                        return <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: Math.floor(CELL * 0.55), animation: isAdj ? "float 1s ease infinite" : "float 3s ease infinite", filter: damaged ? "brightness(0.5) saturate(0.5)" : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))", border: isAdj ? "2px solid rgba(244,208,63,0.6)" : "none", borderRadius: 4, padding: 1 }}>{RES[staticNode.res!]?.e || "❓"}</span>
                          {damaged && <div style={{ position: "absolute", bottom: 0, left: "10%", width: "80%", height: 3, background: "#333", borderRadius: 2 }}><div style={{ width: `${(curHp / maxHp) * 100}%`, height: "100%", background: "#7A9E3F", borderRadius: 2 }} /></div>}
                        </div>;
                      })()
                      : gate ? <span style={{ filter: "drop-shadow(0 0 3px #F4D03F)" }}>🚪</span>
                        : NPCS.find((n) => n.x === wx && n.y === wy) ? (() => { const npc = NPCS.find((n) => n.x === wx && n.y === wy)!; return <div style={{ position: "relative" }}>
                            <div style={{ ...npcCircle(npc.emoji, CELL), filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
                            {!completedQuests.includes(npc.quest.id) && <span style={{ position: "absolute", top: -6, right: -2, fontSize: 12, animation: "float 1s ease infinite" }}>❗</span>}
                          </div>; })()
                          : vilIdx >= 0 ? <div style={{ width: CELL, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.floor(CELL * 0.6) }} />
                          : tile === "t" ? <span style={{ fontSize: Math.floor(CELL * 0.65), filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }}>🌳</span>
                            : tile === "fl" ? <span style={{ fontSize: Math.floor(CELL * 0.4) }}>🌸</span>
                              : tile === "lv" ? <span style={{ fontSize: Math.floor(CELL * 0.4) }}>💜</span>
                                : tile === "r" ? <span style={{ fontSize: Math.floor(CELL * 0.45), opacity: 0.7 }}>🪨</span>
                                  : (() => { const f = FORTRESSES[currentBiome]; return f && Math.abs(wx - f.x) <= 1 && Math.abs(wy - f.y) <= 1 && !bosses.includes(currentBiome); })() ? (wx === FORTRESSES[currentBiome].x && wy === FORTRESSES[currentBiome].y ? <span style={{ fontSize: Math.floor(CELL * 1.3), filter: "drop-shadow(0 0 8px #D94F4F)", animation: "float 2s ease infinite" }}>🏰</span> : null)
                                    : DUNGEON_ENTRANCES.find((d) => d.x === wx && d.y === wy) ? <span style={{ fontSize: Math.floor(CELL * 0.6), filter: "drop-shadow(0 0 4px #9B7EDE)" }}>🕳️</span>
                                    : (mysteryPos && wx === mysteryPos.x && wy === mysteryPos.y) ? <div style={{ ...playerCircle("🌙", "#111", "#000", CELL), filter: "brightness(0.3)", opacity: 0.4, animation: "float 2s ease infinite" }} />
                                    : null}
          </div>;
        })).flat()}
      </div>

      {/* JOYSTICK (mobile) */}
      <Joystick onMove={(dx, dy) => {
        if (dungeon) {
          // Dungeon movement
          const nx = dungeonPos.x + dx, ny = dungeonPos.y + dy;
          if (nx < 0 || nx >= 20 || ny < 0 || ny >= 20) return;
          if (!dungeon.tiles[ny][nx].walkable) return;
          if (dungeon.tiles[ny][nx].type === "entrance") { exitDungeon(); return; }
          // Check mob
          const mobIdx = dungeon.mobs.findIndex((m) => m.x === nx && m.y === ny);
          if (mobIdx >= 0 && dungeonMobsAlive.has(mobIdx)) {
            const guard = GUARDS[dungeon.biome];
            const dMob = dungeon.mobs[mobIdx];
            setCombat({ grid: createGrid(), enemy: { ...guard, hp: dMob.hp }, enemyHp: dMob.hp, enemyMaxHp: dMob.hp, playerHp: hp, node: { x: dMob.x, y: dMob.y, biome: dungeon.biome, res: null, guard, done: false }, sel: null, combo: 0, totalDmg: 0, msg: "Donjon !", won: false, lost: false, animating: false });
            setDungeonMobsAlive((s) => { const ns = new Set(s); ns.delete(mobIdx); return ns; });
            sounds.playCombatMusic(); return;
          }
          // Check chest
          if (dungeon.tiles[ny][nx].type === "chest" && !dungeonChestOpened.has(dungeon.tiles[0].length * ny + nx)) {
            setDungeonChestOpened((s) => new Set(s).add(dungeon.tiles[0].length * ny + nx));
            const eq = EQUIPMENTS.find((e) => e.id === dungeon.loot);
            if (eq && !ownedEquip.includes(eq.id)) { setOwnedEquip((p) => [...p, eq.id]); notify(`🎁 ${eq.emoji} ${eq.name} !`); }
            else { setInv((p) => [...p, "potion", "potion"]); notify("🎁 2 Potions !"); }
            sounds.questComplete();
          }
          setDungeonPos({ x: nx, y: ny });
        } else {
          tryMove(dx, dy);
        }
      }} onStop={() => { setWalking(false); }} moveInterval={equipped.bottes === "bottes_vent" ? 150 : equipped.bottes === "sandales" ? 200 : 250} />

      {/* ACTION BUTTONS (bottom right) */}
      <div style={{ position: "fixed", bottom: 16, right: 10, zIndex: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button style={{ width: 52, height: 44, borderRadius: 8, background: "rgba(232,163,23,0.8)", color: "#3D2B1F", border: "2px solid #5C4033", fontSize: 10, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New',monospace" }} onClick={() => { const inCamp = Math.abs(pos.x - CAMP_POS.x) <= CAMP_RADIUS && Math.abs(pos.y - CAMP_POS.y) <= CAMP_RADIUS; if (inCamp) setCampPanel("rest"); else notify("🏠 Au camp !"); }}>🏠</button>
        <button style={{ width: 52, height: 44, borderRadius: 8, background: bagFull ? "rgba(217,79,79,0.8)" : "rgba(46,134,171,0.8)", color: "#FFF", border: "2px solid #5C4033", fontSize: 10, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New',monospace" }} onClick={() => setBag(true)}>🎒</button>
        <button style={{ width: 52, height: 44, borderRadius: 8, background: "rgba(155,126,222,0.8)", color: "#FFF", border: "2px solid #5C4033", fontSize: 10, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New',monospace" }} onClick={() => setCharPanel(true)}>👤</button>
        <button style={{ width: 52, height: 44, borderRadius: 8, background: "rgba(244,208,63,0.8)", color: "#3D2B1F", border: "2px solid #5C4033", fontSize: 10, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New',monospace" }} onClick={() => setQuestPanel(true)}>📋</button>
      </div>
      {/* QUICK MESSAGES */}
      <div style={{ position: "fixed", top: 38, left: 0, right: 0, zIndex: 9, display: "flex", justifyContent: "center", gap: 4, padding: "2px 4px" }}>
        {[["❤️", "Aide!"], ["👋", "Ici!"], ["⚔️", "Boss!"], ["🏡", "Camp!"]].map(([emoji, label]) => (
          <button key={label} onClick={() => {
            setQuickMsg(`${emoji} ${label}`);
            // Save to Supabase for other player to see
            if (playerId) supabase.from("players").update({ quick_msg: `${emoji} ${label}` }).eq("id", playerId);
            setTimeout(() => { setQuickMsg(""); if (playerId) supabase.from("players").update({ quick_msg: "" }).eq("id", playerId); }, 3000);
          }} style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(61,43,31,0.6)", border: "1px solid rgba(244,208,63,0.3)", color: "#F4D03F", fontSize: 9, cursor: "pointer" }}>
            {emoji}
          </button>
        ))}
      </div>
      {quickMsg && <div style={{ position: "fixed", top: 54, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(61,43,31,0.9)", border: "2px solid #F4D03F", borderRadius: 10, padding: "6px 16px", color: "#F4D03F", fontSize: 14, fontWeight: "bold" }}>{quickMsg}</div>}

      {/* TORCH BUTTON (night only) */}
      {(timeOfDay >= 0.45 && timeOfDay < 0.9) && <button onClick={() => {
        if (torchActive) return;
        if (torches <= 0) { notify("🔦 Pas de torche ! Craftez-en au camp (🪵×2 + 🌿×1)"); return; }
        setTorches(t => t - 1); setTorchActive(true); setTorchEnd(Date.now() + 180000);
        notify("🔦 Torche allumée ! (3 min)");
        setTimeout(() => { setTorchActive(false); notify("🔦 La torche s'est éteinte..."); }, 180000);
      }} style={{
        position: "fixed", bottom: 70, right: 10, zIndex: 10,
        width: 56, height: 36, borderRadius: 8,
        background: torchActive ? "rgba(255,150,50,0.9)" : "rgba(100,80,50,0.7)",
        color: "#FFF", border: `2px solid ${torchActive ? "#F4D03F" : "#5C4033"}`,
        fontSize: 10, fontWeight: "bold", cursor: "pointer",
        fontFamily: "'Courier New',monospace",
        boxShadow: torchActive ? "0 0 10px rgba(255,150,50,0.5)" : "none",
      }}>🔦{torchActive ? "✓" : `×${torches}`}</button>}
      {/* Settings menu */}
      {settingsOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...UI.panel, padding: 16, maxWidth: 260, color: "#3D2B1F", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 12 }}>⚙️ Options</div>
          <button style={{ ...UI.btn("#7A9E3F", "#FFF"), width: "100%", marginBottom: 8 }} onClick={() => { setSettingsOpen(false); setShowGuide(true); }}>📖 Guide du jeu</button>
          <button style={{ ...UI.btn("#D94F4F", "#FFF"), width: "100%", marginBottom: 8 }} onClick={() => { setSettingsOpen(false); setPvpActive(true); }}>⚔️ Arène PvP</button>
          <button style={{ ...UI.btn("#2E86AB", "#FFF"), width: "100%", marginBottom: 8 }} onClick={() => { sounds.cycleVolume(); setMuted(sounds.isMuted()); }}>{sounds.getVolIcon()} Son : {muted ? "OFF" : "ON"}</button>
          <button style={{ ...UI.btn("#8B7355", "#FFF"), width: "100%", marginBottom: 8 }} onClick={() => { window.location.href = "/"; }}>🏠 Menu principal</button>
          <button style={UI.close} onClick={() => setSettingsOpen(false)}>✕ Fermer</button>
        </div>
      </div>}
      {showGuide && <GameGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: "100%", height: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>⛰️</div>Chargement...</div></div>;
  return <Suspense fallback={<div style={{ width: "100%", height: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}>Chargement...</div>}><GameContent /></Suspense>;
}
