"use client";

interface SpellLevel {
  effect: string;
  recipe: Record<string, number>;
}

interface SpellDef {
  id: string;
  name: string;
  emoji: string;
  tier: number;
  levels: SpellLevel[];
}

interface SpellOwned {
  id: string;
  level: number;
}

const SPELLS: SpellDef[] = [
  { id: "brume", name: "Brume", emoji: "🌫️", tier: 1, levels: [
    { effect: "Efface 1 couleur", recipe: { lavande: 3, herbe: 2 } },
    { effect: "Efface 1 couleur +3 dmg", recipe: { lavande: 5, herbe: 3, miel: 1 } },
    { effect: "Efface 2 couleurs", recipe: { lavande_pure: 3, herbe_fraiche: 2, miel: 2 } },
  ]},
  { id: "bouclier", name: "Bouclier", emoji: "🛡️", tier: 1, levels: [
    { effect: "Skip 1 tour ennemi", recipe: { pierre: 3, herbe: 2 } },
    { effect: "Skip 1 tour +DEF+2", recipe: { pierre: 5, fer: 2 } },
    { effect: "Skip 2 tours", recipe: { pierre_taillee: 3, fer: 3, cristal: 1 } },
  ]},
  { id: "maree", name: "Marée", emoji: "🌊", tier: 2, levels: [
    { effect: "+5 dmg prochain match", recipe: { coquillage: 3, sel: 2 } },
    { effect: "+8 dmg", recipe: { coquillage: 5, sel: 3, corail: 1 } },
    { effect: "+12 dmg +3 PV", recipe: { perle: 2, corail: 3 } },
  ]},
  { id: "gel", name: "Gel", emoji: "❄️", tier: 2, levels: [
    { effect: "Bloque 2 colonnes 2t", recipe: { sel: 3, coquillage: 2 } },
    { effect: "Bloque 3 colonnes", recipe: { sel: 5, cristal: 1 } },
    { effect: "Bloque 3 col + gèle 1t", recipe: { cristal_pur: 2, sel: 5 } },
  ]},
  { id: "festin", name: "Festin", emoji: "🍖", tier: 2, levels: [
    { effect: "Soigne 5 PV", recipe: { herbe_fraiche: 2, pain: 1 } },
    { effect: "Soigne 8 PV", recipe: { herbe_fraiche: 3, poisson: 2 } },
    { effect: "Soigne 12 PV + enlève debuff", recipe: { champignon: 2, baies: 3 } },
  ]},
  { id: "eclat", name: "Éclat", emoji: "⚡", tier: 3, levels: [
    { effect: "ATK+MAG+3 directs", recipe: { cristal: 2, sel: 2 } },
    { effect: "ATK+MAG+6", recipe: { cristal: 3, ocre: 2 } },
    { effect: "ATK+MAG+10 + stun 1t", recipe: { cristal_pur: 2, ocre: 3 } },
  ]},
  { id: "brasier", name: "Brasier", emoji: "🔥", tier: 3, levels: [
    { effect: "-2 PV/tour 3t", recipe: { branche: 3, ocre: 2 } },
    { effect: "-3 PV/tour", recipe: { branche: 5, ocre: 3, fer: 2 } },
    { effect: "-4 PV/tour + ATK-1", recipe: { ocre: 5, cristal: 2 } },
  ]},
  { id: "confusion", name: "Confusion", emoji: "🔄", tier: 3, levels: [
    { effect: "Auto-attaque 1t", recipe: { champignon: 2, lavande_pure: 1 } },
    { effect: "2 tours", recipe: { champignon: 3, lavande_pure: 2 } },
    { effect: "2t + perd 1 ligne", recipe: { champignon: 3 } },
  ]},
  { id: "seisme", name: "Séisme", emoji: "💥", tier: 4, levels: [
    { effect: "Mélange grille", recipe: { pierre: 4, fer: 3, ocre: 2 } },
    { effect: "Mélange +5 dmg", recipe: { pierre_taillee: 3, fer: 4 } },
    { effect: "Mélange +10 +3 matchs", recipe: { cristal_pur: 3 } },
  ]},
  { id: "miroir", name: "Miroir", emoji: "🪞", tier: 4, levels: [
    { effect: "Renvoie 50% 2t", recipe: { cristal: 2, perle: 1 } },
    { effect: "75%", recipe: { cristal: 3, perle: 2 } },
    { effect: "100% 2t", recipe: { cristal_pur: 2, perle: 3 } },
  ]},
  { id: "malediction", name: "Malédiction", emoji: "💀", tier: 4, levels: [
    { effect: "-1 ATK permanent", recipe: { ocre: 2, corail: 1 } },
    { effect: "-2 ATK", recipe: { ocre: 3, corail: 2 } },
    { effect: "-3 ATK -1 DEF", recipe: { ocre: 3, corail: 3, perle: 1 } },
  ]},
  { id: "lumiere", name: "Lumière", emoji: "☀️", tier: 5, levels: [
    { effect: "×2 dmg si jour", recipe: { lavande_pure: 3, cristal: 2 } },
    { effect: "×2.5", recipe: { lavande_pure: 5, cristal_pur: 2 } },
    { effect: "×3 +5 PV", recipe: { lavande_pure: 5, cristal_pur: 3, perle: 2 } },
  ]},
  { id: "ombre_sort", name: "Ombre", emoji: "🌙", tier: 5, levels: [
    { effect: "×2 dmg si nuit", recipe: { champignon: 3, corail: 2 } },
    { effect: "×2.5", recipe: { champignon: 3, corail: 3 } },
    { effect: "×3 + invisible 1t", recipe: { champignon: 3, perle: 2 } },
  ]},
  { id: "ralentissement", name: "Ralentissement", emoji: "⏳", tier: 5, levels: [
    { effect: "1 tour/2 pendant 3t", recipe: { sel: 3, cristal: 1 } },
    { effect: "4 tours", recipe: { sel: 5, cristal: 2 } },
    { effect: "5t + -20% dmg", recipe: { cristal_pur: 2, perle: 2 } },
  ]},
];

const ITEM_NAMES: Record<string, string> = {
  lavande: "💜", herbe: "🌿", pierre: "🪨", branche: "🪵", sel: "🧂",
  coquillage: "🐚", corail: "🪸", fer: "⛏️", ocre: "🟠", cristal: "💎",
  perle: "⚪", poisson: "🐟", pain: "🍞", miel: "🍯",
  herbe_fraiche: "🌿✨", lavande_pure: "💜✨", champignon: "🍄",
  baies: "🫐", pierre_taillee: "🪨✨", cristal_pur: "💎✨",
};

function hasRecipe(inv: { id: string; qty: number }[], recipe: Record<string, number>): boolean {
  for (const [id, need] of Object.entries(recipe)) {
    const have = inv.find(i => i.id === id)?.qty || 0;
    if (have < need) return false;
  }
  return true;
}

interface SpellSalonProps {
  inventory: { id: string; qty: number }[];
  spellsOwned: SpellOwned[];
  spellsEquipped: [string, string, string];
  unlockedBiomes: string[];
  onCraftSpell: (spellId: string, level: number) => void;
  onEquipSpell: (spellId: string, slot: number) => void;
  onClose: () => void;
}

const TIER_BIOME: Record<number, string> = { 1: "garrigue", 2: "calanques", 3: "mines", 4: "mer", 5: "restanques" };

export function SpellSalon({ inventory, spellsOwned, spellsEquipped, unlockedBiomes, onCraftSpell, onEquipSpell, onClose }: SpellSalonProps) {
  const getOwnedLevel = (spellId: string): number => {
    return spellsOwned.find(s => s.id === spellId)?.level || 0;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel-opening" style={{
        background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
        borderRadius: 14, padding: 16, maxWidth: 380, width: "94%",
        maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#3D2B1F" }}>✨ Salon des Sorts</div>
          <button onClick={onClose} style={{ background: "#5C4033", color: "#E8D5A3", border: "2px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer" }}>❌</button>
        </div>

        {/* Equipped spells */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: "center" }}>
          {spellsEquipped.map((sid, i) => {
            const spell = SPELLS.find(s => s.id === sid);
            return (
              <div key={i} style={{
                width: 60, height: 60, borderRadius: 12,
                background: spell ? "linear-gradient(135deg, #6B4EAE, #4A3178)" : "rgba(0,0,0,0.2)",
                border: "2px solid #DAA520",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>
                {spell ? spell.emoji : "+"}
                {spell && <div style={{ fontSize: 7, color: "#FFD700" }}>Nv.{getOwnedLevel(spell.id)}</div>}
              </div>
            );
          })}
        </div>

        {/* All spells by tier */}
        {[1, 2, 3, 4, 5].map(tier => {
          const biomeName = TIER_BIOME[tier];
          const unlocked = unlockedBiomes.includes(biomeName);
          const tierSpells = SPELLS.filter(s => s.tier === tier);
          return (
            <div key={tier} style={{ marginBottom: 10, opacity: unlocked ? 1 : 0.4 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#5C4033", marginBottom: 4 }}>
                Tier {tier} — {biomeName.charAt(0).toUpperCase() + biomeName.slice(1)}
                {!unlocked && " 🔒"}
              </div>
              {tierSpells.map(spell => {
                const owned = getOwnedLevel(spell.id);
                const nextLevel = owned + 1;
                const canUpgrade = nextLevel <= 3 && unlocked;
                const recipe = canUpgrade ? spell.levels[nextLevel - 1].recipe : null;
                const canCraft = recipe ? hasRecipe(inventory, recipe) : false;
                const isEquipped = spellsEquipped.includes(spell.id);

                return (
                  <div key={spell.id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 8px", marginBottom: 4, borderRadius: 8,
                    background: owned > 0 ? "rgba(107,78,174,0.15)" : "rgba(0,0,0,0.05)",
                    border: isEquipped ? "2px solid #DAA520" : "1px solid rgba(0,0,0,0.1)",
                  }}>
                    <div style={{ fontSize: 22, width: 32, textAlign: "center" }}>{spell.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: "#3D2B1F" }}>
                        {spell.name} {owned > 0 && <span style={{ color: "#DAA520" }}>Nv.{owned}</span>}
                      </div>
                      {owned > 0 && <div style={{ fontSize: 9, color: "#5C4033" }}>{spell.levels[owned - 1].effect}</div>}
                      {canUpgrade && recipe && (
                        <div style={{ fontSize: 8, color: canCraft ? "#4CAF50" : "#999" }}>
                          → Nv.{nextLevel}: {Object.entries(recipe).map(([id, n]) => `${ITEM_NAMES[id] || id}×${n}`).join(" ")}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {canUpgrade && canCraft && (
                        <button onClick={() => onCraftSpell(spell.id, nextLevel)} style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: "bold",
                          background: "#4CAF50", color: "#FFF", border: "1px solid #2E7D32", cursor: "pointer",
                        }}>{owned > 0 ? "⬆️" : "Forger"}</button>
                      )}
                      {owned > 0 && !isEquipped && (
                        <button onClick={() => {
                          const emptySlot = spellsEquipped.findIndex(s => s === "");
                          if (emptySlot >= 0) onEquipSpell(spell.id, emptySlot);
                        }} style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 9,
                          background: "#6B4EAE", color: "#FFF", border: "1px solid #4A3178", cursor: "pointer",
                        }}>Équiper</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
