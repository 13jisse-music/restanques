"use client";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { RECIPES, RES } from "../data/game-data";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void }

export function KitchenPanel({ gs, onUpdateGs, onClose }: Props) {
  const cook = (recipeId: string) => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    for (const [item, qty] of Object.entries(recipe.recipe)) {
      if ((gs.bag[item] || 0) < qty) return;
    }
    const nb = {...gs.bag};
    for (const [item, qty] of Object.entries(recipe.recipe)) nb[item] = (nb[item] || 0) - qty;
    nb[recipeId] = (nb[recipeId] || 0) + 1;
    sounds.craft();

    // Apply immediate effects
    let nhp = gs.hp;
    if (recipe.effect.stat === "hp") nhp = Math.min(gs.maxHp + gs.lv * 5, nhp + recipe.effect.val);

    onUpdateGs({ bag: nb, hp: nhp });
  };

  return (
    <Panel title="🍳 Cuisine" onClose={onClose}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {RECIPES.map(r => {
          const canMake = Object.entries(r.recipe).every(([item, qty]) => (gs.bag[item] || 0) >= qty);
          return (
            <button key={r.id} onClick={() => canMake && cook(r.id)} style={{
              padding:10,background:canMake ? "rgba(76,175,80,.2)" : "rgba(255,255,255,.05)",
              border: canMake ? "1px solid #4CAF50" : "1px solid rgba(255,255,255,.1)",
              borderRadius:8,color:"#FFF",cursor:canMake ? "pointer" : "default",
              opacity:canMake ? 1 : 0.5,textAlign:"left",fontSize:13,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22}}>{r.emoji}</span>
                <div>
                  <div style={{fontWeight:"bold"}}>{r.name}</div>
                  <div style={{fontSize:10,color:"#AAA"}}>{r.desc}</div>
                  <div style={{fontSize:10,color:"#888",marginTop:2}}>
                    {Object.entries(r.recipe).map(([i,q]) => `${RES[i]?.emoji||i}×${q}`).join(" ")}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{fontSize:11,color:"#666",marginTop:8,textAlign:"center"}}>
        Les potions soignent, les plats donnent des buffs temporaires
      </div>
    </Panel>
  );
}
