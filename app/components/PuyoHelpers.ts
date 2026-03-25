import { PuyoGem, Pos, PUYO_W, PUYO_H } from "./GameTypes";

export function mkGrid(): PuyoGem[][] {
  const g: PuyoGem[][] = [];
  for (let y = 0; y < PUYO_H; y++) {
    g[y] = [];
    for (let x = 0; x < PUYO_W; x++) {
      g[y][x] = { color: Math.floor(Math.random() * 5), x, y };
    }
  }
  for (let pass = 0; pass < 5; pass++) {
    for (let y = 0; y < PUYO_H; y++) for (let x = 0; x < PUYO_W; x++) {
      if (x >= 2 && g[y][x].color === g[y][x-1].color && g[y][x].color === g[y][x-2].color)
        g[y][x].color = (g[y][x].color + 1) % 5;
      if (y >= 2 && g[y][x].color === g[y-1][x].color && g[y][x].color === g[y-2][x].color)
        g[y][x].color = (g[y][x].color + 1) % 5;
    }
  }
  return g;
}

export function findMatches(grid: PuyoGem[][]): Set<string> {
  const matched = new Set<string>();
  for (let y = 0; y < PUYO_H; y++) for (let x = 0; x < PUYO_W; x++) {
    if (x + 2 < PUYO_W && grid[y][x].color === grid[y][x+1].color && grid[y][x].color === grid[y][x+2].color) {
      matched.add(`${x},${y}`); matched.add(`${x+1},${y}`); matched.add(`${x+2},${y}`);
    }
    if (y + 2 < PUYO_H && grid[y][x].color === grid[y+1][x].color && grid[y][x].color === grid[y+2][x].color) {
      matched.add(`${x},${y}`); matched.add(`${x},${y+1}`); matched.add(`${x},${y+2}`);
    }
  }
  return matched;
}

export function applyGravity(grid: PuyoGem[][]): PuyoGem[][] {
  const ng: PuyoGem[][] = Array.from({length: PUYO_H}, (_, y) => Array.from({length: PUYO_W}, (_, x) => ({color: -1, x, y})));
  for (let x = 0; x < PUYO_W; x++) {
    let wy = PUYO_H - 1;
    for (let y = PUYO_H - 1; y >= 0; y--) {
      if (grid[y][x].color >= 0) { ng[wy][x].color = grid[y][x].color; wy--; }
    }
    for (let y = wy; y >= 0; y--) ng[y][x].color = Math.floor(Math.random() * 5);
  }
  return ng;
}

export function swapGems(grid: PuyoGem[][], a: Pos, b: Pos): PuyoGem[][] {
  const ng = grid.map(row => row.map(g => ({...g})));
  const tmp = ng[a.y][a.x].color;
  ng[a.y][a.x].color = ng[b.y][b.x].color;
  ng[b.y][b.x].color = tmp;
  return ng;
}

export function mkRng(s: number) {
  let v = s;
  return () => { v = (v * 16807 + 0) % 2147483647; return (v - 1) / 2147483646; };
}
