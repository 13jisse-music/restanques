"use client";
import { useState, useCallback } from "react";
import { sounds } from "../lib/sounds";

// Mini puzzle: align 3 items in a 4x4 grid to craft
const PW = 4, PH = 4;
const CRAFT_COLORS = ["🔴","🔵","🟢","🟡"];

interface Props { onSuccess: () => void; onFail: () => void; onClose: () => void }

export function CraftPuzzle({ onSuccess, onFail, onClose }: Props) {
  const [grid, setGrid] = useState(() => {
    const g: number[][] = [];
    for (let y = 0; y < PH; y++) {
      g[y] = [];
      for (let x = 0; x < PW; x++) g[y][x] = Math.floor(Math.random() * 4);
    }
    return g;
  });
  const [selected, setSelected] = useState<{x:number;y:number}|null>(null);
  const [moves, setMoves] = useState(8);
  const [done, setDone] = useState(false);

  const checkWin = useCallback((g: number[][]) => {
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      if (x + 2 < PW && g[y][x] === g[y][x+1] && g[y][x] === g[y][x+2]) return true;
      if (y + 2 < PH && g[y][x] === g[y+1][x] && g[y][x] === g[y+2][x]) return true;
    }
    return false;
  }, []);

  const tap = (x: number, y: number) => {
    if (done || moves <= 0) return;
    if (selected) {
      const dx = Math.abs(selected.x - x), dy = Math.abs(selected.y - y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        const ng = grid.map(r => [...r]);
        const tmp = ng[selected.y][selected.x];
        ng[selected.y][selected.x] = ng[y][x];
        ng[y][x] = tmp;
        setGrid(ng);
        setMoves(m => m - 1);
        setSelected(null);
        sounds.click();
        if (checkWin(ng)) {
          setDone(true);
          sounds.victory();
          setTimeout(onSuccess, 800);
        } else if (moves - 1 <= 0) {
          setDone(true);
          sounds.defeat();
          setTimeout(onFail, 800);
        }
      } else {
        setSelected({x, y});
      }
    } else {
      setSelected({x, y});
    }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:"rgba(0,0,0,.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}>
      <div style={{color:"#DAA520",fontSize:16,fontWeight:"bold",marginBottom:8}}>🔨 Puzzle Craft</div>
      <div style={{color:"#AAA",fontSize:12,marginBottom:12}}>Alignez 3 couleurs ! Coups: {moves}</div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${PW},56px)`,gridTemplateRows:`repeat(${PH},56px)`,gap:3}}>
        {grid.map((row, y) => row.map((c, x) => (
          <button key={`${x}-${y}`} onClick={() => tap(x, y)} style={{
            width:56,height:56,borderRadius:10,fontSize:28,cursor:"pointer",
            border: selected?.x === x && selected?.y === y ? "3px solid #FFD700" : "2px solid rgba(255,255,255,.15)",
            background: [`#E53935`,`#1E88E5`,`#43A047`,`#FDD835`][c],
            transform: selected?.x === x && selected?.y === y ? "scale(1.1)" : "scale(1)",
            transition:"transform .1s",
          }}>
            {CRAFT_COLORS[c]}
          </button>
        )))}
      </div>
      {done && (
        <div style={{color: moves > 0 ? "#4CAF50" : "#F44336",fontSize:18,fontWeight:"bold",marginTop:14}}>
          {moves > 0 ? "🎉 Réussi !" : "💀 Raté !"}
        </div>
      )}
      <button onClick={onClose} style={{marginTop:14,padding:"8px 24px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#AAA",fontSize:12,cursor:"pointer"}}>
        Fermer
      </button>
    </div>
  );
}
