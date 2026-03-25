"use client";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";
import { SPELLS, RES } from "../data/game-data";
import { sounds } from "../lib/sounds";

interface Props { gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onClose: () => void; canCraft: boolean }

export function SpellSalon({ gs, onUpdateGs, onClose, canCraft }: Props) {
  const craftSpell = (spellId: string) => {
    if (!canCraft) return;
    const spell = SPELLS.find(s => s.id === spellId);
    if (!spell) return;
    const currentLv = gs.spellLevels[spellId] || 0;
    if (currentLv >= 3) return;
    const lvData = spell.levels[currentLv];
    if (!lvData) return;
    for (const [item, qty] of Object.entries(lvData.recipe)) {
      if ((gs.bag[item] || 0) < qty) return;
    }
    const nb = {...gs.bag};
    for (const [item, qty] of Object.entries(lvData.recipe)) nb[item] = (nb[item] || 0) - qty;
    const nsl = {...gs.spellLevels, [spellId]: currentLv + 1};
    const ns = currentLv === 0 ? [...gs.spells, spellId] : gs.spells;
    sounds.craft();
    onUpdateGs({ bag: nb, spellLevels: nsl, spells: ns });
  };

  return (
    <Panel title="✨ Salon des Sorts" onClose={onClose}>
      {!canCraft ? (
        <div style={{color:"#F88",textAlign:"center",padding:20}}>Le Paladin ne peut pas crafter de sorts !</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:350,overflowY:"auto"}}>
          {SPELLS.map(spell => {
            const currentLv = gs.spellLevels[spell.id] || 0;
            const nextLv = spell.levels[currentLv];
            const maxed = currentLv >= 3;
            const canMake = nextLv ? Object.entries(nextLv.recipe).every(([item, qty]) => (gs.bag[item] || 0) >= qty) : false;
            return (
              <div key={spell.id} style={{
                padding:8,borderRadius:8,fontSize:12,color:"#FFF",
                background: maxed ? "rgba(255,215,0,.1)" : "rgba(255,255,255,.05)",
                border: maxed ? "1px solid #DAA520" : "1px solid rgba(255,255,255,.1)",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span><span style={{fontSize:18}}>{spell.emoji}</span> <strong>{spell.name}</strong> <span style={{color:"#888"}}>T{spell.tier}</span></span>
                  <span style={{color:"#DAA520",fontSize:11}}>Nv{currentLv}/3</span>
                </div>
                {currentLv > 0 && <div style={{fontSize:10,color:"#8BC34A",marginTop:2}}>✓ {spell.levels[currentLv-1].effect}</div>}
                {!maxed && nextLv && (
                  <div style={{marginTop:4}}>
                    <div style={{fontSize:10,color:"#AAA"}}>→ Nv{currentLv+1}: {nextLv.effect}</div>
                    <div style={{fontSize:9,color:"#888"}}>{Object.entries(nextLv.recipe).map(([i,q]) => `${RES[i]?.emoji||i}×${q}`).join(" ")}</div>
                    <button onClick={() => craftSpell(spell.id)} style={{
                      marginTop:4,padding:"4px 10px",fontSize:10,borderRadius:6,cursor:canMake?"pointer":"default",
                      background:canMake?"rgba(76,175,80,.3)":"rgba(255,255,255,.05)",
                      border:canMake?"1px solid #4CAF50":"1px solid rgba(255,255,255,.1)",
                      color:"#FFF",opacity:canMake?1:0.4,
                    }}>Crafter Nv{currentLv+1}</button>
                  </div>
                )}
                {maxed && <div style={{fontSize:10,color:"#FFD700",marginTop:2}}>★ MAX</div>}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
