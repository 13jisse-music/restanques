"use client";
import { useState, useCallback } from "react";
import { PUYO_W, PUYO_H, GEM_COLORS, Pos } from "../components/GameTypes";
import { mkGrid, findMatches, applyGravity, swapGems } from "../components/PuyoHelpers";
import { sounds } from "../lib/sounds";

interface Props {
  player1: string; player2: string;
  onEnd: (winner: string) => void;
}

export function PvPArena({ player1, player2, onEnd }: Props) {
  const [p1Grid, setP1Grid] = useState(() => mkGrid());
  const [p2Grid, setP2Grid] = useState(() => mkGrid());
  const [p1Hp, setP1Hp] = useState(30);
  const [p2Hp, setP2Hp] = useState(30);
  const [turn, setTurn] = useState<1|2>(1);
  const [selected, setSelected] = useState<Pos|null>(null);
  const [msg, setMsg] = useState(`Tour de ${player1}`);
  const [winner, setWinner] = useState<string|null>(null);

  const activeGrid = turn === 1 ? p1Grid : p2Grid;
  const setActiveGrid = turn === 1 ? setP1Grid : setP2Grid;

  const select = useCallback((x: number, y: number) => {
    if (winner) return;
    if (selected) {
      const dx = Math.abs(selected.x-x), dy = Math.abs(selected.y-y);
      if ((dx===1&&dy===0)||(dx===0&&dy===1)) {
        let ng = swapGems(activeGrid, selected, {x,y});
        let matches = findMatches(ng);
        if (matches.size === 0) { setSelected(null); setMsg("Pas de match !"); return; }
        let dmg = 0, combo = 0;
        const resolve = () => {
          matches = findMatches(ng);
          if (matches.size === 0) {
            setActiveGrid(ng);
            // Apply damage to opponent
            if (turn === 1) {
              const nh = p2Hp - dmg;
              setP2Hp(Math.max(0, nh));
              if (nh <= 0) { setWinner(player1); setMsg(`${player1} gagne !`); sounds.victory(); setTimeout(()=>onEnd(player1),2000); return; }
            } else {
              const nh = p1Hp - dmg;
              setP1Hp(Math.max(0, nh));
              if (nh <= 0) { setWinner(player2); setMsg(`${player2} gagne !`); sounds.victory(); setTimeout(()=>onEnd(player2),2000); return; }
            }
            setTurn(t => t===1?2:1);
            setMsg(`Tour de ${turn===1?player2:player1}`);
            setSelected(null);
            return;
          }
          combo++;
          dmg += Math.round(matches.size * 2 * (1+combo*0.3));
          sounds.gemMatch(combo);
          for (const k of matches) { const [mx,my]=k.split(",").map(Number); ng[my][mx].color=-1; }
          ng = applyGravity(ng);
          setTimeout(resolve, 250);
        };
        setSelected(null);
        setTimeout(resolve, 150);
      } else { setSelected({x,y}); }
    } else { setSelected({x,y}); }
  }, [selected, activeGrid, setActiveGrid, turn, p1Hp, p2Hp, player1, player2, winner, onEnd]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#DAA520",fontSize:18,fontWeight:"bold",marginBottom:8}}>PvP Arena</div>
      {/* HP bars */}
      <div style={{display:"flex",gap:20,marginBottom:8,width:280}}>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{color:turn===1?"#FFD700":"#888",fontSize:12}}>{player1}</div>
          <div style={{height:8,background:"#333",borderRadius:4}}>
            <div style={{height:"100%",background:"#4CAF50",borderRadius:4,width:`${(p1Hp/30)*100}%`,transition:"width .3s"}} />
          </div>
          <div style={{fontSize:10,color:"#4CAF50"}}>{p1Hp}/30</div>
        </div>
        <div style={{color:"#F44",fontSize:16,alignSelf:"center"}}>VS</div>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{color:turn===2?"#FFD700":"#888",fontSize:12}}>{player2}</div>
          <div style={{height:8,background:"#333",borderRadius:4}}>
            <div style={{height:"100%",background:"#F44336",borderRadius:4,width:`${(p2Hp/30)*100}%`,transition:"width .3s"}} />
          </div>
          <div style={{fontSize:10,color:"#F44336"}}>{p2Hp}/30</div>
        </div>
      </div>
      <div style={{color:"#AAA",fontSize:12,marginBottom:6}}>{msg}</div>
      {/* Active grid */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},40px)`,gridTemplateRows:`repeat(${PUYO_H},40px)`,gap:2,padding:4,borderRadius:8,border:`2px solid ${turn===1?"#4CAF50":"#F44336"}`}}>
        {activeGrid.map((row,y) => row.map((gem,x) => (
          <button key={`${x}-${y}`} onClick={() => select(x,y)} style={{
            width:40,height:40,borderRadius:7,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            border:selected?.x===x&&selected?.y===y?"3px solid #FFD700":"1px solid rgba(255,255,255,.08)",
            background:gem.color>=0?["#E53935","#1E88E5","#43A047","#FDD835","#8E24AA","#FF6D00"][gem.color]:"#222",
          }}>{gem.color>=0?GEM_COLORS[gem.color]:""}</button>
        )))}
      </div>
      {winner && <div style={{marginTop:14,color:"#FFD700",fontSize:20,fontWeight:"bold"}}>{winner} remporte le duel !</div>}
    </div>
  );
}
