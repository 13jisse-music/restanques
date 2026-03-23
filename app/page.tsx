"use client";

import Link from "next/link";

const C = {
  sky: "#87CEEB", bg: "#F5ECD7", earth: "#3D2B1F", sun: "#F4D03F",
  olive: "#7A9E3F", pink: "#E88EAD", stone: "#D4C5A9", white: "#FFF8E7",
  terra: "#CC7043",
};

const PXB = (c: string, tc: string): React.CSSProperties => ({
  background: c, color: tc, border: `3px solid ${C.earth}`,
  padding: "14px 24px", fontSize: "16px",
  fontWeight: "bold", fontFamily: "'Courier New',monospace", cursor: "pointer",
  boxShadow: `2px 2px 0 ${C.earth}`, letterSpacing: "1px",
  userSelect: "none", textDecoration: "none", display: "block",
  textAlign: "center", borderRadius: "4px",
});

export default function Home() {
  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: `linear-gradient(180deg,${C.sky}44,${C.bg})`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "14px", fontFamily: "'Courier New',monospace", padding: "16px", boxSizing: "border-box",
    }}>
      <div style={{ fontSize: "56px", textShadow: "2px 4px 8px rgba(0,0,0,0.2)" }}>⛰️</div>
      <h1 style={{ fontSize: "34px", fontWeight: "bold", color: C.earth, textShadow: `2px 2px ${C.sun}`, letterSpacing: "4px", margin: 0 }}>RESTANQUES</h1>
      <p style={{ color: C.terra, fontSize: "12px", fontStyle: "italic", margin: 0, textAlign: "center" }}>Reconstruis le duché provençal à deux</p>
      <div style={{ display: "flex", gap: "4px", fontSize: "10px", color: C.earth, opacity: 0.5 }}>
        <span>🌿 Explore</span><span>·</span><span>🏺 Craft</span><span>·</span>
        <span>💎 Match-3</span><span>·</span><span>🏰 Conquiers</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "260px", marginTop: "8px" }}>
        <Link href="/game?player=jisse" style={PXB(C.olive, C.white)}>🎸 Jouer : Jisse</Link>
        <Link href="/game?player=melanie" style={PXB(C.pink, C.white)}>🎨 Jouer : Mélanie</Link>
      </div>

      <div style={{ background: C.white, border: `2px solid ${C.stone}`, padding: "12px", maxWidth: "310px", fontSize: "11px", lineHeight: 1.7, borderRadius: "6px", marginTop: "4px" }}>
        <strong>🗺️ Le jeu :</strong> Explorez ensemble la Provence sur une grande carte ! Récoltez des ressources, forgez des outils pour débloquer 5 zones, combattez les gardiens en <strong>match-3</strong>, achetez aux villages, et affrontez le Mistral !<br /><br />
        <strong>👫 À deux :</strong> Chacun choisit son personnage. Vous voyez l&apos;autre sur la carte en temps réel. Explorez chacun de votre côté ou ensemble !<br /><br />
        <strong>🔧</strong> Garrigue → Calanques → Mines → Mer → Restanques
      </div>
    </div>
  );
}
