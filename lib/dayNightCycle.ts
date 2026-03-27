// Cycle jour/nuit - 20 min reel = 24h jeu
export const CYCLE_DURATION_MS = 20 * 60 * 1000
export const DAWN = 0.25  // 6h
export const DUSK = 0.83  // 20h

export function getGameHour(cycle: number): number {
  return ((cycle * 24) + 6) % 24
}

export function isDay(cycle: number): boolean {
  const hour = getGameHour(cycle)
  return hour >= 6 && hour < 20
}

export function isNight(cycle: number): boolean {
  return !isDay(cycle)
}

export function getSkyColor(cycle: number): string {
  const hour = getGameHour(cycle)
  if (hour >= 6 && hour < 8) return '#FFD700'  // aube doree
  if (hour >= 8 && hour < 17) return '#87CEEB' // jour bleu
  if (hour >= 17 && hour < 20) return '#FF6347' // crepuscule
  return '#1a1232' // nuit
}

export function getDarkness(cycle: number): number {
  const hour = getGameHour(cycle)
  if (hour >= 8 && hour < 17) return 0
  if (hour >= 20 || hour < 5) return 0.4
  if (hour >= 17) return (hour - 17) * 0.13
  return (5 - hour) * 0.08
}
