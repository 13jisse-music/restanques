"use client";
import { GameState } from "../components/GameTypes";
import type { PlayerClass } from "../data/classes";

interface Props {
  playerClass: PlayerClass; playerName: string; gs: GameState;
  lv: number; xp: number; biomeEmoji: string; biomeName: string;
  dayPhase: "day"|"dusk"|"night"|"dawn";
  timeOfDay?: number;
}

export function GameHUD({ playerClass, playerName, gs, lv, xp, biomeEmoji, biomeName, dayPhase, timeOfDay = 0 }: Props) {
  const isDay = dayPhase === "day" || dayPhase === "dawn";
  const rotDeg = timeOfDay * 360;

  return (
    <>
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(rgba(0,0,0,.7),transparent)",pointerEvents:"none"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:13,color:"#FFF"}}>{playerClass.emoji} {playerName}</span>
          <span style={{fontSize:12,color:"#4CAF50"}}>HP{gs.hp}/{gs.maxHp+lv*5}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>Lv{lv}</span>
          <span style={{fontSize:12,color:"#FFD700"}}>☀️{gs.sous}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",pointerEvents:"auto"}}>
          <span style={{fontSize:11,color:"#CCC"}}>{biomeEmoji} {biomeName}</span>
          {/* 40x40 clock */}
          <div style={{
            position:"relative",width:40,height:40,borderRadius:"50%",
            border:"2px solid #DAA520",overflow:"hidden",flexShrink:0,
          }}>
            {/* Rotating sky half / dark half */}
            <div style={{
              position:"absolute",inset:0,borderRadius:"50%",
              background:`conic-gradient(from 0deg, #87CEEB 0deg, #87CEEB 180deg, #1A1A4E 180deg, #1A1A4E 360deg)`,
              transform:`rotate(${rotDeg}deg)`,transition:"transform 1s linear",
            }}>
              {/* Sun at top, counter-rotated */}
              <div style={{position:"absolute",top:1,left:"50%",transform:`translateX(-50%) rotate(${-rotDeg}deg)`,fontSize:10,lineHeight:1}}>☀️</div>
              {/* Moon at bottom, counter-rotated */}
              <div style={{position:"absolute",bottom:1,left:"50%",transform:`translateX(-50%) rotate(${-rotDeg}deg)`,fontSize:10,lineHeight:1}}>🌙</div>
            </div>
            {/* Fixed golden needle */}
            <div style={{
              position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",
              width:2,height:10,background:"#DAA520",borderRadius:1,zIndex:2,
            }} />
            {/* Day/Night label */}
            <div style={{
              position:"absolute",bottom:-1,left:"50%",transform:"translateX(-50%)",
              fontSize:7,color:"#DAA520",fontWeight:"bold",zIndex:3,
              textShadow:"0 0 3px #000, 0 0 3px #000",whiteSpace:"nowrap",
            }}>{isDay ? "Jour" : "Nuit"}</div>
          </div>
        </div>
      </div>
      <div style={{position:"absolute",top:32,left:10,right:10,zIndex:10,height:3,background:"rgba(255,255,255,.15)",borderRadius:2}}>
        <div style={{height:"100%",background:"#FFD700",borderRadius:2,width:`${(xp/(lv*20))*100}%`,transition:"width .3s"}} />
      </div>
    </>
  );
}
