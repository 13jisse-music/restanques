"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { GEM_STYLES } from "../../lib/sprites";
import { sounds } from "../../lib/sounds";
import { spawnGemParticles, spawnDamageText, shakeScreen, damageFlash } from "../../lib/particles";
import { createGrid, findMatches, applyGravity } from "../../lib/match3";
import type { CombatCard } from "../../lib/constants";

interface Props {
  sessionId: string; playerId: string;
  pName: string; pEmoji: string; pColor: string;
  hp: number; maxHp: number; lvl: number;
  cards: CombatCard[];
  onClose: (won: boolean, xpGained: number) => void;
}

export function PvpArena({ sessionId, playerId, pName, pEmoji, pColor, hp, maxHp, lvl, cards, onClose }: Props) {
  const [grid, setGrid] = useState(() => createGrid());
  const [myHp, setMyHp] = useState(maxHp);
  const [theirHp, setTheirHp] = useState(20);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [oppName, setOppName] = useState("Adversaire");
  const [oppEmoji, setOppEmoji] = useState("👤");
  const [timeLeft, setTimeLeft] = useState(180); // 3 min
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Create or join PvP match
  useEffect(() => {
    async function initPvP() {
      // Check for waiting match in this session
      const { data: existing } = await supabase
        .from("pvp_matches")
        .select("*")
        .eq("session_id", sessionId)
        .eq("status", "waiting")
        .neq("player1_id", playerId)
        .limit(1)
        .single();

      if (existing) {
        // Join existing match
        await supabase.from("pvp_matches").update({
          player2_id: playerId, player2_hp: maxHp, status: "active"
        }).eq("id", existing.id);
        setMatchId(existing.id);
        setTheirHp(existing.player1_hp);
        setWaiting(false);
        sounds.playMusic("combat");
      } else {
        // Create new match
        const { data } = await supabase.from("pvp_matches").insert({
          session_id: sessionId, player1_id: playerId, player1_hp: maxHp
        }).select().single();
        if (data) {
          setMatchId(data.id);
          // Poll for opponent
          const poll = setInterval(async () => {
            const { data: match } = await supabase.from("pvp_matches")
              .select("*").eq("id", data.id).single();
            if (match?.status === "active") {
              setWaiting(false);
              setTheirHp(match.player2_hp || 20);
              sounds.playMusic("combat");
              clearInterval(poll);
            }
          }, 2000);
          return () => clearInterval(poll);
        }
      }
    }
    initPvP();
  }, [sessionId, playerId, maxHp]);

  // Timer
  useEffect(() => {
    if (waiting) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time's up — whoever has more HP wins
          const won = myHp >= theirHp;
          handleEnd(won);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [waiting, myHp, theirHp]);

  // Subscribe to opponent's moves via Realtime
  useEffect(() => {
    if (!matchId || waiting) return;
    const channel = supabase.channel(`pvp_${matchId}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "pvp_matches", filter: `id=eq.${matchId}` },
      (payload: { new: Record<string, unknown> }) => {
        const match = payload.new as { player1_hp: number; player2_hp: number; player1_id: string; status: string; winner: string };
        const isP1 = match.player1_id === playerId;
        const oppHp = isP1 ? match.player2_hp : match.player1_hp;
        // Don't update our own HP from the DB
        setTheirHp(oppHp);
        if (match.status === "finished") {
          handleEnd(match.winner === playerId);
        }
      }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, waiting, playerId]);

  const handleEnd = useCallback((won: boolean) => {
    clearInterval(timerRef.current);
    sounds.playMusic("garrigue");
    if (won) { sounds.combatVictory(); setMessage("🏆 Victoire ! +50 XP"); }
    else { sounds.combatDefeat(); setMessage("Défaite... +20 XP"); }
    setTimeout(() => onClose(won, won ? 50 : 20), 2500);
  }, [onClose]);

  // Process gem swap
  const selectGem = useCallback((r: number, c: number) => {
    if (waiting) return;
    if (!selected) { setSelected([r, c]); return; }
    const sr = selected[0], sc = selected[1];
    setSelected(null);
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) { setSelected([r, c]); return; }

    // Swap
    const ng = grid.map(row => [...row]);
    [ng[sr][sc], ng[r][c]] = [ng[r][c], ng[sr][sc]];

    let matches = findMatches(ng);
    if (matches.length === 0) return; // Invalid swap

    let totalDmg = 0; let combo = 0;
    const processChain = () => {
      matches = findMatches(ng);
      if (matches.length === 0) { setGrid(ng); sendDamage(totalDmg); return; }
      combo++;
      let dmg = matches.length;
      if (combo >= 3) dmg = Math.ceil(dmg * 2);
      else if (combo >= 2) dmg = Math.ceil(dmg * 1.5);
      totalDmg += dmg;
      sounds.gemMatch(combo);
      matches.forEach((m) => { ng[m.x][m.y] = -1; });
      applyGravity(ng);
      setTimeout(processChain, 250);
    };
    processChain();
  }, [selected, grid, waiting]);

  const sendDamage = useCallback(async (dmg: number) => {
    if (!matchId || dmg <= 0) return;
    // Update opponent HP in Supabase
    const { data: match } = await supabase.from("pvp_matches").select("*").eq("id", matchId).single();
    if (!match) return;
    const isP1 = match.player1_id === playerId;
    const field = isP1 ? "player2_hp" : "player1_hp";
    const newHp = Math.max(0, (match[field] as number) - dmg);
    await supabase.from("pvp_matches").update({ [field]: newHp }).eq("id", matchId);
    setTheirHp(newHp);
    if (newHp <= 0) {
      await supabase.from("pvp_matches").update({ status: "finished", winner: playerId }).eq("id", matchId);
      handleEnd(true);
    }
  }, [matchId, playerId, handleEnd]);

  // Use spell
  const useSpell = useCallback((card: CombatCard) => {
    if (usedCards.includes(card.n)) return;
    setUsedCards(p => [...p, card.n]);
    sounds.combatSpell();
    if (card.n === "Éclat") sendDamage(5);
    else if (card.n === "Brume") {
      const ng = grid.map(r => [...r]);
      const color = Math.floor(Math.random() * 6);
      ng.forEach((r, ri) => r.forEach((v, ci) => { if (v === color) ng[ri][ci] = -1; }));
      applyGravity(ng); setGrid(ng);
    }
    else if (card.n === "Séisme") { setGrid(createGrid()); }
  }, [usedCards, grid]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (waiting) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F4D03F" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚔️</div>
        <div style={{ fontSize: 18, fontFamily: "'Crimson Text',serif", marginBottom: 10 }}>En attente d&apos;un adversaire...</div>
        <div style={{ fontSize: 12, color: "#8B7355" }}>L&apos;autre joueur doit aussi entrer dans l&apos;arène</div>
        <button onClick={() => { if (matchId) supabase.from("pvp_matches").delete().eq("id", matchId); onClose(false, 0); }}
          style={{ marginTop: 30, padding: "10px 20px", background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div id="game-container" style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #1A0A00, #2D1F14)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 5px", overflow: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 360, marginBottom: 8 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg, ${pColor}, ${pColor}88)`, border: "3px solid #F4D03F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto" }}>{pEmoji}</div>
          <div style={{ fontSize: 11, color: "#F4D03F", fontWeight: "bold" }}>{pName} Nv.{lvl}</div>
          <div style={{ width: 80, height: 10, background: "#2D1F14", border: "1px solid #5C4033", borderRadius: 5, overflow: "hidden", margin: "2px auto" }}>
            <div style={{ width: `${(myHp / maxHp) * 100}%`, height: "100%", background: myHp > maxHp * 0.5 ? "linear-gradient(90deg, #4CAF50, #8BC34A)" : myHp > maxHp * 0.25 ? "linear-gradient(90deg, #FF9800, #FFC107)" : "linear-gradient(90deg, #F44336, #FF5722)", transition: "width 300ms" }} />
          </div>
          <div style={{ fontSize: 10, color: "#E8D5A3" }}>{myHp}/{maxHp}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24 }}>⚔️</span>
          <span style={{ fontSize: 12, color: "#F4D03F", fontWeight: "bold" }}>{mins}:{secs.toString().padStart(2, "0")}</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, #555, #333)", border: "3px solid #D94F4F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto" }}>{oppEmoji}</div>
          <div style={{ fontSize: 11, color: "#D94F4F", fontWeight: "bold" }}>{oppName}</div>
          <div style={{ width: 80, height: 10, background: "#2D1F14", border: "1px solid #5C4033", borderRadius: 5, overflow: "hidden", margin: "2px auto" }}>
            <div style={{ width: `${(theirHp / 20) * 100}%`, height: "100%", background: theirHp > 10 ? "linear-gradient(90deg, #4CAF50, #8BC34A)" : "linear-gradient(90deg, #F44336, #FF5722)", transition: "width 300ms" }} />
          </div>
          <div style={{ fontSize: 10, color: "#E8D5A3" }}>{theirHp}/20</div>
        </div>
      </div>

      {message && <div style={{ fontSize: 18, fontFamily: "'Crimson Text',serif", color: "#F4D03F", marginBottom: 8, textShadow: "0 0 8px rgba(244,208,63,0.5)" }}>{message}</div>}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 44px)", gap: 3, padding: 8, background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "3px solid #F4D03F" }}>
        {grid.map((row, r) => row.map((gem, c) => (
          <button key={`${r}-${c}`} onClick={() => selectGem(r, c)}
            className={selected && selected[0] === r && selected[1] === c ? "gem-selected" : ""}
            style={{
              width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
              background: gem >= 0 ? `radial-gradient(circle at 30% 30%, ${GEM_STYLES[gem]?.light || "#888"}, ${GEM_STYLES[gem]?.dark || "#444"})` : "transparent",
              boxShadow: gem >= 0 ? "inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.3)" : "none",
              position: "relative",
            }}>
            {gem >= 0 && <div style={{ position: "absolute", top: 4, left: 6, width: 12, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: "50%", transform: "rotate(-20deg)" }} />}
          </button>
        )))}
      </div>

      {/* Spells */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {cards.map((card, i) => {
          const used = usedCards.includes(card.n);
          return <button key={i} onClick={() => !used && useSpell(card)} style={{
            padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: "bold", cursor: used ? "default" : "pointer",
            background: used ? "#333" : "linear-gradient(135deg, #9B7EDE, #6B4EAE)",
            color: used ? "#666" : "#FFF", border: "2px solid " + (used ? "#444" : "#F4D03F"),
            opacity: used ? 0.5 : 1,
          }}>{card.e} {card.n}</button>;
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => { if (matchId) supabase.from("pvp_matches").update({ status: "finished", winner: "forfeit" }).eq("id", matchId); onClose(false, 10); }}
          style={{ padding: "8px 16px", background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
          🏃 Fuir
        </button>
      </div>
    </div>
  );
}
