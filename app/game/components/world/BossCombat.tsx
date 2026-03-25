"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── TYPES ───
const BCOLS = 6;
const BROWS = 7;

type Grid = number[][]; // -1=empty, 0-5=gem colors

const GEM_COLORS = [
  { light: "#C4A0FF", dark: "#6B4EAE" },
  { light: "#A0D860", dark: "#4A6E1F" },
  { light: "#FF7070", dark: "#A92F2F" },
  { light: "#70B0FF", dark: "#2A60A9" },
  { light: "#FFE070", dark: "#C4A01F" },
  { light: "#FFB050", dark: "#B64E02" },
];

interface BossAbility {
  name: string;
  emoji: string;
  effect: string;
}

interface BossCombatProps {
  boss: {
    name: string;
    emoji: string;
    hp: number;
    atk: number;
    level: number;
    biome: string;
    ability: BossAbility;
  };
  playerName: string;
  playerEmoji: string;
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  timeOfDay: number;
  spells: { id: string; name: string; emoji: string; effect: string }[];
  potionCount: number;
  onVictory: (xpGained: number, sousGained: number, drops: string[]) => void;
  onDefeat: () => void;
  onUsePotion: () => void;
  onCastSpell: (spellId: string) => void;
}

// ─── MATCH-3 PURE LOGIC ───
function createGrid(): Grid {
  const grid: Grid = [];
  for (let r = 0; r < BROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < BCOLS; c++) {
      let color: number;
      do {
        color = Math.floor(Math.random() * 6);
      } while (
        (c >= 2 && row[c - 1] === color && row[c - 2] === color) ||
        (r >= 2 && grid[r - 1]?.[c] === color && grid[r - 2]?.[c] === color)
      );
      row.push(color);
    }
    grid.push(row);
  }
  return grid;
}

function findMatches3(grid: Grid): [number, number][] {
  const matched = new Set<string>();

  // Horizontal
  for (let r = 0; r < BROWS; r++) {
    for (let c = 0; c <= BCOLS - 3; c++) {
      if (grid[r][c] >= 0 && grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) {
        let end = c + 2;
        while (end + 1 < BCOLS && grid[r][end + 1] === grid[r][c]) end++;
        for (let i = c; i <= end; i++) matched.add(`${r},${i}`);
      }
    }
  }
  // Vertical
  for (let c = 0; c < BCOLS; c++) {
    for (let r = 0; r <= BROWS - 3; r++) {
      if (grid[r][c] >= 0 && grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) {
        let end = r + 2;
        while (end + 1 < BROWS && grid[end + 1][c] === grid[r][c]) end++;
        for (let i = r; i <= end; i++) matched.add(`${i},${c}`);
      }
    }
  }

  return [...matched].map(s => {
    const [r, c] = s.split(",").map(Number);
    return [r, c] as [number, number];
  });
}

function removeAndFill(grid: Grid, positions: [number, number][]): Grid {
  const g = grid.map(r => [...r]);
  // Remove
  for (const [r, c] of positions) g[r][c] = -1;
  // Gravity
  for (let c = 0; c < BCOLS; c++) {
    let writeRow = BROWS - 1;
    for (let r = BROWS - 1; r >= 0; r--) {
      if (g[r][c] >= 0) {
        if (r !== writeRow) { g[writeRow][c] = g[r][c]; g[r][c] = -1; }
        writeRow--;
      }
    }
    // Fill from top
    for (let r = writeRow; r >= 0; r--) {
      g[r][c] = Math.floor(Math.random() * 6);
    }
  }
  return g;
}

function swap(grid: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const g = grid.map(r => [...r]);
  const tmp = g[r1][c1];
  g[r1][c1] = g[r2][c2];
  g[r2][c2] = tmp;
  return g;
}

function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

// ─── BOSS AI ───
function bossAI(grid: Grid): [number, number, number, number] | null {
  // Find a swap that creates a match
  for (let r = 0; r < BROWS; r++) {
    for (let c = 0; c < BCOLS; c++) {
      // Try swapping right
      if (c + 1 < BCOLS) {
        const test = swap(grid, r, c, r, c + 1);
        if (findMatches3(test).length > 0) return [r, c, r, c + 1];
      }
      // Try swapping down
      if (r + 1 < BROWS) {
        const test = swap(grid, r, c, r + 1, c);
        if (findMatches3(test).length > 0) return [r, c, r + 1, c];
      }
    }
  }
  // Random swap if no match found (shuffle effect)
  const r = Math.floor(Math.random() * BROWS);
  const c = Math.floor(Math.random() * (BCOLS - 1));
  return [r, c, r, c + 1];
}

// ─── COMPONENT ───
export function BossCombat({
  boss, playerName, playerEmoji, playerHp: initHp, playerMaxHp,
  playerAtk, playerDef, timeOfDay,
  spells, potionCount,
  onVictory, onDefeat, onUsePotion, onCastSpell,
}: BossCombatProps) {
  const [playerGrid, setPlayerGrid] = useState<Grid>(createGrid);
  const [bossGrid, setBossGrid] = useState<Grid>(createGrid);
  const [playerHp, setPlayerHp] = useState(initHp);
  const [bossHp, setBossHp] = useState(boss.hp);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [comboText, setComboText] = useState("");
  const [damageText, setDamageText] = useState("");
  const [receivedText, setReceivedText] = useState("");
  const [bossAbilityText, setBossAbilityText] = useState("");
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [usedSpells, setUsedSpells] = useState<Set<string>>(new Set());
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [bossMatchedCells, setBossMatchedCells] = useState<Set<string>>(new Set());
  const [abilityTimer, setAbilityTimer] = useState(15); // seconds until boss ability

  const bossTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abilityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── PROCESS PLAYER MATCHES ───
  const processPlayerGrid = useCallback((grid: Grid): Grid => {
    let g = grid;
    let chainLevel = 0;
    let totalDmg = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const matches = findMatches3(g);
      if (matches.length === 0) break;
      chainLevel++;

      setMatchedCells(new Set(matches.map(([r, c]) => `${r},${c}`)));

      // Damage calculation
      let matchDmg = playerAtk;
      if (matches.length >= 5) matchDmg += 8;
      else if (matches.length >= 4) matchDmg += 3;
      if (chainLevel >= 3) matchDmg = Math.ceil(matchDmg * 2.0);
      else if (chainLevel >= 2) matchDmg = Math.ceil(matchDmg * 1.5);

      totalDmg += matchDmg;
      g = removeAndFill(g, matches);
    }

    if (totalDmg > 0) {
      setBossHp(h => Math.max(0, h - totalDmg));
      setDamageText(`+${totalDmg} 💥`);
      if (chainLevel >= 2) setComboText(`COMBO ×${chainLevel} !`);
      setTimeout(() => { setDamageText(""); setComboText(""); setMatchedCells(new Set()); }, 800);
    }

    return g;
  }, [playerAtk]);

  // ─── PLAYER TAP GEM ───
  const handleGemTap = (r: number, c: number) => {
    if (victory || defeat) return;
    if (selected === null) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    setSelected(null);
    if (!isAdjacent(r, c, sr, sc)) {
      setSelected([r, c]);
      return;
    }
    // Swap
    let g = swap(playerGrid, sr, sc, r, c);
    const matches = findMatches3(g);
    if (matches.length === 0) {
      // Invalid swap - revert
      return;
    }
    g = processPlayerGrid(g);
    setPlayerGrid(g);
  };

  // ─── BOSS AI TURN ───
  const bossTurn = useCallback(() => {
    if (victory || defeat) return;

    const move = bossAI(bossGrid);
    if (!move) return;
    const [r1, c1, r2, c2] = move;
    let g = swap(bossGrid, r1, c1, r2, c2);
    let chainLevel = 0;
    let totalDmg = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const matches = findMatches3(g);
      if (matches.length === 0) break;
      chainLevel++;
      setBossMatchedCells(new Set(matches.map(([r, c]) => `${r},${c}`)));

      let dmg = Math.max(1, boss.atk - playerDef);
      if (chainLevel >= 2) dmg = Math.ceil(dmg * 1.5);
      totalDmg += dmg;

      g = removeAndFill(g, matches);
    }

    if (totalDmg > 0) {
      setPlayerHp(h => Math.max(0, h - totalDmg));
      setReceivedText(`-${totalDmg} ❤️`);
      setShaking(true);
      setTimeout(() => { setReceivedText(""); setShaking(false); setBossMatchedCells(new Set()); }, 800);
    }

    setBossGrid(g);
  }, [bossGrid, boss.atk, playerDef, victory, defeat]);

  // ─── BOSS ABILITY ───
  const triggerBossAbility = useCallback(() => {
    if (victory || defeat) return;
    setBossAbilityText(`${boss.ability.emoji} ${boss.ability.name} !`);

    // Apply ability effect
    switch (boss.biome) {
      case "garrigue": // Charge: double damage next attack
        setPlayerHp(h => Math.max(0, h - Math.ceil(boss.atk * 0.5)));
        break;
      case "calanques": // Cri: shuffle 2 columns
        setPlayerGrid(g => {
          const ng = g.map(r => [...r]);
          const c1 = Math.floor(Math.random() * BCOLS);
          let c2 = c1;
          while (c2 === c1) c2 = Math.floor(Math.random() * BCOLS);
          for (let r = 0; r < BROWS; r++) {
            const tmp = ng[r][c1]; ng[r][c1] = ng[r][c2]; ng[r][c2] = tmp;
          }
          return ng;
        });
        break;
      case "mines": // Carapace: displayed message only (reduced damage handled elsewhere)
        break;
      case "mer": // Encre: visual effect only
        break;
      case "restanques": // Tempete: shuffle entire grid + direct damage
        setPlayerGrid(createGrid);
        setPlayerHp(h => Math.max(0, h - Math.ceil(boss.atk * 0.3)));
        break;
    }

    setTimeout(() => setBossAbilityText(""), 2000);
    setAbilityTimer(15);
  }, [boss, victory, defeat]);

  // ─── BOSS TIMER (2s interval) ───
  useEffect(() => {
    bossTimerRef.current = setInterval(bossTurn, 2000);
    return () => { if (bossTimerRef.current) clearInterval(bossTimerRef.current); };
  }, [bossTurn]);

  // ─── ABILITY COUNTDOWN ───
  useEffect(() => {
    abilityTimerRef.current = setInterval(() => {
      setAbilityTimer(t => {
        if (t <= 1) {
          triggerBossAbility();
          return 15;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (abilityTimerRef.current) clearInterval(abilityTimerRef.current); };
  }, [triggerBossAbility]);

  // ─── CHECK WIN/LOSE ───
  useEffect(() => {
    if (bossHp <= 0 && !victory) {
      setVictory(true);
      const xpGain = boss.level * 20;
      const sousGain = boss.biome === "garrigue" ? 50 : boss.biome === "calanques" ? 100 : boss.biome === "mines" ? 200 : boss.biome === "mer" ? 300 : 500;
      const drops = [`trophee_${boss.biome}`, `outil_${boss.biome}`];
      setTimeout(() => onVictory(xpGain, sousGain, drops), 2000);
    }
    if (playerHp <= 0 && !defeat) {
      setDefeat(true);
      setTimeout(onDefeat, 1500);
    }
  }, [bossHp, playerHp, victory, defeat]);

  // ─── RENDERING ───
  const W = typeof window !== "undefined" ? window.innerWidth : 360;
  const gemSize = Math.floor(Math.min(44, (W * 0.45) / BCOLS));

  const renderGem = (color: number, size: number, isSelected = false, isMatched = false) => {
    if (color < 0) return <div style={{ width: size, height: size }} />;
    const gc = GEM_COLORS[color];
    return (
      <div className={isMatched ? "gem-matched" : isSelected ? "gem-selected" : ""} style={{
        width: size, height: size, borderRadius: size * 0.2,
        background: `radial-gradient(circle at 30% 30%, ${gc.light}, ${gc.dark})`,
        boxShadow: isSelected
          ? `0 0 12px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.3)`
          : `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`,
        border: isSelected ? "2px solid #FFD700" : "1px solid rgba(0,0,0,0.2)",
        cursor: "pointer",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: "35%", height: "25%", borderRadius: "50%",
          background: "rgba(255,255,255,0.4)",
        }} />
      </div>
    );
  };

  const hpBar = (current: number, max: number, width: number) => {
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? "#4CAF50" : pct > 0.25 ? "#FF9800" : "#F44336";
    return (
      <div style={{ width, height: 12, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color, transition: "width 300ms" }} />
      </div>
    );
  };

  if (victory) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="panel-opening" style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #DAA520", borderRadius: 16, padding: 24, textAlign: "center", maxWidth: 340 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#DAA520" }}>BOSS VAINCU !</div>
          <div style={{ fontSize: 16, color: "#3D2B1F", marginTop: 8 }}>{boss.emoji} {boss.name}</div>
        </div>
      </div>
    );
  }

  if (defeat) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(180,0,0,0.9)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFF" }}>
          <div style={{ fontSize: 64 }}>💀</div>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>K.O.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={shaking ? "screen-shake" : ""} style={{
      position: "fixed", inset: 0, background: "#0A0005", zIndex: 200,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, color: "#FFF" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #4A6E1F, #2D4A0F)", border: "3px solid #F4D03F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto" }}>{playerEmoji}</div>
          <div style={{ fontSize: 10, fontWeight: "bold" }}>{playerName}</div>
          {hpBar(playerHp, playerMaxHp, 80)}
          <div style={{ fontSize: 9 }}>❤️{playerHp}/{playerMaxHp}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#FFD700" }}>BOSS Nv.{boss.level}</div>
          <div style={{ fontSize: 24 }}>⚔️</div>
          <div style={{ fontSize: 9, color: "#D94F4F" }}>Pouvoir: {abilityTimer}s</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #6A0000, #2D0A0A)", border: "3px solid #D94F4F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto", animation: "healthPulse 1s infinite alternate", boxShadow: "0 0 20px rgba(220,50,50,0.4)" }}>{boss.emoji}</div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#D94F4F" }}>{boss.name}</div>
          {hpBar(bossHp, boss.hp, 90)}
          <div style={{ fontSize: 9 }}>❤️{Math.max(0, bossHp)}/{boss.hp}</div>
        </div>
      </div>

      {/* Boss ability alert */}
      {bossAbilityText && <div style={{
        textAlign: "center", fontSize: 18, fontWeight: "bold", color: "#FF4444",
        padding: 8, background: "rgba(220,50,50,0.2)", margin: "0 8px", borderRadius: 8,
        textShadow: "0 0 12px rgba(255,0,0,0.6)",
      }}>{bossAbilityText}</div>}

      {/* Damage overlays */}
      {damageText && <div style={{ position: "absolute", top: 90, right: 30, fontSize: 22, fontWeight: "bold", color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.8)", zIndex: 10 }}>{damageText}</div>}
      {receivedText && <div style={{ position: "absolute", top: 90, left: 30, fontSize: 22, fontWeight: "bold", color: "#FF4444", textShadow: "0 0 8px rgba(255,0,0,0.8)", zIndex: 10 }}>{receivedText}</div>}
      {comboText && <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)", fontSize: 30, fontWeight: "bold", color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.8)", zIndex: 10 }}>{comboText}</div>}

      {/* Two grids side by side */}
      <div style={{ flex: 1, display: "flex", gap: 8, padding: "4px 8px", justifyContent: "center" }}>
        {/* Player grid */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#AAA", marginBottom: 2 }}>Ma grille</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${BCOLS}, ${gemSize}px)`,
            gridTemplateRows: `repeat(${BROWS}, ${gemSize}px)`,
            gap: 2, background: "#1A0A00", border: "2px solid #DAA520", borderRadius: 6, padding: 3,
          }}>
            {playerGrid.map((row, r) =>
              row.map((color, c) => (
                <div key={`p${r}-${c}`} onClick={() => handleGemTap(r, c)}>
                  {renderGem(color, gemSize, selected?.[0] === r && selected?.[1] === c, matchedCells.has(`${r},${c}`))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Boss grid */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#D94F4F", marginBottom: 2 }}>Boss</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${BCOLS}, ${gemSize}px)`,
            gridTemplateRows: `repeat(${BROWS}, ${gemSize}px)`,
            gap: 2, background: "#0A0000", border: "2px solid #D94F4F", borderRadius: 6, padding: 3,
            opacity: 0.8,
          }}>
            {bossGrid.map((row, r) =>
              row.map((color, c) => (
                <div key={`b${r}-${c}`}>
                  {renderGem(color, gemSize, false, bossMatchedCells.has(`${r},${c}`))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ display: "flex", gap: 6, padding: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {spells.map(spell => (
          <button key={spell.id} disabled={usedSpells.has(spell.id)}
            onClick={() => { if (!usedSpells.has(spell.id)) { setUsedSpells(s => new Set([...s, spell.id])); onCastSpell(spell.id); } }}
            style={{
              width: 44, height: 44, borderRadius: 8,
              background: usedSpells.has(spell.id) ? "#555" : "linear-gradient(135deg, #6B4EAE, #4A3178)",
              border: "2px solid #DAA520", fontSize: 20, cursor: "pointer",
              opacity: usedSpells.has(spell.id) ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{spell.emoji}</button>
        ))}
        {potionCount > 0 && (
          <button onClick={() => { setPlayerHp(h => Math.min(playerMaxHp, h + 10)); onUsePotion(); }} style={{
            width: 44, height: 44, borderRadius: 8,
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            border: "2px solid #DAA520", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>🧪</button>
        )}
      </div>
    </div>
  );
}
