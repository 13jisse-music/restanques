"use client";
import { GameState } from "../components/GameTypes";
import type { PlayerClass } from "../data/classes";

interface Props {
  playerClass: PlayerClass; playerName: string; gs: GameState;
  lv: number; xp: number; biomeEmoji: string; biomeName: string;
  dayPhase: "day"|"dusk"|"night"|"dawn";
}

export function GameHUD({ playerClass, playerName, gs, lv, xp, biomeEmoji, biomeName, dayPhase }: Props) {
  return (
    <>
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(rgba(0,0,0,.7),transparent)",pointerEvents:"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:13,color:"#FFF"}}>{playerClass.emoji} {playerName}</span>
          <span style={{fontSize:12,color:"#4CAF50"}}>HP{gs.hp}/{gs.maxHp+lv*5}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>Lv{lv}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>{gs.sous}$</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:11,color:"#CCC"}}>{biomeEmoji} {biomeName}</span>
          <span style={{fontSize:11,color:"#AAA"}}>{dayPhase==="day"?"D":dayPhase==="night"?"N":"~"}</span>
        </div>
      </div>
      <div style={{position:"absolute",top:32,left:10,right:10,zIndex:10,height:3,background:"rgba(255,255,255,.15)",borderRadius:2}}>
        <div style={{height:"100%",background:"#FFD700",borderRadius:2,width:`${(xp/(lv*20))*100}%`,transition:"width .3s"}} />
      </div>
    </>
  );
}
