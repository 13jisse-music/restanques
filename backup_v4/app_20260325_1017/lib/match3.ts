// ═══════════════════════════════════════════════════════════
// MATCH-3 COMBAT ENGINE
// ═══════════════════════════════════════════════════════════

export const M3_COLS = 6;
export const M3_ROWS = 7;

export function createGrid(): number[][] {
  let grid: number[][];
  do {
    grid = Array.from({ length: M3_ROWS }, () =>
      Array.from({ length: M3_COLS }, () => Math.floor(Math.random() * 6))
    );
  } while (findMatches(grid).length > 0);
  return grid;
}

export function findMatches(grid: number[][]): { x: number; y: number }[] {
  const matches = new Set<string>();
  for (let y = 0; y < M3_ROWS; y++) {
    for (let x = 0; x < M3_COLS - 2; x++) {
      if (grid[y][x] !== -1 && grid[y][x] === grid[y][x + 1] && grid[y][x] === grid[y][x + 2]) {
        matches.add(`${x},${y}`);
        matches.add(`${x + 1},${y}`);
        matches.add(`${x + 2},${y}`);
      }
    }
  }
  for (let x = 0; x < M3_COLS; x++) {
    for (let y = 0; y < M3_ROWS - 2; y++) {
      if (grid[y][x] !== -1 && grid[y][x] === grid[y + 1][x] && grid[y][x] === grid[y + 2][x]) {
        matches.add(`${x},${y}`);
        matches.add(`${x},${y + 1}`);
        matches.add(`${x},${y + 2}`);
      }
    }
  }
  return [...matches].map((s) => {
    const [x, y] = s.split(",").map(Number);
    return { x, y };
  });
}

export function swapGems(grid: number[][], x1: number, y1: number, x2: number, y2: number): number[][] {
  const g = grid.map((r) => [...r]);
  [g[y1][x1], g[y2][x2]] = [g[y2][x2], g[y1][x1]];
  return g;
}

export function applyGravity(grid: number[][]): number[][] {
  const g = grid.map((r) => [...r]);
  for (let x = 0; x < M3_COLS; x++) {
    let empty = M3_ROWS - 1;
    for (let y = M3_ROWS - 1; y >= 0; y--) {
      if (g[y][x] !== -1) {
        g[empty][x] = g[y][x];
        if (empty !== y) g[y][x] = -1;
        empty--;
      }
    }
    for (let y = empty; y >= 0; y--) g[y][x] = Math.floor(Math.random() * 6);
  }
  return g;
}
