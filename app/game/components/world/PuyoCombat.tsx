"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── TYPES ───
interface PuyoGem {
  color: number; // 0-5, -1=garbage
  resourceId?: string;
}

interface PuyoPair {
  gems: [number, number];
  x: number; // column 0-5
  y: number; // row position (float)
  rotation: number; // 0=vertical, 1=right, 2=inverted, 3=left
  resourceIdx?: number; // which gem index is resource (0 or 1)
  resourceId?: string;
}

type Grid = (PuyoGem | null)[][];

interface PuyoCombatProps {
  enemy: { name: string; emoji: string; hp: number; atk: number; level: number };
  playerName: string;
  playerEmoji: string;
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  isPaladin: boolean;
  isArtisaneZone: boolean; // easier for nuisibles
  biomeResources: string[];
  timeOfDay: number;
  spells: { id: string; name: string; emoji: string; effect: string }[];
  potionCount: number;
  onVictory: (xpGained: number, sousGained: number, drops: string[], resourcesCollected: string[]) => void;
  onDefeat: () => void;
  onFlee: () => void;
  onUsePotion: () => void;
  onCastSpell: (spellId: string) => void;
}

const COLS = 6;
const ROWS = 12;
const GEM_COLORS = [
  { light: "#C4A0FF", dark: "#6B4EAE", name: "Lavande" },
  { light: "#A0D860", dark: "#4A6E1F", name: "Olive" },
  { light: "#FF7070", dark: "#A92F2F", name: "Rubis" },
  { light: "#70B0FF", dark: "#2A60A9", name: "Saphir" },
  { light: "#FFE070", dark: "#C4A01F", name: "Soleil" },
  { light: "#FFB050", dark: "#B64E02", name: "Ocre" },
];

const RESOURCE_EMOJIS: Record<string, string> = {
  branche: "🪵", herbe: "🌿", lavande: "💜", pierre: "🪨",
  coquillage: "🐚", sel: "🧂", poisson: "🐟", corail: "🪸",
  fer: "⛏️", ocre: "🟠", cristal: "💎", perle: "⚪",
};

// ─── PURE LOGIC HELPERS ───
function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomColor(): number {
  return Math.floor(Math.random() * 6);
}

function generatePair(resources: string[], resourceChance = 0.1): PuyoPair {
  const isResource = Math.random() < resourceChance && resources.length > 0;
  const gem1 = randomColor();
  const gem2 = randomColor();
  const pair: PuyoPair = { gems: [gem1, gem2], x: 2, y: 0, rotation: 0 };
  if (isResource) {
    pair.resourceIdx = Math.random() < 0.5 ? 0 : 1;
    pair.resourceId = resources[Math.floor(Math.random() * resources.length)];
  }
  return pair;
}

function getPairPositions(pair: PuyoPair): [number, number, number, number] {
  // Returns [row1, col1, row2, col2] for the two gems
  const r1 = Math.floor(pair.y);
  const c1 = pair.x;
  let r2 = r1, c2 = c1;
  switch (pair.rotation) {
    case 0: r2 = r1 + 1; break; // vertical: gem2 below
    case 1: c2 = c1 + 1; break; // right: gem2 right
    case 2: r2 = r1 - 1; break; // inverted: gem2 above
    case 3: c2 = c1 - 1; break; // left: gem2 left
  }
  return [r1, c1, r2, c2];
}

function canPlace(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS && grid[row][col] === null;
}

function placePairOnGrid(grid: Grid, pair: PuyoPair): Grid {
  const g = grid.map(r => [...r]);
  const [r1, c1, r2, c2] = getPairPositions(pair);
  if (r1 >= 0 && r1 < ROWS && c1 >= 0 && c1 < COLS) {
    g[r1][c1] = pair.resourceIdx === 0
      ? { color: pair.gems[0], resourceId: pair.resourceId }
      : { color: pair.gems[0] };
  }
  if (r2 >= 0 && r2 < ROWS && c2 >= 0 && c2 < COLS) {
    g[r2][c2] = pair.resourceIdx === 1
      ? { color: pair.gems[1], resourceId: pair.resourceId }
      : { color: pair.gems[1] };
  }
  return g;
}

function applyGravity(grid: Grid): { grid: Grid; fell: boolean } {
  const g = grid.map(r => [...r]);
  let fell = false;
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (g[r][c] !== null) {
        if (r !== writeRow) {
          g[writeRow][c] = g[r][c];
          g[r][c] = null;
          fell = true;
        }
        writeRow--;
      }
    }
  }
  return { grid: g, fell };
}

function floodFill(grid: Grid, startRow: number, startCol: number, color: number, visited: boolean[][]): [number, number][] {
  const positions: [number, number][] = [];
  const stack: [number, number][] = [[startRow, startCol]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (visited[r][c]) continue;
    if (grid[r][c] === null || grid[r][c]!.color !== color || grid[r][c]!.color === -1) continue;
    visited[r][c] = true;
    positions.push([r, c]);
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return positions;
}

function findMatches(grid: Grid): { positions: [number, number][]; color: number; hasResource: boolean; resourceId?: string }[] {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const matches: { positions: [number, number][]; color: number; hasResource: boolean; resourceId?: string }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (visited[r][c] || grid[r][c] === null || grid[r][c]!.color === -1) continue;
      const group = floodFill(grid, r, c, grid[r][c]!.color, visited);
      if (group.length >= 4) {
        let hasResource = false;
        let resourceId: string | undefined;
        for (const [gr, gc] of group) {
          if (grid[gr][gc]?.resourceId) {
            hasResource = true;
            resourceId = grid[gr][gc]!.resourceId;
          }
        }
        matches.push({ positions: group, color: grid[r][c]!.color, hasResource, resourceId });
      }
    }
  }
  return matches;
}

function removeMatches(grid: Grid, matches: { positions: [number, number][] }[]): Grid {
  const g = grid.map(r => [...r]);
  for (const match of matches) {
    for (const [r, c] of match.positions) {
      g[r][c] = null;
    }
  }
  return g;
}

function addGarbage(grid: Grid, lines: number): Grid {
  const g = grid.map(r => [...r]);
  // Push everything up
  for (let l = 0; l < lines; l++) {
    // Check if top row has gems (game over condition)
    for (let c = 0; c < COLS; c++) {
      if (g[0][c] !== null) return g; // can't add more
    }
    // Shift everything up
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        g[r][c] = g[r + 1][c];
      }
    }
    // Add garbage at bottom with 1 hole
    const hole = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) {
      g[ROWS - 1][c] = c === hole ? null : { color: -1 };
    }
  }
  return g;
}

function isGridFull(grid: Grid): boolean {
  // Check if any gem in rows 0-1
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c] !== null) return true;
  }
  return false;
}

function calcDamage(matchCount: number, comboLevel: number, atk: number, hasResource: boolean, isPaladin: boolean, rageActive: boolean): number {
  let dmg = atk;
  if (matchCount === 5) dmg += 3;
  if (matchCount >= 6) dmg += 8;
  // Combo multiplier
  if (comboLevel === 2) dmg = Math.ceil(dmg * 1.5);
  else if (comboLevel === 3) dmg = Math.ceil(dmg * 2.0);
  else if (comboLevel >= 4) dmg = Math.ceil(dmg * 3.0);
  // Resource bonus
  if (hasResource) dmg += 5;
  // Paladin bonus
  if (isPaladin) dmg = Math.ceil(dmg * 1.2);
  // Rage
  if (rageActive) dmg = Math.ceil(dmg * 1.5);
  return Math.max(1, dmg);
}

// ─── MONSTER AI (simple) ───
function monsterPlay(grid: Grid, pair: PuyoPair, difficulty: number): { x: number; rotation: number } {
  // Simple AI: try each position, pick the one that creates matches or connects colors
  let bestX = Math.floor(Math.random() * COLS);
  let bestRot = 0;
  let bestScore = -1;

  const tryPositions = difficulty > 10 ? COLS : Math.min(3, COLS);
  for (let x = 0; x < tryPositions; x++) {
    for (let rot = 0; rot < 2; rot++) {
      const testPair = { ...pair, x, rotation: rot };
      const [r1, c1, r2, c2] = getPairPositions(testPair);
      if (c1 < 0 || c1 >= COLS || c2 < 0 || c2 >= COLS) continue;

      // Find where gems would land
      let score = 0;
      // Check adjacent same-color gems
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (Math.abs(dr) + Math.abs(dc) !== 1) continue;
          const nr1 = r1 + dr, nc1 = c1 + dc;
          if (nr1 >= 0 && nr1 < ROWS && nc1 >= 0 && nc1 < COLS) {
            if (grid[nr1][nc1]?.color === pair.gems[0]) score += 2;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestRot = rot;
      }
    }
  }
  return { x: Math.max(0, Math.min(COLS - 1, bestX)), rotation: bestRot };
}

// ─── COMPONENT ───
export function PuyoCombat({
  enemy, playerName, playerEmoji, playerHp: initialPlayerHp, playerMaxHp,
  playerAtk, playerDef, isPaladin, isArtisaneZone, biomeResources,
  timeOfDay, spells, potionCount,
  onVictory, onDefeat, onFlee, onUsePotion, onCastSpell,
}: PuyoCombatProps) {
  const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid);
  const [enemyGrid, setEnemyGrid] = useState<Grid>(createEmptyGrid);
  const [currentPair, setCurrentPair] = useState<PuyoPair | null>(() => generatePair(biomeResources));
  const [nextPair, setNextPair] = useState<PuyoPair>(() => generatePair(biomeResources));
  const [playerHp, setPlayerHp] = useState(initialPlayerHp);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [comboCount, setComboCount] = useState(0);
  const [comboText, setComboText] = useState("");
  const [damageText, setDamageText] = useState("");
  const [receivedText, setReceivedText] = useState("");
  const [rageActive, setRageActive] = useState(false);
  const [rageTurns, setRageTurns] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [resourcesCollected, setResourcesCollected] = useState<string[]>([]);
  const [usedSpells, setUsedSpells] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());

  const fallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enemyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const fallSpeed = isArtisaneZone ? 1500 : 1000; // ms per row
  const enemySpeed = isArtisaneZone ? 3000 : 2000; // ms between enemy drops

  // ─── PROCESS MATCHES (chain resolution) ───
  const processMatches = useCallback((grid: Grid, isPlayer: boolean): Grid => {
    let g = grid;
    let chainLevel = 0;
    let totalDmg = 0;
    const collected: string[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const matches = findMatches(g);
      if (matches.length === 0) break;
      chainLevel++;

      // Mark matched cells for animation
      if (isPlayer) {
        const cells = new Set<string>();
        for (const m of matches) {
          for (const [r, c] of m.positions) cells.add(`${r},${c}`);
        }
        setMatchedCells(cells);
      }

      // Calculate damage
      for (const match of matches) {
        if (isPlayer) {
          const dmg = calcDamage(match.positions.length, chainLevel, playerAtk, match.hasResource, isPaladin, rageActive);
          totalDmg += dmg;
          if (match.resourceId) collected.push(match.resourceId);
        } else {
          // Enemy damage to player
          const eDmg = Math.max(1, enemy.atk - playerDef);
          const comboMult = chainLevel >= 3 ? 2 : chainLevel >= 2 ? 1.5 : 1;
          const totalEDmg = Math.ceil(eDmg * comboMult);
          setPlayerHp(h => Math.max(0, h - totalEDmg));
          setReceivedText(`-${totalEDmg} ❤️`);
          setShaking(true);
          setTimeout(() => { setReceivedText(""); setShaking(false); }, 800);
          // Send garbage to player
          if (chainLevel >= 2) {
            const garbageLines = Math.min(3, chainLevel - 1);
            if (!isArtisaneZone || garbageLines <= 1) {
              setPlayerGrid(pg => addGarbage(pg, garbageLines));
            }
          }
        }
      }

      g = removeMatches(g, matches);
      const { grid: grav } = applyGravity(g);
      g = grav;
    }

    if (isPlayer && totalDmg > 0) {
      setEnemyHp(h => Math.max(0, h - totalDmg));
      setDamageText(`+${totalDmg} 💥`);
      if (chainLevel >= 2) {
        setComboText(`COMBO ×${chainLevel} !`);
        setComboCount(chainLevel);
      }
      setTimeout(() => { setDamageText(""); setComboText(""); setMatchedCells(new Set()); }, 800);
      // Paladin rage check
      if (isPaladin && chainLevel >= 3 && !rageActive) {
        setRageActive(true);
        setRageTurns(2);
      }
      // Collect resources
      if (collected.length > 0) {
        setResourcesCollected(prev => [...prev, ...collected]);
      }
    }

    return g;
  }, [playerAtk, playerDef, isPaladin, rageActive, enemy.atk, isArtisaneZone]);

  // ─── DROP CURRENT PAIR ───
  const dropPair = useCallback(() => {
    if (gameOver || victory || !currentPair) return;

    const pair = currentPair;
    const newY = pair.y + 1;
    const [r1, c1, r2, c2] = getPairPositions({ ...pair, y: newY });

    // Check if can fall further
    const blocked1 = r1 >= ROWS || (r1 >= 0 && r1 < ROWS && playerGrid[r1]?.[c1] !== null && playerGrid[r1]?.[c1] !== undefined);
    const blocked2 = r2 >= ROWS || (r2 >= 0 && r2 < ROWS && playerGrid[r2]?.[c2] !== null && playerGrid[r2]?.[c2] !== undefined);

    if (blocked1 || blocked2) {
      // Place pair
      let g = placePairOnGrid(playerGrid, pair);
      const { grid: grav } = applyGravity(g);
      g = processMatches(grav, true);
      setPlayerGrid(g);

      // Check game over
      if (isGridFull(g)) {
        setGameOver(true);
        setCurrentPair(null);
        return;
      }

      // Advance next pair
      setCurrentPair(nextPair);
      setNextPair(generatePair(biomeResources));
    } else {
      setCurrentPair({ ...pair, y: newY });
    }
  }, [currentPair, playerGrid, nextPair, biomeResources, gameOver, victory, processMatches]);

  // ─── ENEMY AI TURN ───
  const enemyTurn = useCallback(() => {
    if (gameOver || victory) return;

    const pair = generatePair([], 0);
    const ai = monsterPlay(enemyGrid, pair, enemy.level);
    const placed = { ...pair, x: ai.x, rotation: ai.rotation, y: ROWS - 2 };

    // Find where it lands
    let g = placePairOnGrid(enemyGrid, placed);
    const { grid: grav } = applyGravity(g);
    g = processMatches(grav, false);
    setEnemyGrid(g);
  }, [enemyGrid, enemy.level, gameOver, victory, processMatches]);

  // ─── FALL TIMER ───
  useEffect(() => {
    fallTimerRef.current = setInterval(dropPair, fallSpeed);
    return () => { if (fallTimerRef.current) clearInterval(fallTimerRef.current); };
  }, [dropPair, fallSpeed]);

  // ─── ENEMY TIMER ───
  useEffect(() => {
    enemyTimerRef.current = setInterval(enemyTurn, enemySpeed);
    return () => { if (enemyTimerRef.current) clearInterval(enemyTimerRef.current); };
  }, [enemyTurn, enemySpeed]);

  // ─── CHECK WIN/LOSE ───
  useEffect(() => {
    if (enemyHp <= 0 && !victory) {
      setVictory(true);
      const xpGain = enemy.level * 10;
      const sousGain = Math.floor(enemy.level * 2 * (0.7 + Math.random() * 0.6));
      const drops = biomeResources.slice(0, 1 + Math.floor(Math.random() * 2));
      setTimeout(() => onVictory(xpGain, sousGain, drops, resourcesCollected), 1500);
    }
    if (playerHp <= 0 && !gameOver) {
      setGameOver(true);
      setTimeout(onDefeat, 1500);
    }
  }, [enemyHp, playerHp, victory, gameOver]);

  // ─── TOUCH CONTROLS ───
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !currentPair) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (dt < 200 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // TAP = rotate
      setCurrentPair(p => {
        if (!p) return p;
        const newRot = (p.rotation + 1) % 4;
        const [, , r2, c2] = getPairPositions({ ...p, rotation: newRot });
        if (c2 >= 0 && c2 < COLS && r2 >= 0 && r2 < ROWS) {
          return { ...p, rotation: newRot };
        }
        return p;
      });
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      const dir = dx > 0 ? 1 : -1;
      setCurrentPair(p => {
        if (!p) return p;
        const newX = p.x + dir;
        const [r1, c1, r2, c2] = getPairPositions({ ...p, x: newX });
        if (c1 >= 0 && c1 < COLS && c2 >= 0 && c2 < COLS &&
            canPlace(playerGrid, r1, c1) && canPlace(playerGrid, r2, c2)) {
          return { ...p, x: newX };
        }
        return p;
      });
    } else if (dy > 30) {
      // Swipe down = hard drop
      dropPair();
      dropPair();
      dropPair();
    }
  };

  // ─── RENDERING ───
  const W = typeof window !== "undefined" ? window.innerWidth : 360;
  const gemSize = Math.floor(Math.min(36, (W * 0.65) / COLS));
  const enemyGemSize = Math.floor(gemSize * 0.5);

  const isNight = timeOfDay >= 0.55;
  const isDay = timeOfDay >= 0.15 && timeOfDay < 0.45;

  const renderGem = (gem: PuyoGem | null, size: number, isMatched = false) => {
    if (!gem) return <div style={{ width: size, height: size }} />;
    if (gem.color === -1) {
      // Garbage
      return <div style={{
        width: size, height: size, borderRadius: 4,
        background: "#888", border: "1px solid #666",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
      }} />;
    }
    if (gem.resourceId) {
      return <div style={{
        width: size, height: size, borderRadius: 4,
        background: "linear-gradient(135deg, #FFD700, #FFA500)",
        border: "2px solid #DAA520",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.6,
        animation: isMatched ? "gemMatch 400ms ease-out forwards" : undefined,
      }}>{RESOURCE_EMOJIS[gem.resourceId] || "?"}</div>;
    }
    const gc = GEM_COLORS[gem.color] || GEM_COLORS[0];
    return <div className={isMatched ? "gem-matched" : ""} style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: `radial-gradient(circle at 30% 30%, ${gc.light}, ${gc.dark})`,
      boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`,
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: "15%", left: "20%",
        width: "35%", height: "25%", borderRadius: "50%",
        background: "rgba(255,255,255,0.4)",
      }} />
    </div>;
  };

  const hpBar = (current: number, max: number, width: number) => {
    const pct = Math.max(0, current / max);
    const color = pct > 0.5 ? "#4CAF50" : pct > 0.25 ? "#FF9800" : "#F44336";
    return (
      <div style={{ width, height: 10, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color, transition: "width 300ms" }} />
      </div>
    );
  };

  if (victory) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="panel-opening" style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 16, padding: 24, textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#3D2B1F" }}>Victoire !</div>
          <div style={{ fontSize: 14, color: "#5C4033", marginTop: 8 }}>{enemy.emoji} {enemy.name} vaincu !</div>
        </div>
      </div>
    );
  }

  if (gameOver) {
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
      position: "fixed", inset: 0, background: "#1A0A00", zIndex: 200,
      display: "flex", flexDirection: "column", padding: 8,
    }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header: fighters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", color: "#FFF" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7 }}>
            {isDay ? "☀️ Jour" : isNight ? "🌙 Nuit" : "🌇 Crépuscule"}
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #4A6E1F, #2D4A0F)", border: `2px solid ${rageActive ? "#FF4444" : "#F4D03F"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto" }}>{playerEmoji}</div>
          <div style={{ fontSize: 10, fontWeight: "bold" }}>{playerName}</div>
          {hpBar(playerHp, playerMaxHp, 80)}
          <div style={{ fontSize: 9 }}>❤️{playerHp}/{playerMaxHp}</div>
        </div>
        <div style={{ fontSize: 20 }}>⚔️</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#D94F4F" }}>Nv.{enemy.level}</div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #4A1A1A, #2D0A0A)", border: "2px solid #D94F4F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto" }}>{enemy.emoji}</div>
          <div style={{ fontSize: 10, fontWeight: "bold", color: "#D94F4F" }}>{enemy.name}</div>
          {hpBar(enemyHp, enemy.hp, 80)}
          <div style={{ fontSize: 9 }}>❤️{Math.max(0, enemyHp)}/{enemy.hp}</div>
        </div>
      </div>

      {/* Damage/Combo text overlays */}
      {damageText && <div style={{ position: "absolute", top: 80, right: 40, fontSize: 20, fontWeight: "bold", color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.8)", zIndex: 10, animation: "combatDamageFloat 800ms ease-out forwards" }}>{damageText}</div>}
      {receivedText && <div style={{ position: "absolute", top: 80, left: 40, fontSize: 20, fontWeight: "bold", color: "#FF4444", textShadow: "0 0 8px rgba(255,0,0,0.8)", zIndex: 10, animation: "combatDamageFloat 800ms ease-out forwards" }}>{receivedText}</div>}
      {comboText && <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", fontSize: 28, fontWeight: "bold", color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.8)", zIndex: 10 }}>{comboText}</div>}

      {/* Main area: player grid + enemy grid */}
      <div style={{ flex: 1, display: "flex", gap: 8, padding: "4px 0", overflow: "hidden" }}>
        {/* Player grid (70%) */}
        <div style={{ flex: 7, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>Ma grille</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${gemSize}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${gemSize}px)`,
            gap: 1, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 4, padding: 2,
          }}>
            {playerGrid.map((row, r) =>
              row.map((gem, c) => {
                const isMatched = matchedCells.has(`${r},${c}`);
                // Show current pair
                if (currentPair) {
                  const [r1, c1, r2, c2] = getPairPositions(currentPair);
                  if (r === Math.floor(currentPair.y) && c === c1 && !gem) {
                    const pairGem: PuyoGem = currentPair.resourceIdx === 0
                      ? { color: currentPair.gems[0], resourceId: currentPair.resourceId }
                      : { color: currentPair.gems[0] };
                    return <div key={`${r}-${c}`}>{renderGem(pairGem, gemSize)}</div>;
                  }
                  if (r === r2 && c === c2 && !gem) {
                    const pairGem: PuyoGem = currentPair.resourceIdx === 1
                      ? { color: currentPair.gems[1], resourceId: currentPair.resourceId }
                      : { color: currentPair.gems[1] };
                    return <div key={`${r}-${c}`}>{renderGem(pairGem, gemSize)}</div>;
                  }
                }
                return <div key={`${r}-${c}`}>{renderGem(gem, gemSize, isMatched)}</div>;
              })
            )}
          </div>
        </div>

        {/* Enemy grid (30%) */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>Ennemi</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${enemyGemSize}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${enemyGemSize}px)`,
            gap: 0, background: "#1A0A00", border: "1px solid #5C4033", borderRadius: 4, padding: 1,
            opacity: 0.7,
          }}>
            {enemyGrid.map((row, r) =>
              row.map((gem, c) => (
                <div key={`e${r}-${c}`}>{renderGem(gem, enemyGemSize)}</div>
              ))
            )}
          </div>

          {/* Next pair preview */}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#888" }}>Suivant</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", marginTop: 2 }}>
              {renderGem({ color: nextPair.gems[0], resourceId: nextPair.resourceIdx === 0 ? nextPair.resourceId : undefined }, enemyGemSize)}
              {renderGem({ color: nextPair.gems[1], resourceId: nextPair.resourceIdx === 1 ? nextPair.resourceId : undefined }, enemyGemSize)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar: spells + potion + flee */}
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
          <button onClick={onUsePotion} style={{
            width: 44, height: 44, borderRadius: 8,
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            border: "2px solid #DAA520", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>🧪<span style={{ fontSize: 8, color: "#FFF" }}>×{potionCount}</span></button>
        )}
        <button onClick={onFlee} style={{
          width: 44, height: 44, borderRadius: 8,
          background: "linear-gradient(135deg, #8B7355, #5C4033)",
          border: "2px solid #DAA520", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>🏃</button>
      </div>
    </div>
  );
}
