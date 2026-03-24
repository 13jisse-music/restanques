"use client";

import { RES, TOOLS, CARD_RECIPES, EQUIPMENTS, BAG_LIMIT, countBagItems, isBagFull, type CombatCard, type EquipSlot } from "../../lib/constants";
import { itemSprite } from "../../lib/sprites";
import { sounds } from "../../lib/sounds";

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
}

export function CampPanel(props: CampPanelProps) {
  const { tab, hp, maxHp, inv, chest, tools, cards, equipped, ownedEquip, onSetTab, onClose, onSetInv, onSetChest, onSetTools, onSetCards, onSetEquipped, onSetOwnedEquip, onNotify } = props;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: 14, maxWidth: 360, width: "100%", color: "#3D2B1F", maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>⛺ Camp de Base</span>
          <button style={CLOSE} onClick={onClose}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {(["rest", "chest", "craft", "equip"] as const).map((t) => (
            <button key={t} onClick={() => onSetTab(t)} style={{ flex: 1, padding: "6px 3px", fontSize: 10, fontWeight: "bold", background: tab === t ? "#E8A317" : "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, cursor: "pointer", color: "#3D2B1F" }}>
              {t === "rest" ? "🛏️" : t === "chest" ? "📦" : t === "craft" ? "🔨" : "⚔️"}
            </button>
          ))}
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
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>🔧 Outils</div>
          {Object.entries(TOOLS).map(([tid, tool]) => {
            const owned = tools.includes(tid);
            const canCraft = !owned && tool.r.every((r) => inv.includes(r));
            return <div key={tid} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: owned ? "#7A9E3F22" : canCraft ? "#F4D03F22" : "#FFF8E7", borderRadius: 6, border: `1px solid ${owned ? "#7A9E3F" : "#D4C5A9"}` }}>
              <span style={{ fontSize: 20, width: 28 }}>{tool.e}</span>
              <div style={{ flex: 1, fontSize: 11 }}>
                <div style={{ fontWeight: "bold" }}>{tool.n} {owned && "✅"}</div>
                <div style={{ color: "#8B7355" }}>{tool.r.map((r) => `${RES[r]?.e}${RES[r]?.n}`).join(" + ")}</div>
                {tool.u && <div style={{ fontSize: 10, color: "#2E86AB" }}>→ Débloque {tool.u}</div>}
              </div>
              {canCraft && <button onClick={() => { onSetTools((p) => [...p, tid]); tool.r.forEach((r) => { const idx = inv.indexOf(r); if (idx >= 0) onSetInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); }); sounds.craft(); onNotify(`✨ ${tool.e} ${tool.n} !`); }} style={UI_BTN("#7A9E3F", "#FFF", true)}>Forger</button>}
            </div>;
          })}
          <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 8, marginBottom: 6 }}>🃏 Cartes combat</div>
          {CARD_RECIPES.map((rec, i) => {
            const canCraft = rec.r.every((r) => inv.includes(r));
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, marginBottom: 4, background: canCraft ? "#F4D03F22" : "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}>
              <span style={{ fontSize: 18, width: 28 }}>{rec.c.e}</span>
              <div style={{ flex: 1, fontSize: 11 }}><div style={{ fontWeight: "bold" }}>{rec.c.n}</div><div style={{ color: "#8B7355" }}>{rec.r.map((r) => `${RES[r]?.e}`).join("+")} → {rec.c.d}</div></div>
              {canCraft && <button onClick={() => { onSetCards((p) => [...p, { ...rec.c }]); rec.r.forEach((r) => { const idx = inv.indexOf(r); if (idx >= 0) onSetInv((p) => { const n = [...p]; n.splice(idx, 1); return n; }); }); sounds.craft(); onNotify(`✨ ${rec.c.e} !`); }} style={UI_BTN("#E8A317", "#3D2B1F", true)}>Forger</button>}
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
      </div>
    </div>
  );
}
