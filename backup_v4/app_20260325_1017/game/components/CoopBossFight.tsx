"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { GEM_STYLES } from "../../lib/sprites";
import { sounds } from "../../lib/sounds";
import { createGrid, findMatches, applyGravity } from "../../lib/match3";
import type { CombatCard } from "../../lib/constants";

interface Props {
  sessionId: string; playerId: string; biome: string;
  bossName: string; bossEmoji: string; bossHp: number; bossAtk: number;
  pName: string; pEmoji: string; pColor: string;
  hp: number; maxHp: number; totalAtk: number; totalDef: number;
  cards: CombatCard[];
  onVictory: () => void;
  onDefeat: () => void;
}

export function CoopBossFight({
  sessionId, playerId, biome, bossName, bossEmoji, bossHp, bossAtk,
  pName, pEmoji, pColor, hp, maxHp, totalAtk, totalDef, cards, onVictory, onDefeat,
}: Props) {
  const [fightId, setFightId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isCoop, setIsCoop] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [currentBossHp, setCurrentBossHp] = useState(bossHp);
  const [bossMaxHp, setBossMaxHp] = useState(bossHp);
  const [myHp, setMyHp] = useState(hp);
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmoji, setPartnerEmoji] = useState("👤");
  const [grid, setGrid] = useState(() => createGrid());
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [msg, setMsg] = useState("En attente...");
  const [usedSpells, setUsedSpells] = useState<Set<string>>(new Set());
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [playerShaking, setPlayerShaking] = useState(false);
  const [finished, setFinished] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const countRef = useRef<ReturnType<typeof setInterval>>();

  // Create or find boss fight
  useEffect(() => {
    async function init() {
      // Check if there's already a waiting fight for this boss
      const { data: existing } = await supabase.from("boss_fights")
        .select("*").eq("session_id", sessionId).eq("biome", biome)
        .eq("status", "waiting").neq("player1_id", playerId).limit(1).single();

      if (existing) {
        // Join as player 2 — COOP!
        const coopHp = Math.ceil(bossHp * 1.5);
        await supabase.from("boss_fights").update({
          player2_id: playerId, boss_hp: coopHp, boss_max_hp: coopHp,
          status: "active", current_turn: existing.player1_id,
        }).eq("id", existing.id);
        setFightId(existing.id);
        setIsCoop(true);
        setCurrentBossHp(coopHp);
        setBossMaxHp(coopHp);
        setIsMyTurn(false); // Player 1 goes first
        setWaiting(false);
        setMsg("⚔️ Combat coop ! Tour de votre partenaire...");
        sounds.playMusic("boss");
        // Get partner name
        const { data: p1 } = await supabase.from("players").select("name, emoji").eq("id", existing.player1_id).single();
        if (p1) { setPartnerName(p1.name); setPartnerEmoji(p1.emoji); }
      } else {
        // Create new fight — wait for partner
        const { data } = await supabase.from("boss_fights").insert({
          session_id: sessionId, player1_id: playerId,
          boss_hp: bossHp, boss_max_hp: bossHp, biome,
        }).select().single();
        if (data) setFightId(data.id);
      }
    }
    init();

    return () => { clearInterval(pollRef.current); clearInterval(countRef.current); };
  }, [sessionId, playerId, biome, bossHp]);

  // Countdown while waiting
  useEffect(() => {
    if (!waiting || !fightId) return;
    countRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          // Timeout — go solo
          clearInterval(countRef.current);
          clearInterval(pollRef.current);
          supabase.from("boss_fights").update({ status: "active", current_turn: playerId }).eq("id", fightId);
          setWaiting(false);
          setIsMyTurn(true);
          setMsg("⚔️ Combat solo ! Votre tour.");
          sounds.playMusic("boss");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Poll for player 2
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from("boss_fights").select("*").eq("id", fightId).single();
      if (data?.status === "active") {
        clearInterval(pollRef.current);
        clearInterval(countRef.current);
        setIsCoop(true);
        setCurrentBossHp(data.boss_hp);
        setBossMaxHp(data.boss_max_hp);
        setIsMyTurn(data.current_turn === playerId);
        setWaiting(false);
        setMsg(data.current_turn === playerId ? "⚔️ Combat coop ! Votre tour." : "⚔️ Combat coop ! Tour du partenaire...");
        sounds.playMusic("boss");
        // Get partner info
        const partnerId = data.player2_id;
        if (partnerId) {
          const { data: p2 } = await supabase.from("players").select("name, emoji").eq("id", partnerId).single();
          if (p2) { setPartnerName(p2.name); setPartnerEmoji(p2.emoji); }
        }
      }
    }, 2000);

    return () => { clearInterval(pollRef.current); clearInterval(countRef.current); };
  }, [waiting, fightId, playerId]);

  // Listen for turn changes (Realtime)
  useEffect(() => {
    if (!fightId || waiting) return;
    const channel = supabase.channel(`boss_${fightId}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "boss_fights", filter: `id=eq.${fightId}` },
      (payload: { new: Record<string, unknown> }) => {
        const f = payload.new as { boss_hp: number; current_turn: string; status: string };
        setCurrentBossHp(f.boss_hp);
        if (f.status === "won") { setFinished(true); setMsg("🏆 VICTOIRE COOP !"); sounds.combatVictory(); setTimeout(onVictory, 2500); }
        else if (f.status === "lost") { setFinished(true); setMsg("💀 Défaite..."); sounds.combatDefeat(); setTimeout(onDefeat, 2500); }
        else if (f.current_turn === playerId) { setIsMyTurn(true); setMsg("🎯 Votre tour !"); }
        else { setIsMyTurn(false); setMsg("⏳ Tour du partenaire..."); }
      }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fightId, waiting, playerId, onVictory, onDefeat]);

  // Select gem + process match
  const selectGem = useCallback((x: number, y: number) => {
    if (!isMyTurn || finished) return;
    if (!selected) { setSelected({ x, y }); return; }
    if (Math.abs(selected.x - x) + Math.abs(selected.y - y) !== 1) { setSelected({ x, y }); return; }

    const ng = grid.map(r => [...r]);
    [ng[selected.y][selected.x], ng[y][x]] = [ng[y][x], ng[selected.y][selected.x]];
    setSelected(null);

    const matches = findMatches(ng);
    if (matches.length === 0) return;

    // Process matches
    let totalDmg = 0;
    const processChain = (g: number[][], combo: number) => {
      const m = findMatches(g);
      if (m.length === 0) {
        setGrid(g);
        if (totalDmg > 0) applyDamage(totalDmg);
        return;
      }
      const matchBonus = m.length <= 3 ? 0 : m.length === 4 ? 3 : 8;
      const comboMult = combo === 0 ? 1 : combo === 1 ? 1.5 : 2;
      totalDmg += Math.floor((totalAtk + matchBonus) * comboMult);
      sounds.gemMatch(combo);
      setEnemyShaking(true); setTimeout(() => setEnemyShaking(false), 400);
      m.forEach(({ x: mx, y: my }) => { g[my][mx] = -1; });
      const filled = applyGravity(g);
      setTimeout(() => processChain(filled, combo + 1), 300);
    };

    processChain(ng, 0);
  }, [selected, grid, isMyTurn, finished, totalAtk]);

  const applyDamage = useCallback(async (dmg: number) => {
    if (!fightId) return;
    const newHp = Math.max(0, currentBossHp - dmg);
    setCurrentBossHp(newHp);
    setMsg(`💥 -${dmg} au ${bossName} !`);

    if (newHp <= 0) {
      // Victory!
      await supabase.from("boss_fights").update({ boss_hp: 0, status: "won" }).eq("id", fightId);
      setFinished(true); setMsg("🏆 VICTOIRE !"); sounds.combatVictory();
      setTimeout(onVictory, 2500);
      return;
    }

    // Boss attacks current player
    const bossDmg = Math.max(1, bossAtk - totalDef);
    setMyHp(h => {
      const nh = h - bossDmg;
      if (nh <= 0) {
        supabase.from("boss_fights").update({ boss_hp: newHp, status: isCoop ? "active" : "lost", current_turn: isCoop ? "partner" : playerId }).eq("id", fightId);
        if (!isCoop) { setFinished(true); setTimeout(onDefeat, 2000); }
        else setMsg(`💀 KO ! Votre partenaire continue...`);
        return 0;
      }
      return nh;
    });

    setPlayerShaking(true); sounds.combatHit();
    setTimeout(() => setPlayerShaking(false), 400);

    // Pass turn to partner (or back to self if solo)
    if (isCoop) {
      await supabase.from("boss_fights").update({ boss_hp: newHp, current_turn: "swap" }).eq("id", fightId);
      setIsMyTurn(false);
      setMsg(`⏳ Tour du partenaire... (Boss -${dmg}, vous -${bossDmg})`);
    } else {
      await supabase.from("boss_fights").update({ boss_hp: newHp }).eq("id", fightId);
      setMsg(`Boss -${dmg} | Vous -${bossDmg} PV`);
    }
  }, [fightId, currentBossHp, bossAtk, totalDef, isCoop, playerId, onVictory, onDefeat, bossName]);

  const castSpell = (card: CombatCard) => {
    if (!isMyTurn || usedSpells.has(card.n)) return;
    setUsedSpells(s => new Set(s).add(card.n));
    sounds.combatSpell();
    if (card.n === "Éclat") applyDamage(totalAtk + 3);
    else if (card.n === "Festin") { setMyHp(h => Math.min(maxHp, h + 5)); setMsg("🍖 +5 PV !"); }
    else if (card.n === "Brume") {
      const ng = grid.map(r => [...r]); const c = Math.floor(Math.random() * 6);
      ng.forEach((r, ri) => r.forEach((v, ci) => { if (v === c) ng[ri][ci] = -1; }));
      setGrid(applyGravity(ng));
    }
    else if (card.n === "Séisme") setGrid(createGrid());
  };

  const hpPct = myHp / maxHp;
  const bossHpPct = bossMaxHp > 0 ? currentBossHp / bossMaxHp : 0;

  // Waiting screen
  if (waiting) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F4D03F" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{bossEmoji}</div>
      <div style={{ fontSize: 20, fontFamily: "'Crimson Text',serif", marginBottom: 8, textShadow: "0 0 8px rgba(244,208,63,0.5)" }}>{bossName}</div>
      <div style={{ fontSize: 14, color: "#E8D5A3", marginBottom: 16 }}>En attente d&apos;un partenaire... ({countdown}s)</div>
      <div style={{ width: 200, height: 4, background: "#333", borderRadius: 2 }}>
        <div style={{ width: `${(countdown / 30) * 100}%`, height: "100%", background: "#F4D03F", borderRadius: 2, transition: "width 1s" }} />
      </div>
      <div style={{ fontSize: 11, color: "#8B7355", marginTop: 12 }}>L&apos;autre joueur doit aussi entrer dans la forteresse</div>
      <button onClick={() => {
        clearInterval(pollRef.current); clearInterval(countRef.current);
        if (fightId) supabase.from("boss_fights").update({ status: "active", current_turn: playerId }).eq("id", fightId);
        setWaiting(false); setIsMyTurn(true); setMsg("⚔️ Combat solo !"); sounds.playMusic("boss");
      }} style={{ marginTop: 20, padding: "10px 24px", background: "#D94F4F", color: "#FFF", border: "2px solid #F4D03F", borderRadius: 10, fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
        ⚔️ Combattre seul
      </button>
    </div>
  );

  return (
    <div id="game-container" className={playerShaking ? "screen-shake" : ""} style={{
      position: "fixed", inset: 0, background: "linear-gradient(180deg, #2D0A0A, #1A0A00)", zIndex: 200,
      display: "flex", flexDirection: "column", alignItems: "center", padding: 10, overflow: "auto",
    }}>
      {/* Header — players vs boss */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, marginBottom: 8, alignItems: "center" }}>
        {/* Player */}
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${pColor}, ${pColor}88)`, border: "3px solid #F4D03F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto" }}>{pEmoji}</div>
          <div style={{ fontSize: 10, color: "#F4D03F", fontWeight: "bold" }}>{pName}</div>
          <div style={{ width: 70, height: 8, background: "#2D1F14", border: "1px solid #5C4033", borderRadius: 4, overflow: "hidden", margin: "2px auto" }}>
            <div style={{ width: `${hpPct * 100}%`, height: "100%", background: hpPct > 0.5 ? "#4CAF50" : hpPct > 0.25 ? "#FF9800" : "#F44336", transition: "width 300ms" }} />
          </div>
          <div style={{ fontSize: 9, color: "#E8D5A3" }}>❤️{myHp}/{maxHp}</div>
          {isMyTurn && !finished && <div style={{ fontSize: 9, color: "#7A9E3F", fontWeight: "bold" }}>🎯 Votre tour</div>}
        </div>

        {isCoop && <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#555", border: "2px solid #F4D03F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, margin: "0 auto" }}>{partnerEmoji}</div>
          <div style={{ fontSize: 9, color: "#F4D03F" }}>{partnerName}</div>
          {!isMyTurn && !finished && <div style={{ fontSize: 9, color: "#7A9E3F" }}>🎯</div>}
        </div>}

        <div style={{ fontSize: 14, color: "#F4D03F" }}>VS</div>

        {/* Boss */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto",
            background: "linear-gradient(135deg, #4A0000, #2D0000)",
            border: "3px solid #FF4444", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, animation: enemyShaking ? "screenShake 0.3s" : "none",
            boxShadow: "0 0 16px rgba(255,0,0,0.4)",
          }}>{bossEmoji}</div>
          <div style={{ fontSize: 11, color: "#FF4444", fontWeight: "bold" }}>{bossName}</div>
          <div style={{ width: 90, height: 10, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 5, overflow: "hidden", margin: "3px auto" }}>
            <div style={{ width: `${bossHpPct * 100}%`, height: "100%", background: bossHpPct > 0.5 ? "#4CAF50" : "#F44336", transition: "width 300ms" }} />
          </div>
          <div style={{ fontSize: 9, color: "#E8D5A3" }}>❤️{currentBossHp}/{bossMaxHp}</div>
          {isCoop && <div style={{ fontSize: 8, color: "#FF9800" }}>HP ×1.5 (coop)</div>}
        </div>
      </div>

      {/* Message */}
      <div style={{ fontSize: 13, fontWeight: "bold", color: finished ? (currentBossHp <= 0 ? "#7A9E3F" : "#FF4444") : "#F4D03F", textAlign: "center", marginBottom: 6, fontFamily: "'Crimson Text',serif" }}>{msg}</div>

      {/* Grid */}
      {!finished && <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 44px)", gap: 3, padding: 8, background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "3px solid #FF4444", opacity: isMyTurn ? 1 : 0.5 }}>
        {grid.map((row, gy) => row.map((gem, gx) => {
          const sel = selected && selected.x === gx && selected.y === gy;
          const gs = GEM_STYLES[gem] || GEM_STYLES[0];
          return <div key={`${gx}${gy}`} onClick={() => selectGem(gx, gy)}
            className={sel ? "gem-selected" : ""}
            style={{
              width: 44, height: 44, borderRadius: 10, cursor: isMyTurn ? "pointer" : "default",
              background: `radial-gradient(circle at 30% 30%, ${gs.light}, ${gs.dark})`,
              boxShadow: sel ? `0 0 12px ${gs.glow}` : "inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.3)",
              transform: sel ? "scale(1.15)" : "scale(1)", transition: "all 0.15s",
              border: sel ? "3px solid #F4D03F" : "2px solid rgba(0,0,0,0.2)",
              position: "relative",
            }}>
            <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "20%", background: "rgba(255,255,255,0.3)", borderRadius: "50%", transform: "rotate(-20deg)" }} />
          </div>;
        }))}
      </div>}

      {/* Spells */}
      {!finished && isMyTurn && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {cards.slice(0, 3).map((card, i) => {
          const used = usedSpells.has(card.n);
          return <button key={i} disabled={used} onClick={() => castSpell(card)} style={{
            padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: "bold",
            background: used ? "#333" : `linear-gradient(135deg, ${card.color}, ${card.color}CC)`,
            color: "#FFF", border: `2px solid ${used ? "#444" : "#F4D03F"}`,
            cursor: used ? "default" : "pointer", opacity: used ? 0.4 : 1,
          }}>{card.e} {card.n}</button>;
        })}
      </div>}

      {/* Victory/Defeat */}
      {finished && <div style={{ marginTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>{currentBossHp <= 0 ? "🏆" : "💀"}</div>
        <div style={{ fontSize: 20, fontFamily: "'Crimson Text',serif", color: currentBossHp <= 0 ? "#F4D03F" : "#FF4444" }}>
          {currentBossHp <= 0 ? (isCoop ? "Victoire coopérative !" : "Victoire !") : "Défaite..."}
        </div>
      </div>}
    </div>
  );
}
