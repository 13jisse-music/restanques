"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { genWorld } from "../lib/world";
import { createGrid, findMatches, swapGems, applyGravity } from "../lib/match3";
import {
  COLORS as C, GEMS, RES, TOOLS, CARD_RECIPES, GUARDS, QUESTS_DEF,
  TILES, MW, MH, CELL,
  type GameWorld, type GameNode, type CombatState, type CombatCard, type Quest, type Village,
} from "../lib/constants";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ═══════════════════════════════════════════════════════════
// PIXEL BUTTON STYLE
// ═══════════════════════════════════════════════════════════
const PXB = (c = C.terra, tc = C.white, sm = false): React.CSSProperties => ({
  background: c, color: tc, border: `3px solid ${C.earth}`,
  padding: sm ? "6px 10px" : "10px 16px", fontSize: sm ? "12px" : "14px",
  fontWeight: "bold", fontFamily: "'Courier New',monospace", cursor: "pointer",
  boxShadow: `2px 2px 0 ${C.earth}`, letterSpacing: "1px",
  userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation",
  borderRadius: "4px",
});

function GameContent() {
  const searchParams = useSearchParams();
  const playerParam = searchParams.get("player");

  const [pName] = useState(playerParam === "melanie" ? "Mélanie" : "Jisse");
  const [pEmoji] = useState(playerParam === "melanie" ? "🎨" : "🎸");
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
  const [otherPlayer, setOtherPlayer] = useState<{ x: number; y: number; name: string; emoji: string; hp: number; lvl: number } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const worldRef = useRef<GameWorld | null>(null);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 2500); };

  const gainXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      const needed = lvl * 50;
      if (next >= needed) {
        setLvl((l) => l + 1);
        setMaxHp((h) => h + 3);
        setHp((h) => Math.min(h + 5, maxHp + 3));
        notify(`⬆️ Niveau ${lvl + 1} ! +3 PV max`);
        return next - needed;
      }
      return next;
    });
  }, [lvl, maxHp]);

  // ─── SUPABASE SESSION ───
  useEffect(() => {
    async function initSession() {
      // Find or create active session
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      let session = sessions?.[0];
      let seed: number;

      if (!session) {
        seed = Math.floor(Math.random() * 999999);
        const { data } = await supabase
          .from("game_sessions")
          .insert({ seed, active: true })
          .select()
          .single();
        session = data;
      }

      if (!session) return;
      seed = session.seed;
      setSessionId(session.id);

      // Generate world from shared seed
      const w = genWorld(seed);
      setWorld(w);
      worldRef.current = w;
      setPos(w.spawn);

      // Apply collected nodes from session
      if (session.collected_nodes && Array.isArray(session.collected_nodes)) {
        for (const idx of session.collected_nodes) {
          if (w.nodes[idx]) w.nodes[idx].done = true;
        }
      }

      // Upsert player
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("*")
        .eq("session_id", session.id)
        .eq("name", pName)
        .single();

      if (existingPlayer) {
        setPlayerId(existingPlayer.id);
        // Restore state
        setPos({ x: existingPlayer.x, y: existingPlayer.y });
        setHp(existingPlayer.hp);
        setMaxHp(existingPlayer.max_hp);
        setLvl(existingPlayer.lvl);
        setXp(existingPlayer.xp);
        setInv(existingPlayer.inventory || []);
        setTools(existingPlayer.tools || []);
        setCards(existingPlayer.cards || []);
        setUnlocked(existingPlayer.unlocked_biomes || ["garrigue"]);
        setBosses(existingPlayer.bosses_defeated || []);
      } else {
        const { data: newPlayer } = await supabase
          .from("players")
          .insert({
            session_id: session.id,
            name: pName,
            emoji: pEmoji,
            x: w.spawn.x,
            y: w.spawn.y,
          })
          .select()
          .single();
        if (newPlayer) setPlayerId(newPlayer.id);
      }

      // Show intro
      setStory("🏔️ La légende raconte qu'un magnifique duché provençal s'élevait autrefois sur les terrasses de pierre des collines...\n\n🌪️ Mais le Mistral, jaloux, a tout balayé.\n\n💪 Aujourd'hui, deux aventuriers partent restaurer les Restanques.\n\n🌿 Votre quête commence dans la Garrigue parfumée.\nExplorez, récoltez, forgez vos outils, et ouvrez le chemin vers les Restanques !");
    }

    initSession();
  }, [pName, pEmoji]);

  // ─── SYNC PLAYER STATE TO SUPABASE (throttled) ───
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!playerId || !sessionId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      await supabase.from("players").update({
        x: pos.x, y: pos.y, hp, max_hp: maxHp, lvl, xp,
        inventory: inv, tools, cards, unlocked_biomes: unlocked, bosses_defeated: bosses,
        updated_at: new Date().toISOString(),
      }).eq("id", playerId);
    }, 200);
  }, [pos, hp, maxHp, lvl, xp, inv, tools, cards, unlocked, bosses, playerId, sessionId]);

  // ─── SYNC COLLECTED NODES ───
  const syncNodesRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!sessionId || !world) return;
    if (syncNodesRef.current) clearTimeout(syncNodesRef.current);
    syncNodesRef.current = setTimeout(async () => {
      const collected = world.nodes.map((n, i) => n.done ? i : -1).filter((i) => i >= 0);
      await supabase.from("game_sessions").update({ collected_nodes: collected }).eq("id", sessionId);
    }, 300);
  }, [world?.nodes.filter((n) => n.done).length, sessionId]);

  // ─── REALTIME: listen for other player + collected nodes ───
  useEffect(() => {
    if (!sessionId) return;
    const otherName = pName === "Jisse" ? "Mélanie" : "Jisse";

    // Poll other player position
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("players")
        .select("x, y, name, emoji, hp, lvl")
        .eq("session_id", sessionId)
        .eq("name", otherName)
        .single();
      if (data) setOtherPlayer(data);
    }, 1000);

    // Subscribe to game_sessions changes for collected nodes
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` }, (payload) => {
        const collected = payload.new.collected_nodes;
        if (collected && Array.isArray(collected) && worldRef.current) {
          for (const idx of collected) {
            if (worldRef.current.nodes[idx]) worldRef.current.nodes[idx].done = true;
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [sessionId, pName]);

  // ─── QUEST CHECK ───
  const checkQuests = useCallback(() => {
    setQuests((prev) => prev.map((q) => {
      if (q.done) return q;
      if (q.need) {
        const ok = Object.entries(q.need).every(([item, cnt]) => inv.filter((i) => i === item).length >= cnt);
        if (ok) {
          gainXp(q.xp);
          if (q.reward) setInv((p) => [...p, q.reward!]);
          notify(`✅ Quête: ${q.t} !`);
          const doneCount = prev.filter((p) => p.done).length + 1;
          if (doneCount + 2 < QUESTS_DEF.length) {
            const next = QUESTS_DEF[doneCount + 2];
            if (next && !prev.find((p) => p.id === next.id)) {
              setTimeout(() => setQuests((p) => [...p, { ...next, done: false }]), 500);
            }
          }
          return { ...q, done: true };
        }
      }
      if (q.needTool && tools.includes(q.needTool)) {
        gainXp(q.xp); if (q.reward) setInv((p) => [...p, q.reward!]);
        notify(`✅ Quête: ${q.t} !`); return { ...q, done: true };
      }
      if (q.needBoss && bosses.includes(q.needBoss)) {
        gainXp(q.xp); if (q.reward) setInv((p) => [...p, q.reward!]);
        notify(`✅ Quête: ${q.t} !`); return { ...q, done: true };
      }
      return q;
    }));
  }, [inv, tools, bosses, gainXp]);

  useEffect(() => { if (world) checkQuests(); }, [inv, tools, bosses, checkQuests, world]);

  // ─── BIOME ───
  const getBiome = useCallback(() => {
    if (!world) return "garrigue";
    let best = "garrigue", bd = 999;
    for (const [n, z] of Object.entries(world.Z)) {
      const d = Math.sqrt((pos.x - z.cx) ** 2 + (pos.y - z.cy) ** 2);
      if (d < z.r + 2 && d < bd) { bd = d; best = n; }
    }
    return best;
  }, [world, pos]);

  // ─── MOVEMENT ───
  const tryMove = useCallback((dx: number, dy: number) => {
    if (!world || story || dialog || combat || craft || bag || shop || questPanel) return;
    const nx = pos.x + dx, ny = pos.y + dy;
    if (nx < 0 || nx >= MW || ny < 0 || ny >= MH) return;
    const tile = world.m[ny][nx];
    const tt = TILES[tile];

    // Gate
    const gate = world.gates.find((g) => g.x === nx && g.y === ny);
    if (gate) {
      const bio = gate.b;
      const needMap: Record<string, string> = { calanques: "baton", mines: "pioche", mer: "filet", restanques: "cle" };
      const need = needMap[bio];
      if (need && !tools.includes(need)) {
        notify(`🚪 Verrouillé ! Il faut ${TOOLS[need].e} ${TOOLS[need].n}`); return;
      }
      if (!unlocked.includes(bio)) {
        setUnlocked((p) => [...p, bio]);
        const msgs: Record<string, string> = {
          calanques: "🏖️ Les Calanques s'ouvrent ! Falaises blanches et eaux turquoise...",
          mines: "⛏️ Les Mines d'Ocre ! Galeries secrètes aux reflets dorés...",
          mer: "🌊 La Méditerranée ! Trésors des profondeurs...",
          restanques: "⛰️ Les Restanques ! Le Mistral vous attend pour le combat final !",
        };
        if (msgs[bio]) setStory(msgs[bio]);
      }
    }

    if (!tt?.w && tile !== "gt") return;
    setPos({ x: nx, y: ny });

    // Village?
    const vil = world.villages.find((v) => nx >= v.x && nx <= v.x + 1 && ny >= v.y && ny <= v.y + 1);
    if (vil && !shop) setShop(vil);

    // Node?
    const node = world.nodes.find((n) => n.x === nx && n.y === ny && !n.done);
    if (node) {
      if (node.guard) {
        setDialog(node);
      } else if (node.res) {
        setInv((p) => [...p, node.res!]);
        node.done = true;
        notify(`${RES[node.res].e} +1 ${RES[node.res].n}`);
      }
    }
  }, [world, pos, story, dialog, combat, craft, bag, shop, questPanel, tools, unlocked]);

  const holdMove = (dx: number, dy: number) => { tryMove(dx, dy); moveRef.current = setInterval(() => tryMove(dx, dy), 160); };
  const stopMove = () => { if (moveRef.current) clearInterval(moveRef.current); moveRef.current = null; };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") tryMove(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") tryMove(1, 0);
      if (e.key === "ArrowUp" || e.key === "w") tryMove(0, -1);
      if (e.key === "ArrowDown" || e.key === "s") tryMove(0, 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tryMove]);

  // ─── COMBAT (Match-3) ───
  const startCombat = (node: GameNode) => {
    setDialog(null);
    const g = node.guard || GUARDS[node.biome];
    setCombat({
      grid: createGrid(),
      enemy: { ...g },
      enemyHp: g.hp,
      enemyMaxHp: g.hp,
      playerHp: hp,
      node,
      sel: null,
      combo: 0,
      totalDmg: 0,
      msg: "Alignez 3 gemmes pour attaquer !",
      won: false, lost: false, animating: false,
    });
  };

  const selectGem = (x: number, y: number) => {
    if (!combat || combat.won || combat.lost || combat.animating) return;
    if (!combat.sel) {
      setCombat((p) => p ? { ...p, sel: { x, y } } : p);
    } else {
      const { sel } = combat;
      const dx = Math.abs(sel.x - x), dy = Math.abs(sel.y - y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        const newGrid = swapGems(combat.grid, sel.x, sel.y, x, y);
        const matches = findMatches(newGrid);
        if (matches.length > 0) {
          processMatches(newGrid, matches, 0);
        } else {
          setCombat((p) => p ? { ...p, sel: null, msg: "Pas de match ! Réessayez." } : p);
        }
      } else {
        setCombat((p) => p ? { ...p, sel: { x, y } } : p);
      }
    }
  };

  const processMatches = (grid: number[][], matches: { x: number; y: number }[], combo: number) => {
    setCombat((p) => p ? { ...p, animating: true } : p);
    const dmg = matches.length + combo * 2;
    const bonusDmg = cards.reduce((a, c) => a + (c.pow || 0), 0);

    const g = grid.map((r) => [...r]);
    matches.forEach(({ x, y }) => { g[y][x] = -1; });

    setTimeout(() => {
      const filled = applyGravity(g);
      const newMatches = findMatches(filled);

      setCombat((p) => {
        if (!p) return p;
        const totalD = dmg + Math.floor(bonusDmg / 2);
        const newEHp = Math.max(0, p.enemyHp - totalD);
        const comboMsg = combo > 0 ? ` COMBO x${combo + 1} !` : "";

        if (newEHp <= 0) {
          const node = p.node;
          node.done = true;
          if (node.boss) setBosses((prev) => [...prev, node.biome]);
          if (node.res) setInv((prev) => [...prev, node.res!]);
          const biome = node.biome;
          const lootRes = Object.entries(RES).filter(([, v]) => v.b === biome).map(([k]) => k);
          if (lootRes.length > 0) {
            const bonus = lootRes[Math.floor(Math.random() * lootRes.length)];
            setInv((prev) => [...prev, bonus]);
          }
          gainXp(node.boss ? 50 : 15);

          if (node.boss && node.biome === "restanques") {
            setTimeout(() => {
              setCombat(null);
              setStory("🏆 LE MISTRAL EST VAINCU !\n\n🏔️ Les Restanques reprennent vie, terrasse après terrasse.\n🫒 Les oliviers refleurissent, la lavande embaume...\n\n👑 Vous êtes les souverains de Provence !\n\n🎸🎨 FÉLICITATIONS !");
            }, 1500);
          }
          return { ...p, grid: filled, enemyHp: 0, sel: null, combo: combo + 1, totalDmg: p.totalDmg + totalD, msg: `💥 -${totalD}${comboMsg} VICTOIRE ! 🎉`, won: true, animating: false };
        }

        if (newMatches.length > 0) {
          setTimeout(() => processMatches(filled, newMatches, combo + 1), 400);
          return { ...p, grid: filled, enemyHp: newEHp, sel: null, combo: combo + 1, totalDmg: p.totalDmg + totalD, msg: `💥 -${totalD}${comboMsg}`, animating: true };
        }

        // Enemy turn
        const eDmg = Math.ceil(p.enemy.hp / 5);
        const shield = cards.find((c) => c.n === "Bouclier") ? 1 : 0;
        const realDmg = Math.max(1, eDmg - shield);
        const newPHp = p.playerHp - realDmg;
        setHp(Math.max(0, newPHp));

        if (newPHp <= 0) {
          return { ...p, grid: filled, enemyHp: newEHp, playerHp: 0, sel: null, combo: 0, totalDmg: 0, msg: `${p.enemy.e} -${realDmg} PV... KO ! 💀`, lost: true, animating: false };
        }

        return { ...p, grid: filled, enemyHp: newEHp, playerHp: newPHp, sel: null, combo: 0, totalDmg: p.totalDmg + totalD, msg: `💥 -${totalD}${comboMsg} → ${p.enemy.e} -${realDmg} PV`, animating: false };
      });
    }, 300);
  };

  const endCombat = () => {
    if (combat?.lost) setHp(Math.max(5, maxHp - 5));
    setCombat(null);
  };

  // ─── CRAFT ───
  const addSlot = (id: string, idx: number) => {
    if (craftSlots.length < 3 && !craftSlots.find((s) => s.idx === idx))
      setCraftSlots((p) => [...p, { id, idx }]);
  };

  const rmSlots = () => {
    const idxs = craftSlots.map((s) => s.idx).sort((a, b) => b - a);
    setInv((p) => { const n = [...p]; idxs.forEach((i) => n.splice(i, 1)); return n; });
  };

  const doCraft = () => {
    const ids = craftSlots.map((s) => s.id).sort();
    for (const [tid, tool] of Object.entries(TOOLS)) {
      const r = [...tool.r].sort();
      if (r.length === ids.length && r.every((v, i) => v === ids[i]) && !tools.includes(tid)) {
        setTools((p) => [...p, tid]); rmSlots();
        setCraftMsg(`✨ ${tool.e} ${tool.n} ! ${tool.d}`); setCraftSlots([]); return;
      }
    }
    for (const rec of CARD_RECIPES) {
      const r = [...rec.r].sort();
      if (r.length === ids.length && r.every((v, i) => v === ids[i])) {
        setCards((p) => [...p, { ...rec.c }]); rmSlots();
        setCraftMsg(`✨ ${rec.c.e} ${rec.c.n} ! ${rec.c.d}`); setCraftSlots([]); return;
      }
    }
    setCraftMsg("❌ Pas de recette..."); setCraftSlots([]);
  };

  // ─── SHOP ───
  const buyItem = (item: { sell: string; cost: string[] }) => {
    const has = item.cost.every((c) => inv.includes(c));
    if (!has) { notify("❌ Pas assez de ressources !"); return; }
    const newInv = [...inv];
    item.cost.forEach((c) => { const i = newInv.indexOf(c); if (i >= 0) newInv.splice(i, 1); });
    newInv.push(item.sell);
    setInv(newInv);
    notify(`${RES[item.sell].e} +1 ${RES[item.sell].n} !`);
    if (item.sell === "potion") { setHp((h) => Math.min(maxHp, h + 8)); notify("❤️ +8 PV !"); }
    if (item.sell === "pain") { setHp((h) => Math.min(maxHp, h + 4)); notify("❤️ +4 PV !"); }
  };

  // ─── HEAL ───
  const usePotion = () => {
    const i = inv.indexOf("potion");
    if (i >= 0) {
      setInv((p) => { const n = [...p]; n.splice(i, 1); return n; });
      setHp((h) => Math.min(maxHp, h + 10)); notify("🧪 +10 PV !");
    } else {
      const j = inv.indexOf("pain");
      if (j >= 0) {
        setInv((p) => { const n = [...p]; n.splice(j, 1); return n; });
        setHp((h) => Math.min(maxHp, h + 5)); notify("🥖 +5 PV !");
      }
    }
  };

  // ─── NEW GAME ───
  const newGame = async () => {
    if (sessionId) {
      await supabase.from("game_sessions").update({ active: false }).eq("id", sessionId);
    }
    window.location.href = `/game?player=${playerParam}`;
  };

  // ═══ RENDER ═══
  if (!world) return (
    <div style={{ width: "100%", minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: C.sun }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>⛰️</div>
        <div>Chargement...</div>
      </div>
    </div>
  );

  const biome = getBiome();
  const vw = Math.min(13, Math.floor((typeof window !== "undefined" ? window.innerWidth - 8 : 360) / CELL));
  const vh = Math.min(9, Math.floor(((typeof window !== "undefined" ? window.innerHeight : 700) - 280) / CELL));
  const camX = Math.max(0, Math.min(MW - vw, pos.x - Math.floor(vw / 2)));
  const camY = Math.max(0, Math.min(MH - vh, pos.y - Math.floor(vh / 2)));

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: C.dark, fontFamily: "'Courier New',monospace", color: C.white, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", width: "100%", maxWidth: "400px", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: C.earth + "DD", fontSize: "10px", flexWrap: "wrap", gap: "2px" }}>
        <span>{pEmoji} Nv.{lvl}</span>
        <span style={{ color: C.red }}>❤️{hp}/{maxHp}</span>
        <span>🎒{inv.length} 🃏{cards.length}</span>
        <span>🏆{bosses.length}/5</span>
        {otherPlayer && <span style={{ color: C.sun }}>👥 {otherPlayer.emoji}{otherPlayer.name}</span>}
        <button style={{ background: "none", border: "none", color: C.sun, fontSize: "13px", cursor: "pointer", padding: "2px" }} onClick={() => setMmap(!mmap)}>🗺️</button>
      </div>

      {/* XP BAR */}
      <div style={{ width: "100%", maxWidth: "400px", height: "4px", background: "#333" }}>
        <div style={{ width: `${(xp / (lvl * 50)) * 100}%`, height: "100%", background: C.sun, transition: "width 0.3s" }} />
      </div>

      {/* NOTIF */}
      {notif && <div style={{ position: "fixed", top: "52px", left: "50%", transform: "translateX(-50%)", background: C.sun, color: C.earth, padding: "6px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", zIndex: 50, border: `2px solid ${C.earth}`, whiteSpace: "nowrap" }}>{notif}</div>}

      {/* MINIMAP */}
      {mmap && <div style={{ position: "fixed", top: "54px", right: "4px", zIndex: 40, background: C.earth, border: `2px solid ${C.sun}`, borderRadius: "4px", padding: "3px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${MW},2.5px)`, gap: 0 }}>
          {world.m.map((row, y) => row.map((_, x) => {
            const isP = pos.x === x && pos.y === y;
            const isO = otherPlayer && Math.abs(otherPlayer.x - x) < 2 && Math.abs(otherPlayer.y - y) < 2;
            return <div key={`m${x}${y}`} style={{ width: 2.5, height: 2.5, background: isP ? C.sun : isO ? C.pink : TILES[world.m[y][x]]?.bg || C.gar }} />;
          }))}
        </div>
      </div>}

      {/* STORY */}
      {story && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "20px", borderRadius: "8px", maxWidth: "340px", border: `3px solid ${C.sun}`, maxHeight: "80vh", overflow: "auto" }}>
          <div style={{ fontSize: "13px", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: "14px" }}>{story}</div>
          <button style={PXB(C.olive)} onClick={() => setStory(null)}>Continuer →</button>
        </div>
      </div>}

      {/* DIALOG */}
      {dialog && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "18px", borderRadius: "8px", maxWidth: "320px", border: `3px solid ${C.red}`, textAlign: "center" }}>
          <div style={{ fontSize: "44px" }}>{dialog.guard?.e}</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", margin: "6px 0" }}>{dialog.guard?.n}</div>
          <div style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "10px" }}>&quot;{dialog.guard?.d}&quot;</div>
          <div style={{ fontSize: "11px", marginBottom: "12px" }}>❤️ {dialog.guard?.hp} PV</div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button style={PXB(C.red)} onClick={() => startCombat(dialog)}>💎 Combattre</button>
            <button style={PXB(C.stone)} onClick={() => setDialog(null)}>🏃 Fuir</button>
          </div>
        </div>
      </div>}

      {/* COMBAT (Match-3) */}
      {combat && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "12px", borderRadius: "8px", maxWidth: "360px", width: "100%", border: `3px solid ${C.red}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold" }}>{pEmoji} {pName}</div>
              <div style={{ width: "100%", height: "10px", background: "#ddd", borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.earth}` }}>
                <div style={{ width: `${(combat.playerHp / maxHp) * 100}%`, height: "100%", background: C.olive, transition: "width 0.3s" }} />
              </div>
              <span>{combat.playerHp}/{maxHp}</span>
            </div>
            <div style={{ fontSize: "18px", padding: "0 8px", alignSelf: "center" }}>⚔️</div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontWeight: "bold" }}>{combat.enemy.e} {combat.enemy.n}</div>
              <div style={{ width: "100%", height: "10px", background: "#ddd", borderRadius: "4px", overflow: "hidden", border: `1px solid ${C.earth}` }}>
                <div style={{ width: `${Math.max(0, (combat.enemyHp / combat.enemyMaxHp) * 100)}%`, height: "100%", background: C.red, transition: "width 0.3s" }} />
              </div>
              <span>{Math.max(0, combat.enemyHp)}/{combat.enemyMaxHp}</span>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: combat.won ? C.green : combat.lost ? C.red : C.earth, minHeight: "18px" }}>{combat.msg}</div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(6,1fr)`, gap: "3px", maxWidth: "280px", margin: "0 auto", padding: "6px", background: C.dark, borderRadius: "6px", border: `2px solid ${C.earth}` }}>
            {combat.grid.map((row, y) => row.map((gem, x) => {
              const sel = combat.sel && combat.sel.x === x && combat.sel.y === y;
              const g = GEMS[gem] || GEMS[0];
              return <div key={`${x}${y}`}
                onClick={() => selectGem(x, y)}
                style={{
                  width: "100%", aspectRatio: "1", background: g.color + "33",
                  borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", cursor: "pointer",
                  border: sel ? `3px solid ${C.sun}` : `2px solid ${g.color}55`,
                  boxShadow: sel ? `0 0 8px ${C.sun}` : "none",
                  transform: sel ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.15s",
                }}>{g.emoji}</div>;
            }))}
          </div>

          {cards.length > 0 && !combat.won && !combat.lost && <div style={{ fontSize: "10px", color: C.earth, textAlign: "center", marginTop: "6px", opacity: 0.7 }}>
            🃏 Cartes actives : {cards.map((c) => c.e).join(" ")} (bonus auto)
          </div>}

          {!combat.won && !combat.lost && inv.includes("potion") && <button style={{ ...PXB(C.lav, C.white, true), width: "100%", marginTop: "6px", textAlign: "center" }} onClick={() => {
            const i = inv.indexOf("potion");
            if (i >= 0) {
              setInv((p) => { const n = [...p]; n.splice(i, 1); return n; });
              setCombat((p) => p ? { ...p, playerHp: Math.min(maxHp, p.playerHp + 8), msg: "🧪 +8 PV !" } : p);
              setHp((h) => Math.min(maxHp, h + 8));
            }
          }}>🧪 Utiliser Potion (+8 PV)</button>}

          {(combat.won || combat.lost) && <button style={{ ...PXB(combat.won ? C.olive : C.stone), width: "100%", marginTop: "8px", textAlign: "center" }} onClick={endCombat}>
            {combat.won ? "🎉 Victoire ! Continuer" : "😤 Retenter plus tard"}
          </button>}
        </div>
      </div>}

      {/* SHOP */}
      {shop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "16px", borderRadius: "8px", maxWidth: "320px", width: "100%", border: `3px solid ${C.honey}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: "bold" }}>🏘️ {shop.name}</span>
            <button style={PXB(C.stone, C.white, true)} onClick={() => setShop(null)}>✕</button>
          </div>
          <div style={{ fontSize: "11px", marginBottom: "10px", color: C.earth, opacity: 0.7 }}>Échangez vos ressources contre des provisions !</div>
          {shop.items.map((item, i) => {
            const res = RES[item.sell];
            const canBuy = item.cost.every((c) => inv.includes(c));
            return <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", background: C.white, borderRadius: "4px", marginBottom: "6px", border: `1px solid ${C.stone}` }}>
              <div>
                <span style={{ fontSize: "16px" }}>{res.e}</span> <strong style={{ fontSize: "12px" }}>{res.n}</strong>
                <div style={{ fontSize: "10px", color: C.earth, opacity: 0.6 }}>Coût : {item.cost.map((c) => RES[c].e).join(" + ")}</div>
              </div>
              <button style={PXB(canBuy ? C.olive : C.stone, C.white, true)} onClick={() => canBuy && buyItem(item)}>Troquer</button>
            </div>;
          })}
          <div style={{ fontSize: "11px", textAlign: "center", marginTop: "6px" }}><em>Le pain redonne 4 PV, la potion 10 PV</em></div>
        </div>
      </div>}

      {/* CRAFT */}
      {craft && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8px", overflow: "auto" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "14px", borderRadius: "8px", maxWidth: "360px", width: "100%", border: `3px solid ${C.honey}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: "bold" }}>🏺 Atelier</span>
            <button style={PXB(C.stone, C.white, true)} onClick={() => { setCraft(false); setCraftSlots([]); setCraftMsg(""); }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: "48px", height: "48px", border: `2px dashed ${C.earth}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", background: craftSlots[i] ? RES[craftSlots[i].id]?.c + "33" : C.white, cursor: "pointer" }} onClick={() => { if (craftSlots[i]) setCraftSlots((p) => p.filter((_, j) => j !== i)); }}>
              {craftSlots[i] ? RES[craftSlots[i].id]?.e : "?"}
            </div>)}
            <button style={PXB(craftSlots.length >= 2 ? C.sun : C.stone, C.earth, true)} onClick={() => craftSlots.length >= 2 && doCraft()}>⚒️</button>
          </div>

          {craftMsg && <div style={{ fontSize: "12px", fontWeight: "bold", color: craftMsg[0] === "✨" ? C.green : C.red, marginBottom: "8px", textAlign: "center" }}>{craftMsg}</div>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxHeight: "100px", overflow: "auto" }}>
            {inv.map((id, i) => {
              const used = craftSlots.find((s) => s.idx === i);
              return <button key={i} onClick={() => !used && addSlot(id, i)} style={{ background: used ? "#ccc" : RES[id]?.c + "22", border: `2px solid ${RES[id]?.c || "#888"}`, borderRadius: "4px", padding: "3px", fontSize: "16px", cursor: used ? "default" : "pointer", opacity: used ? 0.3 : 1, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {RES[id]?.e}
              </button>;
            })}
          </div>

          <div style={{ marginTop: "8px", fontSize: "9px", color: C.earth, opacity: 0.6, lineHeight: 1.5 }}>
            <strong>Outils :</strong> 🪵🪵→🥖 · 🪨🪵→⛏️ · 🐚🌿→🕸️ · ⚙️🪵→🔪 · 💎🟠🫧→🗝️<br />
            <strong>Cartes :</strong> 💜🌿→🌫️ · 🪨🧂→🛡️ · 🟠💎→✨ · 🐟🧂→🍽️ · 🫧🪸→🌊 · ⚙️🪨→💥
          </div>
        </div>
      </div>}

      {/* BAG */}
      {bag && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "14px", borderRadius: "8px", maxWidth: "340px", width: "100%", border: `3px solid ${C.olive}`, maxHeight: "80vh", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: "bold" }}>🎒 Inventaire</span>
            <button style={PXB(C.stone, C.white, true)} onClick={() => setBag(false)}>✕</button>
          </div>
          <div style={{ fontSize: "12px", marginBottom: "6px" }}>❤️ {hp}/{maxHp} · ⭐ Nv.{lvl} · XP {xp}/{lvl * 50}</div>
          {tools.length > 0 && <div style={{ marginBottom: "6px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>🔧 Outils</div>{tools.map((t) => <div key={t} style={{ fontSize: "11px" }}>{TOOLS[t].e} {TOOLS[t].n}</div>)}</div>}
          {cards.length > 0 && <div style={{ marginBottom: "6px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>🃏 Cartes</div>{cards.map((c, i) => <div key={i} style={{ fontSize: "11px" }}>{c.e} {c.n} — {c.d}</div>)}</div>}
          <div style={{ fontSize: "11px", fontWeight: "bold" }}>📦 Ressources ({inv.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "4px" }}>{inv.map((id, i) => <span key={i} style={{ fontSize: "14px" }}>{RES[id]?.e}</span>)}</div>
          <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "bold" }}>⛰️ Zones</div>
          {Object.entries({ garrigue: "🌿 Garrigue", calanques: "🏖️ Calanques", mines: "⛏️ Mines", mer: "🌊 Mer", restanques: "⛰️ Restanques" }).map(([id, n]) =>
            <div key={id} style={{ fontSize: "11px", opacity: unlocked.includes(id) ? 1 : 0.3 }}>{n} {unlocked.includes(id) ? "✅" : "🔒"}{bosses.includes(id) ? " 🏆" : ""}</div>
          )}
          {(inv.includes("potion") || inv.includes("pain")) && <button style={{ ...PXB(C.lav, C.white, true), width: "100%", marginTop: "8px", textAlign: "center" }} onClick={() => { usePotion(); setBag(false); }}>
            {inv.includes("potion") ? "🧪 Potion (+10PV)" : "🥖 Pain (+5PV)"}
          </button>}
        </div>
      </div>}

      {/* QUESTS */}
      {questPanel && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
        <div style={{ background: C.bg, color: C.earth, padding: "14px", borderRadius: "8px", maxWidth: "340px", width: "100%", border: `3px solid ${C.sun}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: "bold" }}>📋 Quêtes</span>
            <button style={PXB(C.stone, C.white, true)} onClick={() => setQuestPanel(false)}>✕</button>
          </div>
          {quests.map((q, i) => <div key={i} style={{ padding: "6px", background: q.done ? C.olive + "22" : C.white, borderRadius: "4px", marginBottom: "4px", border: `1px solid ${q.done ? C.olive : C.stone}`, fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{q.done ? "✅" : "⬜"} {q.t}</span>
            <span style={{ fontSize: "10px", color: C.sun }}>+{q.xp}XP</span>
          </div>)}
        </div>
      </div>}

      {/* ── MAP ── */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${vw},${CELL}px)`, gap: 0, border: `2px solid ${C.earth}`, margin: "2px 0", borderRadius: "2px" }}>
        {Array.from({ length: vh }, (_, vy) => Array.from({ length: vw }, (_, vx) => {
          const wx = camX + vx, wy = camY + vy;
          const tile = world.m[wy]?.[wx] || "g";
          const tt = TILES[tile] || TILES.g;
          const isP = pos.x === wx && pos.y === wy;
          const isOther = otherPlayer && otherPlayer.x === wx && otherPlayer.y === wy;
          const node = world.nodes.find((n) => n.x === wx && n.y === wy && !n.done);
          const gate = world.gates.find((g) => g.x === wx && g.y === wy);
          const vil = world.villages.find((v) => wx >= v.x && wx <= v.x + 1 && wy >= v.y && wy <= v.y + 1);

          return <div key={`${vx}${vy}`} style={{
            width: CELL, height: CELL, background: tt.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isP || isOther ? "16px" : "13px", position: "relative",
            boxShadow: isP ? `inset 0 0 0 2px ${C.sun}` : isOther ? `inset 0 0 0 2px ${C.pink}` : "none",
          }} onClick={() => {
            const dx = wx - pos.x, dy = wy - pos.y;
            if (Math.abs(dx) + Math.abs(dy) === 1) tryMove(dx, dy);
          }}>
            {isP ? <span style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.6))", zIndex: 2 }}>{pEmoji}</span>
              : isOther ? <span style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.4))", opacity: 0.8 }}>{otherPlayer!.emoji}</span>
                : node ? <span>{node.guard ? (node.boss ? node.guard.e : "⚔️") : RES[node.res!]?.e}</span>
                  : gate ? <span style={{ fontSize: "15px" }}>🚪</span>
                    : vil ? null
                      : tt.c ? <span style={{ fontSize: "10px", opacity: 0.4 }}>{tt.c}</span>
                        : null}
          </div>;
        })).flat()}
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "100%", maxWidth: "400px", justifyContent: "space-between", padding: "4px 6px", marginTop: "2px" }}>
        {/* D-Pad */}
        <div style={{ display: "grid", gridTemplateAreas: `". u ." "l . r" ". d ."`, gap: "2px" }}>
          {([["u", 0, -1, "▲"], ["l", -1, 0, "◀"], ["r", 1, 0, "▶"], ["d", 0, 1, "▼"]] as [string, number, number, string][]).map(([a, dx, dy, ch]) =>
            <button key={a} style={{
              gridArea: a, width: "50px", height: "50px", borderRadius: "10px",
              background: C.olive, color: C.white, border: `2px solid ${C.earth}`,
              fontSize: "20px", fontWeight: "bold", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `1px 1px 0 ${C.earth}`,
            }}
              onMouseDown={() => holdMove(dx, dy)} onMouseUp={stopMove} onMouseLeave={stopMove}
              onTouchStart={(e) => { e.preventDefault(); holdMove(dx, dy); }} onTouchEnd={(e) => { e.preventDefault(); stopMove(); }}
            >{ch}</button>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", flex: 1, maxWidth: "200px" }}>
          <button style={{ ...PXB(C.honey, C.earth, true), textAlign: "center", padding: "10px 4px" }} onClick={() => { setCraftSlots([]); setCraftMsg(""); setCraft(true); }}>🏺 Craft</button>
          <button style={{ ...PXB(C.sea, C.white, true), textAlign: "center", padding: "10px 4px" }} onClick={() => setBag(true)}>🎒 Sac</button>
          <button style={{ ...PXB(C.sun, C.earth, true), textAlign: "center", padding: "10px 4px" }} onClick={() => setQuestPanel(true)}>📋 Quêtes</button>
          <button style={{ ...PXB(C.stone, C.white, true), textAlign: "center", padding: "10px 4px" }} onClick={newGame}>🔄 Nouveau</button>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>⛰️</div>
        <div>Chargement...</div>
      </div>
    </div>
  );
  return (
    <Suspense fallback={<div style={{ width: "100%", minHeight: "100vh", background: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#F4D03F" }}>Chargement...</div>}>
      <GameContent />
    </Suspense>
  );
}
