import { create } from 'zustand'

export interface InventoryItem {
  itemId: string
  quantity: number
  slot?: number
}

export interface EquippedSpell {
  spellId: string
  slot: 1 | 2 | 3
  usesRemaining: number | null // null = infinite (common)
}

export interface EquipmentSlot {
  itemId: string
  level: number
}

interface PlayerState {
  // Stats
  level: number
  xp: number
  xpNext: number
  hp: number
  hpMax: number
  atk: number
  def: number
  luck: number
  sous: number
  fatigue: number

  // Position
  currentBiome: string
  positionX: number
  positionY: number
  isAlive: boolean

  // Inventory
  bag: InventoryItem[]
  storage: InventoryItem[]
  bagMaxSlots: number
  bagMaxStack: number
  storageMaxPerType: number

  // Equipment
  equipment: Partial<Record<'arme' | 'armure' | 'casque' | 'gants' | 'amulette' | 'bottes', EquipmentSlot>>
  equippedSpells: EquippedSpell[]

  // Fog of war — explored tiles (persisted as Set<string> "x,y")
  exploredTiles: Set<string>
  revealTiles: (cx: number, cy: number, radius: number) => void

  // Craft counter (CDC M1: Sumo appears after 10 crafts)
  totalCrafts: number
  addCraft: () => void

  // Actions
  setStats: (stats: Partial<PlayerState>) => void
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  addXp: (amount: number) => void
  addSous: (amount: number) => void
  addFatigue: (amount: number) => void
  die: () => void
  respawn: () => void
  moveTo: (x: number, y: number) => void
  setBiome: (biome: string) => void
  addToInventory: (itemId: string, quantity: number) => boolean
  removeFromInventory: (itemId: string, quantity: number) => boolean
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  level: 1,
  xp: 0,
  xpNext: 50,
  hp: 100,
  hpMax: 100,
  atk: 10,
  def: 5,
  luck: 5,
  sous: 100,
  fatigue: 0,

  currentBiome: 'maison',
  positionX: 50,
  positionY: 50,
  isAlive: true,

  bag: [],
  storage: [],
  bagMaxSlots: 5,
  bagMaxStack: 20,
  storageMaxPerType: 100,

  equipment: {},
  equippedSpells: [],

  exploredTiles: new Set<string>(),
  totalCrafts: 0,

  addCraft: () => set((state) => ({ totalCrafts: state.totalCrafts + 1 })),

  revealTiles: (cx, cy, radius) => set((state) => {
    const newExplored = new Set(state.exploredTiles)
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          newExplored.add(`${cx + dx},${cy + dy}`)
        }
      }
    }
    return { exploredTiles: newExplored }
  }),

  setStats: (stats) => set(stats),

  takeDamage: (amount) => set((state) => {
    const newHp = Math.max(0, state.hp - amount)
    return { hp: newHp, isAlive: newHp > 0 }
  }),

  heal: (amount) => set((state) => ({
    hp: Math.min(state.hpMax, state.hp + amount),
  })),

  addXp: (amount) => set((state) => {
    let xp = state.xp + amount
    let level = state.level
    let xpNext = state.xpNext
    let hpMax = state.hpMax
    let atk = state.atk
    let def = state.def

    // Level up loop
    while (xp >= xpNext && level < 30) {
      xp -= xpNext
      level++
      xpNext = Math.floor(xpNext * 1.3)
      hpMax += 5
      atk += 2
      def += 1
    }

    return { xp, level, xpNext, hpMax, atk, def, hp: level > state.level ? hpMax : state.hp }
  }),

  addSous: (amount) => set((state) => ({
    sous: Math.max(0, state.sous + amount),
  })),

  addFatigue: (amount) => set((state) => ({
    fatigue: Math.min(100, Math.max(0, state.fatigue + amount)),
  })),

  die: () => set({
    isAlive: false,
  }),

  respawn: () => set((state) => ({
    isAlive: true,
    hp: state.hpMax,
    fatigue: 0,
    currentBiome: 'maison',
    positionX: 50,
    positionY: 50,
  })),

  moveTo: (x, y) => set({ positionX: x, positionY: y }),

  setBiome: (biome) => set({ currentBiome: biome }),

  addToInventory: (itemId, quantity) => {
    const state = get()
    const existing = state.bag.find((i) => i.itemId === itemId)
    if (existing) {
      if (existing.quantity + quantity > state.bagMaxStack) return false
      set({ bag: state.bag.map((i) => i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i) })
      return true
    }
    if (state.bag.length >= state.bagMaxSlots) return false
    set({ bag: [...state.bag, { itemId, quantity }] })
    return true
  },

  removeFromInventory: (itemId, quantity) => {
    const state = get()
    const existing = state.bag.find((i) => i.itemId === itemId)
    if (!existing || existing.quantity < quantity) return false
    if (existing.quantity === quantity) {
      set({ bag: state.bag.filter((i) => i.itemId !== itemId) })
    } else {
      set({ bag: state.bag.map((i) => i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i) })
    }
    return true
  },
}))
