"use client";

import { GEM_STYLES } from "../../lib/sprites";
import type { CombatState, CombatCard } from "../../lib/constants";

const UI_BTN = (c: string, tc = "#FFF8E7", sm = false): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${c}, ${c}CC)`, color: tc,
  border: "3px solid #3D2B1F", padding: sm ? "8px 12px" : "12px 18px",
  fontSize: sm ? "12px" : "14px", fontWeight: "bold",
  fontFamily: "'Courier New',monospace", cursor: "pointer",
  borderRadius: "8px", boxShadow: "2px 2px 0 #1A1410, inset 0 1px 0 rgba(255,255,255,0.2)",
  letterSpacing: "1px", userSelect: "none",
});

interface CombatScreenProps {
  combat: CombatState;
  pName: string;
  pEmoji: string;
  pColor: string;
  maxHp: number;
  playerShaking: boolean;
  enemyShaking: boolean;
  enemyTurnMsg: string;
  cards: CombatCard[];
  usedSpells: Set<string>;
  inv: string[];
  onSelectGem: (x: number, y: number) => void;
  onCastSpell: (card: CombatCard) => void;
  onUsePotion: () => void;
  onEndCombat: () => void;
}

export function CombatScreen({
  combat, pName, pEmoji, pColor, maxHp, playerShaking, enemyShaking,
  enemyTurnMsg, cards, usedSpells, inv,
  onSelectGem, onCastSpell, onUsePotion, onEndCombat,
}: CombatScreenProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
      <div style={{ background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: 12, maxWidth: 380, width: "100%", color: "#3D2B1F" }}>
        {/* Fighters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ flex: 1, textAlign: "center", animation: playerShaking ? "playerHit 0.3s" : "none" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: pColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "3px solid #3D2B1F", boxShadow: "0 2px 6px rgba(0,0,0,0.4)", margin: "0 auto" }}>{pEmoji}</div>
            <div style={{ fontSize: 10, fontWeight: "bold", marginTop: 2 }}>{pName}</div>
            <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", border: "1px solid #3D2B1F", margin: "2px 0" }}>
              <div style={{ width: `${(combat.playerHp / maxHp) * 100}%`, height: "100%", background: combat.playerHp < maxHp * 0.3 ? "#D94F4F" : "linear-gradient(90deg, #7A9E3F, #5E9A22)", transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 10 }}>❤️{combat.playerHp}/{maxHp}</span>
          </div>
          <div style={{ fontSize: 20, padding: "0 4px" }}>⚔️</div>
          <div style={{ flex: 1, textAlign: "center", animation: enemyShaking ? "shake 0.3s" : "none" }}>
            <div style={{ fontSize: 44, lineHeight: 1, textAlign: "center" }}>{combat.enemy.e}</div>
            <div style={{ fontSize: 10, fontWeight: "bold" }}>{combat.enemy.n}</div>
            <div style={{ height: 8, background: "#ddd", borderRadius: 4, overflow: "hidden", border: "1px solid #3D2B1F", margin: "2px 0" }}>
              <div style={{ width: `${Math.max(0, (combat.enemyHp / combat.enemyMaxHp) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #D94F4F, #A92F2F)", transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 10 }}>❤️{Math.max(0, combat.enemyHp)}/{combat.enemyMaxHp}</span>
          </div>
        </div>

        {/* Enemy turn banner */}
        {enemyTurnMsg && <div style={{ textAlign: "center", fontSize: 14, fontWeight: "bold", color: "#fff", padding: 6, background: "linear-gradient(90deg, transparent, #D94F4FCC, transparent)", borderRadius: 4, marginBottom: 4, animation: "enemyAtk 0.6s" }}>{enemyTurnMsg}</div>}

        {/* Message */}
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", marginBottom: 6, color: combat.won ? "#3D7A18" : combat.lost ? "#D94F4F" : "#3D2B1F", minHeight: 16, whiteSpace: "pre-line" }}>{combat.msg}</div>

        {/* Gem grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 4, width: "100%", maxWidth: 340, margin: "0 auto", padding: 8, background: "#1A1410", borderRadius: 10, border: "3px solid #F4D03F" }}>
          {combat.grid.map((row, y) => row.map((gem, x) => {
            const sel = combat.sel && combat.sel.x === x && combat.sel.y === y;
            const gs = GEM_STYLES[gem] || GEM_STYLES[0];
            return <div key={`${x}${y}`} onClick={() => onSelectGem(x, y)} style={{
              aspectRatio: "1", borderRadius: 10, cursor: "pointer",
              background: `radial-gradient(circle at 30% 30%, ${gs.light}, ${gs.dark})`,
              boxShadow: sel ? `0 0 12px ${gs.glow}, inset 2px 2px 4px rgba(255,255,255,0.4)` : `inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 6px rgba(0,0,0,0.4)`,
              transform: sel ? "scale(1.15)" : "scale(1)",
              border: sel ? "3px solid #F4D03F" : "2px solid rgba(0,0,0,0.2)",
              transition: "all 0.15s ease", position: "relative",
            }}>
              <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "20%", background: "rgba(255,255,255,0.35)", borderRadius: "50%", transform: "rotate(-20deg)" }} />
            </div>;
          }))}
        </div>

        {/* Spell buttons */}
        {cards.length > 0 && !combat.won && !combat.lost && !combat.animating && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
          {cards.map((c, i) => {
            const used = usedSpells.has(c.n);
            return <button key={i} disabled={used} onClick={() => onCastSpell(c)} style={{
              padding: "4px 8px", fontSize: 11, fontWeight: "bold",
              background: used ? "#888" : `linear-gradient(145deg, ${c.color || "#8B7355"}, ${c.color || "#5C4033"}CC)`,
              color: "#FFF", border: "1px solid #3D2B1F", borderRadius: 6,
              cursor: used ? "default" : "pointer", opacity: used ? 0.4 : 1,
              fontFamily: "'Courier New',monospace",
            }}>{c.e} {c.n}</button>;
          })}
        </div>}

        {/* Potion */}
        {!combat.won && !combat.lost && inv.includes("potion") && <button style={{ ...UI_BTN("#9B7EDE", "#FFF", true), width: "100%", marginTop: 6, textAlign: "center" }} onClick={onUsePotion}>🧪 Potion</button>}

        {/* End combat */}
        {(combat.won || combat.lost) && <button style={{ ...UI_BTN(combat.won ? "#7A9E3F" : "#8B7355"), width: "100%", marginTop: 8, textAlign: "center" }} onClick={onEndCombat}>{combat.won ? "🎉 Victoire !" : "😤 Retenter"}</button>}
      </div>
    </div>
  );
}
