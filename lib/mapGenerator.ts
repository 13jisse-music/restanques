// Map generator - seed-based terrain generation
export function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

export function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453
  return n - Math.floor(n)
}

export function smoothNoise(x: number, y: number, seed: number, scale: number): number {
  const sx = x / scale, sy = y / scale
  const ix = Math.floor(sx), iy = Math.floor(sy)
  const fx = sx - ix, fy = sy - iy
  const a = noise2D(ix, iy, seed), b = noise2D(ix + 1, iy, seed)
  const c = noise2D(ix, iy + 1, seed), d = noise2D(ix + 1, iy + 1, seed)
  const top = a + (b - a) * fx, bot = c + (d - c) * fx
  return top + (bot - top) * fy
}
