"use client";

import { useState } from "react";
import { RES, TOOLS, CARD_RECIPES, EQUIPMENTS, BAG_LIMIT, countBagItems, isBagFull, GARDEN_SEEDS, RECIPES_CUISINE, FUSION_RESULTS, TORCH_RECIPE, type CombatCard, type EquipSlot, type GardenPlot } from "../../lib/constants";
import { itemSprite } from "../../lib/sprites";
import { sounds } from "../../lib/sounds";
import { CraftPuzzle } from "./CraftPuzzle";

const UI_BTN = (c: string, tc = "#FFF8E7", sm = false): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${c}, ${c}CC)`, color: tc,
  border: "3px solid #3D2B1F", padding: sm ? "8px 12px" : "12px 18px",
  fontSize: sm ? "12px" : "14px", fontWeight: "bold",
  fontFamily: "'Courier New',monospace", cursor: "pointer",
  borderRadius: "8px", boxShadow: "2px 2px 0 #1A1410, inset 0 1px 0 rgba(255,255,255,0.2)",
});
const CLOSE = { background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: "6px", padding: "4px 10px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" as const };

interface CampPanelProps {
  tab: string;
  hp: number; maxHp: number;
  inv: string[]; chest: string[];
  tools: string[]; cards: CombatCard[];
  equipped: Record<EquipSlot, string | null>;
  ownedEquip: string[];
  onSetTab: (tab: string) => void;
  onClose: () => void;
  onSetInv: (fn: (p: string[]) => string[]) => void;
  onSetChest: (fn: (p: string[]) => string[]) => void;
  onSetTools: (fn: (p: string[]) => string[]) => void;
  onSetCards: (fn: (p: CombatCard[]) => CombatCard[]) => void;
  onSetEquipped: (fn: (p: Record<EquipSlot, string | null>) => Record<EquipSlot, string | null>) => void;
  onSetOwnedEquip: (fn: (p: string[]) => string[]) => void;
  onNotify: (msg: string) => void;
  // Garden, cuisine, fusion, torches
  playerClass: string;
  garden: GardenPlot[];
  onSetGarden: (fn: (p: GardenPlot[]) => GardenPlot[]) => void;
  torches: number;
  onSetTorches: (fn: (t: number) => number) => void;
}

export function CampPanel(props: CampPanelProps) {
  const { tab, hp, maxHp, inv, chest, tools, cards, equipped, ownedEquip, onSetTab, onClose, onSetInv, onSetChest, onSetTools, onSetCards, onSetEquipped, onSetOwnedEquip, onNotify, playerClass, garden, onSetGarden, torches, onSetTorches } = props;
  const isArtisan = playerClass === "artisane";
  const isOmbre = playerClass === "ombre";
  const [puzzleRecipe, setPuzzleRecipe] = useState<{ name: string; emoji: string; ingredients: { id: string; emoji: string; qty: number }[]; recipeIdx: number } | null>(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: 14, maxWidth: 360, width: "100%", color: "#3D2B1F", maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>⛺ Camp de Base</span>
          <button style={CLOSE} onClick={onClose}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {/* Main menu — big icon grid */}
          {tab === "menu" ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { id: "rest", emoji: "🛏️", title: "Repos", sub: "Soigner", show: true },
              { id: "chest", emoji: "📦", title: "Coffre", sub: "Échanger", show: true },
              { id: "craft", emoji: "🔨", title: "Crafter", sub: "Forger", show: true },
              { id: "equip", emoji: "⚔️", title: "Perso", sub: "Équiper", show: true },
              { id: "garden", emoji: "🌱", title: "Jardin", sub: "Planter", show: isArtisan },
              { id: "cuisine", emoji: "🍳", title: "Cuisine", sub: "Recettes", show: isArtisan },
              { id: "fusion", emoji: "🔮", title: "Fusion", sub: "Combiner", show: true },
            ].filter(t => t.show).map(t => (
              <button key={t.id} onClick={() => onSetTab(t.id)} style={{
                padding: "12px 8px", borderRadius: 12,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(139,115,85,0.3)",
                cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 32 }}>{t.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: "bold", color: "#3D2B1F" }}>{t.title}</span>
                <span style={{ fontSize: 10, color: "#8B7355" }}>{t.sub}</span>
              </button>
            ))}
          </div>
          : <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => onSetTab("menu")} style={{ padding: "4px 8px", fontSize: 11, fontWeight: "bold", background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 6, cursor: "pointer" }}>← Menu</button>
            {(["rest", "chest", "craft", "equip", "garden", "cuisine", "fusion"] as string[]).filter(t => t === tab || !(["garden","cuisine"].includes(t) && !isArtisan)).map((t) => (
              <button key={t} onClick={() => onSetTab(t)} style={{ padding: "4px 6px", fontSize: 9, fontWeight: "bold", background: tab === t ? "#E8A317" : "#E8D5A3", border: "1px solid #8B7355", borderRadius: 4, cursor: "pointer", color: "#3D2B1F" }}>
                {t === "rest" ? "🛏️" : t === "chest" ? "📦" : t === "craft" ? "🔨" : t === "equip" ? "⚔️" : t === "garden" ? "🌱" : t === "cuisine" ? "🍳" : "🔮"}
              </button>
            ))}
          </div>}
        </div>
        {/* REST */}
        {tab === "rest" && <div style={{ textAlign: "center", padding: 20 }}><div style={{ fontSize: 40, marginBottom: 8 }}>❤️</div><div style={{ fontSize: 14, fontWeight: "bold" }}>PV restaurés !</div><div style={{ fontSize: 12 }}>{hp}/{maxHp}</div></div>}
        {/* CHEST */}
        {tab === "chest" && <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>🎒 Sac ({countBagItems(inv)}/{BAG_LIMIT})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3 }}>
                {inv.map((id, i) => <button key={`s${i}`} onClick={() => { if (chest.length < 40) { onSetChest((c) => [...c, id]); onSetInv((p) => { const n = [...p]; n.splice(i, 1); return n; }); } }} style={{ width: 28, height: 28, border: "1px solid #D4C5A9", borderRadius: 4, cursor: "pointer", background: "#FFF8E7", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{RES[id]?.e || "?"}</button>)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>📦 Coffre ({chest.length}/40)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3 }}>
                {chest.map((id, i) => <button key={`c${i}`} onClick={() => { if (!isBagFull(inv)) { onSetInv((p) => [...p, id]); onSetChest((c) => { const n = [...c]; n.splice(i, 1); return n; }); } }} style={{ width: 28, height: 28, border: "1px solid #8B7355", borderRadius: 4, cursor: "pointer", background: "#E8D5A3", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{RES[id]?.e || "?"}</button>)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10, textAlign: "center", opacity: 0.6 }}>Tap un item pour le transférer</div>
        </div>}
        {/* CRAFT */}
        {tab === "craft" && <div>
          {/* Adventurer crafts tools/weapons, Artisan crafts spells, Ombre both with 20% fail */}
          <div style={{ fontSize: 10, color: "#8B7355", marginBottom: 6, textAlign: "center" }}>
            {isArtisan ? "🎨 Artisane : sorts, potions, torches" : playerClass === "ombre" ? "🌙 Ombre : tout (20% échec)" : "🎸 Aventurier : outils, armes"}
          </div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>🔧 Outils {isArtisan && <span style={{ fontSize: 9, color: "#888" }}>— Aventurier uniquement</span>}</div>
          {Object.entries(TOOLS).map(([tid, tool]) => {
            const owned = tools.includes(tid);
            const canCraft = !owned && tool.r.every((r) => inv.includes(r));
            const classLocked = isArtisan; // Artisan can't craft tools
            return <div key={tid} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: owned ? "#7A9E3F22" : canCraft && !classLocked ? "#F4D03F22" : "#FFF8E7", borderRadius: 6, border: `1px solid ${owned ? "#7A9E3F" : "#D4C5A9"}`, opacity: classLocked && !owned ? 0.5 : 1 }}>
              <span style={{ fontSize: 20, width: 28 }}>{tool.e}</span>
              <div style={{ flex: 1, fontSize: 11 }}>
                <div style={{ fontWeight: "bold" }}>{tool.n} {owned && "✅"}</div>
                <div style={{ color: "#8B7355" }}>{tool.r.map((r) => `${RES[r]?.e}${RES[r]?.n}`).join(" + ")}</div>
                {tool.u && <div style={{ fontSize: 10, color: "#2E86AB" }}>→ Débloque {tool.u}</div>}
                {classLocked && !owned && <div style={{ fontSize: 9, color: "#D94F4F" }}>⚔️ Aventurier uniquement</div>}
              </div>
              {canCraft && !classLocked && <button onClick={() => {
                // Ombre 20% fail
                if (playerClass === "ombre" && Math.random() < 0.2) { onNotify("💥 Échec ! Item perdu..."); sounds.combatHit(); return; }
                onSetTools((p) => [...p, tid]); tool.r.forEach((r) => { const idx = inv.indexOf(r); if (idx >= 0) onSetInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); }); sounds.craft(); onNotify(`✨ ${tool.e} ${tool.n} !`);
              }} style={UI_BTN("#7A9E3F", "#FFF", true)}>Forger</button>}
            </div>;
          })}
          <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 8, marginBottom: 6 }}>🃏 Sorts {!isArtisan && playerClass !== "ombre" && <span style={{ fontSize: 9, color: "#888" }}>— Artisane uniquement</span>}</div>
          {CARD_RECIPES.map((rec, i) => {
            const canCraft = rec.r.every((r) => inv.includes(r));
            const spellLocked = !isArtisan && playerClass !== "ombre";
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: canCraft && !spellLocked ? "#F4D03F22" : "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9", opacity: spellLocked ? 0.5 : 1 }}>
              <span style={{ fontSize: 18, width: 28 }}>{rec.c.e}</span>
              <div style={{ flex: 1, fontSize: 11 }}><div style={{ fontWeight: "bold" }}>{rec.c.n}</div><div style={{ color: "#8B7355" }}>{rec.r.map((r) => `${RES[r]?.e}`).join("+")} → {rec.c.d}</div>{spellLocked && <div style={{ fontSize: 9, color: "#D94F4F" }}>🎨 Artisane uniquement</div>}</div>
              {canCraft && !spellLocked && <button onClick={() => {
                // Open puzzle for craft
                const ings: { id: string; emoji: string; qty: number }[] = [];
                const countMap: Record<string, number> = {};
                rec.r.forEach(r => { countMap[r] = (countMap[r] || 0) + 1; });
                Object.entries(countMap).forEach(([id, qty]) => {
                  ings.push({ id, emoji: RES[id]?.e || "?", qty });
                });
                setPuzzleRecipe({ name: rec.c.n, emoji: rec.c.e, ingredients: ings, recipeIdx: i });
              }} style={UI_BTN("#E8A317", "#3D2B1F", true)}>Forger</button>}
            </div>;
          })}
        </div>}
        {/* EQUIP */}
        {tab === "equip" && <div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>⚔️ Équipement</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            {(["arme", "armure", "amulette", "bottes"] as EquipSlot[]).map((slot) => {
              const eqId = equipped[slot]; const eq = eqId ? EQUIPMENTS.find((e) => e.id === eqId) : null;
              return <div key={slot} style={{ padding: 6, background: eq ? "#7A9E3F22" : "#FFF8E7", borderRadius: 6, border: `1px solid ${eq ? "#7A9E3F" : "#D4C5A9"}`, textAlign: "center", fontSize: 11 }}>
                <div style={{ fontSize: 8, color: "#8B7355", textTransform: "uppercase" }}>{slot}</div>
                {eq ? <div><span style={{ fontSize: 16 }}>{eq.emoji}</span><div style={{ fontSize: 10, fontWeight: "bold" }}>{eq.name}</div><div style={{ fontSize: 9, color: "#7A9E3F" }}>{Object.entries(eq.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(" ")}</div></div> : <div style={{ fontSize: 10, color: "#8B7355" }}>— vide —</div>}
              </div>;
            })}
          </div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>🔧 Forger</div>
          {EQUIPMENTS.map((eq) => {
            const owned = ownedEquip.includes(eq.id); const isEquipped = Object.values(equipped).includes(eq.id);
            const canCraft = !owned && Object.entries(eq.recipe).every(([res, cnt]) => inv.filter((i) => i === res).length >= cnt);
            return <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: owned ? "#7A9E3F11" : "#FFF8E7", borderRadius: 6, border: `1px solid ${owned ? "#7A9E3F44" : "#D4C5A9"}` }}>
              <span style={{ fontSize: 18 }}>{eq.emoji}</span>
              <div style={{ flex: 1, fontSize: 10 }}><div style={{ fontWeight: "bold", fontSize: 11 }}>{eq.name}</div><div style={{ color: "#7A9E3F" }}>{Object.entries(eq.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(" ")}</div>{!owned && <div style={{ color: "#8B7355" }}>{Object.entries(eq.recipe).map(([r, n]) => `${RES[r]?.e}×${n}`).join(" ")}</div>}</div>
              {isEquipped ? <span style={{ fontSize: 9, color: "#7A9E3F", fontWeight: "bold" }}>Équipé ✅</span>
                : owned ? <button onClick={() => { onSetEquipped((e) => ({ ...e, [eq.slot]: eq.id })); sounds.equip(); }} style={UI_BTN("#2E86AB", "#FFF", true)}>Équiper</button>
                  : canCraft ? <button onClick={() => {
                      Object.entries(eq.recipe).forEach(([r, n]) => { for (let j = 0; j < n; j++) { const idx = inv.indexOf(r); if (idx >= 0) onSetInv((p) => { const x = [...p]; x.splice(idx, 1); return x; }); } });
                      onSetOwnedEquip((p) => [...p, eq.id]); onSetEquipped((e) => ({ ...e, [eq.slot]: eq.id })); sounds.craft(); onNotify(`⚔️ ${eq.emoji} ${eq.name} !`);
                    }} style={UI_BTN("#7A9E3F", "#FFF", true)}>Forger</button>
                    : <span style={{ fontSize: 9, color: "#8B7355" }}>Manque</span>}
            </div>;
          })}
        </div>}
        {/* GARDEN */}
        {tab === "garden" && <div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>🌱 Jardin {!isArtisan && <span style={{ fontSize: 10, color: "#E67E22" }}>(pousse 2× plus lent)</span>}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 8 }}>
            {garden.map((plot, i) => {
              const ready = plot.seed && Date.now() >= plot.plantedAt + (plot.growTime * 1000 * (isArtisan ? 1 : 2));
              const growing = plot.seed && !ready;
              const remaining = growing ? Math.max(0, Math.ceil((plot.plantedAt + plot.growTime * 1000 * (isArtisan ? 1 : 2) - Date.now()) / 1000)) : 0;
              const mins = Math.floor(remaining / 60), secs = remaining % 60;
              return <button key={i} onClick={() => {
                if (ready && plot.seed) {
                  const seed = GARDEN_SEEDS[plot.seed];
                  if (seed) { onSetInv(p => [...p, seed.yields]); onSetGarden(g => { const n = [...g]; n[i] = { seed: null, plantedAt: 0, growTime: 0 }; return n; }); sounds.collect(); onNotify(`🌿 ${seed.name} récolté !`); }
                }
              }} style={{ padding: 4, height: 48, background: ready ? "#7A9E3F33" : growing ? "#F4D03F22" : "#FFF8E7", border: `1px solid ${ready ? "#7A9E3F" : "#D4C5A9"}`, borderRadius: 6, textAlign: "center", fontSize: 10, cursor: ready ? "pointer" : "default" }}>
                {ready ? <div><span style={{ fontSize: 16 }}>✅</span><div style={{ fontSize: 8, color: "#7A9E3F" }}>Prêt!</div></div>
                  : growing ? <div><span style={{ fontSize: 14 }}>🌱</span><div style={{ fontSize: 8, color: "#E67E22" }}>{mins}:{secs.toString().padStart(2, "0")}</div></div>
                    : <span style={{ fontSize: 12, color: "#8B7355" }}>vide</span>}
              </button>;
            })}
          </div>
          <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>Planter :</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(GARDEN_SEEDS).map(([seedId, seed]) => {
              const has = inv.includes(seedId);
              const emptyPlot = garden.findIndex(p => !p.seed);
              return <button key={seedId} disabled={!has || emptyPlot < 0} onClick={() => {
                if (has && emptyPlot >= 0) {
                  onSetInv(p => { const n = [...p]; const i = n.indexOf(seedId); if (i >= 0) n.splice(i, 1); return n; });
                  onSetGarden(g => { const n = [...g]; n[emptyPlot] = { seed: seedId, plantedAt: Date.now(), growTime: seed.growTime }; return n; });
                  sounds.collect(); onNotify(`🌱 ${seed.name} planté !`);
                }
              }} style={{ padding: "4px 8px", borderRadius: 6, background: has ? "#7A9E3F22" : "#eee", border: "1px solid #D4C5A9", fontSize: 10, cursor: has ? "pointer" : "default", opacity: has ? 1 : 0.4 }}>
                {seed.emoji} {seed.name.split(" ")[0]}
              </button>;
            })}
          </div>
        </div>}
        {/* CUISINE */}
        {tab === "cuisine" && <div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>🍳 Cuisine {!isArtisan && <span style={{ fontSize: 10, color: "#D94F4F" }}>🔒 Artisane uniquement</span>}</div>
          {!isArtisan ? <div style={{ padding: 16, textAlign: "center", color: "#8B7355", fontSize: 12 }}>Seule l&apos;Artisane peut cuisiner. Demandez à votre partenaire !</div>
            : RECIPES_CUISINE.map((rec, i) => {
              const canCook = Object.entries(rec.recipe).every(([r, n]) => inv.filter(i => i === r).length >= n);
              return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: canCook ? "#7A9E3F22" : "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}>
                <span style={{ fontSize: 18 }}>{rec.emoji}</span>
                <div style={{ flex: 1, fontSize: 10 }}><div style={{ fontWeight: "bold", fontSize: 11 }}>{rec.name}</div><div style={{ color: "#8B7355" }}>{Object.entries(rec.recipe).map(([r, n]) => `${r}×${n}`).join(" + ")}</div><div style={{ color: "#2E86AB", fontSize: 9 }}>{rec.desc}</div></div>
                {canCook && <button onClick={() => {
                  Object.entries(rec.recipe).forEach(([r, n]) => { for (let j = 0; j < n; j++) { const idx = inv.indexOf(r); if (idx >= 0) onSetInv(p => { const x = [...p]; x.splice(idx, 1); return x; }); } });
                  if (rec.buff.stat === "hp") { /* heal handled in page */ }
                  onSetInv(p => [...p, rec.name]); sounds.craft(); onNotify(`🍳 ${rec.emoji} ${rec.name} !`);
                }} style={UI_BTN("#7A9E3F", "#FFF", true)}>Cuisiner</button>}
              </div>;
            })}
        </div>}
        {/* FUSION */}
        {tab === "fusion" && <div>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>🔮 Fusion {isArtisan ? <span style={{ fontSize: 10, color: "#7A9E3F" }}>0% échec !</span> : <span style={{ fontSize: 10, color: "#E67E22" }}>30% échec</span>}</div>
          <div style={{ fontSize: 10, color: "#8B7355", marginBottom: 8 }}>Fusionnez 2 items identiques pour créer un item amélioré.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(FUSION_RESULTS).map(([itemId, result]) => {
              const count = inv.filter(i => i === itemId).length;
              const canFuse = count >= 2;
              return <div key={itemId} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, background: canFuse ? "#9B7EDE22" : "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}>
                <span style={{ fontSize: 14 }}>{RES[itemId]?.e}×2 →</span>
                <div style={{ flex: 1, fontSize: 10 }}><span style={{ fontWeight: "bold" }}>{result.emoji} {result.name}</span> <span style={{ color: "#8B7355" }}>(vous avez ×{count})</span></div>
                {canFuse && <button onClick={() => {
                  // Remove 2 items
                  let removed = 0;
                  onSetInv(p => p.filter(i => { if (i === itemId && removed < 2) { removed++; return false; } return true; }));
                  // Chance of failure for non-artisan
                  if (!isArtisan && Math.random() < 0.3) { onNotify("💥 Fusion échouée ! 1 item perdu..."); sounds.combatHit(); return; }
                  const bonus = isArtisan && Math.random() < 0.2;
                  onSetInv(p => [...p, result.value, ...(bonus ? [result.value] : [])]);
                  sounds.craft(); onNotify(`🔮 ${result.emoji} ${result.name} !${bonus ? " ×2 bonus Artisane !" : ""}`);
                }} style={UI_BTN("#9B7EDE", "#FFF", true)}>Fusionner</button>}
              </div>;
            })}
          </div>
          {/* TORCH CRAFT */}
          <div style={{ marginTop: 10, padding: 6, background: "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>🔦</span>
            <div style={{ flex: 1, fontSize: 10 }}><div style={{ fontWeight: "bold" }}>Torche (×{torches})</div><div style={{ color: "#8B7355" }}>🪵×2 + 🌿×1 → éclaire la nuit 3 min</div></div>
            {inv.filter(i => i === "branche").length >= 2 && inv.includes("herbe") && <button onClick={() => {
              let r = 0; onSetInv(p => p.filter(i => { if (i === "branche" && r < 2) { r++; return false; } return true; }));
              onSetInv(p => { const n = [...p]; const i = n.indexOf("herbe"); if (i >= 0) n.splice(i, 1); return n; });
              onSetTorches(t => t + 1); sounds.craft(); onNotify("🔦 Torche craftée !");
            }} style={UI_BTN("#E67E22", "#FFF", true)}>Crafter</button>}
          </div>
        </div>}
      </div>

      {/* CRAFT PUZZLE OVERLAY */}
      {puzzleRecipe && <CraftPuzzle
        recipeName={puzzleRecipe.name}
        recipeEmoji={puzzleRecipe.emoji}
        ingredients={puzzleRecipe.ingredients}
        gridSize={isArtisan ? 4 : 3}
        failChance={isArtisan ? 0 : isOmbre ? 0.1 : 0.2}
        onSuccess={(bonus) => {
          const rec = CARD_RECIPES[puzzleRecipe.recipeIdx];
          if (!rec) { setPuzzleRecipe(null); return; }
          // Remove ingredients from inventory
          rec.r.forEach((r) => { const idx = inv.indexOf(r); if (idx >= 0) onSetInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); });
          // Add cards based on bonus
          const count = bonus === "triple" ? 3 : bonus === "double" ? 2 : 1;
          for (let i = 0; i < count; i++) onSetCards((p) => [...p, { ...rec.c }]);
          const bonusText = bonus === "triple" ? " ×3 Perfection !" : bonus === "double" ? " ×2 Bonus !" : "";
          onNotify(`✨ ${rec.c.e} ${rec.c.n}${bonusText}`);
          setPuzzleRecipe(null);
        }}
        onCancel={() => setPuzzleRecipe(null)}
      />}
    </div>
  );
}
