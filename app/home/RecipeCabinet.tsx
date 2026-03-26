"use client";
import { useState } from "react";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { EQUIPMENT, RECIPES, TOOLS, RES, BIOMES } from "../data/game-data";
import { SPELLS } from "../data/spells";
import { sounds } from "../lib/sounds";
import { CraftPuzzle } from "./CraftPuzzle";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void; canCraft: boolean; craftFail: number }

type RecipeItem = { id: string; name: string; emoji: string; recipe: Record<string, number>; category: string; desc: string; biome?: string; locked?: boolean };

export function RecipeCabinet({ gs, onUpdateGs, onClose, canCraft, craftFail }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [crafting, setCrafting] = useState<RecipeItem | null>(null);

  // Build recipe list from all sources
  const allRecipes: RecipeItem[] = [
    // Spells (level 1 recipe)
    ...SPELLS.map(s => ({ id: s.id, name: `${s.name} Nv.1`, emoji: s.emoji, recipe: s.levels[0]?.recipe || {}, category: "📖 Sorts", desc: s.levels[0]?.effect || "" })),
    // Equipment
    ...EQUIPMENT.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, recipe: e.recipe, category: e.slot === "arme" ? "⚔️ Armes" : e.slot === "armure" ? "🧥 Armures" : e.slot === "amulette" ? "📿 Amulettes" : "👡 Bottes", desc: Object.entries(e.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(" "), biome: e.biome })),
    // Kitchen
    ...RECIPES.map(r => ({ id: r.id, name: r.name, emoji: r.emoji, recipe: r.recipe, category: "🍳 Cuisine", desc: r.desc })),
    // Tools
    ...Object.entries(TOOLS).map(([k, t]) => ({ id: k, name: t.name, emoji: t.emoji, recipe: t.recipe, category: "🔧 Outils", desc: t.desc })),
  ];

  // Group by category
  const categories = [...new Set(allRecipes.map(r => r.category))];

  const canMake = (r: RecipeItem) => Object.entries(r.recipe).every(([item, qty]) => (gs.bag[item] || 0) >= qty);

  const doCraft = (r: RecipeItem) => {
    if (!canMake(r) || !canCraft) return;
    // Fail chance (Ombre)
    if (Math.random() < craftFail) {
      sounds.locked(); return;
    }
    // Simple crafts (tools, potions) = instant
    const isSimple = r.category === "🔧 Outils" || r.category === "🍳 Cuisine";
    if (isSimple) {
      completeCraft(r);
    } else {
      // Complex crafts = puzzle
      setCrafting(r);
    }
  };

  const completeCraft = (r: RecipeItem) => {
    const nb = { ...gs.bag };
    Object.entries(r.recipe).forEach(([item, qty]) => { nb[item] = (nb[item] || 0) - qty; });
    nb[r.id] = (nb[r.id] || 0) + 1;
    sounds.craft();
    onUpdateGs({ bag: nb });
    setCrafting(null);
  };

  return (
    <>
      <Panel title="📚 Armoire aux Recettes" onClose={onClose}>
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#DAA520", marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,.1)", paddingBottom: 4 }}>{cat}</div>
              {allRecipes.filter(r => r.category === cat).map(r => {
                const open = expanded === r.id;
                const ok = canMake(r);
                const biome = r.biome ? BIOMES[r.biome] : null;
                const isLocked = r.biome && !gs.bossesDefeated.includes(r.biome) && r.biome !== "garrigue";
                return (
                  <div key={r.id} style={{ marginBottom: 4 }}>
                    <button onClick={() => setExpanded(open ? null : r.id)} style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 10px", background: isLocked ? "rgba(255,255,255,.03)" : ok ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.06)",
                      border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, cursor: "pointer",
                      color: isLocked ? "#666" : "#FFF", fontSize: 13,
                    }}>
                      <span>{r.emoji} {r.name} {isLocked && "🔒"}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{open ? "▲" : "▼"}</span>
                    </button>
                    {open && !isLocked && (
                      <div style={{ padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: "0 0 8px 8px", marginTop: -2 }}>
                        <div style={{ fontSize: 12, color: "#E8D5A3", marginBottom: 6 }}>{r.desc}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                          {Object.entries(r.recipe).map(([item, qty]) => (
                            <span key={item} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: (gs.bag[item] || 0) >= qty ? "rgba(76,175,80,.2)" : "rgba(244,67,54,.2)", color: "#FFF" }}>
                              {RES[item]?.emoji || item} ×{qty} <span style={{ color: "#888" }}>({gs.bag[item] || 0})</span>
                            </span>
                          ))}
                        </div>
                        {biome && <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>Biome: {biome.emoji} {biome.name}</div>}
                        {canCraft ? (
                          <button onClick={() => doCraft(r)} disabled={!ok} style={{
                            width: "100%", padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: ok ? "pointer" : "default",
                            background: ok ? "linear-gradient(135deg,#4CAF50,#388E3C)" : "#555",
                            color: "#FFF", border: ok ? "2px solid #DAA520" : "1px solid #555", opacity: ok ? 1 : .5,
                          }}>
                            {ok ? "✨ Réaliser" : "Ingrédients insuffisants"}
                          </button>
                        ) : (
                          <div style={{ color: "#F88", fontSize: 11, textAlign: "center" }}>Le Paladin ne craft pas — achetez au comptoir</div>
                        )}
                      </div>
                    )}
                    {open && isLocked && (
                      <div style={{ padding: 8, color: "#666", fontSize: 11, textAlign: "center" }}>
                        🔒 Débloqué en atteignant : {biome?.emoji} {biome?.name || r.biome}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Panel>
      {/* Craft puzzle */}
      {crafting && <CraftPuzzle gridSize={canCraft ? 4 : 3} onSuccess={() => completeCraft(crafting)} onFail={() => { sounds.locked(); setCrafting(null); }} onClose={() => setCrafting(null)} />}
    </>
  );
}
