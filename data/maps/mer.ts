// Mer — ocean, iles, recifs
export const MER_COLORS: Record<number, string> = {
  0: '#3a7ab4', 1: '#8a7a5a', 2: '#5a5a6a', 3: '#2a8a4a',
  4: '#2a5a9a', 5: '#5aaaca', 6: '#2a6a4a',
  10: '#ef9f27', 11: '#e91e8c', 12: '#534AB7', 13: '#8B4513',
}
export const MER_WALKABLE = new Set([0, 1, 5])
export const MAP_W = 150, MAP_H = 150

function seededRandom(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
function noise2D(x: number, y: number, seed: number): number { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453; return n - Math.floor(n) }
function smoothNoise(x: number, y: number, seed: number, scale: number): number {
  const sx=x/scale,sy=y/scale,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  const a=noise2D(ix,iy,seed),b=noise2D(ix+1,iy,seed),c=noise2D(ix,iy+1,seed),d=noise2D(ix+1,iy+1,seed);
  return(a+(b-a)*fx)+(c-a+(d-c)*fx-(b-a)*fx)*fy;
}

export function generateMer(seed: number = 303) {
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
