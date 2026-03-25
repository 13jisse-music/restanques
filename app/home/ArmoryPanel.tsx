"use client";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { EQUIPMENT, RES } from "../data/game-data";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void; canCraft: boolean; craftFail: number }

export function ArmoryPanel({ gs, onUpdateGs, onClose, canCraft, craftFail }: Props) {
  const craft = (equipId: string) => {
    if (!canCraft) return;
    const eq = EQUIPMENT.find(e => e.id === equipId);
    if (!eq) return;
    for (const [item, qty] of Object.entries(eq.recipe)) {
      if ((gs.bag[item] || 0) < qty) return;
    }
    if (Math.random() < craftFail) { sounds.locked(); return; }
    const nb = {...gs.bag};
    for (const [item, qty] of Object.entries(eq.recipe)) nb[item] = (nb[item] || 0) - qty;
    const ne = {...gs.equip, [eq.slot]: eq.id};
    const ns = {...gs.stats};
    for (const [k, v] of Object.entries(eq.stats)) ns[k as keyof typeof ns] += v;
    sounds.equip();
    onUpdateGs({ bag: nb, equip: ne, stats: ns });
  };

  return (
    <Panel title="⚔️ Armurerie" onClose={onClose}>
      {!canCraft ? (
        <div style={{color:"#F88",textAlign:"center",padding:20}}>Seul(e) l&apos;Artisane et l&apos;Ombre peuvent crafter !</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {EQUIPMENT.map(eq => {
            const canMake = Object.entries(eq.recipe).every(([item, qty]) => (gs.bag[item] || 0) >= qty);
            const equipped = gs.equip[eq.slot] === eq.id;
            return (
              <button key={eq.id} onClick={() => canMake && !equipped && craft(eq.id)} style={{
                padding:10,textAlign:"left",fontSize:13,color:"#FFF",borderRadius:8,cursor:canMake && !equipped ? "pointer" : "default",
                background: equipped ? "rgba(255,215,0,.15)" : canMake ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.05)",
                border: equipped ? "1px solid #DAA520" : canMake ? "1px solid #4CAF50" : "1px solid rgba(255,255,255,.1)",
                opacity: canMake || equipped ? 1 : 0.5,
              }}>
                <span style={{fontSize:20,marginRight:6}}>{eq.emoji}</span>
                <strong>{eq.name}</strong> {equipped && <span style={{color:"#DAA520",fontSize:10}}>ÉQUIPÉ</span>}
                <div style={{fontSize:10,color:"#AAA",marginTop:2}}>
                  {Object.entries(eq.stats).map(([k,v]) => `${k.toUpperCase()}+${v}`).join(" ")} | {eq.slot}
                </div>
                <div style={{fontSize:10,color:"#888"}}>
                  {Object.entries(eq.recipe).map(([i,q]) => `${RES[i]?.emoji||i}×${q}`).join(" ")}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {craftFail > 0 && <div style={{fontSize:10,color:"#F88",textAlign:"center",marginTop:6}}>⚠️ {Math.round(craftFail*100)}% chance d&apos;échec</div>}
    </Panel>
  );
}
