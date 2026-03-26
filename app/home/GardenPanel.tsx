"use client";
import { useState, useEffect } from "react";
import { Panel } from "../components/Panel";
import { GameState, GardenPlot } from "../components/GameTypes";
import { SEEDS } from "../data/game-data";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void }

export function GardenPanel({ gs, onUpdateGs, onClose }: Props) {
  const [now, setNow] = useState(Date.now());
  const [selectPlot, setSelectPlot] = useState<number|null>(null);
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const plant = (plotIdx: number, seedId: string) => {
    const seed = SEEDS.find(s => s.id === seedId);
    if (!seed || (gs.bag[seedId] || 0) < 1) return;
    const nb = {...gs.bag, [seedId]: (gs.bag[seedId] || 0) - 1};
    const ng = [...gs.garden];
    // Artisane bonus: grow 2x faster
    const growTime = seed.grow * 1000;
    ng[plotIdx] = { ...ng[plotIdx], seedId, plantedAt: Date.now(), growTime, yields: seed.yields, qty: seed.qty, ready: false };
    sounds.gardenHarvest();
    onUpdateGs({ bag: nb, garden: ng });
    setSelectPlot(null);
  };

  const harvest = (plotIdx: number) => {
    const plot = gs.garden[plotIdx];
    if (!plot.seedId || !isReady(plot)) return;
    const qty = plot.qty[0] + Math.floor(Math.random() * (plot.qty[1] - plot.qty[0] + 1));
    const nb = {...gs.bag, [plot.yields]: (gs.bag[plot.yields] || 0) + qty};
    const ng = [...gs.garden];
    ng[plotIdx] = { ...ng[plotIdx], seedId: null, plantedAt: 0, ready: false };
    sounds.gardenHarvest();
    onUpdateGs({ bag: nb, garden: ng });
  };

  const isReady = (p: GardenPlot) => p.seedId && p.plantedAt > 0 && now - p.plantedAt >= p.growTime;
  const progress = (p: GardenPlot) => p.seedId && p.plantedAt > 0 ? Math.min(1, (now - p.plantedAt) / p.growTime) : 0;
  const remaining = (p: GardenPlot) => {
    if (!p.seedId || isReady(p)) return "";
    const ms = Math.max(0, p.growTime - (now - p.plantedAt));
    const s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // Visual emoji based on progress
  const plantEmoji = (p: GardenPlot) => {
    if (!p.seedId) return "";
    const pr = progress(p);
    if (isReady(p)) { const s = SEEDS.find(se => se.id === p.seedId); return s?.emoji || "🌱"; }
    if (pr < 0.3) return "🌱";
    if (pr < 0.8) return "🌿";
    return SEEDS.find(se => se.id === p.seedId)?.emoji || "🌿";
  };

  return (
    <Panel title="🌿 Jardin — Bacs de plantation" onClose={onClose}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
        {gs.garden.slice(0, 4).map((plot, i) => {
          const seed = plot.seedId ? SEEDS.find(s => s.id === plot.seedId) : null;
          const ready = isReady(plot);
          const pr = progress(plot);
          return (
            <div key={i} style={{
              background: ready ? "rgba(76,175,80,.2)" : plot.seedId ? "rgba(101,67,33,.25)" : "rgba(80,60,30,.15)",
              border: ready ? "2px solid #4CAF50" : "2px solid rgba(139,115,85,.3)",
              borderRadius: 12, padding: 10, textAlign: "center",
              animation: ready ? "pulse 1.5s infinite" : "none",
            }}>
              {plot.seedId ? (
                <>
                  <div style={{fontSize:32,marginBottom:4}}>{plantEmoji(plot)}</div>
                  <div style={{fontSize:11,fontWeight:"bold",color:"#E8D5A3"}}>{seed?.name || "..."}</div>
                  {ready ? (
                    <button onClick={() => harvest(i)} style={{marginTop:6,padding:"8px 16px",background:"linear-gradient(135deg,#4CAF50,#388E3C)",color:"#FFF",border:"2px solid #DAA520",borderRadius:8,fontSize:13,fontWeight:"bold",cursor:"pointer",animation:"pulse 1s infinite"}}>🌾 Récolter</button>
                  ) : (
                    <>
                      <div style={{width:"100%",height:6,background:"#333",borderRadius:3,marginTop:6}}>
                        <div style={{height:"100%",background:"linear-gradient(90deg,#8BC34A,#4CAF50)",borderRadius:3,width:`${pr*100}%`,transition:"width 1s"}} />
                      </div>
                      <div style={{fontSize:14,color:"#FFD700",fontWeight:"bold",marginTop:4}}>{remaining(plot)}</div>
                    </>
                  )}
                </>
              ) : (
                <button onClick={() => setSelectPlot(i)} style={{width:"100%",padding:"16px 8px",background:"rgba(255,255,255,.05)",border:"2px dashed rgba(139,115,85,.3)",borderRadius:10,color:"#AAA",fontSize:13,cursor:"pointer"}}>
                  <div style={{fontSize:24,marginBottom:4}}>🟫</div>
                  🌱 Planter
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Seed selection popup */}
      {selectPlot !== null && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={() => setSelectPlot(null)}>
          <div onClick={e => e.stopPropagation()} style={{background:"linear-gradient(#F5ECD7,#E8D5A3)",border:"3px solid #5C4033",borderRadius:14,padding:16,maxWidth:300,width:"90%",color:"#3D2B1F"}}>
            <div style={{fontSize:15,fontWeight:"bold",marginBottom:10,textAlign:"center"}}>🌱 Que planter ?</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SEEDS.filter(s => (gs.bag[s.id] || 0) > 0).map(s => (
                <button key={s.id} onClick={() => plant(selectPlot, s.id)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",
                  background:"rgba(255,255,255,.4)",border:"2px solid #8B7355",borderRadius:10,cursor:"pointer",fontSize:13,
                }}>
                  <span>{s.emoji} {s.name}</span>
                  <span style={{color:"#8B7355",fontSize:11}}>({Math.round(s.grow/60)} min) ×{gs.bag[s.id]||0}</span>
                </button>
              ))}
              {SEEDS.filter(s => (gs.bag[s.id] || 0) > 0).length === 0 && (
                <div style={{textAlign:"center",color:"#888",padding:16}}>Pas de graines dans l'inventaire</div>
              )}
            </div>
            <button onClick={() => setSelectPlot(null)} style={{marginTop:10,width:"100%",padding:"8px",background:"#5C4033",color:"#E8D5A3",border:"2px solid #8B7355",borderRadius:8,cursor:"pointer",fontSize:12}}>Annuler</button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
    </Panel>
  );
}
