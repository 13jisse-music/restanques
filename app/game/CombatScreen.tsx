"use client";
import { useCallback, MutableRefObject } from "react";
import { CombatState, Mob, PUYO_W, PUYO_H, GEM_COLORS } from "../components/GameTypes";
import { findMatches, applyGravity, swapGems } from "../components/PuyoHelpers";
import { RES } from "../data/game-data";
import { sounds } from "../lib/sounds";
import type { PlayerClass } from "../data/classes";

interface Props {
  combat: CombatState;
  setCombat: (c: CombatState|null) => void;
  stats: { atk: number; def: number; mag: number; vit: number };
  playerClass: PlayerClass;
  maxHp: number; lv: number;
  onEnd: (won: boolean, newHp: number, drop?: string, sous?: number) => void;
  addToBag: (item: string, qty?: number) => void;
  gainXp: (amount: number) => void;
  mobsRef: MutableRefObject<Mob[]>;
}

export function CombatScreen({ combat, setCombat, stats, playerClass, maxHp, lv, onEnd, addToBag, gainXp, mobsRef }: Props) {
  const select = useCallback((x: number, y: number) => {
    if (combat.phase !== "play" || combat.animating) return;
    if (combat.selected) {
      const s = combat.selected;
      const dx = Math.abs(s.x-x), dy = Math.abs(s.y-y);
      if ((dx===1&&dy===0)||(dx===0&&dy===1)) {
        let ng = swapGems(combat.grid, s, {x,y});
        let matches = findMatches(ng);
        if (matches.size === 0) { setCombat({...combat,selected:null,msg:"Pas de match !"}); return; }
        let totalDmg = 0, combo = 0;
        const resolve = () => {
          matches = findMatches(ng);
          if (matches.size === 0) {
            const eDmg = Math.max(1, combat.enemy.atk - stats.def);
            const newPHp = combat.playerHp - eDmg;
            if (newPHp <= 0) {
              setCombat({...combat,grid:ng,playerHp:0,enemyHp:combat.enemyHp-totalDmg,phase:"lose",combo,msg:"K.O.",selected:null,animating:false});
              sounds.defeat(); return;
            }
            setCombat({...combat,grid:ng,playerHp:newPHp,enemyHp:Math.max(0,combat.enemyHp-totalDmg),turn:combat.turn+1,combo,msg:totalDmg>0?`${totalDmg} dmg ! (${combo}x)`:"",selected:null,animating:false});
            return;
          }
          combo++;
          totalDmg += Math.round(matches.size*(stats.atk+stats.mag)*playerClass.combatMul*(1+combo*0.25));
          sounds.gemMatch(combo);
          for (const key of matches) { const [mx,my]=key.split(",").map(Number); ng[my][mx].color=-1; }
          ng = applyGravity(ng);
          if (combat.enemyHp-totalDmg<=0) {
            const drop=combat.enemy.drops[Math.floor(Math.random()*combat.enemy.drops.length)];
            const sGain=combat.enemy.sous[0]+Math.floor(Math.random()*(combat.enemy.sous[1]-combat.enemy.sous[0]));
            gainXp(combat.enemy.lv*5); sounds.victory();
            const mi=mobsRef.current.findIndex(m=>m.id===combat.enemy.id); if(mi>=0) mobsRef.current[mi].hp=0;
            setCombat({...combat,grid:ng,enemyHp:0,combo,phase:"win",msg:`Victoire ! +${RES[drop]?.emoji||drop} +${sGain} sous`,selected:null,animating:false});
            setTimeout(()=>onEnd(true,combat.playerHp,drop,sGain), 100);
            return;
          }
          setTimeout(resolve, 300);
        };
        setCombat({...combat,grid:ng,animating:true,selected:null});
        setTimeout(resolve, 200);
      } else { setCombat({...combat,selected:{x,y}}); }
    } else { setCombat({...combat,selected:{x,y}}); }
  }, [combat, setCombat, stats, playerClass, gainXp, mobsRef, onEnd]);

  const handleEnd = () => {
    if (combat.phase === "win") onEnd(true, combat.playerHp);
    else onEnd(false, 0);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn .3s"}}>
      <div style={{textAlign:"center",marginBottom:10}}>
        <div style={{fontSize:40}}>{combat.enemy.emoji}</div>
        <div style={{color:"#FFF",fontSize:14,fontWeight:"bold"}}>{combat.enemy.name} Lv{combat.enemy.lv}</div>
        <div style={{width:160,height:8,background:"#333",borderRadius:4,margin:"4px auto"}}>
          <div style={{height:"100%",background:combat.enemyHp>combat.enemy.maxHp*0.3?"#F44336":"#D32F2F",borderRadius:4,width:`${(combat.enemyHp/combat.enemy.maxHp)*100}%`,transition:"width .3s"}} />
        </div>
        <div style={{color:"#F88",fontSize:11}}>HP {combat.enemyHp}/{combat.enemy.maxHp}</div>
      </div>
      {combat.msg && <div style={{color:"#FFD700",fontSize:13,marginBottom:8,textAlign:"center",padding:"0 20px"}}>{combat.msg}</div>}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},42px)`,gridTemplateRows:`repeat(${PUYO_H},42px)`,gap:2,background:"rgba(255,255,255,.05)",padding:6,borderRadius:10,border:"2px solid rgba(255,255,255,.1)"}}>
        {combat.grid.map((row,y)=>row.map((gem,x)=>(
          <button key={`${x}-${y}`} onClick={()=>select(x,y)} style={{
            width:42,height:42,borderRadius:8,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            border:combat.selected?.x===x&&combat.selected?.y===y?"3px solid #FFD700":"1px solid rgba(255,255,255,.1)",
            background:gem.color>=0?["#E53935","#1E88E5","#43A047","#FDD835","#8E24AA","#FF6D00"][gem.color]:"#222",
            transition:"transform .15s",transform:combat.selected?.x===x&&combat.selected?.y===y?"scale(1.15)":"scale(1)",
          }}>{gem.color>=0?GEM_COLORS[gem.color]:""}</button>
        )))}
      </div>
      <div style={{marginTop:10,textAlign:"center"}}>
        <div style={{color:"#4CAF50",fontSize:13}}>HP {combat.playerHp}/{maxHp}</div>
        <div style={{width:160,height:8,background:"#333",borderRadius:4,margin:"4px auto"}}>
          <div style={{height:"100%",background:"#4CAF50",borderRadius:4,width:`${(combat.playerHp/maxHp)*100}%`,transition:"width .3s"}} />
        </div>
      </div>
      {(combat.phase==="win"||combat.phase==="lose") && (
        <button onClick={handleEnd} style={{marginTop:14,padding:"12px 40px",background:combat.phase==="win"?"linear-gradient(135deg,#6B8E23,#556B2F)":"linear-gradient(135deg,#8B0000,#5C0000)",color:"#FFF",border:"2px solid #DAA520",borderRadius:12,fontSize:16,fontWeight:"bold",cursor:"pointer"}}>
          {combat.phase==="win"?"Continuer":"Respawn"}
        </button>
      )}
    </div>
  );
}
