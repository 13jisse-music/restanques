"use client";
import { useState, useCallback } from "react";
import { CombatState, PUYO_W, PUYO_H, GEM_COLORS, Pos } from "../components/GameTypes";
import { mkGrid, findMatches, applyGravity, swapGems } from "../components/PuyoHelpers";
import { BOSSES, RES } from "../data/game-data";
import { sounds } from "../lib/sounds";

// Boss combat: double grid (player + boss), boss has abilities
interface Props {
  biome: string;
  playerHp: number; maxHp: number;
  stats: { atk: number; def: number; mag: number; vit: number };
  combatMul: number;
  onWin: (drop: string, sous: number) => void;
  onLose: () => void;
}

export function BossCombat({ biome, playerHp: initHp, maxHp, stats, combatMul, onWin, onLose }: Props) {
  const boss = BOSSES[biome];
  const [pGrid, setPGrid] = useState(() => mkGrid());
  const [bGrid, setBGrid] = useState(() => mkGrid());
  const [pHp, setPHp] = useState(initHp);
  const [bHp, setBHp] = useState(boss?.hp || 100);
  const [selected, setSelected] = useState<Pos|null>(null);
  const [msg, setMsg] = useState(`${boss?.emoji} ${boss?.name} vous defie !`);
  const [phase, setPhase] = useState<"play"|"boss"|"win"|"lose">("play");
  const [turn, setTurn] = useState(0);
  const [animating, setAnimating] = useState(false);

  if (!boss) return <div style={{position:"fixed",inset:0,background:"#000",color:"#FFF",display:"flex",alignItems:"center",justifyContent:"center"}}>Pas de boss ici</div>;

  const select = (x: number, y: number) => {
    if (phase !== "play" || animating) return;
    if (selected) {
      const dx = Math.abs(selected.x-x), dy = Math.abs(selected.y-y);
      if ((dx===1&&dy===0)||(dx===0&&dy===1)) {
        let ng = swapGems(pGrid, selected, {x,y});
        let matches = findMatches(ng);
        if (matches.size === 0) { setSelected(null); setMsg("Pas de match !"); return; }
        setAnimating(true); setSelected(null);
        let totalDmg = 0, combo = 0;
        const resolve = () => {
          matches = findMatches(ng);
          if (matches.size === 0) {
            setPGrid(ng);
            // Boss turn
            setPhase("boss");
            setTimeout(() => {
              const bDmg = Math.max(1, boss.atk - stats.def);
              // Boss ability every 3 turns
              const abilityDmg = (turn+1)%3===0 ? Math.floor(boss.atk*0.5) : 0;
              const total = bDmg + abilityDmg;
              const newPHp = pHp - total;
              if (abilityDmg > 0) setMsg(`${boss.ability} -${total} PV !`);
              else setMsg(`-${total} PV`);
              if (newPHp <= 0) { setPHp(0); setPhase("lose"); sounds.defeat(); setTimeout(onLose, 1500); return; }
              setPHp(newPHp);
              // Boss also does match-3 on their grid
              let bg = bGrid;
              const bMatches = findMatches(bg);
              if (bMatches.size > 0) {
                for (const k of bMatches) { const [mx,my]=k.split(",").map(Number); bg[my][mx].color=-1; }
                bg = applyGravity(bg);
                setBGrid(bg);
              }
              setTurn(t => t+1);
              setPhase("play");
              setAnimating(false);
            }, 800);
            return;
          }
          combo++;
          totalDmg += Math.round(matches.size*(stats.atk+stats.mag)*combatMul*(1+combo*0.25));
          sounds.gemMatch(combo);
          for (const k of matches) { const [mx,my]=k.split(",").map(Number); ng[my][mx].color=-1; }
          ng = applyGravity(ng);
          const newBHp = bHp - totalDmg;
          if (newBHp <= 0) {
            setBHp(0); setPGrid(ng);
            setMsg(`${boss.emoji} vaincu !`);
            setPhase("win"); sounds.victory();
            setTimeout(() => onWin(boss.drop, boss.sous), 1500);
            return;
          }
          setBHp(newBHp);
          setPGrid(ng);
          setTimeout(resolve, 250);
        };
        setTimeout(resolve, 200);
      } else { setSelected({x,y}); }
    } else { setSelected({x,y}); }
  };

  const bossHpPct = Math.max(0, (bHp / boss.hp) * 100);
  const pHpPct = Math.max(0, (pHp / maxHp) * 100);

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn .3s"}}>
      {/* Boss info */}
      <div style={{textAlign:"center",marginBottom:6}}>
        <div style={{fontSize:48,animation:phase==="boss"?"shake .3s":"none"}}>{boss.emoji}</div>
        <div style={{color:"#FF6",fontSize:16,fontWeight:"bold"}}>{boss.name} <span style={{color:"#F88",fontSize:12}}>Lv{boss.lv}</span></div>
        <div style={{width:200,height:10,background:"#333",borderRadius:5,margin:"4px auto",overflow:"hidden"}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,#F44336,#FF6D00)`,borderRadius:5,width:`${bossHpPct}%`,transition:"width .3s"}} />
        </div>
        <div style={{color:"#F88",fontSize:11}}>HP {bHp}/{boss.hp}</div>
      </div>
      {msg && <div style={{color:"#FFD700",fontSize:13,marginBottom:6,textAlign:"center"}}>{msg}</div>}
      {/* Player grid */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},38px)`,gridTemplateRows:`repeat(${PUYO_H},38px)`,gap:2,padding:4,borderRadius:8,border:"2px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.03)"}}>
        {pGrid.map((row,y) => row.map((gem,x) => (
          <button key={`${x}-${y}`} onClick={() => select(x,y)} style={{
            width:38,height:38,borderRadius:7,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            border:selected?.x===x&&selected?.y===y?"3px solid #FFD700":"1px solid rgba(255,255,255,.08)",
            background:gem.color>=0?["#E53935","#1E88E5","#43A047","#FDD835","#8E24AA","#FF6D00"][gem.color]:"#222",
            transform:selected?.x===x&&selected?.y===y?"scale(1.12)":"scale(1)",transition:"transform .1s",
          }}>{gem.color>=0?GEM_COLORS[gem.color]:""}</button>
        )))}
      </div>
      {/* Player HP */}
      <div style={{marginTop:8,textAlign:"center"}}>
        <div style={{color:"#4CAF50",fontSize:12}}>HP {pHp}/{maxHp}</div>
        <div style={{width:200,height:8,background:"#333",borderRadius:4,margin:"4px auto"}}>
          <div style={{height:"100%",background:"#4CAF50",borderRadius:4,width:`${pHpPct}%`,transition:"width .3s"}} />
        </div>
      </div>
      {/* Win/Lose overlay */}
      {(phase==="win"||phase==="lose") && (
        <div style={{marginTop:16,fontSize:20,fontWeight:"bold",color:phase==="win"?"#4CAF50":"#F44336"}}>
          {phase==="win"?`Victoire ! +${boss.drop} +${boss.sous} sous`:"Defaite..."}
        </div>
      )}
    </div>
  );
}
