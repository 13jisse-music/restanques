// Garrigue — carte 150x150, seed fixe
// Tiles: 0=herbe, 1=chemin, 2=rocher, 3=buisson, 4=eau, 5=lavande, 6=arbre(olivier)
// 10=PNJ, 11=portail_maison, 12=portail_calanques(locked), 13=donjon_entree
// 20=resource_bois, 21=resource_herbe, 22=resource_pierre

import { seededRandom, noise2D, smoothNoise, MAP_W as _MW, MAP_H as _MH, type MapEntity } from '@/lib/mapGenerator'
export type { MapEntity } from '@/lib/mapGenerator'

export const GARRIGUE_COLORS: Record<number, string> = {
  0: '#7a9f45', 1: '#c4a661', 2: '#a0968a', 3: '#5a7f3a', 4: '#4a90c4',
  5: '#9370DB', 6: '#4a6b2e', 10: '#ef9f27', 11: '#e91e8c', 12: '#534AB7',
  13: '#8B4513', 20: '#6b5030', 21: '#5a8f3c', 22: '#888',
}

export const GARRIGUE_WALKABLE = new Set([0, 1, 5, 21])
export const GARRIGUE_INTERACTIVE: Record<number, string> = {
  10: 'pnj', 11: 'portail_maison', 12: 'portail_calanques', 13: 'donjon',
  20: 'resource', 21: 'resource', 22: 'resource', 3: 'buisson',
}

export const MAP_W = _MW, MAP_H = _MH

export function generateGarrigue(seed: number = 42): { map: number[][], entities: MapEntity[] } {
  const rng = seededRandom(seed);
  const map: number[][] = [];
  const entities: MapEntity[] = [];

  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const n1 = smoothNoise(x, y, seed, 20);
      const n2 = smoothNoise(x, y, seed + 100, 8);
      const val = n1 * 0.6 + n2 * 0.4;

      let tile = 0; // herbe default

      // Water (low areas)
      if (val < 0.18) tile = 4;
      // Chemin (band)
      else if (Math.abs(y - 75) < 2 || Math.abs(x - 75) < 2) tile = 1;
      // Cross paths
      else if (Math.abs(x - y) < 2 && x > 30 && x < 120) tile = 1;
      // Rochers
      else if (val > 0.82) tile = 2;
      // Buissons
      else if (val > 0.75 && n2 > 0.5) tile = 3;
      // Lavande patches
      else if (val > 0.4 && val < 0.5 && n2 > 0.6) tile = 5;
      // Oliviers
      else if (val > 0.6 && val < 0.65 && n2 < 0.3) tile = 6;
      // Resources scattered
      else if (val > 0.55 && val < 0.58 && n2 > 0.7) tile = 20;
      else if (val > 0.35 && val < 0.38 && n2 < 0.2) tile = 21;

      row.push(tile);
    }
    map.push(row);
  }

  // Ensure spawn area is clear
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      const sx = 10 + dx, sy = MAP_H - 10 + dy;
      if (sx >= 0 && sy >= 0 && sy < MAP_H && sx < MAP_W) map[sy][sx] = 0;
    }

  // Place PNJ
  const pnjPositions = [
    { x: 30, y: 30, id: 'marius', name: 'Marius' },
    { x: 100, y: 50, id: 'rosalie', name: 'Rosalie' },
    { x: 60, y: 100, id: 'gaston_fanny', name: 'Gaston & Fanny' },
    { x: 120, y: 80, id: 'facteur', name: 'Le Facteur' },
    { x: 45, y: 130, id: 'toinette', name: 'Toinette' },
  ];
  pnjPositions.forEach(p => {
    map[p.y][p.x] = 10;
    entities.push({ ...p, type: 'pnj' });
    // Clear around PNJ
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (p.y + dy >= 0 && p.x + dx >= 0 && p.y + dy < MAP_H && p.x + dx < MAP_W && !(dx === 0 && dy === 0))
          map[p.y + dy][p.x + dx] = 0;
  });

  // Portails
  map[MAP_H - 5][5] = 11; // portail maison (sud-ouest)
  entities.push({ x: 5, y: MAP_H - 5, type: 'portail', id: 'portail_maison', name: 'Maison' });
  map[5][MAP_W - 5] = 12; // portail calanques (nord-est, locked)
  entities.push({ x: MAP_W - 5, y: 5, type: 'portail_locked', id: 'portail_calanques', name: 'Calanques 🔒' });

  // Donjon
  map[40][110] = 13;
  entities.push({ x: 110, y: 40, type: 'donjon', id: 'donjon_cerf', name: 'Donjon du Cerf' });

  return { map, entities };
}

export const SPAWN_X = 10, SPAWN_Y = MAP_H - 10;

// Monster spawn positions (random within biome, refreshed)
export function spawnMonsters(seed: number): MapEntity[] {
  const rng = seededRandom(seed + 999);
  const monsters: MapEntity[] = [];
  const types = [
    { id: 'rat', name: 'Rat', hp: 30, atk: 6, def: 2, xp: 12, weakness: 'Feu', atbSpeed: 3 },
    { id: 'serpent', name: 'Serpent', hp: 45, atk: 10, def: 3, xp: 16, weakness: 'Lumiere', atbSpeed: 3.5 },
    { id: 'loup', name: 'Loup', hp: 60, atk: 13, def: 5, xp: 25, weakness: 'Feu', atbSpeed: 2.5 },
  ];

  for (let i = 0; i < 12; i++) {
    const t = types[Math.floor(rng() * types.length)];
    monsters.push({
      ...t,
      x: Math.floor(rng() * 120) + 15,
      y: Math.floor(rng() * 120) + 15,
      type: 'monster',
      id: t.id + '_' + i,
      name: t.name,
    });
  }
  return monsters;
}
