// Mines — souterrain, cristaux, lave
import { seededRandom, noise2D, smoothNoise, MAP_W as _MW, MAP_H as _MH } from '@/lib/mapGenerator'

export const MINES_COLORS: Record<number, string> = {
  0: '#3a3a4a', 1: '#4a4a3a', 2: '#2a2a3a', 3: '#5a4a5a',
  4: '#c84a20', 5: '#4a6acc', 6: '#2a3a2a',
  10: '#ef9f27', 11: '#e91e8c', 12: '#534AB7', 13: '#8B4513',
}
export const MINES_WALKABLE = new Set([0, 1, 5])
export const MAP_W = _MW, MAP_H = _MH

export function generateMines(seed: number = 202) {
  const rng = seededRandom(seed)
  const map: number[][] = []
  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = []
    for (let x = 0; x < MAP_W; x++) {
      const n1 = smoothNoise(x, y, seed, 20), n2 = smoothNoise(x, y, seed + 100, 8)
      const val = n1 * 0.6 + n2 * 0.4
      let tile = 0
      if (val < 0.2) tile = 4
      else if (Math.abs(y - 75) < 2 || Math.abs(x - 75) < 2) tile = 1
      else if (val > 0.8) tile = 2
      else if (val > 0.7 && n2 > 0.5) tile = 3
      else if (val > 0.4 && val < 0.5 && n2 > 0.6) tile = 5
      else if (val > 0.6 && val < 0.65 && n2 < 0.3) tile = 6
      row.push(tile)
    }
    map.push(row)
  }
  // Clear spawn
  for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++) {
    const sx=10+dx,sy=MAP_H-10+dy;
    if(sx>=0&&sy>=0&&sy<MAP_H&&sx<MAP_W) map[sy][sx]=0;
  }
  return { map, entities: [] }
}
export const SPAWN_X = 10, SPAWN_Y = MAP_H - 10
