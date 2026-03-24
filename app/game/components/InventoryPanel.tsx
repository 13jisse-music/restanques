"use client";

import { RES, TOOLS, BAG_LIMIT, countBagItems, isBagFull, type CombatCard } from "../../lib/constants";

const CLOSE: React.CSSProperties = { background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: "6px", padding: "4px 10px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" };
const PANEL: React.CSSProperties = { background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" };

interface Props {
  inv: string[]; hp: number; maxHp: number; lvl: number; xp: number;
  tools: string[]; cards: CombatCard[];
  unlocked: string[]; bosses: string[];
  onClose: () => void;
  onSetInv: (fn: (p: string[]) => string[]) => void;
  onSetHp: (fn: (h: number) => number) => void;
  onNotify: (msg: string) => void;
  onUsePotion: () => void;
  onDropItem: (idx: number) => void;
}

export function InventoryPanel({ inv, hp, maxHp, lvl, xp, tools, cards, unlocked, bosses, onClose, onSetInv, onSetHp, onNotify, onUsePotion, onDropItem }: Props) {
  const bagCount = countBagItems(inv);
  const bagFull = isBagFull(inv);

  const grouped: { id: string; count: number; indices: number[] }[] = [];
  inv.forEach((id, i) => {
    const existing = grouped.find((g) => g.id === id);
    if (existing) { existing.count++; existing.indices.push(i); }
    else grouped.push({ id, count: 1, indices: [i] });
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ ...PANEL, padding: 14, maxWidth: 340, width: "100%", color: "#3D2B1F", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>🎒 Inventaire</span>
          <button style={CLOSE} onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>❤️ {hp}/{maxHp} · Nv.{lvl} · XP {xp}/{lvl * 50}</div>
        <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ width: `${(xp / (lvl * 50)) * 100}%`, height: "100%", background: "linear-gradient(90deg, #F4D03F, #E67E22)" }} />
        </div>
        <div style={{ fontSize: 12, marginBottom: 8, color: bagFull ? "#D94F4F" : "#3D2B1F", fontWeight: "bold" }}>
          📦 Ressources: {bagCount}/{BAG_LIMIT} {bagFull ? "— PLEIN !" : ""}
        </div>
        {tools.length > 0 && <div style={{ marginBottom: 8, padding: 6, background: "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}>
          <strong style={{ fontSize: 12 }}>🔧 Outils</strong>
          {tools.map((t) => <div key={t} style={{ fontSize: 12, padding: "2px 0" }}>{TOOLS[t].e} {TOOLS[t].n} <span style={{ fontSize: 10, color: "#8B7355" }}>— {TOOLS[t].d}</span></div>)}
        </div>}
        {cards.length > 0 && <div style={{ marginBottom: 8, padding: 6, background: "#FFF8E7", borderRadius: 6, border: "1px solid #D4C5A9" }}>
          <strong style={{ fontSize: 12 }}>🃏 Cartes</strong>
          {cards.map((c, i) => <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>{c.e} {c.n} <span style={{ fontSize: 10, color: "#8B7355" }}>— {c.d}</span></div>)}
        </div>}
        <strong style={{ fontSize: 12 }}>📦 Items</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 6 }}>
          {grouped.map((g) => (
            <button key={g.id} onClick={() => {
              if (g.id === "potion") { onSetInv((p) => { const n = [...p]; const i = n.indexOf("potion"); if (i >= 0) n.splice(i, 1); return n; }); onSetHp((h) => Math.min(maxHp, h + 10)); onNotify("🧪 +10 PV !"); return; }
              if (g.id === "pain") { onSetInv((p) => { const n = [...p]; const i = n.indexOf("pain"); if (i >= 0) n.splice(i, 1); return n; }); onSetHp((h) => Math.min(maxHp, h + 5)); onNotify("🍞 +5 PV !"); return; }
              onDropItem(g.indices[g.indices.length - 1]);
            }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 4, background: RES[g.id]?.c + "18", border: `2px solid ${RES[g.id]?.c || "#888"}`,
              borderRadius: 8, cursor: "pointer", position: "relative", minHeight: 56,
            }}>
              <span style={{ fontSize: 24 }}>{RES[g.id]?.e || "❓"}</span>
              <span style={{ fontSize: 10, fontWeight: "bold", position: "absolute", bottom: 2, right: 4, background: "rgba(0,0,0,0.5)", color: "#FFF", padding: "0 3px", borderRadius: 3 }}>×{g.count}</span>
              <span style={{ fontSize: 8, color: "#8B7355" }}>{RES[g.id]?.n}</span>
            </button>
          ))}
        </div>
        <strong style={{ fontSize: 11, display: "block", marginTop: 8 }}>⛰️ Zones</strong>
        {Object.entries({ garrigue: "🌿 Garrigue", calanques: "🏖️ Calanques", mines: "⛏️ Mines", mer: "🌊 Mer", restanques: "⛰️ Restanques" }).map(([id, n]) => (
          <div key={id} style={{ fontSize: 11, opacity: unlocked.includes(id) ? 1 : 0.3 }}>{n} {unlocked.includes(id) ? "✅" : "🔒"}{bosses.includes(id) ? " 🏆" : ""}</div>
        ))}
        {(inv.includes("potion") || inv.includes("pain")) && <button style={{ background: "linear-gradient(145deg, #9B7EDE, #9B7EDECC)", color: "#FFF", border: "3px solid #3D2B1F", padding: "8px 12px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", borderRadius: 8, width: "100%", marginTop: 8, textAlign: "center" }} onClick={() => { onUsePotion(); onClose(); }}>{inv.includes("potion") ? "🧪 Potion" : "🥖 Pain"}</button>}
      </div>
    </div>
  );
}
