"use client";

import { GEM_STYLES } from "../../lib/sprites";
import type { CombatState, CombatCard } from "../../lib/constants";

interface CombatScreenProps {
  combat: CombatState;
  pName: string; pEmoji: string; pColor: string; maxHp: number;
  playerShaking: boolean; enemyShaking: boolean; enemyTurnMsg: string;
  cards: CombatCard[]; usedSpells: Set<string>; inv: string[];
  rageActive?: boolean; timeOfDay?: number;
  onSelectGem: (x: number, y: number) => void;
  onCastSpell: (card: CombatCard) => void;
  onUsePotion: () => void;
  onEndCombat: () => void;
}

function hpColor(pct: number) {
  if (pct > 0.5) return "linear-gradient(90deg, #4CAF50, #8BC34A)";
  if (pct > 0.25) return "linear-gradient(90deg, #FF9800, #FFC107)";
  return "linear-gradient(90deg, #F44336, #FF5722)";
}

export function CombatScreen({
  combat, pName, pEmoji, pColor, maxHp, playerShaking, enemyShaking,
  enemyTurnMsg, cards, usedSpells, inv, rageActive, timeOfDay,
  onSelectGem, onCastSpell, onUsePotion, onEndCombat,
}: CombatScreenProps) {
  const isNight = timeOfDay !== undefined && timeOfDay >= 0.55 && timeOfDay < 0.9;
  const isDay = timeOfDay !== undefined && timeOfDay >= 0.15 && timeOfDay < 0.45;
  const playerHpPct = combat.playerHp / maxHp;
  const enemyHpPct = combat.enemyMaxHp > 0 ? Math.max(0, combat.enemyHp) / combat.enemyMaxHp : 0;

  // Combat hints
  let hint = "";
  if (playerHpPct < 0.3 && inv.includes("potion")) hint = "💡 PV bas ! Utilisez une Potion !";
  else if (enemyHpPct < 0.2 && enemyHpPct > 0) hint = "💡 Dernier coup ! Finissez-le !";
  else if (cards.length === 0 && !combat.won && !combat.lost) hint = "💡 Craftez des sorts à l'établi !";

  return (
    <div id="game-container" className={playerShaking ? "screen-shake" : ""} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 8,
    }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        padding: 12, maxWidth: 380, width: "100%", color: "#3D2B1F",
      }}>
        {/* Day/Night indicator */}
        {timeOfDay !== undefined && <div style={{ textAlign: "center", fontSize: 9, color: "#8B7355", marginBottom: 4 }}>
          {isDay ? "☀️ Jour — Sorts lumière renforcés" : isNight ? "🌙 Nuit — Sorts ombre renforcés" : "🌇 Crépuscule — Tous sorts +50%"}
        </div>}

        {/* Fighters — bigger portraits */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          {/* Player */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto",
              background: `linear-gradient(135deg, ${pColor}, ${pColor}88)`,
              border: `3px solid ${rageActive ? "#FF4444" : "#F4D03F"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
              boxShadow: rageActive ? "0 0 12px rgba(255,50,50,0.6)" : "0 2px 8px rgba(0,0,0,0.4)",
              animation: playerShaking ? "screenShake 0.3s" : "none",
            }}>{pEmoji}</div>
            <div style={{ fontSize: 11, fontWeight: "bold", marginTop: 3 }}>{pName} {rageActive && <span style={{ color: "#FF4444" }}>🔥</span>}</div>
            {/* HP bar */}
            <div style={{ width: 100, height: 12, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 6, overflow: "hidden", margin: "3px auto" }}>
              <div style={{ width: `${playerHpPct * 100}%`, height: "100%", background: hpColor(playerHpPct), transition: "width 300ms", animation: playerHpPct < 0.25 ? "healthPulse 0.5s infinite alternate" : "none" }} />
            </div>
            <span style={{ fontSize: 10, color: playerHpPct < 0.3 ? "#D94F4F" : "#3D2B1F" }}>❤️{combat.playerHp}/{maxHp}</span>
          </div>

          <div style={{ fontSize: 24, padding: "0 6px" }}>⚔️</div>

          {/* Enemy */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto",
              background: "linear-gradient(135deg, #4A1A1A, #2D0A0A)",
              border: "3px solid #D94F4F",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              animation: enemyShaking ? "screenShake 0.3s" : "none",
            }}>{combat.enemy.e}</div>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#D94F4F", marginTop: 3 }}>{combat.enemy.n}</div>
            <div style={{ width: 100, height: 12, background: "#2D1F14", border: "2px solid #5C4033", borderRadius: 6, overflow: "hidden", margin: "3px auto" }}>
              <div style={{ width: `${enemyHpPct * 100}%`, height: "100%", background: hpColor(enemyHpPct), transition: "width 300ms" }} />
            </div>
            <span style={{ fontSize: 10 }}>❤️{Math.max(0, combat.enemyHp)}/{combat.enemyMaxHp}</span>
          </div>
        </div>

        {/* Enemy turn banner — BIG and visible */}
        {enemyTurnMsg && <div style={{
          textAlign: "center", fontSize: 15, fontWeight: "bold", color: "#FFF",
          padding: "8px 12px", marginBottom: 6, borderRadius: 8,
          background: "linear-gradient(90deg, transparent 5%, #D94F4FDD 20%, #D94F4FDD 80%, transparent 95%)",
          textShadow: "0 0 6px rgba(255,0,0,0.6)",
          animation: "panelOpen 0.3s ease-out",
        }}>⚔️ {enemyTurnMsg}</div>}

        {/* Your turn banner */}
        {!enemyTurnMsg && !combat.won && !combat.lost && !combat.animating && <div style={{
          textAlign: "center", fontSize: 12, color: "#7A9E3F", fontWeight: "bold",
          padding: "4px 8px", marginBottom: 4,
        }}>🎯 Votre tour — Alignez 3 gemmes !</div>}

        {/* Message */}
        <div style={{
          textAlign: "center", fontSize: 13, fontWeight: "bold", marginBottom: 6,
          color: combat.won ? "#3D7A18" : combat.lost ? "#D94F4F" : "#3D2B1F",
          minHeight: 16, whiteSpace: "pre-line",
        }}>{combat.msg}</div>

        {/* Hint */}
        {hint && <div style={{ textAlign: "center", fontSize: 10, color: "#E67E22", marginBottom: 4, fontStyle: "italic" }}>{hint}</div>}

        {/* Gem grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3, width: "100%", maxWidth: 340, margin: "0 auto", padding: 6, background: "#1A1410", borderRadius: 10, border: "3px solid #F4D03F" }}>
          {combat.grid.map((row, y) => row.map((gem, x) => {
            const sel = combat.sel && combat.sel.x === x && combat.sel.y === y;
            const gs = GEM_STYLES[gem] || GEM_STYLES[0];
            return <div key={`${x}${y}`} onClick={() => onSelectGem(x, y)}
              className={sel ? "gem-selected" : ""}
              style={{
                aspectRatio: "1", borderRadius: 10, cursor: "pointer",
                background: `radial-gradient(circle at 30% 30%, ${gs.light}, ${gs.dark})`,
                boxShadow: sel ? `0 0 12px ${gs.glow}` : `inset 2px 2px 4px rgba(255,255,255,0.3), 2px 2px 6px rgba(0,0,0,0.4)`,
                transform: sel ? "scale(1.15)" : "scale(1)",
                border: sel ? "3px solid #F4D03F" : "2px solid rgba(0,0,0,0.2)",
                transition: "all 0.15s ease", position: "relative",
              }}>
              <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "20%", background: "rgba(255,255,255,0.35)", borderRadius: "50%", transform: "rotate(-20deg)" }} />
            </div>;
          }))}
        </div>

        {/* Spell slots — always visible (3 slots) */}
        {!combat.won && !combat.lost && <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
          {[0, 1, 2].map((i) => {
            const c = cards[i];
            if (!c) return <div key={i} style={{ width: 64, height: 40, borderRadius: 8, border: "2px dashed rgba(139,115,85,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#8B7355", opacity: 0.3 }}>+</div>;
            const used = usedSpells.has(c.n);
            return <button key={i} disabled={used || combat.animating} onClick={() => onCastSpell(c)} style={{
              padding: "6px 10px", fontSize: 11, fontWeight: "bold",
              background: used ? "#555" : `linear-gradient(145deg, ${c.color || "#8B7355"}, ${c.color || "#5C4033"}CC)`,
              color: "#FFF", border: `2px solid ${used ? "#444" : "#F4D03F"}`, borderRadius: 8,
              cursor: used || combat.animating ? "default" : "pointer", opacity: used ? 0.4 : 1,
              minWidth: 64,
            }}>{c.e} {c.n}</button>;
          })}
        </div>}

        {/* Actions row */}
        {!combat.won && !combat.lost && <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
          {inv.includes("potion") && <button onClick={onUsePotion} style={{ padding: "6px 12px", background: "linear-gradient(135deg, #9B7EDE, #6B4EAE)", color: "#FFF", border: "2px solid #F4D03F", borderRadius: 8, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>🧪 Potion</button>}
          <button onClick={onEndCombat} style={{ padding: "6px 12px", background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>🏃 Fuir</button>
        </div>}

        {/* Victory/Defeat — auto-close, just show status */}
        {combat.won && <div style={{ textAlign: "center", padding: 8 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D7A18", fontFamily: "'Crimson Text',serif" }}>Victoire !</div>
        </div>}
        {combat.lost && <div style={{ textAlign: "center", padding: 8 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💀</div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#D94F4F", fontFamily: "'Crimson Text',serif" }}>Défaite...</div>
        </div>}
      </div>
    </div>
  );
}
