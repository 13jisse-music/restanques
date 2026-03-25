import { PuyoGem, Pos, PUYO_W, PUYO_H } from "./GameTypes";

// ═══ PUYO ENGINE — Flood-fill (4+ connected = match), pairs, gravity ═══

export function mkGrid(): PuyoGem[][] {
  const g: PuyoGem[][] = [];
  for (let y = 0; y < PUYO_H; y++) {
    g[y] = [];
    for (let x = 0; x < PUYO_W; x++) {
      g[y][x] = { color: Math.floor(Math.random() * 5), x, y };
    }
  }
  // Remove initial 4+ connected groups
  for (let pass = 0; pass < 10; pass++) {
    const matches = findMatches(g);
    if (matches.size === 0) break;
    for (const key of matches) {
      const [mx, my] = key.split(",").map(Number);
      g[my][mx].color = (g[my][mx].color + 1 + Math.floor(Math.random() * 3)) % 5;
    }
  }
  return g;
}

// Flood-fill: find groups of 4+ connected same-color gems
export function findMatches(grid: PuyoGem[][]): Set<string> {
  const visited = Array.from({ length: PUYO_H }, () => Array(PUYO_W).fill(false));
  const matched = new Set<string>();

  for (let y = 0; y < PUYO_H; y++) {
    for (let x = 0; x < PUYO_W; x++) {
      if (visited[y][x] || grid[y][x].color < 0) continue;
      // BFS flood-fill
      const color = grid[y][x].color;
      const group: string[] = [];
      const stack: [number, number][] = [[x, y]];
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cx >= PUYO_W || cy < 0 || cy >= PUYO_H) continue;
        if (visited[cy][cx]) continue;
        if (grid[cy][cx].color !== color) continue;
        visited[cy][cx] = true;
        group.push(`${cx},${cy}`);
        stack.push([cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]);
      }
      // 4+ connected = match (real Puyo rule)
      if (group.length >= 4) {
        for (const key of group) matched.add(key);
      }
    }
  }
  return matched;
}

// Gravity: drop gems down, fill empty with random
export function applyGravity(grid: PuyoGem[][]): PuyoGem[][] {
  const ng: PuyoGem[][] = Array.from({ length: PUYO_H }, (_, y) =>
    Array.from({ length: PUYO_W }, (_, x) => ({ color: -1, x, y }))
  );
  for (let x = 0; x < PUYO_W; x++) {
    let wy = PUYO_H - 1;
    for (let y = PUYO_H - 1; y >= 0; y--) {
      if (grid[y][x].color >= 0) {
        ng[wy][x].color = grid[y][x].color;
        wy--;
      }
    }
    for (let y = wy; y >= 0; y--) {
      ng[y][x].color = Math.floor(Math.random() * 5);
    }
  }
  return ng;
}

// Swap two gems (for Match-3 boss combat)
export function swapGems(grid: PuyoGem[][], a: Pos, b: Pos): PuyoGem[][] {
  const ng = grid.map(row => row.map(g => ({ ...g })));
  const tmp = ng[a.y][a.x].color;
  ng[a.y][a.x].color = ng[b.y][b.x].color;
  ng[b.y][b.x].color = tmp;
  return ng;
}

// Deterministic RNG
export function mkRng(s: number) {
  let v = s;
  return () => { v = (v * 16807 + 0) % 2147483647; return (v - 1) / 2147483646; };
}
