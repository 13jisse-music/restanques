"use client";
import { useState, useCallback } from "react";
import { sounds } from "../lib/sounds";

// CDC: Tap ingredient en bas → tap case vide → emoji se place
// Aligner 3+ identiques (ligne/colonne/diagonale) = craft reussi
const PW = 4, PH = 4;
const CRAFT_EMOJIS = ["💜","🌿","🪨","🍄"];
const CRAFT_NAMES = ["Lavande","Herbe","Pierre","Champignon"];
const CRAFT_BG = ["#B39DDB","#A5D6A7","#BCAAA4","#FFCC80"];

interface Props {
  gridSize?: number; // 4 for Artisane, 3 for Ombre
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

// Check alignments (3+ same in row/col/diagonal)
function checkAlign(grid: (number|null)[][], size: number): {ok:boolean; cells:[number,number][]} {
  let best: [number,number][] = [];
  // Rows
  for (let y=0; y<size; y++) for (let x=0; x<=size-3; x++) {
    const v = grid[y][x]; if (v===null) continue;
    let cnt=1; const cells: [number,number][] = [[y,x]];
    for (let k=1; x+k<size && grid[y][x+k]===v; k++) { cnt++; cells.push([y,x+k]); }
    if (cnt>=3 && cnt>best.length) best = cells;
  }
  // Cols
  for (let x=0; x<size; x++) for (let y=0; y<=size-3; y++) {
    const v = grid[y][x]; if (v===null) continue;
    let cnt=1; const cells: [number,number][] = [[y,x]];
    for (let k=1; y+k<size && grid[y+k][x]===v; k++) { cnt++; cells.push([y+k,x]); }
    if (cnt>=3 && cnt>best.length) best = cells;
  }
  // Diag ↘
  for (let y=0; y<=size-3; y++) for (let x=0; x<=size-3; x++) {
    const v = grid[y][x]; if (v===null) continue;
    let cnt=1; const cells: [number,number][] = [[y,x]];
    for (let k=1; y+k<size && x+k<size && grid[y+k][x+k]===v; k++) { cnt++; cells.push([y+k,x+k]); }
    if (cnt>=3 && cnt>best.length) best = cells;
  }
  // Diag ↙
  for (let y=0; y<=size-3; y++) for (let x=size-1; x>=2; x--) {
    const v = grid[y][x]; if (v===null) continue;
    let cnt=1; const cells: [number,number][] = [[y,x]];
    for (let k=1; y+k<size && x-k>=0 && grid[y+k][x-k]===v; k++) { cnt++; cells.push([y+k,x-k]); }
    if (cnt>=3 && cnt>best.length) best = cells;
  }
  return {ok: best.length>=3, cells: best};
}

export function CraftPuzzle({ gridSize=4, onSuccess, onFail, onClose }: Props) {
  const SZ = gridSize;
  const [grid, setGrid] = useState<(number|null)[][]>(
    () => Array.from({length:SZ}, ()=>Array(SZ).fill(null))
  );
  // Pool of ingredients to place (randomly chosen)
  const [pool, setPool] = useState<number[]>(() => {
    const p: number[] = [];
    // Give 3 of each of 3 types + some extras = enough to align
    const types = [0,1,2,3].sort(()=>Math.random()-0.5).slice(0,3);
    for (const t of types) for (let i=0; i<3; i++) p.push(t);
    // A few random extras
    for (let i=0; i<3; i++) p.push(Math.floor(Math.random()*4));
    return p.sort(()=>Math.random()-0.5);
  });
  const [selectedPool, setSelectedPool] = useState<number|null>(null); // index in pool
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  const alignment = checkAlign(grid, SZ);
  const glowSet = new Set(alignment.cells.map(([y,x])=>`${y},${x}`));

  // Tap on a grid cell
  const tapGrid = (y: number, x: number) => {
    if (done) return;
    if (grid[y][x] !== null) {
      // Cell occupied → remove ingredient, return to pool
      const val = grid[y][x]!;
      setGrid(g => { const ng=g.map(r=>[...r]); ng[y][x]=null; return ng; });
      setPool(p => [...p, val]);
      setSelectedPool(null);
      sounds.click();
      return;
    }
    if (selectedPool === null) return;
    // Place selected ingredient
    const val = pool[selectedPool];
    setGrid(g => { const ng=g.map(r=>[...r]); ng[y][x]=val; return ng; });
    setPool(p => p.filter((_,i)=>i!==selectedPool));
    setSelectedPool(null);
    sounds.click();
  };

  // Validate
  const validate = () => {
    if (!alignment.ok) {
      setMsg("Alignez 3+ ingredients identiques !");
      setTimeout(()=>setMsg(""), 2000);
      sounds.defeat();
      return;
    }
    setDone(true);
    sounds.victory();
    setMsg("Craft reussi !");
    setTimeout(onSuccess, 1000);
  };

  // Reset
  const reset = () => {
    // Return all placed items to pool
    const returned: number[] = [];
    grid.forEach(row => row.forEach(v => { if (v!==null) returned.push(v); }));
    setPool(p => [...p, ...returned]);
    setGrid(Array.from({length:SZ}, ()=>Array(SZ).fill(null)));
    setSelectedPool(null);
  };

  const CS = Math.floor(Math.min((typeof window!=="undefined"?window.innerWidth:360) - 60, 280) / SZ);

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:"rgba(0,0,0,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}}>
      <div style={{background:"linear-gradient(#F5ECD7,#E8D5A3)",border:"3px solid #5C4033",borderRadius:14,padding:16,maxWidth:340,width:"90%",color:"#3D2B1F"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:"bold"}}>🔨 Puzzle Craft</div>
          <div style={{fontSize:11,color:"#8B7355"}}>Placez les ingredients puis alignez 3+ identiques !</div>
        </div>

        {/* Grid */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${SZ},${CS}px)`,gap:4,justifyContent:"center",marginBottom:12}}>
          {grid.map((row,y) => row.map((val,x) => {
            const glow = glowSet.has(`${y},${x}`);
            return <div key={`${x}${y}`} onClick={()=>tapGrid(y,x)} style={{
              width:CS,height:CS,borderRadius:10,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:Math.floor(CS*0.55),
              background: val!==null ? (glow ? "rgba(244,208,63,.3)" : CRAFT_BG[val]) : "rgba(0,0,0,.06)",
              border: val!==null ? (glow ? "3px solid #DAA520" : "2px solid #8B7355") : "2px dashed rgba(139,115,85,.3)",
              boxShadow: glow ? "0 0 10px rgba(244,208,63,.5)" : "none",
              transition: "all .15s",
            }}>
              {val!==null ? CRAFT_EMOJIS[val] : ""}
            </div>;
          }))}
        </div>

        {/* Alignment indicator */}
        {alignment.ok && !done && <div style={{textAlign:"center",fontSize:12,color:"#DAA520",fontWeight:"bold",marginBottom:8}}>
          ✨ Alignement de {alignment.cells.length} detecte !
        </div>}

        {/* Pool of ingredients to place */}
        {pool.length > 0 && !done && <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:"bold",marginBottom:4}}>Ingredients a placer :</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
            {pool.map((val,i) => (
              <button key={i} onClick={()=>setSelectedPool(selectedPool===i?null:i)} style={{
                width:44,height:44,borderRadius:10,fontSize:22,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                background: selectedPool===i ? "rgba(244,208,63,.3)" : CRAFT_BG[val],
                border: selectedPool===i ? "3px solid #DAA520" : "2px solid #8B7355",
                transform: selectedPool===i ? "scale(1.15)" : "scale(1)",
                boxShadow: selectedPool===i ? "0 0 8px rgba(244,208,63,.5)" : "none",
                transition: "all .15s",
              }}>{CRAFT_EMOJIS[val]}</button>
            ))}
          </div>
          <div style={{fontSize:9,color:"#8B7355",textAlign:"center",marginTop:4}}>
            {selectedPool!==null ? "Tap une case de la grille pour placer" : "Tap un ingredient puis une case vide"}
          </div>
        </div>}

        {/* Message */}
        {msg && <div style={{textAlign:"center",fontSize:13,fontWeight:"bold",color:msg.includes("reussi")?"#3D7A18":"#D94F4F",marginBottom:8}}>{msg}</div>}

        {/* Buttons */}
        {!done && <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <button onClick={validate} style={{
            padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:"bold",
            background:alignment.ok?"linear-gradient(135deg,#7A9E3F,#5A7E2F)":"#999",
            color:"#FFF",border:"2px solid #DAA520",cursor:alignment.ok?"pointer":"default",
            opacity:alignment.ok?1:.5,
          }}>✨ Valider</button>
          <button onClick={reset} style={{padding:"10px 14px",borderRadius:10,fontSize:12,background:"#8B7355",color:"#E8D5A3",border:"2px solid #5C4033",cursor:"pointer"}}>↩️ Reset</button>
          <button onClick={onClose} style={{padding:"10px 14px",borderRadius:10,fontSize:12,background:"#5C4033",color:"#E8D5A3",border:"2px solid #8B7355",cursor:"pointer"}}>✕</button>
        </div>}

        {done && <div style={{textAlign:"center",fontSize:28,marginTop:8}}>🎉</div>}
      </div>
    </div>
  );
}
