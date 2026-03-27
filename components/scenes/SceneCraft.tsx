'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import MergeGrid, { Ingredient } from '@/components/craft/MergeGrid'
import { playSound } from '@/lib/assetLoader'

// Sample recipes (will come from data/recipes.ts later)
const RECIPES = [
  { id: 'potion_soin', name: 'Potion de soin', effect: '+30 PV', atelier: 'cuisine', emoji: '🧪', ingredients: ['herbe_med', 'herbe_med', 'herbe_med', 'eau_pure'], tier: 'Base', targetLevel: 2, targetCount: 2 },
  { id: 'potion_force', name: 'Potion de force', effect: '+20% ATK 3t', atelier: 'cuisine', emoji: '💪', ingredients: ['racine_rouge', 'racine_rouge', 'champignon', 'champignon'], tier: 'Base', targetLevel: 2, targetCount: 2 },
  { id: 'antidote', name: 'Antidote', effect: 'Purge poison', atelier: 'cuisine', emoji: '💊', ingredients: ['herbe_blanche', 'herbe_blanche', 'eau_pure'], tier: 'Base', targetLevel: 2, targetCount: 1 },
  { id: 'epee_lavande', name: 'Epee de lavande', effect: '+8 ATK', atelier: 'armurerie', emoji: '⚔️', ingredients: ['bois', 'bois', 'bois', 'fer', 'fer', 'lavande', 'lavande'], tier: 'Base', targetLevel: 2, targetCount: 3 },
  { id: 'flamme', name: 'Sort Flamme', effect: '12 dmg Feu', atelier: 'salon', emoji: '🔥', ingredients: ['herbe_seche', 'herbe_seche', 'herbe_seche', 'pierre_lave', 'pierre_lave'], tier: 'Commun', targetLevel: 2, targetCount: 2 },
  { id: 'soin', name: 'Sort Soin', effect: '+20 PV', atelier: 'salon', emoji: '✨', ingredients: ['herbe_med', 'herbe_med', 'herbe_med', 'eau_pure', 'eau_pure'], tier: 'Commun', targetLevel: 2, targetCount: 2 },
]

const INGREDIENT_INFO: Record<string, { emoji: string; color: string; name: string }> = {
  herbe_med: { emoji: '🌿', color: '#7ec850', name: 'Herbe med.' },
  eau_pure: { emoji: '💧', color: '#85B7EB', name: 'Eau pure' },
  racine_rouge: { emoji: '🔴', color: '#e24b4a', name: 'Racine rouge' },
  champignon: { emoji: '🍄', color: '#ef9f27', name: 'Champignon' },
  herbe_blanche: { emoji: '🤍', color: '#F5ECD7', name: 'Herbe blanche' },
  bois: { emoji: '🪵', color: '#8B6914', name: 'Bois' },
  fer: { emoji: '⬜', color: '#888', name: 'Fer' },
  lavande: { emoji: '💜', color: '#9370DB', name: 'Lavande' },
  herbe_seche: { emoji: '🥀', color: '#c4a661', name: 'Herbe seche' },
  pierre_lave: { emoji: '🪨', color: '#e24b4a', name: 'Pierre lave' },
}

type Phase = 'list' | 'crafting' | 'result'

export default function SceneCraft() {
  const { sceneData, transitionToScene } = useGameStore()
  const player = usePlayerStore()
  const [phase, setPhase] = useState<Phase>('list')
  const [selectedRecipe, setSelectedRecipe] = useState<typeof RECIPES[0] | null>(null)
  const [craftResult, setCraftResult] = useState<'success' | 'fail' | null>(null)

  const atelier = (sceneData as Record<string, string> | null)?.atelier || 'cuisine'
  const filtered = RECIPES.filter(r => r.atelier === atelier)
  const playerClass = useGameStore(s => s.playerClass)

  // Calculate success chance
  const getSuccessChance = () => {
    let chance = 60 + player.level * 2
    if (playerClass === 'artisane') chance += 10
    if (playerClass === 'paladin') chance -= 10
    if (playerClass === 'ombre') chance -= 10
    return Math.min(95, Math.max(10, chance))
  }

  const startCraft = (recipe: typeof RECIPES[0]) => {
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
    // Roll success chance
    const chance = getSuccessChance()
    const roll = Math.random() * 100
    if (roll < chance) {
      setCraftResult('success')
      playSound('/sfx/sfx_craft_success.mp3', 'craft_success')
    } else {
      setCraftResult('fail')
      playSound('/sfx/sfx_craft_fail.mp3', 'craft_fail')
    }
    setPhase('result')
  }

  const goBack = () => {
    transitionToScene('maison')
  }

  // Build ingredients for MergeGrid
  const buildIngredients = (recipe: typeof RECIPES[0]): Ingredient[] => {
    const ings: Ingredient[] = recipe.ingredients.map((id, idx) => {
      const info = INGREDIENT_INFO[id] || { emoji: '?', color: '#999', name: id }
      return { id, name: info.name, emoji: info.emoji, level: 1, color: info.color }
    })
    // Add 2-3 random parasites
    const parasiteIds = Object.keys(INGREDIENT_INFO).filter(k => !recipe.ingredients.includes(k))
    for (let i = 0; i < 2 && parasiteIds.length > 0; i++) {
      const pid = parasiteIds[Math.floor(Math.random() * parasiteIds.length)]
      const info = INGREDIENT_INFO[pid]
      ings.push({ id: pid, name: info.name, emoji: info.emoji, level: 1, color: info.color })
    }
    return ings
  }

  const atelierNames: Record<string, string> = { salon: '✦ Salon — Sorts', cuisine: '🍳 Cuisine — Potions', armurerie: '⚒ Armurerie — Armes' }

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '1px solid #3a2d5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600 }}>{atelierNames[atelier] || 'Craft'}</div>
          <div style={{ fontSize: 10, color: '#9a8fbf' }}>Réussite : {getSuccessChance()}%</div>
        </div>
        <button onClick={goBack} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 8, padding: '6px 14px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>
          ← Retour
        </button>
      </div>

      {/* Recipe list */}
      {phase === 'list' && (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(recipe => (
            <button key={recipe.id} onClick={() => startCraft(recipe)} style={{
              background: '#231b42', border: '1px solid #3a2d5c', borderRadius: 10, padding: '12px 14px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontSize: 28 }}>{recipe.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>{recipe.name}</div>
                <div style={{ fontSize: 10, color: '#7ec850' }}>{recipe.effect}</div>
                <div style={{ fontSize: 9, color: '#9a8fbf', marginTop: 2 }}>
                  {recipe.ingredients.map(id => INGREDIENT_INFO[id]?.emoji || '?').join(' ')} — {recipe.tier}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#e91e8c', fontWeight: 600 }}>Crafter →</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9a8fbf', fontSize: 13 }}>
              Aucune recette disponible pour cet atelier.
            </div>
          )}
        </div>
      )}

      {/* Merge mini-game */}
      {phase === 'crafting' && selectedRecipe && (
        <MergeGrid
          ingredients={buildIngredients(selectedRecipe)}
          targetLevel={selectedRecipe.targetLevel}
          targetCount={selectedRecipe.targetCount}
          onComplete={onMergeComplete}
          onCancel={() => setPhase('list')}
        />
      )}

      {/* Result */}
      {phase === 'result' && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          {craftResult === 'success' ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
              <div style={{ fontSize: 20, color: '#7ec850', fontWeight: 700 }}>Craft reussi !</div>
              <div style={{ fontSize: 13, color: '#F5ECD7', marginTop: 8 }}>{selectedRecipe?.name} ajoute a l'inventaire</div>
              <div style={{ fontSize: 11, color: '#ef9f27', marginTop: 4 }}>{selectedRecipe?.effect}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💨</div>
              <div style={{ fontSize: 20, color: '#e24b4a', fontWeight: 700 }}>Echec...</div>
              <div style={{ fontSize: 13, color: '#9a8fbf', marginTop: 8 }}>50% des ingredients perdus</div>
            </>
          )}
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => { setPhase('list'); setCraftResult(null) }} style={{
              padding: '10px 24px', background: '#e91e8c', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Continuer</button>
          </div>
        </div>
      )}
    </div>
  )
}
