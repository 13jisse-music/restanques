// Craft - % reussite + bonus/malus par classe
export function getCraftChance(level: number, playerClass: string, recipeTier: string): number {
  let chance = 60 + level * 2
  if (playerClass === 'artisane') chance += 10
  if (playerClass === 'paladin') chance -= 10
  if (playerClass === 'ombre') chance -= 10
  if (recipeTier === 'Sumo') chance -= 20
  return Math.min(95, Math.max(10, chance))
}

export function rollCraft(chance: number): boolean {
  return Math.random() * 100 < chance
}

export function getJisseBonus(): { powerBonus: number; chanceMalus: number } {
  return { powerBonus: 0.3, chanceMalus: -0.1 } // +30% puissance, -10% reussite
}

export function getIngredientLoss(success: boolean, ingredients: string[]): string[] {
  if (success) return [] // pas de perte
  // Echec: 50% des ingredients perdus
  const half = Math.ceil(ingredients.length / 2)
  return ingredients.slice(0, half)
}
