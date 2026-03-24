"use client";

import { TOOLS, EQUIPMENTS, type PlayerStats, type CombatCard, type EquipSlot } from "../../lib/constants";
import { playerCircle } from "../../lib/sprites";
import { NPCS } from "../../data/npcs";
import type { PlayerClass } from "../../data/classes";

interface CharacterSheetProps {
  pName: string; pEmoji: string; pColor: string;
  playerClass: PlayerClass;
  lvl: number; hp: number; maxHp: number; xp: number;
  stats: PlayerStats; totalStats: PlayerStats;
  equipped: Record<EquipSlot, string | null>;
  cards: CombatCard[];
  tools: string[];
  bosses: string[];
  completedQuests: string[];
  onClose: () => void;
}

const CLOSE = { background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: "6px", padding: "4px 10px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" as const };

export function CharacterSheet(props: CharacterSheetProps) {
  const { pName, pEmoji, pColor, playerClass, lvl, hp, maxHp, xp, stats, totalStats, equipped, cards, tools, bosses, completedQuests, onClose } = props;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
      <div style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: 12, maxWidth: 340, width: "100%", color: "#3D2B1F", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: "bold" }}>{playerClass.emoji} {pName}</span>
          <button style={CLOSE} onClick={onClose}>✕</button>
        </div>
        {/* Portrait */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <div style={{ ...playerCircle(pEmoji, pColor, pColor + "99", 52) }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: "bold" }}>{playerClass.name} Nv.{lvl}</div>
            <div style={{ fontSize: 11, color: "#8B7355" }}>❤️ {hp}/{maxHp} · XP {xp}/{lvl * 50}</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 2 }}>
              {playerClass.perks.map((p, i) => <span key={i} style={{ fontSize: 8, background: "#7A9E3F22", padding: "1px 4px", borderRadius: 3, color: "#3D5E1A" }}>✦ {p}</span>)}
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>═ STATS ═</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
          {(["atk", "def", "mag", "vit"] as const).map((s) => {
            const base = stats[s]; const total = totalStats[s]; const bonus = total - base;
            const icons: Record<string, string> = { atk: "⚔️", def: "🛡️", mag: "✨", vit: "💚" };
            return <div key={s} style={{ background: "#FFF8E7", padding: 4, borderRadius: 6, border: "1px solid #D4C5A9", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#8B7355" }}>{icons[s]} {s.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>{total} {bonus > 0 && <span style={{ fontSize: 9, color: "#7A9E3F" }}>(+{bonus})</span>}</div>
            </div>;
          })}
        </div>
        {/* Equipment */}
        <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>═ ÉQUIPEMENT ═</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
          {(["arme", "armure", "amulette", "bottes"] as const).map((slot) => {
            const eqId = equipped[slot]; const eq = eqId ? EQUIPMENTS.find((e) => e.id === eqId) : null;
            return <div key={slot} style={{ background: eq ? "#7A9E3F15" : "#FFF8E7", padding: 6, borderRadius: 6, border: `2px solid ${eq ? "#7A9E3F55" : "#D4C5A9"}`, textAlign: "center", minHeight: 56 }}>
              <div style={{ fontSize: 8, color: "#8B7355", textTransform: "uppercase" }}>{slot}</div>
              {eq ? <><div style={{ fontSize: 20 }}>{eq.emoji}</div><div style={{ fontSize: 9, fontWeight: "bold" }}>{eq.name}</div><div style={{ fontSize: 8, color: "#7A9E3F" }}>{Object.entries(eq.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(" ")}</div></> : <div style={{ fontSize: 10, color: "#8B7355", marginTop: 8 }}>— vide —</div>}
            </div>;
          })}
        </div>
        {/* Spells */}
        <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>═ SORTS ({cards.length}) ═</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[0, 1, 2].map((i) => {
            const c = cards[i];
            return <div key={i} style={{ flex: 1, background: c ? "#9B7EDE15" : "#FFF8E7", padding: 4, borderRadius: 6, border: `1px solid ${c ? "#9B7EDE55" : "#D4C5A9"}`, textAlign: "center", minHeight: 40 }}>
              {c ? <><div style={{ fontSize: 18 }}>{c.e}</div><div style={{ fontSize: 8 }}>{c.n}</div></> : <div style={{ fontSize: 10, color: "#8B7355", marginTop: 8 }}>vide</div>}
            </div>;
          })}
        </div>
        {/* Tools */}
        <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>═ OUTILS ═</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {Object.entries(TOOLS).map(([tid, tool]) => (
            <span key={tid} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: tools.includes(tid) ? "#7A9E3F22" : "#88888822", color: tools.includes(tid) ? "#3D5E1A" : "#888" }}>{tool.e} {tools.includes(tid) ? "✅" : "❌"}</span>
          ))}
        </div>
        <div style={{ fontSize: 11 }}>🏆 Boss: {bosses.length}/5 · 📋 Quêtes: {completedQuests.length}/{NPCS.length}</div>
      </div>
    </div>
  );
}
