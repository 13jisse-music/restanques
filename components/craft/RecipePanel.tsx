'use client'

import { Recipe } from '@/data/recipes'

// CDC M3: Liste de recettes avec filtres, détail, statut stock, % réussite, verrou biome

interface RecipePanelProps {
  recipes: Recipe[]
  unlockedBiomes: string[] // biomes accessibles au joueur
  successChance: number
  onSelect: (recipe: Recipe) => void
}

// Ingredient emoji lookup
const INGR_EMOJI: Record<string, string> = {
  herbe_med: '🌿', eau_pure: '💧', racine_rouge: '🔴', champignon: '🍄', herbe_blanche: '🤍',
  bois: '🪵', fer: '⬜', lavande: '💜', herbe_seche: '🥀', pierre_lave: '🪨', corail: '🪸',
  perle: '🫧', sel: '🧂', algue: '🌊', coquillage: '🐚', argile: '🟤', cuir: '🟫',
  plume: '🪶', baie: '🫐', soufre: '💛', resine: '🟠', miel: '🍯', piment: '🌶',
  menthe: '🌿', cristal_bleu: '💎', tomate: '🍅', ail: '🧄', huile: '🫒', poisson: '🐟',
  safran: '🟡', farine: '🌾', tissu: '🧶', brindille: '🌿', semelle: '👟', fil: '🧵',
  venin: '☠️', cristal_noir: '🖤', cristal_rouge: '❤️', cristal: '💎', rune: '🔮',
  pierre_lune: '🌙', plume_blanche: '🕊', cristal_blanc: '⬜', sang_lune: '🩸', oeil_nuit: '👁',
  flocon: '❄️', champignon_noir: '🍄', cire: '🕯', meche: '🧶', bois_ancien: '🌳',
  fer_noir: '⚫', cuir_marin: '🟤', ecaille: '🐉', acier_marin: '🔵', dent_requin: '🦷',
  perle_noire: '⚫', cuir_fin: '🟤', acier_celeste: '⭐', cristal_vent: '💨', essence_mistral: '🌪',
  plume_mistral: '🪶', herbe_rare: '🌿', poisson_dore: '🐠', mystere: '❓', essence_pure: '✨',
  ambroisie: '🍇', miel_rare: '🍯', essence_boss: '💀', trefle: '🍀', poudre_etoile: '⭐', larme: '💧',
}

export default function RecipePanel({ recipes, unlockedBiomes, successChance, onSelect }: RecipePanelProps) {
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {recipes.map(recipe => {
        const locked = recipe.biome !== 'Tous' && recipe.biome !== 'Maison' && !unlockedBiomes.includes(recipe.biome)
        const tierColor = recipe.tier === 'Legendaire' ? '#ef9f27' : recipe.tier === 'Rare' ? '#7F77DD' : recipe.tier === 'Sumo' ? '#D4537E' : '#F5ECD7'

        return (
          <button key={recipe.id} onClick={() => !locked && onSelect(recipe)}
            style={{
              background: locked ? '#1a1232' : '#231b42', border: `1px solid ${locked ? '#2d1f54' : '#3a2d5c'}`,
              borderRadius: 10, padding: '12px 14px', cursor: locked ? 'default' : 'pointer',
              textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center',
              opacity: locked ? 0.5 : 1,
            }}>
            <span style={{ fontSize: 28 }}>{locked ? '🔒' : recipe.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: tierColor, fontWeight: 500 }}>
                {recipe.name}
                {recipe.tier !== 'Base' && <span style={{ fontSize: 9, marginLeft: 6, color: tierColor }}>({recipe.tier})</span>}
              </div>
              <div style={{ fontSize: 10, color: '#7ec850' }}>{recipe.effect}</div>
              <div style={{ fontSize: 9, color: '#9a8fbf', marginTop: 2 }}>
                {recipe.ingredients.map(id => INGR_EMOJI[id] || '?').join(' ')}
                {locked && <span style={{ color: '#e24b4a', marginLeft: 6 }}>🔒 {recipe.biome}</span>}
              </div>
            </div>
            {!locked && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#e91e8c', fontWeight: 600 }}>Crafter →</div>
                <div style={{ fontSize: 9, color: '#9a8fbf' }}>{successChance}%</div>
              </div>
            )}
          </button>
        )
      })}
      {recipes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#9a8fbf', fontSize: 13 }}>
          Aucune recette pour cet atelier.
        </div>
      )}
    </div>
  )
}
