"use client";

interface Equipment {
  id: string;
  name: string;
  emoji: string;
  slot: string;
  stats: Record<string, number>;
  biome: string;
  recipe: Record<string, number>;
}

const EQUIPMENT: Equipment[] = [
  { id: "epee_bois", name: "Épée en bois", emoji: "🗡️", slot: "arme", stats: { atk: 2 }, biome: "garrigue", recipe: { branche: 5, pierre: 2 } },
  { id: "tunique_cuir", name: "Tunique de cuir", emoji: "🧥", slot: "armure", stats: { def: 2 }, biome: "garrigue", recipe: { herbe: 5, branche: 3 } },
  { id: "epee_fer", name: "Épée de fer", emoji: "⚔️", slot: "arme", stats: { atk: 5 }, biome: "calanques", recipe: { fer: 5, branche: 2, pierre: 3 } },
  { id: "amulette", name: "Amulette", emoji: "📿", slot: "amulette", stats: { mag: 3 }, biome: "calanques", recipe: { lavande: 5, coquillage: 2, herbe: 3 } },
  { id: "cotte_ecailles", name: "Cotte d'écailles", emoji: "🛡️", slot: "armure", stats: { def: 5 }, biome: "mines", recipe: { fer: 8, pierre: 5 } },
  { id: "sandales", name: "Sandales", emoji: "👡", slot: "bottes", stats: { vit: 2 }, biome: "mines", recipe: { herbe: 5 } },
  { id: "trident", name: "Trident corail", emoji: "🔱", slot: "arme", stats: { atk: 7, mag: 3 }, biome: "mer", recipe: { corail: 5, perle: 3, fer: 3 } },
  { id: "collier_perles", name: "Collier perles", emoji: "💎", slot: "amulette", stats: { mag: 5, def: 2 }, biome: "mer", recipe: { perle: 5, cristal: 2 } },
  { id: "lame_mistral", name: "Lame Mistral", emoji: "🗡️", slot: "arme", stats: { atk: 12 }, biome: "restanques", recipe: { cristal: 5, fer: 5, perle: 3 } },
  { id: "armure_ancienne", name: "Armure ancienne", emoji: "🛡️", slot: "armure", stats: { def: 8 }, biome: "restanques", recipe: { pierre: 10, fer: 8, cristal: 3 } },
];

const TOOLS: { id: string; name: string; emoji: string; recipe: Record<string, number>; desc: string }[] = [
  { id: "torche", name: "Torche", emoji: "🔦", recipe: { branche: 2, herbe: 1 }, desc: "Visibilité 7×7, 3min" },
  { id: "piege", name: "Piège", emoji: "🪤", recipe: { pierre: 3 }, desc: "Stun monstre 5s" },
  { id: "pierre_rappel", name: "Pierre de rappel", emoji: "🏠", recipe: { pierre: 5, cristal: 1 }, desc: "Téléport maison" },
];

const ITEM_NAMES: Record<string, string> = {
  branche: "🪵", herbe: "🌿", lavande: "💜", pierre: "🪨",
  coquillage: "🐚", sel: "🧂", fer: "⛏️", ocre: "🟠",
  cristal: "💎", poisson: "🐟", perle: "⚪", corail: "🪸",
};

function hasRecipe(inv: { id: string; qty: number }[], recipe: Record<string, number>): boolean {
  for (const [id, need] of Object.entries(recipe)) {
    const have = inv.find(i => i.id === id)?.qty || 0;
    if (have < need) return false;
  }
  return true;
}

interface ArmoryPanelProps {
  inventory: { id: string; qty: number }[];
  ownedEquip: string[];
  unlockedBiomes: string[];
  onCraft: (equipId: string) => void;
  onCraftTool: (toolId: string) => void;
  onClose: () => void;
}

export function ArmoryPanel({ inventory, ownedEquip, unlockedBiomes, onCraft, onCraftTool, onClose }: ArmoryPanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 380, width: "94%",
        maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F" }}>⚔️ Armurerie</div>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>❌</button>
        </div>

        {/* Equipment by biome */}
        {["garrigue", "calanques", "mines", "mer", "restanques"].map(biome => {
          const unlocked = unlockedBiomes.includes(biome);
          const biomeEquip = EQUIPMENT.filter(e => e.biome === biome);
          if (biomeEquip.length === 0) return null;
          return (
            <div key={biome} style={{ marginBottom: 10, opacity: unlocked ? 1 : 0.4 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#5C4033", marginBottom: 4 }}>
                {biome.charAt(0).toUpperCase() + biome.slice(1)} {!unlocked && "🔒"}
              </div>
              {biomeEquip.map(eq => {
                const owned = ownedEquip.includes(eq.id);
                const canCraft = !owned && unlocked && hasRecipe(inventory, eq.recipe);
                return (
                  <div key={eq.id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", marginBottom: 4, borderRadius: 8,
                    background: owned ? "rgba(76,175,80,0.15)" : "rgba(0,0,0,0.05)",
                    border: owned ? "2px solid #4CAF50" : "1px solid rgba(0,0,0,0.1)",
                  }}>
                    <div style={{ fontSize: 24, width: 32, textAlign: "center" }}>{eq.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F" }}>
                        {eq.name} {owned && <span style={{ color: "#4CAF50" }}>✅</span>}
                      </div>
                      <div style={{ fontSize: 9, color: "#5C4033" }}>
                        {Object.entries(eq.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(" ")} — {eq.slot}
                      </div>
                      {!owned && (
                        <div style={{ fontSize: 8, color: canCraft ? "#4CAF50" : "#999" }}>
                          {Object.entries(eq.recipe).map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`).join(" ")}
                        </div>
                      )}
                    </div>
                    {canCraft && !owned && (
                      <button onClick={() => onCraft(eq.id)} style={{
                        padding: "6px 10px", borderRadius: 6, fontSize: 10, fontWeight: "bold",
                        background: "#E67E22", color: "#FFF", border: "1px solid #D35400", cursor: "pointer",
                      }}>Forger</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Tools */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F", marginTop: 10, marginBottom: 6 }}>Outils :</div>
        {TOOLS.map(tool => {
          const canCraft = hasRecipe(inventory, tool.recipe);
          return (
            <button key={tool.id} disabled={!canCraft} onClick={() => canCraft && onCraftTool(tool.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 10px", marginBottom: 4, borderRadius: 8,
              background: canCraft ? "linear-gradient(135deg, #8B7355, #5C4033)" : "#888",
              color: "#FFF", border: "2px solid #5C4033", cursor: canCraft ? "pointer" : "default",
              opacity: canCraft ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 20 }}>{tool.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{tool.name}</div>
                <div style={{ fontSize: 9, opacity: 0.7 }}>{tool.desc}</div>
                <div style={{ fontSize: 8, opacity: 0.5 }}>
                  {Object.entries(tool.recipe).map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`).join(" ")}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
