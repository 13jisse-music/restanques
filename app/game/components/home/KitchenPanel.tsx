"use client";

interface KitchenPanelProps {
  inventory: { id: string; qty: number }[];
  onCraft: (recipeId: string) => void;
  onClose: () => void;
}

const RECIPES: { id: string; name: string; emoji: string; recipe: Record<string, number>; desc: string; type: string }[] = [
  { id: "potion", name: "Potion", emoji: "🧪", recipe: { herbe: 3 }, desc: "Soigne 10 PV", type: "potion" },
  { id: "potion_plus", name: "Potion+", emoji: "🧪", recipe: { herbe_fraiche: 2, champignon: 1 }, desc: "Soigne 20 PV", type: "potion" },
  { id: "ragout", name: "Ragoût", emoji: "🍖", recipe: { herbe_fraiche: 2, poisson: 1 }, desc: "ATK+3 5min", type: "food" },
  { id: "bouillon", name: "Bouillon", emoji: "🛡️", recipe: { herbe_fraiche: 1, baies: 1 }, desc: "DEF+3 5min", type: "food" },
  { id: "infusion", name: "Infusion", emoji: "✨", recipe: { lavande_pure: 2, champignon: 1 }, desc: "MAG+5 5min", type: "food" },
  { id: "festin_heros", name: "Festin héros", emoji: "💪", recipe: { ragout: 1, potion_plus: 1, infusion: 1 }, desc: "ALL+3 10min", type: "food" },
];

const ITEM_NAMES: Record<string, string> = {
  herbe: "🌿Herbe", herbe_fraiche: "🌿Herbe fr.", champignon: "🍄Champi",
  lavande_pure: "💜Lavande", poisson: "🐟Poisson", baies: "🫐Baies",
  ragout: "🍖Ragoût", potion_plus: "🧪Potion+", infusion: "✨Infusion",
};

function hasRecipe(inv: { id: string; qty: number }[], recipe: Record<string, number>): boolean {
  for (const [id, need] of Object.entries(recipe)) {
    const have = inv.find(i => i.id === id)?.qty || 0;
    if (have < need) return false;
  }
  return true;
}

export function KitchenPanel({ inventory, onCraft, onClose }: KitchenPanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 360, width: "92%",
        maxHeight: "85vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F" }}>🍳 Cuisine</div>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>❌</button>
        </div>

        {/* Potions */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F", marginBottom: 6 }}>Potions :</div>
        {RECIPES.filter(r => r.type === "potion").map(recipe => {
          const canCraft = hasRecipe(inventory, recipe.recipe);
          return (
            <button key={recipe.id} disabled={!canCraft} onClick={() => canCraft && onCraft(recipe.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "10px 12px", marginBottom: 6, borderRadius: 8,
              background: canCraft ? "linear-gradient(135deg, #4CAF50, #2E7D32)" : "#888",
              color: "#FFF", border: "2px solid #3D5E1A", cursor: canCraft ? "pointer" : "default",
              opacity: canCraft ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 24 }}>{recipe.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: "bold" }}>{recipe.name}</div>
                <div style={{ fontSize: 9, opacity: 0.8 }}>{recipe.desc}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>
                  {Object.entries(recipe.recipe).map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`).join(" + ")}
                </div>
              </div>
            </button>
          );
        })}

        {/* Food/Buffs */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F", marginTop: 10, marginBottom: 6 }}>Plats (buffs) :</div>
        {RECIPES.filter(r => r.type === "food").map(recipe => {
          const canCraft = hasRecipe(inventory, recipe.recipe);
          return (
            <button key={recipe.id} disabled={!canCraft} onClick={() => canCraft && onCraft(recipe.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "10px 12px", marginBottom: 6, borderRadius: 8,
              background: canCraft ? "linear-gradient(135deg, #E67E22, #D35400)" : "#888",
              color: "#FFF", border: "2px solid #8B4513", cursor: canCraft ? "pointer" : "default",
              opacity: canCraft ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 24 }}>{recipe.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: "bold" }}>{recipe.name}</div>
                <div style={{ fontSize: 9, opacity: 0.8 }}>{recipe.desc}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>
                  {Object.entries(recipe.recipe).map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`).join(" + ")}
                </div>
              </div>
            </button>
          );
        })}

        <div style={{ fontSize: 9, color: "#888", textAlign: "center", marginTop: 8 }}>
          Potions gratuites pour le Paladin. Plats payants.
        </div>
      </div>
    </div>
  );
}
