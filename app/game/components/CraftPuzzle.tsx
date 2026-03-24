"use client";

import { useState, useCallback } from "react";
import { sounds } from "../../lib/sounds";

interface Ingredient { id: string; emoji: string; }

interface CraftPuzzleProps {
  recipeName: string;
  recipeEmoji: string;
  ingredients: { id: string; emoji: string; qty: number }[];
  gridSize: number; // 4 for Artisane, 3 for Aventurier/Ombre
  failChance: number; // 0 for Artisane, 0.2 for Aventurier, 0.1 for Ombre
  onSuccess: (bonus: "normal" | "double" | "triple") => void;
  onCancel: () => void;
}

function checkAlignments(grid: (Ingredient | null)[][], size: number): { aligned: boolean; count: number; type: string; cells: [number, number][] } {
  let best = { aligned: false, count: 0, type: "", cells: [] as [number, number][] };

  // Check rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 3; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      let count = 1;
      const cells: [number, number][] = [[r, c]];
      for (let k = 1; c + k < size && grid[r][c + k]?.id === cell.id; k++) {
        count++; cells.push([r, c + k]);
      }
      if (count >= 3 && count > best.count) best = { aligned: true, count, type: "row", cells };
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 3; r++) {
      const cell = grid[r][c];
      if (!cell) continue;
      let count = 1;
      const cells: [number, number][] = [[r, c]];
      for (let k = 1; r + k < size && grid[r + k][c]?.id === cell.id; k++) {
        count++; cells.push([r + k, c]);
      }
      if (count >= 3 && count > best.count) best = { aligned: true, count, type: "col", cells };
    }
  }

  // Check diagonals (↘)
  for (let r = 0; r <= size - 3; r++) {
    for (let c = 0; c <= size - 3; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      let count = 1;
      const cells: [number, number][] = [[r, c]];
      for (let k = 1; r + k < size && c + k < size && grid[r + k][c + k]?.id === cell.id; k++) {
        count++; cells.push([r + k, c + k]);
      }
      if (count >= 3 && count > best.count) best = { aligned: true, count, type: "diag", cells };
    }
  }

  // Check diagonals (↙)
  for (let r = 0; r <= size - 3; r++) {
    for (let c = size - 1; c >= 2; c--) {
      const cell = grid[r][c];
      if (!cell) continue;
      let count = 1;
      const cells: [number, number][] = [[r, c]];
      for (let k = 1; r + k < size && c - k >= 0 && grid[r + k][c - k]?.id === cell.id; k++) {
        count++; cells.push([r + k, c - k]);
      }
      if (count >= 3 && count > best.count) best = { aligned: true, count, type: "diag", cells };
    }
  }

  return best;
}

export function CraftPuzzle({ recipeName, recipeEmoji, ingredients, gridSize, failChance, onSuccess, onCancel }: CraftPuzzleProps) {
  const [grid, setGrid] = useState<(Ingredient | null)[][]>(
    Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  );
  const [toPlace, setToPlace] = useState<Ingredient[]>(() => {
    const items: Ingredient[] = [];
    ingredients.forEach(ing => {
      for (let i = 0; i < ing.qty; i++) items.push({ id: ing.id, emoji: ing.emoji });
    });
    return items;
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [glowCells, setGlowCells] = useState<Set<string>>(new Set());
  const [crafted, setCrafted] = useState(false);

  const alignment = checkAlignments(grid, gridSize);

  // Update glow when alignment changes
  const glowSet = new Set<string>();
  if (alignment.aligned) alignment.cells.forEach(([r, c]) => glowSet.add(`${r},${c}`));

  const placeIngredient = useCallback((row: number, col: number) => {
    if (grid[row][col]) {
      // Remove from grid, return to toPlace
      const item = grid[row][col]!;
      setGrid(g => { const n = g.map(r => [...r]); n[row][col] = null; return n; });
      setToPlace(p => [...p, item]);
      setSelectedIdx(null);
      return;
    }
    if (selectedIdx === null) return;
    // Place selected ingredient
    const item = toPlace[selectedIdx];
    setGrid(g => { const n = g.map(r => [...r]); n[row][col] = item; return n; });
    setToPlace(p => p.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
    sounds.uiClick();
  }, [grid, selectedIdx, toPlace]);

  const validate = () => {
    if (!alignment.aligned) {
      setMessage("❌ Alignez 3+ ingrédients identiques en ligne, colonne ou diagonale !");
      sounds.locked();
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    // Fail chance
    if (Math.random() < failChance) {
      setMessage("💥 Échec du craft ! Les matériaux résistent...");
      sounds.combatHit();
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    // Determine bonus
    const allPlaced = toPlace.length === 0;
    let bonus: "normal" | "double" | "triple" = "normal";
    if (allPlaced) bonus = "triple";
    else if (alignment.count >= 4) bonus = "double";
    else if (alignment.type === "diag") bonus = "double";

    setCrafted(true);
    setGlowCells(glowSet);
    sounds.craft();

    const bonusText = bonus === "triple" ? "🌟 Perfection ! Résultat triple !" : bonus === "double" ? "✨ Bonus ! Résultat double !" : "✨ Craft réussi !";
    setMessage(bonusText);

    setTimeout(() => onSuccess(bonus), 1500);
  };

  const CELL = Math.floor(Math.min((window.innerWidth - 60) / gridSize, 64));

  return (
    <div className="panel-opening" style={{
      position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
    }}>
      <div style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 360, width: "100%",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", color: "#3D2B1F",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{recipeEmoji}</span>
          <div style={{ fontSize: 14, fontWeight: "bold", marginTop: 4 }}>Forge : {recipeName}</div>
          <div style={{ fontSize: 10, color: "#8B7355" }}>Alignez 3+ ingrédients identiques !</div>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${gridSize}, ${CELL}px)`,
          gap: 4, justifyContent: "center", marginBottom: 12,
        }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isGlowing = glowSet.has(`${r},${c}`) || glowCells.has(`${r},${c}`);
            return <div key={`${r}${c}`} onClick={() => placeIngredient(r, c)} style={{
              width: CELL, height: CELL, borderRadius: 10,
              background: cell ? (isGlowing ? "rgba(244,208,63,0.3)" : "rgba(139,115,85,0.15)") : "rgba(0,0,0,0.08)",
              border: cell ? (isGlowing ? "3px solid #F4D03F" : "2px solid #8B7355") : "2px dashed rgba(139,115,85,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: Math.floor(CELL * 0.55), cursor: "pointer",
              boxShadow: isGlowing ? "0 0 12px rgba(244,208,63,0.6)" : "none",
              animation: isGlowing && crafted ? "gemMatch 400ms ease-out" : "none",
              transition: "all 0.2s",
            }}>
              {cell?.emoji || ""}
            </div>;
          }))}
        </div>

        {/* Ingredients to place */}
        {toPlace.length > 0 && <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>Ingrédients à placer :</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {toPlace.map((item, i) => (
              <button key={i} onClick={() => setSelectedIdx(selectedIdx === i ? null : i)} style={{
                width: 48, height: 48, borderRadius: 10,
                background: selectedIdx === i ? "rgba(244,208,63,0.3)" : "rgba(139,115,85,0.1)",
                border: selectedIdx === i ? "3px solid #F4D03F" : "2px solid #8B7355",
                fontSize: 24, cursor: "pointer",
                transform: selectedIdx === i ? "scale(1.15)" : "scale(1)",
                boxShadow: selectedIdx === i ? "0 0 10px rgba(244,208,63,0.5)" : "none",
                transition: "all 0.15s",
              }}>{item.emoji}</button>
            ))}
          </div>
          <div style={{ fontSize: 9, color: "#8B7355", textAlign: "center", marginTop: 4 }}>
            {selectedIdx !== null ? "Tap une case de la grille pour placer" : "Tap un ingrédient puis une case"}
          </div>
        </div>}

        {/* Message */}
        {message && <div style={{
          textAlign: "center", fontSize: 13, fontWeight: "bold", padding: 8,
          color: message.includes("❌") || message.includes("💥") ? "#D94F4F" : "#3D7A18",
          background: message.includes("❌") || message.includes("💥") ? "#D94F4F11" : "#7A9E3F11",
          borderRadius: 8, marginBottom: 8,
        }}>{message}</div>}

        {/* Alignment hint */}
        {alignment.aligned && !crafted && <div style={{
          textAlign: "center", fontSize: 12, color: "#DAA520", fontWeight: "bold", marginBottom: 8,
        }}>
          ✨ Alignement de {alignment.count} détecté ! ({alignment.type === "diag" ? "diagonale — bonus !" : alignment.type === "row" ? "ligne" : "colonne"})
        </div>}

        {/* Buttons */}
        {!crafted && <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={validate} style={{
            padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: "bold",
            background: alignment.aligned ? "linear-gradient(135deg, #7A9E3F, #5A7E2F)" : "#888",
            color: "#FFF", border: "2px solid #F4D03F", cursor: alignment.aligned ? "pointer" : "default",
            opacity: alignment.aligned ? 1 : 0.5,
          }}>Valider ✨</button>
          <button onClick={onCancel} style={{
            padding: "10px 16px", borderRadius: 10, fontSize: 12,
            background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", cursor: "pointer",
          }}>Annuler</button>
        </div>}
      </div>
    </div>
  );
}
