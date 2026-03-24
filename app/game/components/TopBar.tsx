"use client";

import { BAG_LIMIT, countBagItems, isBagFull } from "../../lib/constants";
import { sounds } from "../../lib/sounds";

interface Props {
  pEmoji: string; lvl: number; currentBiome: string;
  hp: number; maxHp: number; xp: number;
  inv: string[]; bosses: string[];
  otherPlayer: { emoji: string } | null;
  timeOfDay: number; fatigueUntil: number;
  onToggleVolume: () => void;
  onTutorial: () => void;
  onSettings: () => void;
}

export function TopBar({ pEmoji, lvl, currentBiome, hp, maxHp, xp, inv, bosses, otherPlayer, timeOfDay, fatigueUntil, onToggleVolume, onTutorial, onSettings }: Props) {
  const bagCount = countBagItems(inv);
  const bagFull = isBagFull(inv);

  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: "rgba(61,43,31,0.75)", fontSize: 11, borderBottom: "1px solid rgba(244,208,63,0.4)", backdropFilter: "blur(4px)", gap: 4 }}>
        <span style={{ textShadow: "0 0 4px #F4D03F" }}>{pEmoji} Nv.{lvl} · {currentBiome}</span>
        <span style={{ color: "#FF6666" }}>❤️{hp}/{maxHp}</span>
        <span style={{ color: bagFull ? "#FF6666" : "#D4C5A9" }}>🎒{bagCount}/{BAG_LIMIT}</span>
        <span>🏆{bosses.length}/5</span>
        {otherPlayer && <span style={{ color: "#F4D03F" }}>👥{otherPlayer.emoji}</span>}
        <button onClick={onToggleVolume} style={{ background: "none", border: "none", color: "#F4D03F", fontSize: 14, cursor: "pointer", padding: 2 }}>{sounds.getVolIcon()}</button>
        {/* Day/night clock */}
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #DAA520", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 45%, #FFD700 45%, #FFD700 55%, #1A1A4E 55%, #1A1A4E 100%)", transform: `rotate(${timeOfDay * 360}deg)`, transition: "transform 1s linear" }}>
            <span style={{ position: "absolute", top: 3, left: "50%", fontSize: 10, transform: `translateX(-50%) rotate(-${timeOfDay * 360}deg)` }}>☀️</span>
            <span style={{ position: "absolute", bottom: 3, left: "50%", fontSize: 8, transform: `translateX(-50%) rotate(-${timeOfDay * 360}deg)` }}>🌙</span>
          </div>
          <div style={{ position: "absolute", width: 2, height: 8, background: "#DAA520", top: 2, left: "50%", transform: "translateX(-50%)", zIndex: 5, borderRadius: 1 }} />
        </div>
        {fatigueUntil > Date.now() && (() => {
          const remaining = Math.max(0, Math.ceil((fatigueUntil - Date.now()) / 1000));
          const mins = Math.floor(remaining / 60); const secs = remaining % 60;
          return <span style={{ color: "#FF6666", fontSize: 10, fontWeight: "bold" }}>😵 {mins}:{secs.toString().padStart(2, "0")}</span>;
        })()}
        <button onClick={onTutorial} style={{ background: "none", border: "none", color: "#F4D03F", fontSize: 14, cursor: "pointer", padding: 2 }}>❓</button>
        <button onClick={onSettings} style={{ background: "none", border: "none", color: "#F4D03F", fontSize: 14, cursor: "pointer", padding: 2 }}>⚙️</button>
      </div>
      {/* XP bar */}
      <div style={{ position: "fixed", top: 32, left: 0, right: 0, zIndex: 10, height: 3, background: "rgba(0,0,0,0.3)" }}>
        <div style={{ width: `${(xp / (lvl * 50)) * 100}%`, height: "100%", background: "linear-gradient(90deg, #F4D03F, #E67E22)", transition: "width 0.3s" }} />
      </div>
    </>
  );
}
