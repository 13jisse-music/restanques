'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import MergeGrid, { Ingredient } from '@/components/craft/MergeGrid'
import RecipePanel from '@/components/craft/RecipePanel'
import { ALL_RECIPES, Recipe } from '@/data/recipes'
import { playSound } from '@/lib/assetLoader'

// CDC M3: SceneCraft — use ALL 46 recipes from data/recipes.ts
// RecipePanel for browsing, MergeGrid for crafting, success roll, addCraft counter

const INGREDIENT_INFO: Record<string, { emoji: string; color: string; name: string }> = {
  herbe_med: { emoji: '🌿', color: '#7ec850', name: 'Herbe méd.' },
  eau_pure: { emoji: '💧', color: '#85B7EB', name: 'Eau pure' },
  racine_rouge: { emoji: '🔴', color: '#e24b4a', name: 'Racine rouge' },
  champignon: { emoji: '🍄', color: '#ef9f27', name: 'Champignon' },
  herbe_blanche: { emoji: '🤍', color: '#F5ECD7', name: 'Herbe blanche' },
  bois: { emoji: '🪵', color: '#8B6914', name: 'Bois' },
  fer: { emoji: '⬜', color: '#888', name: 'Fer' },
  lavande: { emoji: '💜', color: '#9370DB', name: 'Lavande' },
  herbe_seche: { emoji: '🥀', color: '#c4a661', name: 'Herbe sèche' },
  pierre_lave: { emoji: '🪨', color: '#e24b4a', name: 'Pierre lave' },
  corail: { emoji: '🪸', color: '#ff6b6b', name: 'Corail' },
  algue: { emoji: '🌊', color: '#3ba88a', name: 'Algue' },
  sel: { emoji: '🧂', color: '#ddd', name: 'Sel' },
  cuir: { emoji: '🟫', color: '#8B4513', name: 'Cuir' },
  plume: { emoji: '🪶', color: '#ccc', name: 'Plume' },
  baie: { emoji: '🫐', color: '#5ba8ef', name: 'Baie' },
  soufre: { emoji: '💛', color: '#ffd700', name: 'Soufre' },
  resine: { emoji: '🟠', color: '#ff8c00', name: 'Résine' },
  venin: { emoji: '☠️', color: '#7b2d8b', name: 'Venin' },
  cristal: { emoji: '💎', color: '#00e5ff', name: 'Cristal' },
}

type Phase = 'list' | 'crafting' | 'result'

export default function SceneCraft() {
  const { sceneData, transitionToScene } = useGameStore()
  const player = usePlayerStore()
  const playerClass = useGameStore(s => s.playerClass)
  const [phase, setPhase] = useState<Phase>('list')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [craftResult, setCraftResult] = useState<'success' | 'fail' | null>(null)

  const atelier = (sceneData as Record<string, string> | null)?.atelier || 'cuisine'

  // CDC M3: Filter by atelier + sort by tier
  const filtered = ALL_RECIPES
    .filter(r => r.atelier === atelier)
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { 'Commun': 0, 'Base': 1, 'Avance': 2, 'Rare': 3, 'Sumo': 4, 'Legendaire': 5 }
      return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0)
    })

  // Unlocked biomes (simplified — Garrigue always unlocked)
  const unlockedBiomes = ['Garrigue', 'Maison', 'Tous']

  // CDC M3: Success chance = 60% base + level*2%, +10% Artisane, -10% Jisse/Quentin, -20% Sumo recipes
  const getSuccessChance = (recipe?: Recipe) => {
    let chance = 60 + player.level * 2
    if (playerClass === 'artisane') chance += 10
    if (playerClass === 'paladin') chance -= 10
    if (playerClass === 'ombre') chance -= 10
    if (recipe?.tier === 'Sumo') chance -= 20
    return Math.min(95, Math.max(10, chance))
  }

  const startCraft = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setPhase('crafting')
  }

  const onMergeComplete = (mergeSuccess: boolean) => {
    if (!mergeSuccess) {
      setCraftResult('fail')
      setPhase('result')
      playSound('/sfx/sfx_craft_fail.mp3', 'craft_fail')
      return
    }
    const chance = getSuccessChance(selectedRecipe || undefined)
    const roll = Math.random() * 100
    if (roll < chance) {
      setCraftResult('success')
      // CDC M3: Add to inventory + increment craft counter
      if (selectedRecipe) {
        player.addToInventory(selectedRecipe.id, 1)
        player.addCraft()
      }
      playSound('/sfx/sfx_craft_success.mp3', 'craft_success')
    } else {
      setCraftResult('fail')
      // CDC M3: 50% ingredients lost on failure
      playSound('/sfx/sfx_craft_fail.mp3', 'craft_fail')
    }
    setPhase('result')
  }

  const goBack = () => transitionToScene('maison')

  // Build ingredients for MergeGrid
  const buildIngredients = (recipe: Recipe): Ingredient[] => {
    const ings: Ingredient[] = recipe.ingredients.map((id) => {
      const info = INGREDIENT_INFO[id] || { emoji: '?', color: '#999', name: id }
      return { id, name: info.name, emoji: info.emoji, level: 1, color: info.color }
    })
    // Add 2-3 random parasites
    const allIds = Object.keys(INGREDIENT_INFO)
    const parasiteIds = allIds.filter(k => !recipe.ingredients.includes(k))
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2) && parasiteIds.length > 0; i++) {
      const pid = parasiteIds.splice(Math.floor(Math.random() * parasiteIds.length), 1)[0]
      const info = INGREDIENT_INFO[pid]
      if (info) ings.push({ id: pid, name: info.name, emoji: info.emoji, level: 1, color: info.color })
    }
    return ings
  }

  const atelierNames: Record<string, string> = {
    salon: '✦ Salon — Sorts',
    cuisine: '🍳 Cuisine — Potions & Plats',
    armurerie: '⚒ Armurerie — Armes & Armures',
  }

  // CDC M3: Timer for advanced recipes (optional)
  const getTimer = (recipe: Recipe): number | undefined => {
    if (recipe.tier === 'Rare' || recipe.tier === 'Legendaire') return 45
    if (recipe.tier === 'Sumo') return 30
    return undefined
  }

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '1px solid #3a2d5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600 }}>{atelierNames[atelier] || 'Craft'}</div>
          <div style={{ fontSize: 10, color: '#9a8fbf' }}>
            Réussite : {getSuccessChance()}% · {filtered.length} recettes · {player.totalCrafts} crafts total
          </div>
        </div>
        <button onClick={goBack} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 8, padding: '6px 14px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>
          ← Retour
        </button>
      </div>

      {/* CDC M3: RecipePanel component */}
      {phase === 'list' && (
        <RecipePanel
          recipes={filtered}
          unlockedBiomes={unlockedBiomes}
          successChance={getSuccessChance()}
          onSelect={startCraft}
        />
      )}

      {/* Merge mini-game */}
      {phase === 'crafting' && selectedRecipe && (
        <MergeGrid
          ingredients={buildIngredients(selectedRecipe)}
          targetLevel={selectedRecipe.targetLevel}
          targetCount={selectedRecipe.targetCount}
          timeLimit={getTimer(selectedRecipe)}
          onComplete={onMergeComplete}
          onCancel={() => setPhase('list')}
        />
      )}

      {/* Result */}
      {phase === 'result' && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          {craftResult === 'success' ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12, animation: 'craftPop 0.5s ease-out' }}>✨</div>
              <div style={{ fontSize: 20, color: '#7ec850', fontWeight: 700 }}>Craft réussi !</div>
              <div style={{ fontSize: 13, color: '#F5ECD7', marginTop: 8 }}>{selectedRecipe?.name} ajouté à l'inventaire</div>
              <div style={{ fontSize: 11, color: '#ef9f27', marginTop: 4 }}>{selectedRecipe?.effect}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💨</div>
              <div style={{ fontSize: 20, color: '#e24b4a', fontWeight: 700 }}>Échec...</div>
              <div style={{ fontSize: 13, color: '#9a8fbf', marginTop: 8 }}>50% des ingrédients perdus</div>
            </>
          )}
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => { setPhase('list'); setCraftResult(null) }} style={{
              padding: '10px 24px', background: '#e91e8c', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Continuer</button>
          </div>
          <style>{`@keyframes craftPop { 0% { transform: scale(0.3) rotate(-15deg); opacity: 0; } 100% { transform: scale(1) rotate(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  )
}
