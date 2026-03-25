// ═══════════════════════════════════════════════════════════
// HOME MAP GENERATOR — Maison de Mélanie + Jardin (100×100)
// ═══════════════════════════════════════════════════════════

export interface HomeRoom {
  id: string;
  name: string;
  emoji: string;
  x: number; y: number;
  w: number; h: number;
}

export interface HomeTile {
  type: 'floor' | 'wall' | 'door' | 'garden_plot' | 'grass' | 'path' | 'chest' | 'portal' | 'room_floor';
  walkable: boolean;
  roomId?: string;
  gardenSlot?: number;
  emoji?: string;
}

export interface HomeMap {
  tiles: HomeTile[][];
  width: number;
  height: number;
  rooms: HomeRoom[];
  gardenPlots: { x: number; y: number; slot: number }[];
  chestPos: { x: number; y: number };
  portalPos: { x: number; y: number };
  doorPos: { x: number; y: number };
  spawnPos: { x: number; y: number };
  safeZone: { x1: number; y1: number; x2: number; y2: number };
}

const MAP_W = 100;
const MAP_H = 100;
const HOUSE_X = 40;
const HOUSE_Y = 45;
const HOUSE_W = 22;
const HOUSE_H = 16;
const SAFE_X1 = 25;
const SAFE_Y1 = 25;
const SAFE_X2 = 75;
const SAFE_Y2 = 75;
const GARDEN_X = 45;
const GARDEN_Y = 36;
const GARDEN_COLS = 4;
const GARDEN_ROWS = 4;
const GARDEN_PLOT_SIZE = 2;
const INTERIOR_X = HOUSE_X + 1;
const INTERIOR_Y = HOUSE_Y + 1;

const SAFE_RESOURCES = [
  { emoji: "🌿", res: "herbe" },
  { emoji: "🪵", res: "branche" },
  { emoji: "💜", res: "lavande" },
  { emoji: "🌸", res: "fleur" },
];

function makeRng(seed: number) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

export function generateHomeMap(): HomeMap {
  const rng = makeRng(42);
  const tiles: HomeTile[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, (): HomeTile => ({ type: 'grass', walkable: true }))
  );

  const set = (x: number, y: number, tile: Partial<HomeTile>) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) Object.assign(tiles[y][x], tile);
  };

  const rooms: HomeRoom[] = [
    { id: "salon", name: "Salon des Sorts", emoji: "✨", x: INTERIOR_X, y: INTERIOR_Y, w: 6, h: 5 },
    { id: "cuisine", name: "Cuisine", emoji: "🍳", x: INTERIOR_X + 7, y: INTERIOR_Y, w: 6, h: 5 },
    { id: "armurerie", name: "Armurerie", emoji: "⚔️", x: INTERIOR_X + 14, y: INTERIOR_Y, w: 6, h: 5 },
    { id: "chambre", name: "Chambre", emoji: "🛏️", x: INTERIOR_X, y: INTERIOR_Y + 7, w: 6, h: 5 },
    { id: "comptoir", name: "Comptoir", emoji: "🏪", x: INTERIOR_X + 10, y: INTERIOR_Y + 7, w: 6, h: 5 },
  ];

  // House exterior walls
  for (let x = HOUSE_X; x < HOUSE_X + HOUSE_W; x++) {
    for (let y = HOUSE_Y; y < HOUSE_Y + HOUSE_H; y++) {
      const isEdge = x === HOUSE_X || x === HOUSE_X + HOUSE_W - 1 || y === HOUSE_Y || y === HOUSE_Y + HOUSE_H - 1;
      set(x, y, isEdge ? { type: 'wall', walkable: false, emoji: '🧱' } : { type: 'floor', walkable: true });
    }
  }

  // Rooms
  for (const room of rooms) {
    for (let x = room.x; x < room.x + room.w; x++) {
      for (let y = room.y; y < room.y + room.h; y++) {
        const isEdge = x === room.x || x === room.x + room.w - 1 || y === room.y || y === room.y + room.h - 1;
        set(x, y, isEdge ? { type: 'wall', walkable: false, roomId: room.id } : { type: 'room_floor', walkable: true, roomId: room.id });
      }
    }
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);
    set(cx, cy, { type: 'room_floor', walkable: true, roomId: room.id, emoji: room.emoji });
  }

  // Doors: top row rooms (bottom wall), bottom row rooms (top wall)
  for (const room of [rooms[0], rooms[1], rooms[2]]) {
    set(room.x + Math.floor(room.w / 2), room.y + room.h - 1, { type: 'door', walkable: true, roomId: room.id, emoji: '🚪' });
  }
  for (const room of [rooms[3], rooms[4]]) {
    set(room.x + Math.floor(room.w / 2), room.y, { type: 'door', walkable: true, roomId: room.id, emoji: '🚪' });
  }

  // Hallway
  for (let x = INTERIOR_X; x < INTERIOR_X + 20; x++) {
    for (let y = INTERIOR_Y + 5; y < INTERIOR_Y + 7; y++) {
      if (tiles[y][x].type === 'floor') set(x, y, { type: 'floor', walkable: true });
    }
  }

  // Main door
  const mainDoorX = HOUSE_X + Math.floor(HOUSE_W / 2);
  const mainDoorY = HOUSE_Y + HOUSE_H - 1;
  set(mainDoorX, mainDoorY, { type: 'door', walkable: true, emoji: '🚪' });
  set(mainDoorX, mainDoorY + 1, { type: 'path', walkable: true });

  // North door to garden
  set(mainDoorX, HOUSE_Y, { type: 'door', walkable: true, emoji: '🚪' });
  for (let y = GARDEN_Y + GARDEN_ROWS * GARDEN_PLOT_SIZE; y < HOUSE_Y; y++) {
    set(mainDoorX, y, { type: 'path', walkable: true });
  }

  // Path south from door
  for (let y = mainDoorY + 1; y <= mainDoorY + 10; y++) {
    set(mainDoorX, y, { type: 'path', walkable: true });
  }

  // Garden plots
  const gardenPlots: { x: number; y: number; slot: number }[] = [];
  let slot = 0;
  for (let row = 0; row < GARDEN_ROWS; row++) {
    for (let col = 0; col < GARDEN_COLS; col++) {
      const px = GARDEN_X + col * GARDEN_PLOT_SIZE;
      const py = GARDEN_Y + row * GARDEN_PLOT_SIZE;
      gardenPlots.push({ x: px, y: py, slot });
      for (let dx = 0; dx < GARDEN_PLOT_SIZE; dx++) {
        for (let dy = 0; dy < GARDEN_PLOT_SIZE; dy++) {
          set(px + dx, py + dy, { type: 'garden_plot', walkable: true, gardenSlot: slot, emoji: '🌱' });
        }
      }
      slot++;
    }
  }

  // Garden border path
  const gl = GARDEN_X - 1, gt = GARDEN_Y - 1;
  const gr = GARDEN_X + GARDEN_COLS * GARDEN_PLOT_SIZE, gb = GARDEN_Y + GARDEN_ROWS * GARDEN_PLOT_SIZE;
  for (let x = gl; x <= gr; x++) { set(x, gt, { type: 'path', walkable: true }); set(x, gb, { type: 'path', walkable: true }); }
  for (let y = gt; y <= gb; y++) { set(gl, y, { type: 'path', walkable: true }); set(gr, y, { type: 'path', walkable: true }); }

  // Chest
  const chestPos = { x: HOUSE_X + HOUSE_W + 2, y: HOUSE_Y + HOUSE_H + 2 };
  set(chestPos.x, chestPos.y, { type: 'chest', walkable: true, emoji: '📦' });
  for (let x = mainDoorX + 1; x <= chestPos.x; x++) set(x, mainDoorY + 4, { type: 'path', walkable: true });
  for (let y = mainDoorY + 4; y <= chestPos.y; y++) set(chestPos.x, y, { type: 'path', walkable: true });

  // Portal
  const portalPos = { x: mainDoorX, y: SAFE_Y2 - 3 };
  set(portalPos.x, portalPos.y, { type: 'portal', walkable: true, emoji: '🌀' });
  set(portalPos.x - 1, portalPos.y, { type: 'path', walkable: true, emoji: '✨' });
  set(portalPos.x + 1, portalPos.y, { type: 'path', walkable: true, emoji: '✨' });

  // Vertical main path
  for (let y = gt; y <= portalPos.y + 1; y++) {
    if (tiles[y][mainDoorX].type === 'grass') set(mainDoorX, y, { type: 'path', walkable: true });
  }

  // Side paths
  for (let y = HOUSE_Y - 1; y <= HOUSE_Y + HOUSE_H + 1; y++) {
    set(HOUSE_X + HOUSE_W + 1, y, { type: 'path', walkable: true });
    set(HOUSE_X - 1, y, { type: 'path', walkable: true });
  }

  // Resources in safe zone
  let placed = 0;
  for (let attempt = 0; attempt < 500 && placed < 40; attempt++) {
    const rx = Math.floor(rng() * (SAFE_X2 - SAFE_X1)) + SAFE_X1;
    const ry = Math.floor(rng() * (SAFE_Y2 - SAFE_Y1)) + SAFE_Y1;
    if (tiles[ry][rx].type !== 'grass') continue;
    if (rx >= HOUSE_X - 3 && rx <= HOUSE_X + HOUSE_W + 3 && ry >= GARDEN_Y - 3 && ry <= HOUSE_Y + HOUSE_H + 5) continue;
    const resInfo = SAFE_RESOURCES[Math.floor(rng() * SAFE_RESOURCES.length)];
    set(rx, ry, { type: 'grass', walkable: true, emoji: resInfo.emoji });
    placed++;
  }

  // Forest outside safe zone
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (x < SAFE_X1 || x > SAFE_X2 || y < SAFE_Y1 || y > SAFE_Y2) {
        const deco = ((x + y) % 3 === 0) ? '🌲' : ((x + y) % 3 === 1) ? '🌳' : '🌿';
        set(x, y, { type: 'wall', walkable: false, emoji: deco });
      }
    }
  }

  // Pest spots near garden
  for (const p of [{ x: GARDEN_X - 3, y: GARDEN_Y + 2 }, { x: gr + 2, y: GARDEN_Y + 1 }, { x: GARDEN_X + 2, y: GARDEN_Y - 3 }]) {
    if (tiles[p.y]?.[p.x]?.type === 'grass') set(p.x, p.y, { type: 'grass', walkable: true, emoji: '🐛' });
  }

  return {
    tiles, width: MAP_W, height: MAP_H, rooms, gardenPlots, chestPos, portalPos,
    doorPos: { x: mainDoorX, y: mainDoorY },
    spawnPos: { x: mainDoorX, y: mainDoorY - 1 },
    safeZone: { x1: SAFE_X1, y1: SAFE_Y1, x2: SAFE_X2, y2: SAFE_Y2 },
  };
}
