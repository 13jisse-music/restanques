"use client";
import { useState } from "react";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void }

export function BedroomPanel({ gs, onUpdateGs, onClose }: Props) {
  const [sleeping, setSleeping] = useState(false);
  const fullHp = gs.maxHp + gs.lv * 5;
  const needsRest = gs.hp < fullHp;

  const sleep = () => {
    if (!needsRest || sleeping) return;
    setSleeping(true);
    sounds.close();
    setTimeout(() => {
      onUpdateGs({ hp: fullHp });
      setSleeping(false);
      sounds.open();
    }, 2000);
  };

  return (
    <Panel title="🛏️ Chambre" onClose={onClose}>
      <div style={{textAlign:"center",padding:16}}>
        {sleeping ? (
          <>
            <div style={{fontSize:40,animation:"pulse 1s infinite"}}>💤</div>
            <div style={{color:"#AAA",fontSize:14,marginTop:10}}>Vous dormez...</div>
          </>
        ) : (
          <>
            <div style={{fontSize:40}}>🛏️</div>
            <div style={{color:"#E8D5A3",fontSize:14,marginTop:10}}>
              PV : <span style={{color: needsRest ? "#F88" : "#4CAF50"}}>{gs.hp}/{fullHp}</span>
            </div>
            <button onClick={sleep} disabled={!needsRest} style={{
              marginTop:14,padding:"10px 30px",fontSize:14,borderRadius:10,cursor:needsRest?"pointer":"default",
              background: needsRest ? "linear-gradient(135deg,#1a1a2e,#16213e)" : "rgba(255,255,255,.05)",
              border: needsRest ? "2px solid #DAA520" : "1px solid rgba(255,255,255,.1)",
              color: needsRest ? "#FFF" : "#666",
            }}>
              {needsRest ? "💤 Dormir (soigne tout)" : "✓ En pleine forme !"}
            </button>
            <div style={{fontSize:11,color:"#666",marginTop:12}}>
              Dormir restaure tous vos PV
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
