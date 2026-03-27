// Progression - XP, level up, stats
export const MAX_LEVEL = 30

export function getXPForLevel(level: number): number {
  let xp = 50
  for (let i = 1; i < level; i++) xp = Math.floor(xp * 1.3)
  return xp
}

export function getLevelUpStats() {
  return { hpMax: 5, atk: 2, def: 1 }
}

export function getBiomeLevelRange(biome: string): [number, number] {
  const ranges: Record<string, [number, number]> = {
    garrigue: [3, 5], calanques: [7, 10], mines: [12, 15],
    mer: [18, 22], restanques: [25, 30],
  }
  return ranges[biome] || [1, 5]
}

export function getBagUpgrade(currentSlots: number, demiBossDefeated: number): number {
  return Math.min(15, 5 + demiBossDefeated * 2) // 5 base + 2 per demi-boss
}
