// CDC M4: Biome loader — unified interface for all 5 biomes
// CDC M10: Triggers lazy asset preloading per biome
// Loads map, colors, walkable, interactive tiles, monsters, NPCs per biome

import { generateGarrigue, GARRIGUE_COLORS, GARRIGUE_WALKABLE, GARRIGUE_INTERACTIVE, SPAWN_X as GS_X, SPAWN_Y as GS_Y, MAP_W, MAP_H, spawnMonsters as spawnGarrigue, MapEntity } from '@/data/maps/garrigue'
import { generateCalanques, CALANQUES_COLORS, CALANQUES_WALKABLE, SPAWN_X as CS_X, SPAWN_Y as CS_Y } from '@/data/maps/calanques'
import { generateMines, MINES_COLORS, MINES_WALKABLE, SPAWN_X as MS_X, SPAWN_Y as MS_Y } from '@/data/maps/mines'
import { generateMer, MER_COLORS, MER_WALKABLE, SPAWN_X as MeS_X, SPAWN_Y as MeS_Y } from '@/data/maps/mer'
import { generateRestanques, RESTANQUES_COLORS, RESTANQUES_WALKABLE, SPAWN_X as RS_X, SPAWN_Y as RS_Y } from '@/data/maps/restanques'
import { MONSTERS, Monster } from '@/data/monsters'
import { PNJ_LIST } from '@/data/pnj'
import { QUESTS, Quest } from '@/data/quests'

export type BiomeId = 'garrigue' | 'calanques' | 'mines' | 'mer' | 'restanques'

export interface BiomeData {
  id: BiomeId
  name: string
  map: number[][]
  colors: Record<number, string>
  walkable: Set<number>
  interactive: Record<number, string>
  spawnX: number
  spawnY: number
  monsters: MapEntity[]
  pnjs: MapEntity[]
  entities: MapEntity[]
  levelRange: [number, number]
  nextBiome: BiomeId | null
  prevBiome: BiomeId | 'maison'
  music: string
}

// Interactive tile codes (shared across biomes)
const COMMON_INTERACTIVE: Record<number, string> = {
  10: 'pnj', 11: 'portail_home', 12: 'portail_next', 13: 'donjon',
  14: 'portail_prev', 20: 'resource', 21: 'resource', 22: 'resource', 3: 'buisson',
}

// Seeded random for placing entities
function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
}

function placeEntities(map: number[][], walkable: Set<number>, seed: number, biomeId: string): { pnjs: MapEntity[]; portals: MapEntity[]; dungeon: MapEntity[] } {
  const rng = seededRandom(seed)
  const pnjs: MapEntity[] = []
  const portals: MapEntity[] = []
  const dungeon: MapEntity[] = []

  const biomePnjs = PNJ_LIST.filter(p => p.biome === biomeId.charAt(0).toUpperCase() + biomeId.slice(1))

  // Place PNJs along the main path
  biomePnjs.forEach((pnj, i) => {
    const x = 20 + Math.floor(rng() * 100)
    const y = 20 + Math.floor(rng() * 100)
    pnjs.push({ x, y, type: 'pnj', id: pnj.id, name: pnj.name })
  })

  // Portal home (bottom-left)
  portals.push({ x: 5, y: MAP_H - 5, type: 'portail_home', id: 'home', name: 'Maison' })
  // Portal next biome (top-right)
  portals.push({ x: MAP_W - 10, y: 10, type: 'portail_next', id: 'next', name: 'Biome suivant' })
  // Portal previous (bottom-right)
  portals.push({ x: MAP_W - 10, y: MAP_H - 10, type: 'portail_prev', id: 'prev', name: 'Biome précédent' })
  // Dungeon entrance (center-ish)
  dungeon.push({ x: Math.floor(MAP_W / 2) + Math.floor(rng() * 20), y: Math.floor(MAP_H / 2) + Math.floor(rng() * 20), type: 'donjon', id: 'donjon', name: 'Donjon' })

  return { pnjs, portals, dungeon }
}

function spawnBiomeMonsters(biomeId: string, seed: number): MapEntity[] {
  const rng = seededRandom(seed + 999)
  const biomeMonsters = MONSTERS.filter(m => m.biome.toLowerCase() === biomeId && (m.type === 'Normal' || m.type === 'Mob fort' || m.type === 'Nuisible'))
  const spawned: MapEntity[] = []

  for (let i = 0; i < 8; i++) {
    const m = biomeMonsters[Math.floor(rng() * biomeMonsters.length)]
    if (!m) continue
    spawned.push({
      x: 10 + Math.floor(rng() * (MAP_W - 20)),
      y: 10 + Math.floor(rng() * (MAP_H - 20)),
      type: 'monster',
      id: m.id,
      name: m.name,
    })
  }
  return spawned
}

const BIOME_INFO: Record<BiomeId, { name: string; levelRange: [number, number]; next: BiomeId | null; prev: BiomeId | 'maison'; music: string; seed: number }> = {
  garrigue: { name: 'Garrigue', levelRange: [1, 6], next: 'calanques', prev: 'maison', music: '/music/garrigue.mp3', seed: 42 },
  calanques: { name: 'Calanques', levelRange: [7, 10], next: 'mines', prev: 'garrigue', music: '/music/garrigue.mp3', seed: 101 },
  mines: { name: 'Mines', levelRange: [12, 15], next: 'mer', prev: 'calanques', music: '/music/combat.mp3', seed: 202 },
  mer: { name: 'Mer', levelRange: [18, 22], next: 'restanques', prev: 'mines', music: '/music/garrigue.mp3', seed: 303 },
  restanques: { name: 'Restanques', levelRange: [25, 30], next: null, prev: 'mer', music: '/music/story.mp3', seed: 404 },
}

const generators: Record<BiomeId, (seed: number) => { map: number[][] }> = {
  garrigue: (s) => generateGarrigue(s),
  calanques: (s) => generateCalanques(s),
  mines: (s) => generateMines(s),
  mer: (s) => generateMer(s),
  restanques: (s) => generateRestanques(s),
}

const colorMaps: Record<BiomeId, Record<number, string>> = {
  garrigue: GARRIGUE_COLORS,
  calanques: CALANQUES_COLORS,
  mines: MINES_COLORS,
  mer: MER_COLORS,
  restanques: RESTANQUES_COLORS,
}

const walkableMaps: Record<BiomeId, Set<number>> = {
  garrigue: GARRIGUE_WALKABLE,
  calanques: CALANQUES_WALKABLE,
  mines: MINES_WALKABLE,
  mer: MER_WALKABLE,
  restanques: RESTANQUES_WALKABLE,
}

export function loadBiome(biomeId: BiomeId): BiomeData {
  // CDC M10: Lazy preload biome assets
  import('@/lib/assetLoader').then(mod => mod.preloadBiomeAssets(biomeId))
  const info = BIOME_INFO[biomeId]
  const gen = generators[biomeId](info.seed)
  const { pnjs, portals, dungeon } = placeEntities(gen.map, walkableMaps[biomeId], info.seed, biomeId)
  const monsters = biomeId === 'garrigue' ? spawnGarrigue(info.seed) : spawnBiomeMonsters(biomeId, info.seed)

  // Place entity tiles on map for interactive detection
  const allEntities = [...pnjs, ...portals, ...dungeon]
  allEntities.forEach(e => {
    if (e.y >= 0 && e.y < MAP_H && e.x >= 0 && e.x < MAP_W) {
      if (e.type === 'pnj') gen.map[e.y][e.x] = 10
      else if (e.type === 'portail_home') gen.map[e.y][e.x] = 11
      else if (e.type === 'portail_next') gen.map[e.y][e.x] = 12
      else if (e.type === 'portail_prev') gen.map[e.y][e.x] = 14
      else if (e.type === 'donjon') gen.map[e.y][e.x] = 13
    }
  })

  // Use garrigue interactive for all biomes (same tile codes)
  const interactive = biomeId === 'garrigue' ? GARRIGUE_INTERACTIVE : COMMON_INTERACTIVE

  const spawnX = biomeId === 'garrigue' ? GS_X : biomeId === 'calanques' ? CS_X : biomeId === 'mines' ? MS_X : biomeId === 'mer' ? MeS_X : RS_X
  const spawnY = biomeId === 'garrigue' ? GS_Y : biomeId === 'calanques' ? CS_Y : biomeId === 'mines' ? MS_Y : biomeId === 'mer' ? MeS_Y : RS_Y

  return {
    id: biomeId,
    name: info.name,
    map: gen.map,
    colors: colorMaps[biomeId],
    walkable: walkableMaps[biomeId],
    interactive,
    spawnX, spawnY,
    monsters,
    pnjs,
    entities: [...allEntities, ...monsters],
    levelRange: info.levelRange,
    nextBiome: info.next,
    prevBiome: info.prev,
    music: info.music,
  }
}

// Get monster data for combat
export function getMonsterData(name: string): Monster | undefined {
  return MONSTERS.find(m => m.name === name)
}

// Get PNJ data
export function getPNJData(id: string) {
  return PNJ_LIST.find(p => p.id === id)
}

// Get quest for PNJ
export function getQuestForPNJ(npcId: string): Quest | undefined {
  const pnj = PNJ_LIST.find(p => p.id === npcId)
  if (!pnj) return undefined
  return QUESTS.find(q => q.npc === pnj.name)
}

// Check biome unlock (need to defeat previous boss)
export function isBiomeUnlocked(biomeId: BiomeId): boolean {
  if (biomeId === 'garrigue') return true
  // Check localStorage for defeated bosses
  try {
    const defeated = JSON.parse(localStorage.getItem('restanques_bosses_defeated') || '[]') as string[]
    const bossRequired: Record<string, string> = {
      calanques: 'Sanglier geant',
      mines: 'Mouette titanesque',
      mer: 'Tarasque',
      restanques: 'Kraken',
    }
    return defeated.includes(bossRequired[biomeId] || '')
  } catch { return false }
}

export function markBossDefeated(bossName: string) {
  try {
    const defeated = JSON.parse(localStorage.getItem('restanques_bosses_defeated') || '[]') as string[]
    if (!defeated.includes(bossName)) {
      defeated.push(bossName)
      localStorage.setItem('restanques_bosses_defeated', JSON.stringify(defeated))
    }
  } catch {}
}
