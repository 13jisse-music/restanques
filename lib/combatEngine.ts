// Combat Engine — formules, faiblesses, combos

// Cycle faiblesses : Rouge > Noir > Blanc > Bleu > Rouge
const ELEMENT_CYCLE: Record<string, string> = {
  'Feu': 'Ombre',      // Rouge bat Noir
  'Ombre': 'Lumiere',   // Noir bat Blanc
  'Lumiere': 'Eau',     // Blanc bat Bleu
  'Eau': 'Feu',         // Bleu bat Rouge
}

export function isElementStrong(attackElement: string, defenderWeakness: string): boolean {
  return attackElement === defenderWeakness
}

export interface DamageResult {
  damage: number
  isCritical: boolean
  isMiss: boolean
  isElementBonus: boolean
}

export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  weaponMultiplier: number,
  isSpell: boolean,
  spellPower: number,
  spellElement: string,
  defenderWeakness: string,
  isDefending: boolean,
): DamageResult {
  let baseDmg: number
  if (isSpell) {
    baseDmg = spellPower
  } else {
    baseDmg = attackerAtk * weaponMultiplier
  }

  const defense = defenderDef * 0.5
  const random = Math.floor(Math.random() * 7) - 3
  let damage = Math.max(1, Math.floor(baseDmg - defense + random))

  const isCritical = Math.random() < 0.10
  if (isCritical) damage = Math.floor(damage * 2)

  const isMiss = Math.random() < 0.05
  if (isMiss) damage = 0

  const isElementBonus = isSpell && isElementStrong(spellElement, defenderWeakness)
  if (isElementBonus) damage = Math.floor(damage * 1.5)

  if (isDefending) damage = Math.floor(damage * 0.6)

  return { damage, isCritical, isMiss, isElementBonus }
}

// Flee chance
export function calculateFleeChance(baseChance: number = 0.7, bootsBonus: number = 0): number {
  return Math.min(0.95, baseChance + bootsBonus)
}

// XP scaling (less XP if player much higher level than monster)
export function calculateXP(baseXP: number, playerLevel: number, monsterLevel: number): number {
  const diff = playerLevel - monsterLevel
  if (diff <= 0) return baseXP
  if (diff >= 5) return Math.max(1, Math.floor(baseXP * 0.2))
  return Math.floor(baseXP * (1 - diff * 0.15))
}

// Threat generation
export function getThreat(action: string, playerClass: string): number {
  switch (action) {
    case 'coup': return playerClass === 'paladin' ? 3 : 2
    case 'sort': return playerClass === 'artisane' ? 1 : 2
    case 'defense': return 0
    case 'potion': return 0
    default: return 1
  }
}

// Combo detection
export interface ComboResult {
  name: string
  multiplier: number
  effect: string
}

export function checkCombo(
  action1: string, action2: string, timeDiffMs: number,
  action1Element?: string, action2Element?: string,
  consecutiveHits?: number, monsterHpPct?: number,
  monsterAtbPct?: number,
): ComboResult | null {
  if (timeDiffMs > 2000) return null

  // Coup + Sort = Lame Enchantée
  if ((action1 === 'coup' && action2 === 'sort') || (action1 === 'sort' && action2 === 'coup')) {
    return { name: 'Lame Enchantée', multiplier: 1.8, effect: 'Dégâts ×1.8' }
  }
  // Sort + Sort même couleur = Double Sort
  if (action1 === 'sort' && action2 === 'sort' && action1Element === action2Element) {
    return { name: 'Double Sort', multiplier: 2.2, effect: 'Dégâts ×2.2 + effet amplifié' }
  }
  // Defense quand ATB > 90% = Contre-attaque
  if (action2 === 'defense' && monsterAtbPct && monsterAtbPct > 0.9) {
    return { name: 'Contre-attaque', multiplier: 0, effect: 'Bloque 100% + riposte 50%' }
  }
  // Coup de grâce
  if (action2 === 'coup' && monsterHpPct !== undefined && monsterHpPct < 0.1) {
    return { name: 'Coup de grâce', multiplier: 999, effect: 'Exécution + loot ×2' }
  }
  return null
}

// Solo combos
export function checkSoloCombo(consecutiveActions: string[]): ComboResult | null {
  if (consecutiveActions.length >= 3) {
    const last3 = consecutiveActions.slice(-3)
    if (last3.every(a => a === 'coup')) {
      return { name: 'Rage du Paladin', multiplier: 2.5, effect: '4ème coup = critique garanti' }
    }
    if (last3.every(a => a === 'sort')) {
      return { name: 'Maître Artisane', multiplier: 3, effect: '3ème sort = puissance ×3' }
    }
  }
  return null
}

// Cavalier mystère Quentin (10% chance)
export function rollMysteryRider(): boolean {
  return Math.random() < 0.10
}

export function mysteryRiderDamage(luck: number): number {
  return Math.floor(5 + luck * 0.5) // poison per turn
}
