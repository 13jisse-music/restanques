"use client";

interface BedroomPanelProps {
  hp: number;
  maxHp: number;
  debuffs: string[];
  fatigueUntil: number;
  otherPlayerInHome: boolean;
  onSleep: () => void;
  onClose: () => void;
}

export function BedroomPanel({ hp, maxHp, debuffs, fatigueUntil, otherPlayerInHome, onSleep, onClose }: BedroomPanelProps) {
  const hasFatigue = fatigueUntil > Date.now();
  const hasDebuffs = debuffs.length > 0;
  const needsHeal = hp < maxHp;
  const canSleep = needsHeal || hasDebuffs || hasFatigue;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 20, maxWidth: 340, width: "90%", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛏️</div>
        <div style={{ fontSize: 18, fontWeight: "bold", color: "#3D2B1F", marginBottom: 12 }}>Chambre</div>

        <div style={{ fontSize: 12, color: "#5C4033", marginBottom: 16 }}>
          {needsHeal && <div>❤️ PV : {hp}/{maxHp} → {maxHp}/{maxHp}</div>}
          {hasFatigue && <div>😵 Fatigue → supprimée</div>}
          {hasDebuffs && debuffs.map((d, i) => <div key={i}>❌ {d} → supprimé</div>)}
          {!canSleep && <div style={{ color: "#4CAF50" }}>Vous êtes en pleine forme !</div>}
        </div>

        <button onClick={onSleep} disabled={!canSleep} style={{
          width: "100%", padding: 14, borderRadius: 10, fontSize: 16, fontWeight: "bold",
          background: canSleep ? "linear-gradient(135deg, #3F51B5, #1A237E)" : "#888",
          color: "#FFF", border: "2px solid #DAA520", cursor: canSleep ? "pointer" : "default",
          marginBottom: 8,
        }}>
          💤 Dormir jusqu'à l'aube
        </button>

        <div style={{ fontSize: 9, color: "#888", marginBottom: 12 }}>
          PV restaurés au max. Temps avance au jour. Tous debuffs supprimés.
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: 10, borderRadius: 8,
          background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033",
          fontSize: 13, cursor: "pointer",
        }}>← Retour</button>
      </div>
    </div>
  );
}
