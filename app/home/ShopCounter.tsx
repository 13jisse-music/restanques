"use client";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { RES, SHOP_ITEMS } from "../data/game-data";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void }

export function ShopCounter({ gs, onUpdateGs, onClose }: Props) {
  const buy = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || gs.sous < item.price) return;
    const nb = {...gs.bag, [itemId]: (gs.bag[itemId] || 0) + 1};
    sounds.craft();
    onUpdateGs({ bag: nb, sous: gs.sous - item.price });
  };

  const sell = (itemId: string) => {
    if ((gs.bag[itemId] || 0) <= 0) return;
    const price = Math.floor((RES[itemId]?.hp || 5) / 2);
    const nb = {...gs.bag, [itemId]: (gs.bag[itemId] || 0) - 1};
    sounds.click();
    onUpdateGs({ bag: nb, sous: gs.sous + price });
  };

  return (
    <Panel title="💰 Comptoir" onClose={onClose}>
      <div style={{color:"#FFD700",fontSize:14,textAlign:"center",marginBottom:10}}>💰 {gs.sous} sous</div>
      <div style={{fontSize:13,color:"#DAA520",marginBottom:6,fontWeight:"bold"}}>Acheter</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {SHOP_ITEMS.map(item => (
          <button key={item.id} onClick={() => buy(item.id)} style={{
            padding:8,borderRadius:8,fontSize:13,color:"#FFF",textAlign:"left",cursor:gs.sous>=item.price?"pointer":"default",
            background: gs.sous >= item.price ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.05)",
            border: gs.sous >= item.price ? "1px solid #4CAF50" : "1px solid rgba(255,255,255,.1)",
            opacity: gs.sous >= item.price ? 1 : 0.5,
          }}>
            <span style={{fontSize:18}}>{item.emoji}</span> {item.name} — <span style={{color:"#FFD700"}}>{item.price}💰</span>
          </button>
        ))}
      </div>
      <div style={{fontSize:13,color:"#DAA520",marginBottom:6,fontWeight:"bold"}}>Vendre</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {Object.entries(gs.bag).filter(([,v]) => v > 0).filter(([k]) => RES[k]).map(([id, qty]) => {
          const price = Math.floor((RES[id]?.hp || 5) / 2);
          return (
            <button key={id} onClick={() => sell(id)} style={{
              padding:6,borderRadius:6,fontSize:12,color:"#FFF",textAlign:"left",cursor:"pointer",
              background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
            }}>
              {RES[id]?.emoji} {RES[id]?.name} ×{qty} → <span style={{color:"#FFD700"}}>{price}💰</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
