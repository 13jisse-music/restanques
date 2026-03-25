"use client";
import { useState } from "react";
import { Panel } from "../components/Panel";
import { sounds } from "../lib/sounds";

interface Props { onClose: () => void; bossesDefeated: string[] }

export function MysteryCharacter({ onClose, bossesDefeated }: Props) {
  const [revealed, setRevealed] = useState(false);
  const allBosses = ["garrigue","calanques","mines","mer","restanques"];
  const progress = allBosses.filter(b => bossesDefeated.includes(b)).length;
  const unlocked = progress >= 5;

  const reveal = () => {
    if (!unlocked) return;
    sounds.unlock();
    setRevealed(true);
  };

  return (
    <Panel title="??? Personnage Mystere" onClose={onClose}>
      <div style={{textAlign:"center",padding:16}}>
        {!revealed ? (
          <>
            <div style={{fontSize:64,filter:unlocked?"none":"blur(8px)",transition:"filter .5s"}}>
              {unlocked ? "🎭" : "❓"}
            </div>
            <div style={{color:"#888",fontSize:13,margin:"12px 0"}}>
              Boss vaincus : {progress}/5
            </div>
            <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:14}}>
              {allBosses.map(b => (
                <div key={b} style={{width:24,height:24,borderRadius:12,
                  background:bossesDefeated.includes(b)?"#4CAF50":"#333",
                  border:"1px solid rgba(255,255,255,.2)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
                }}>{bossesDefeated.includes(b)?"✓":""}</div>
              ))}
            </div>
            {unlocked ? (
              <button onClick={reveal} style={{
                padding:"10px 24px",background:"linear-gradient(135deg,#8B0000,#4A0000)",
                border:"2px solid #DAA520",borderRadius:10,color:"#FFF",fontSize:14,
                fontWeight:"bold",cursor:"pointer",animation:"glow 2s infinite",
              }}>Reveler le personnage</button>
            ) : (
              <div style={{color:"#666",fontSize:12}}>Vainquez tous les boss pour debloquer</div>
            )}
          </>
        ) : (
          <>
            <div style={{fontSize:64,animation:"bounce 1s"}}>🎭</div>
            <div style={{color:"#DAA520",fontSize:18,fontWeight:"bold",marginTop:8}}>Le Troubadour</div>
            <div style={{color:"#E8D5A3",fontSize:13,lineHeight:1.6,marginTop:8}}>
              Classe secrete ! Combine combat et craft.
              <br/>ATK+2 DEF+1 MAG+2 VIT+2
              <br/>Peut crafter ET combattre a pleine puissance.
              <br/>Bonus : sorts coutent 20% moins cher.
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
