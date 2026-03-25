"use client";
import { useState, useEffect } from "react";
import { Panel } from "../components/Panel";
import { GameState, GardenPlot } from "../components/GameTypes";
import { SEEDS } from "../data/game-data";
import { sounds } from "../lib/sounds";
import { RES } from "../data/game-data";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void }

export function GardenPanel({ gs, onUpdateGs, onClose }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const plant = (plotIdx: number, seedId: string) => {
    const seed = SEEDS.find(s => s.id === seedId);
    if (!seed) return;
    // Check if player has herbe (seed cost)
    if ((gs.bag["herbe"] || 0) < 1) return;
    const nb = {...gs.bag, herbe: (gs.bag["herbe"] || 0) - 1};
    const ng = [...gs.garden];
    ng[plotIdx] = { ...ng[plotIdx], seedId, plantedAt: Date.now(), growTime: seed.grow * 1000, yields: seed.yields, qty: seed.qty, ready: false };
    sounds.harvest();
    onUpdateGs({ bag: nb, garden: ng });
  };

  const harvest = (plotIdx: number) => {
    const plot = gs.garden[plotIdx];
    if (!plot.seedId || !plot.ready) return;
    const qty = plot.qty[0] + Math.floor(Math.random() * (plot.qty[1] - plot.qty[0] + 1));
    const nb = {...gs.bag, [plot.yields]: (gs.bag[plot.yields] || 0) + qty};
    const ng = [...gs.garden];
    ng[plotIdx] = { ...ng[plotIdx], seedId: null, plantedAt: 0, ready: false };
    sounds.harvest();
    onUpdateGs({ bag: nb, garden: ng });
  };

  // Update ready state
  const garden = gs.garden.map(p => ({
    ...p,
    ready: p.seedId ? (now - p.plantedAt >= p.growTime) : false,
  }));

  return (
    <Panel title="🌿 Jardin (16 parcelles)" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {garden.map((plot, i) => {
          const seed = plot.seedId ? SEEDS.find(s => s.id === plot.seedId) : null;
          const progress = plot.seedId && !plot.ready ? Math.min(1, (now - plot.plantedAt) / plot.growTime) : 0;
          return (
            <div key={i} style={{background: plot.ready ? "rgba(76,175,80,.25)" : plot.seedId ? "rgba(139,119,42,.2)" : "rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:6,textAlign:"center",minHeight:60}}>
              {plot.seedId ? (
                <>
                  <div style={{fontSize:20}}>{seed?.emoji || "🌱"}</div>
                  {plot.ready ? (
                    <button onClick={() => harvest(i)} style={{background:"#4CAF50",color:"#FFF",border:"none",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",marginTop:4}}>Récolter</button>
                  ) : (
                    <>
                      <div style={{fontSize:9,color:"#AAA"}}>{Math.round(progress * 100)}%</div>
                      <div style={{height:3,background:"#333",borderRadius:2,marginTop:2}}>
                        <div style={{height:"100%",background:"#8BC34A",borderRadius:2,width:`${progress*100}%`}} />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <div style={{fontSize:16,color:"#555"}}>🟫</div>
                  {SEEDS.slice(0,2).map(s => (
                    <button key={s.id} onClick={() => plant(i, s.id)} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:4,padding:"2px 4px",fontSize:9,color:"#CCC",cursor:"pointer"}}>
                      {s.emoji} {s.name.slice(0,6)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{fontSize:11,color:"#888",marginTop:8,textAlign:"center"}}>
        Coût: 1 🌿 par plantation | {RES.herbe.emoji} Herbe: {gs.bag["herbe"] || 0}
      </div>
    </Panel>
  );
}
