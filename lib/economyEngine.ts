// Economie - prix par tier
export const PRICE_TIERS: Record<string, number> = {
  Commun: 10, Base: 10, Avance: 50, Rare: 200,
  Legendaire: 500, Boss: 1000, Sumo: 150,
}

export function getItemPrice(tier: string): number {
  return PRICE_TIERS[tier] || 10
}

export function applyDiscount(price: number, discount: number): number {
  return Math.max(0, Math.floor(price * (1 - discount)))
}

export function getDeathPenalty(sous: number): number {
  return Math.floor(sous * 0.1) // -10%
}

export function getVisitorDemand(level: number): { items: string[]; reward: number } {
  const count = Math.min(3, 1 + Math.floor(level / 5))
  const items = Array.from({ length: count }, () => 'potion_soin') // simplified
  const reward = 20 + level * 10
  return { items, reward }
}
