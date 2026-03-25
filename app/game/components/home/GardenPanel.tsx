"use client";

interface GardenPlot {
  seed: string | null;
  plantedAt: number;
  growTime: number;
}

const SEEDS = [
  { id: "graine_herbe", name: "Herbe", emoji: "🌿", growTime: 120, yields: "herbe_fraiche" },
  { id: "graine_lavande", name: "Lavande", emoji: "💜", growTime: 180, yields: "lavande_pure" },
  { id: "graine_champignon", name: "Champignon", emoji: "🍄", growTime: 300, yields: "champignon" },
  { id: "graine_baies", name: "Baies", emoji: "🫐", growTime: 240, yields: "baies" },
];

interface GardenPanelProps {
  garden: GardenPlot[];
  inventory: { id: string; qty: number }[];
  isArtisane: boolean;
  onPlant: (slot: number, seedId: string, growTime: number) => void;
  onHarvest: (slot: number, yields: string) => void;
  onClose: () => void;
}

export function GardenPanel({ garden, inventory, isArtisane, onPlant, onHarvest, onClose }: GardenPanelProps) {
  const timeMultiplier = isArtisane ? 0.5 : 1;

  const getPlotState = (plot: GardenPlot): "empty" | "growing" | "ready" => {
    if (!plot.seed) return "empty";
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    return elapsed >= plot.growTime ? "ready" : "growing";
  };

  const getTimeLeft = (plot: GardenPlot): string => {
    if (!plot.seed) return "";
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    const left = Math.max(0, plot.growTime - elapsed);
    const min = Math.floor(left / 60);
    const sec = Math.floor(left % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const availableSeeds = SEEDS.filter(s =>
    inventory.some(i => i.id === s.id && i.qty > 0)
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 360, width: "92%",
        maxHeight: "85vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F" }}>🌱 Jardin</div>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>❌</button>
        </div>

        {isArtisane && <div style={{ fontSize: 10, color: "#4A7A1A", textAlign: "center", marginBottom: 8 }}>🎨 Artisane : pousse 2× plus vite !</div>}

        {/* Garden grid 4x4 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
          {garden.map((plot, i) => {
            const state = getPlotState(plot);
            const seed = SEEDS.find(s => s.id === plot.seed);
            return (
              <div key={i} onClick={() => {
                if (state === "ready" && seed) onHarvest(i, seed.yields);
              }} style={{
                background: state === "ready" ? "#4CAF50" : state === "growing" ? "#8FBE4A" : "#6B4226",
                border: `2px solid ${state === "ready" ? "#FFD700" : "#5C4033"}`,
                borderRadius: 8, padding: 8, textAlign: "center", cursor: state === "ready" ? "pointer" : "default",
                animation: state === "ready" ? "healthPulse 1s infinite alternate" : undefined,
                minHeight: 64,
              }}>
                <div style={{ fontSize: 24 }}>
                  {state === "empty" ? "🕳️" : state === "ready" ? "🌾" : seed?.emoji || "🌱"}
                </div>
                <div style={{ fontSize: 8, color: "#FFF", marginTop: 2 }}>
                  {state === "empty" ? "Vide" : state === "ready" ? "Prêt !" : getTimeLeft(plot)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Planting section */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F", marginBottom: 6 }}>Planter :</div>
        {availableSeeds.length === 0 ? (
          <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>Pas de graines disponibles</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {availableSeeds.map(seed => {
              const qty = inventory.find(i => i.id === seed.id)?.qty || 0;
              const actualGrowTime = Math.ceil(seed.growTime * timeMultiplier);
              const emptySlot = garden.findIndex(p => !p.seed);
              return (
                <button key={seed.id} disabled={emptySlot === -1}
                  onClick={() => { if (emptySlot >= 0) onPlant(emptySlot, seed.id, actualGrowTime); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 8,
                    background: emptySlot === -1 ? "#888" : "linear-gradient(135deg, #4A7A1A, #3D5E1A)",
                    color: "#FFF", border: "2px solid #3D5E1A",
                    cursor: emptySlot === -1 ? "default" : "pointer",
                    fontSize: 12, fontWeight: "bold",
                  }}>
                  <span style={{ fontSize: 20 }}>{seed.emoji}</span>
                  <div>
                    <div>{seed.name} ×{qty}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{Math.floor(actualGrowTime / 60)}min</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
