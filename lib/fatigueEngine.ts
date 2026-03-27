// Fatigue - max 100, evanouissement a 100
export const FATIGUE_RATES = {
  walking: 0.01,     // par seconde
  combat: 0.5,       // par combat
  harvesting: 0.2,   // par recolte
  nightAwake: 0.05,  // par seconde la nuit
}

export function addFatigue(current: number, amount: number): number {
  return Math.min(100, Math.max(0, current + amount))
}

export function shouldFaint(fatigue: number): boolean {
  return fatigue >= 100
}

export function sleepRestore(): { hp: number; fatigue: number } {
  return { hp: 999, fatigue: 0 } // full restore
}

export function getCampRestoreRate(): number {
  return 0.4 // 40% chance attaque monstre en campant
}
