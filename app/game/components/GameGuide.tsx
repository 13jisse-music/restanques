"use client";
import { useState } from "react";

const TABS = ["🎮 Jouer", "🗺️ Biomes", "🔧 Craft", "📜 Sorts", "👥 Persos", "⚔️ Équip."];

const S = { h: { fontSize: 16, fontWeight: "bold" as const, margin: "12px 0 6px", color: "#5C4033" }, p: { fontSize: 13, lineHeight: 1.6, marginBottom: 8, color: "#3D2B1F" }, em: { fontSize: 22, verticalAlign: "middle" as const }, sub: { fontSize: 11, color: "#8B7355", lineHeight: 1.5 } };

function TabJouer() {
  return <div>
    <div style={S.h}>🕹️ DÉPLACEMENT</div>
    <p style={S.p}>Utilisez le D-pad pour explorer le monde. Chaque biome cache des trésors et des dangers !</p>
    <div style={S.h}>🌿 RÉCOLTE</div>
    <p style={S.p}>Marchez vers une ressource et tapez dessus. Équipez le bon outil pour récolter 2× plus vite.</p>
    <div style={S.h}>⚔️ COMBAT</div>
    <p style={S.p}>Les monstres patrouillent ! Combat PUYO PUYO vs créatures : des paires de gemmes tombent, connectez 4+ gemmes identiques pour attaquer. Combos = multiplicateur de dégâts ! Combat BOSS en Match-3 double grille : 2 grilles simultanées, le boss et vous.</p>
    <div style={S.h}>💀 DÉFAITE</div>
    <p style={S.p}>KO = retour à la maison avec 50% de PV. Fatigue 2 min. Perte 10% des Sous.</p>
    <div style={S.h}>🏡 MAISON (Mélanie)</div>
    <p style={S.p}>✨ Salon : craft 14 sorts (nv1→nv3)<br/>🍳 Cuisine : potions + plats buffs<br/>⚔️ Armurerie : armes, armures, outils<br/>🛏️ Chambre : dormir, enlever debuffs<br/>🏪 Comptoir : vente au Paladin<br/>🌱 Jardin : 16 parcelles, graines</p>
  </div>;
}

function TabBiomes() {
  const biomes = [
    { e: "🌿", n: "Garrigue", lv: "1-5", color: "#7BB33A", mobs: "Rat (1), Lapin (2), Abeille (3), Renard (4)", boss: "Sanglier Ancien (Nv.5, 20 PV)", res: "Branche, Herbe, Lavande, Thym" },
    { e: "🏖️", n: "Calanques", lv: "5-10", color: "#4AA3DF", mobs: "Crabe (5), Goéland (6), Méduse (7), Requin (8)", boss: "Mouette Géante (Nv.10, 30 PV)", res: "Pierre, Coquillage, Sel" },
    { e: "⛏️", n: "Mines", lv: "10-15", color: "#5C4033", mobs: "Chauve-souris (10), Golem (11), Mineur (12)", boss: "Tarasque (Nv.15, 45 PV)", res: "Fer, Ocre, Cristal" },
    { e: "🌊", n: "Mer", lv: "15-20", color: "#1B6E8A", mobs: "Murène (15), Espadon (16), Sirène (18)", boss: "Pieuvre (Nv.20, 50 PV)", res: "Poisson, Perle, Corail" },
    { e: "🏛️", n: "Restanques", lv: "20+", color: "#C4A874", mobs: "Gargoyle (20), Spectre (22), Chimère (24)", boss: "Le Mistral (Nv.25, 80 PV)", res: "Cristal, Perle, Ocre" },
  ];
  return <div>{biomes.map((b, i) => (
    <div key={i} style={{ marginBottom: 10, padding: 8, background: b.color + "18", borderRadius: 8, border: `1px solid ${b.color}44` }}>
      <div style={{ fontSize: 15, fontWeight: "bold", color: "#3D2B1F" }}>{b.e} {b.n} <span style={{ fontSize: 11, color: "#8B7355" }}>Nv. {b.lv}</span></div>
      <div style={S.sub}>Monstres : {b.mobs}</div>
      <div style={S.sub}>Boss : {b.boss}</div>
      <div style={S.sub}>Ressources : {b.res}</div>
    </div>
  ))}</div>;
}

function TabCraft() {
  return <div>
    <div style={S.h}>🔧 OUTILS</div>
    {[
      ["🪵", "Bâton de marche", "Branche ×2", "→ Débloque Calanques"],
      ["⛏️", "Pioche", "Pierre ×1 + Branche ×1", "→ Débloque Mines"],
      ["🕸️", "Filet", "Coquillage ×1 + Herbe ×1", "→ Débloque Mer"],
      ["🔪", "Serpe", "Fer ×1 + Branche ×1", "Récolte améliorée"],
      ["🗝️", "Clé Ancienne", "Cristal ×1 + Ocre ×1 + Perle ×1", "→ Débloque Restanques"],
    ].map(([e, n, r, d], i) => <div key={i} style={{ ...S.p, display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 20 }}>{e}</span><div><strong>{n}</strong><br/><span style={S.sub}>{r} — {d}</span></div></div>)}
    <div style={S.h}>🃏 SORTS</div>
    {[
      ["🌫️", "Brume", "Lavande + Herbe"],
      ["🛡️", "Bouclier", "Pierre + Sel"],
      ["✨", "Éclat", "Ocre + Cristal"],
      ["🍽️", "Festin", "Poisson + Sel"],
      ["🌊", "Marée", "Perle + Corail"],
      ["💥", "Séisme", "Fer + Pierre"],
    ].map(([e, n, r], i) => <div key={i} style={{ ...S.p, display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 20 }}>{e}</span><div><strong>{n}</strong><br/><span style={S.sub}>{r}</span></div></div>)}
  </div>;
}

function TabSorts() {
  const spells = [
    ["🌫️", "BRUME", "Efface toutes les gemmes d'une couleur choisie"],
    ["🛡️", "BOUCLIER", "Annule le prochain tour ennemi"],
    ["⚡", "ÉCLAT", "Inflige ATK+MAG dégâts directs"],
    ["🍖", "FESTIN", "Soigne 5 PV"],
    ["🌊", "MARÉE", "Les gemmes bleues comptent double pendant 2 tours"],
    ["🌍", "SÉISME", "Mélange toute la grille"],
  ];
  return <div>
    {spells.map(([e, n, d], i) => <div key={i} style={{ padding: 8, marginBottom: 6, background: "#FFF8E7", borderRadius: 8, border: "1px solid #D4C5A9" }}>
      <div style={{ fontSize: 14, fontWeight: "bold" }}><span style={{ fontSize: 20 }}>{e}</span> {n}</div>
      <div style={S.sub}>{d}</div>
    </div>)}
    <p style={{ ...S.sub, marginTop: 8, textAlign: "center", fontStyle: "italic" }}>Chaque sort s'utilise 1 fois par combat. Craftez-les à l'établi !</p>
  </div>;
}

function TabPersos() {
  return <div>
    <div style={{ padding: 10, marginBottom: 8, background: "#7A9E3F22", borderRadius: 8, border: "1px solid #7A9E3F44" }}>
      <div style={{ fontSize: 15, fontWeight: "bold" }}>🎸 JISSE — L'Aventurier</div>
      <div style={S.sub}>Spécialiste du combat et de l'exploration</div>
      <div style={S.p}>ATK 3 · DEF 1 · MAG 0 · VIT 2</div>
      <div style={S.sub}>Bonus : Dégâts +20%, voit les monstres de plus loin</div>
    </div>
    <div style={{ padding: 10, marginBottom: 8, background: "#C77DA522", borderRadius: 8, border: "1px solid #C77DA544" }}>
      <div style={{ fontSize: 15, fontWeight: "bold" }}>🎨 MÉLANIE — L'Artisane</div>
      <div style={S.sub}>Spécialiste du craft et de la récolte</div>
      <div style={S.p}>ATK 1 · DEF 1 · MAG 2 · VIT 1</div>
      <div style={S.sub}>Bonus : Récolte 2× plus vite, recettes secrètes</div>
    </div>
    <div style={{ padding: 10, background: "#33333322", borderRadius: 8, border: "1px dashed #88888844" }}>
      <div style={{ fontSize: 15, fontWeight: "bold", color: "#8B7355" }}>🌙 ??? — À découvrir...</div>
      <div style={S.sub}>Une ombre vous observe depuis le début...</div>
      <div style={{ ...S.sub, fontStyle: "italic" }}>Classe débloquée après avoir terminé le jeu</div>
    </div>
  </div>;
}

function TabEquip() {
  const cats = [
    { n: "ARMES", items: [["🗡️", "Épée en bois", "ATK +2", "Garrigue"], ["⚔️", "Épée de fer", "ATK +5", "Mines"], ["🔱", "Trident de corail", "ATK +7, MAG +3", "Mer"]] },
    { n: "ARMURES", items: [["🧥", "Tunique de cuir", "DEF +2", "Garrigue"], ["🐟", "Cotte d'écailles", "DEF +5", "Mer"]] },
    { n: "AMULETTES", items: [["📿", "Amulette d'herbes", "MAG +2", "Garrigue"], ["💎", "Collier de perles", "MAG +5, DEF +2", "Mer"]] },
    { n: "BOTTES", items: [["👡", "Sandales", "VIT +2", "Garrigue"], ["💨", "Bottes du Mistral", "VIT +5", "Restanques"]] },
    { n: "SPÉCIAUX", items: [["🧭", "Boussole Ancienne", "Minimap", "Quête"], ["🪨", "Pierre de Foyer", "Téléport camp", "Quête"], ["🧥", "Cape d'Ombre", "Détection -50%", "Quête"]] },
  ];
  return <div>{cats.map((c, ci) => <div key={ci}>
    <div style={S.h}>{c.n}</div>
    {c.items.map(([e, n, s, z], i) => <div key={i} style={{ ...S.p, display: "flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 18 }}>{e}</span>
      <div><strong>{n}</strong> — <span style={{ color: "#7A9E3F" }}>{s}</span><br/><span style={S.sub}>{z}</span></div>
    </div>)}
  </div>)}</div>;
}

const TAB_CONTENT = [TabJouer, TabBiomes, TabCraft, TabSorts, TabPersos, TabEquip];

export function GameGuide({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const Content = TAB_CONTENT[tab];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
      <div style={{
        width: "95%", maxWidth: 400, maxHeight: "90vh",
        background: "linear-gradient(#F5ECD7, #E8D5A3)",
        border: "4px solid #5C4033", borderRadius: 14,
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "2px solid #D4C5A9", background: "#E8D5A3" }}>
          <span style={{ fontSize: 16, fontWeight: "bold", color: "#5C4033", fontFamily: "'Courier New',monospace" }}>📖 Guide du Jeu</span>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "none", borderRadius: 6, width: 32, height: 32, fontSize: 16, cursor: "pointer", fontWeight: "bold" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #D4C5A9", background: "#E8D5A3", flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "8px 10px", fontSize: 11, fontWeight: "bold",
              fontFamily: "'Courier New',monospace", cursor: "pointer",
              background: tab === i ? "#F5ECD7" : "transparent",
              color: tab === i ? "#5C4033" : "#8B7355",
              border: "none", borderBottom: tab === i ? "2px solid #5C4033" : "2px solid transparent",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14, fontFamily: "'Courier New',monospace" }}>
          <Content />
        </div>
      </div>
    </div>
  );
}
