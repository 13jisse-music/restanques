'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import TileRenderer from '@/components/world/TileRenderer'
import { MONSTERS } from '@/data/monsters'
import { playPlaceholderSound, playMusic } from '@/lib/assetLoader'
import { markBossDefeated } from '@/lib/biomeLoader'
import { triggerStory } from '@/lib/storyEngine'

const TILE_SIZE = 48
const COLORS: Record<number, string> = {
  0: '#2a2a3a', // sol pierre
  1: '#1a1a28', // mur
  2: '#3a3a4a', // porte
  3: '#4a3a2a', // escalier
  4: '#5a4a3a', // coffre
  5: '#ef9f27', // torche
}

// Generate maze using recursive backtracker
function generateMaze(w: number, h: number, seed: number): number[][] {
  const map: number[][] = Array.from({ length: h }, () => Array(w).fill(1)) // all walls
  let s = seed
  const rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }

  // Carve passages
  const visited = new Set<string>()
  const stack: [number, number][] = []
  const sx = 1, sy = 1
  map[sy][sx] = 0
  visited.add(`${sx},${sy}`)
  stack.push([sx, sy])

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1]
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].filter(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy
      return nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && !visited.has(`${nx},${ny}`)
    })

    if (dirs.length === 0) { stack.pop(); continue }

    const [dx, dy] = dirs[Math.floor(rng() * dirs.length)]
    const nx = cx + dx, ny = cy + dy
    map[cy + dy / 2][cx + dx / 2] = 0 // carve wall between
    map[ny][nx] = 0
    visited.add(`${nx},${ny}`)
    stack.push([nx, ny])
  }

  // Add torches on walls near passages
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (map[y][x] === 1) {
      const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => map[y + dy]?.[x + dx] === 0)
      if (adj && rng() > 0.85) map[y][x] = 5
    }
  }

  // Place entrance (top-left area)
  map[1][0] = 2

  return map
}

type DonjonType = 'demiboss' | 'boss'

export default function SceneDonjon() {
  const { sceneData, transitionToScene } = useGameStore()
  const player = usePlayerStore()
  const donjonType = ((sceneData as Record<string, string>)?.type || 'demiboss') as DonjonType
  const biome = (sceneData as Record<string, string>)?.biome || 'garrigue'

  const mapSize = donjonType === 'demiboss' ? 31 : 41 // odd for maze gen
  const [level, setLevel] = useState(1)
  const maxLevels = donjonType === 'demiboss' ? 1 : 3
  const [map, setMap] = useState(() => generateMaze(mapSize, mapSize, 42 + level))
  const [playerX, setPlayerX] = useState(1)
  const [playerY, setPlayerY] = useState(1)
  const [viewW, setViewW] = useState(390)
  const [viewH, setViewH] = useState(500)
  const [msg, setMsg] = useState<string | null>(null)
  const posRef = useRef({ x: 1, y: 1 })
  const joyDXRef = useRef(0), joyDYRef = useRef(0)
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0)
  const [joyDX, setJoyDX] = useState(0)
  const [joyDY, setJoyDY] = useState(0)
  const joyRef = useRef<HTMLDivElement>(null)
  const joyCenterRef = useRef({ x: 0, y: 0 })
  const [joyActive, setJoyActive] = useState(false)

  useEffect(() => {
    const update = () => { setViewW(window.innerWidth); setViewH(window.innerHeight - 120 - 24) }
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // CDC M8: Dungeon monsters — spawn 5-8 per level with stat boost
  const [dungeonMonsters, setDungeonMonsters] = useState<{ x: number; y: number; data: typeof MONSTERS[0] }[]>([])
  // CDC M8: Coffres loot
  const [chests, setChests] = useState<{ x: number; y: number; opened: boolean }[]>([])

  // CDC M8: Story trigger on dungeon entry + dungeon music
  useEffect(() => {
    const biomeCap = biome.charAt(0).toUpperCase() + biome.slice(1)
    const storyId = `story_${biome}_demiboss_entree`
    triggerStory(storyId, 'donjon')
    playMusic('/music/donjon.mp3')
  }, [])

  // Regenerate map on level change
  useEffect(() => {
    setMap(generateMaze(mapSize, mapSize, 42 + level * 7))
    setPlayerX(1); setPlayerY(1); posRef.current = { x: 1, y: 1 }
    // CDC M8: Spawn monsters for this level
    const biomeCap = biome.charAt(0).toUpperCase() + biome.slice(1)
    const biomeMonsters = MONSTERS.filter(m => m.biome === biomeCap && m.type === 'Normal')
    const statMult = donjonType === 'demiboss' ? 1.2 : 1.3 // CDC M8: +20% demi-boss, +30% boss
    const count = 5 + Math.floor(Math.random() * 4) // 5-8
    const spawned: typeof dungeonMonsters = []
    for (let i = 0; i < count && biomeMonsters.length > 0; i++) {
      const m = biomeMonsters[Math.floor(Math.random() * biomeMonsters.length)]
      const x = 3 + Math.floor(Math.random() * (mapSize - 6))
      const y = 3 + Math.floor(Math.random() * (mapSize - 6))
      spawned.push({ x, y, data: { ...m, hp: Math.floor(m.hp * statMult), atk: Math.floor(m.atk * statMult), def: Math.floor(m.def * statMult) } })
    }
    setDungeonMonsters(spawned)
    // CDC M8: Spawn 1-2 chests
    const chestCount = 1 + Math.floor(Math.random() * 2)
    const newChests: typeof chests = []
    for (let i = 0; i < chestCount; i++) {
      newChests.push({ x: 5 + Math.floor(Math.random() * (mapSize - 10)), y: 5 + Math.floor(Math.random() * (mapSize - 10)), opened: false })
    }
    setChests(newChests)
  }, [level, mapSize])

  // Place stairs and boss room
  useEffect(() => {
    setMap(prev => {
      const m = prev.map(r => [...r])
      // Find dead-end for stairs/boss
      let bestX = mapSize - 2, bestY = mapSize - 2
      for (let y = mapSize - 2; y > mapSize / 2; y--) for (let x = mapSize - 2; x > mapSize / 2; x--) {
        if (m[y][x] === 0) { bestX = x; bestY = y; break }
      }
      if (level < maxLevels) m[bestY][bestX] = 3 // escalier
      else { m[bestY][bestX] = 4; /* boss room marker */ }
      return m
    })
  }, [level, maxLevels, mapSize])

  const canWalk = useCallback((x: number, y: number) => {
    const tx = Math.floor(x), ty = Math.floor(y)
    if (tx < 0 || ty < 0 || tx >= mapSize || ty >= mapSize) return false
    return map[ty]?.[tx] !== 1 && map[ty]?.[tx] !== 5
  }, [map, mapSize])

  // Movement
  useEffect(() => {
    let lastTime = 0
    function tick(time: number) {
      if (lastTime) {
        const dt = Math.min((time - lastTime) / 1000, 0.05)
        let dx = joyDXRef.current, dy = joyDYRef.current
        if (dx !== 0 || dy !== 0) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
          const speed = 3
          const pos = posRef.current
          const nx = pos.x + dx * speed * dt, ny = pos.y + dy * speed * dt
          if (dx !== 0 && canWalk(nx, pos.y)) pos.x = nx
          if (dy !== 0 && canWalk(pos.x, ny)) pos.y = ny
          setPlayerX(pos.x); setPlayerY(pos.y)
        }
      }
      lastTime = time
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [canWalk])

  // Joystick handlers
  const joyStart = (cx: number, cy: number) => {
    const rect = joyRef.current?.getBoundingClientRect()
    if (!rect) return
    joyCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setJoyActive(true)
  }
  const joyMove = (cx: number, cy: number) => {
    const c = joyCenterRef.current
    let dx = (cx - c.x) / 34, dy = (cy - c.y) / 34
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 1) { dx /= dist; dy /= dist }
    joyDXRef.current = dx; joyDYRef.current = dy; setJoyDX(dx); setJoyDY(dy)
  }
  const joyEnd = () => { setJoyActive(false); joyDXRef.current = 0; joyDYRef.current = 0; setJoyDX(0); setJoyDY(0) }

  // CDC M8: Monster collision in dungeon
  useEffect(() => {
    const px = Math.floor(playerX), py = Math.floor(playerY)
    for (const m of dungeonMonsters) {
      if (Math.abs(m.x - px) + Math.abs(m.y - py) < 2) {
        setDungeonMonsters(prev => prev.filter(dm => dm !== m))
        playPlaceholderSound('hit')
        transitionToScene('combat', { name: m.data.name, hp: m.data.hp, atk: m.data.atk, def: m.data.def, weakness: m.data.weakness, atbSpeed: m.data.atbSpeed, xp: m.data.xp })
        break
      }
    }
  }, [playerX, playerY, dungeonMonsters])

  // Action
  const handleAction = useCallback(() => {
    const px = Math.floor(posRef.current.x), py = Math.floor(posRef.current.y)
    // CDC M8: Coffre interaction
    const chest = chests.find(c => !c.opened && Math.abs(c.x - px) <= 1 && Math.abs(c.y - py) <= 1)
    if (chest) {
      chest.opened = true
      setChests([...chests])
      const lootItems = ['potion_soin', 'herbe_med', 'antidote', 'cristal']
      const loot = lootItems[Math.floor(Math.random() * lootItems.length)]
      player.addToInventory(loot, 1 + Math.floor(Math.random() * 2))
      player.addSous(20 + Math.floor(Math.random() * 30))
      setMsg('Coffre ! ' + loot + ' + Sous')
      playPlaceholderSound('chest')
      setTimeout(() => setMsg(null), 2000)
      return
    }
    const tile = map[py]?.[px]
    if (tile === 3) { // escalier
      if (level < maxLevels) {
        setLevel(l => l + 1)
        setMsg('Descente au niveau ' + (level + 1) + '...')
        setTimeout(() => setMsg(null), 1500)
      }
    } else if (tile === 4) { // boss room
      // CDC M8: Load boss from monster data based on biome + dungeon type
      const biomeCap = biome.charAt(0).toUpperCase() + biome.slice(1)
      const targetType = donjonType === 'demiboss' ? 'Demi-boss' : 'Boss'
      const bossMonster = MONSTERS.find(m => m.biome === biomeCap && m.type.includes(targetType.split('-').pop()!))
        || MONSTERS.find(m => m.biome === biomeCap && (donjonType === 'demiboss' ? m.type === 'Demi-boss' : m.type === 'Boss' || m.type === 'Boss final'))
      if (bossMonster) {
        playPlaceholderSound('portal')
        transitionToScene('combat', {
          name: bossMonster.name, hp: bossMonster.hp, atk: bossMonster.atk,
          def: bossMonster.def, weakness: bossMonster.weakness,
          atbSpeed: bossMonster.atbSpeed, xp: bossMonster.xp,
        })
      } else {
        setMsg('Boss non trouvé pour ' + biome)
        setTimeout(() => setMsg(null), 2000)
      }
    } else if (tile === 2) { // porte/sortie
      transitionToScene('monde')
    }
  }, [map, level, maxLevels, donjonType, transitionToScene])

  // Keyboard
  useEffect(() => {
    const keys = new Set<string>()
    function updateJoy() {
      let dx = 0, dy = 0
      if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1
      if (keys.has('ArrowRight') || keys.has('d')) dx += 1
      if (keys.has('ArrowUp') || keys.has('w')) dy -= 1
      if (keys.has('ArrowDown') || keys.has('s')) dy += 1
      joyDXRef.current = dx; joyDYRef.current = dy; setJoyDX(dx); setJoyDY(dy)
    }
    const onDown = (e: KeyboardEvent) => { keys.add(e.key); updateJoy(); if (e.key === ' ' || e.key === 'Enter') handleAction() }
    const onUp = (e: KeyboardEvent) => { keys.delete(e.key); updateJoy() }
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [handleAction])

  const knobX = joyDX * 24, knobY = joyDY * 24

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#0a0a15', overflow: 'hidden' }}>
      <div className="top-bar" style={{ background: '#1a1a28' }}>
        <span style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600 }}>Donjon</span>
        <span style={{ fontSize: 10, color: '#9a8fbf' }}>Nv {level}/{maxLevels}</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(player.hp / player.hpMax) * 100}%`, height: '100%', background: '#7ec850', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 9, color: '#9a8fbf' }}>{player.hp}/{player.hpMax}</span>
      </div>

      <div style={{ marginTop: 24, height: viewH, position: 'relative' }}>
        <TileRenderer map={map} tileColors={COLORS} tileSize={TILE_SIZE}
          cameraX={playerX} cameraY={playerY} viewportW={viewW} viewportH={viewH}
          entities={[{ x: playerX, y: playerY, color: '#ef9f27', label: '' }]} />
      </div>

      {msg && (
        <div style={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', background: '#231b42ee', border: '1px solid #3a2d5c', borderRadius: 10, padding: '8px 16px', fontSize: 12, color: '#F5ECD7', zIndex: 200 }}>{msg}</div>
      )}

      <div className="controls-zone" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#1a1a28' }}>
        <div ref={joyRef} style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(100,100,100,0.2)', border: '2px solid #3a3a4a', position: 'relative', touchAction: 'none' }}
          onMouseDown={e => { joyStart(e.clientX, e.clientY); joyMove(e.clientX, e.clientY) }}
          onMouseMove={e => { if (joyActive) joyMove(e.clientX, e.clientY) }}
          onMouseUp={joyEnd} onMouseLeave={joyEnd}
          onTouchStart={e => { e.preventDefault(); joyStart(e.touches[0].clientX, e.touches[0].clientY); joyMove(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={e => { e.preventDefault(); joyMove(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={joyEnd}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5a5a6a', position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`, border: '2px solid #8a8a9a' }} />
        </div>

        <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center' }}>
          {donjonType === 'demiboss' ? 'Donjon' : 'Château'}<br />Niveau {level}/{maxLevels}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={handleAction} style={{ width: 52, height: 52, borderRadius: '50%', background: '#ef9f27', color: '#fff', border: '3px solid rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>A</button>
          <button onClick={() => transitionToScene('monde')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#3a3a4a', color: '#9a8fbf', border: '1px solid #5a5a6a', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'center' }}>B</button>
        </div>
      </div>
    </div>
  )
}
