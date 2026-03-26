import { create } from 'zustand'

export interface CombatMonster {
  monsterId: string
  name: string
  hp: number
  hpMax: number
  atk: number
  def: number
  element: string
  weakness: string
  atbSpeed: number // seconds to fill
  atbCurrent: number // 0-1
  xp: number
}

interface CombatState {
  isInCombat: boolean
  monster: CombatMonster | null
  spellGauge: number // 0-3
  spellsInHand: string[] // spell IDs ready to play
  comboWindow: number // ms remaining for combo
  lastActionTime: number
  isCoop: boolean
  partnerLastAction: number

  // Actions
  startCombat: (monster: CombatMonster) => void
  endCombat: () => void
  updateATB: (delta: number) => void
  addSpellGauge: (amount: number) => void
  playCard: (cardType: string) => void
  resetCombat: () => void
}

export const useCombatStore = create<CombatState>((set) => ({
  isInCombat: false,
  monster: null,
  spellGauge: 0,
  spellsInHand: [],
  comboWindow: 0,
  lastActionTime: 0,
  isCoop: false,
  partnerLastAction: 0,

  startCombat: (monster) => set({
    isInCombat: true,
    monster,
    spellGauge: 0,
    spellsInHand: [],
    comboWindow: 0,
  }),

  endCombat: () => set({
    isInCombat: false,
    monster: null,
    spellGauge: 0,
    spellsInHand: [],
  }),

  updateATB: (delta) => set((state) => {
    if (!state.monster) return state
    const newAtb = Math.min(1, state.monster.atbCurrent + delta / state.monster.atbSpeed)
    return {
      monster: { ...state.monster, atbCurrent: newAtb },
      comboWindow: Math.max(0, state.comboWindow - delta * 1000),
    }
  }),

  addSpellGauge: (amount) => set((state) => ({
    spellGauge: Math.min(3, state.spellGauge + amount),
  })),

  playCard: () => set((state) => ({
    lastActionTime: Date.now(),
    comboWindow: 2000,
  })),

  resetCombat: () => set({
    isInCombat: false,
    monster: null,
    spellGauge: 0,
    spellsInHand: [],
    comboWindow: 0,
  }),
}))
