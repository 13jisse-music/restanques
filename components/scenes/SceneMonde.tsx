'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import TileRenderer from '@/components/world/TileRenderer'
import ClockStardew from '@/components/hud/ClockStardew'
import Minimap from '@/components/hud/Minimap'
import { generateGarrigue, GARRIGUE_COLORS, GARRIGUE_WALKABLE, GARRIGUE_INTERACTIVE, SPAWN_X, SPAWN_Y, MAP_W, MAP_H, spawnMonsters, MapEntity } from '@/data/maps/garrigue'

const TILE_SIZE = 48
const MOVE_SPEED = 0.08 // tiles per frame

export default function SceneMonde() {
  const [mapData] = useState(() => generateGarrigue(42))
  const [monsters] = useState(() => spawnMonsters(42))
  const [playerX, setPlayerX] = useState(SPAWN_X)
  const [playerY, setPlayerY] = useState(SPAWN_Y)
  const [viewW, setViewW] = useState(390)
  const [viewH, setViewH] = useState(500)
  const [interactMsg, setInteractMsg] = useState<string | null>(null)
  const [menuOverlay, setMenuOverlay] = useState<string | null>(null)

  // Joystick state
  const [joyActive, setJoyActive] = useState(false)
  const [joyDX, setJoyDX] = useState(0)
  const [joyDY, setJoyDY] = useState(0)
  const joyRef = useRef<HTMLDivElement>(null)
  const joyCenterRef = useRef({ x: 0, y: 0 })
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0)

  const { transitionToScene } = useGameStore()
  const player = usePlayerStore()

  // Viewport
  useEffect(() => {
    const update = () => { setViewW(window.innerWidth); setViewH(window.innerHeight - 130 - 28) }
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Joystick touch handlers
  const joyStart = (cx: number, cy: number) => {
    const rect = joyRef.current?.getBoundingClientRect()
    if (!rect) return
    joyCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setJoyActive(true)
    joyMove(cx, cy)
  }

  const joyMove = (cx: number, cy: number) => {
    const c = joyCenterRef.current
    let dx = (cx - c.x) / 34, dy = (cy - c.y) / 34
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 1) { dx /= dist; dy /= dist }
    setJoyDX(dx); setJoyDY(dy)
  }

  const joyEnd = () => { setJoyActive(false); setJoyDX(0); setJoyDY(0) }

  // Movement loop
  useEffect(() => {
    function tick() {
      if (joyDX !== 0 || joyDY !== 0) {
        setPlayerX(prev => {
          const nx = prev + joyDX * MOVE_SPEED
          if (nx < 0 || nx >= MAP_W) return prev
          const tileX = Math.floor(nx), tileY = Math.floor(playerY)
          const tile = mapData.map[tileY]?.[tileX]
          if (tile === undefined) return prev
          if (GARRIGUE_WALKABLE.has(tile) || tile === 10 || tile === 11) return nx
          return prev
        })
        setPlayerY(prev => {
          const ny = prev + joyDY * MOVE_SPEED
          if (ny < 0 || ny >= MAP_H) return prev
          const tileX = Math.floor(playerX), tileY = Math.floor(ny)
          const tile = mapData.map[tileY]?.[tileX]
          if (tile === undefined) return prev
          if (GARRIGUE_WALKABLE.has(tile) || tile === 10 || tile === 11) return ny
          return prev
        })
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [joyDX, joyDY, mapData.map, playerX, playerY])

  // Check monster collision
  useEffect(() => {
    const px = Math.floor(playerX), py = Math.floor(playerY)
    for (const m of monsters) {
      if (Math.abs(m.x - px) < 2 && Math.abs(m.y - py) < 2) {
        transitionToScene('combat', { name: m.name, hp: (m as any).hp || 30, atk: (m as any).atk || 8, def: (m as any).def || 3, weakness: (m as any).weakness || 'Feu', atbSpeed: (m as any).atbSpeed || 3, xp: (m as any).xp || 15 })
        break
      }
    }
  }, [Math.floor(playerX), Math.floor(playerY)])

  // Keyboard
  useEffect(() => {
    const keys = new Set<string>()
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key)
      updateJoy()
      if (e.key === ' ' || e.key === 'Enter') handleAction()
    }
    const onUp = (e: KeyboardEvent) => { keys.delete(e.key); updateJoy() }
    function updateJoy() {
      let dx = 0, dy = 0
      if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1
      if (keys.has('ArrowRight') || keys.has('d')) dx += 1
      if (keys.has('ArrowUp') || keys.has('w')) dy -= 1
      if (keys.has('ArrowDown') || keys.has('s')) dy += 1
      setJoyDX(dx); setJoyDY(dy)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [playerX, playerY])

  // Action
  const handleAction = useCallback(() => {
    const px = Math.floor(playerX), py = Math.floor(playerY)
    const dirs = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]
    for (const [dx, dy] of dirs) {
      const tx = px + dx, ty = py + dy
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue
      const tile = mapData.map[ty]?.[tx]
      const action = GARRIGUE_INTERACTIVE[tile]
      if (action === 'pnj') {
        const pnj = mapData.entities.find(e => e.x === tx && e.y === ty && e.type === 'pnj')
        setInteractMsg(pnj ? `${pnj.name} : "Bienvenue dans la Garrigue !"` : 'PNJ')
        setTimeout(() => setInteractMsg(null), 3000)
        return
      }
      if (action === 'portail_maison') {
        transitionToScene('maison')
        return
      }
      if (action === 'portail_calanques') {
        setInteractMsg('🔒 Portail verrouillé — Vaincre le Sanglier géant pour ouvrir')
        setTimeout(() => setInteractMsg(null), 3000)
        return
      }
      if (action === 'donjon') {
        setInteractMsg('🏰 Donjon du Grand Cerf — Module M8')
        setTimeout(() => setInteractMsg(null), 2500)
        return
      }
      if (action === 'resource') {
        setInteractMsg('🪓 Récolte ! +1 matériau')
        setTimeout(() => setInteractMsg(null), 1500)
        return
      }
      if (action === 'buisson') {
        setInteractMsg('🌿 Buisson — tape pour récolter')
        setTimeout(() => setInteractMsg(null), 1500)
        return
      }
    }
  }, [playerX, playerY, mapData, transitionToScene])

  // Entities for TileRenderer
  const allEntities = [
    { x: playerX, y: playerY, color: '#ef9f27', label: 'Jisse' },
    ...mapData.entities.filter(e => e.type === 'pnj').map(e => ({ x: e.x, y: e.y, color: '#ef9f27', label: e.name })),
    ...mapData.entities.filter(e => e.type.includes('portail')).map(e => ({ x: e.x, y: e.y, color: '#e91e8c', label: e.name })),
    ...monsters.map(m => ({ x: m.x, y: m.y, color: '#e24b4a', label: m.name })),
  ]

  const knobX = joyDX * 24, knobY = joyDY * 24

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'hidden', position: 'relative' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600 }}>Jisse</span>
        <span style={{ fontSize: 10, color: '#9a8fbf' }}>Nv.{player.level}</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(player.hp / player.hpMax) * 100}%`, height: '100%', background: '#7ec850', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 9, color: '#9a8fbf' }}>{player.hp}/{player.hpMax}</span>
        <span style={{ fontSize: 10, color: '#ef9f27' }}>💰{player.sous}</span>
      </div>

      {/* Game Canvas */}
      <div style={{ marginTop: 28, height: viewH, position: 'relative' }}>
        <TileRenderer map={mapData.map} tileColors={GARRIGUE_COLORS} tileSize={TILE_SIZE}
          cameraX={playerX} cameraY={playerY} viewportW={viewW} viewportH={viewH} entities={allEntities} />
        <ClockStardew />
        <Minimap map={mapData.map} tileColors={GARRIGUE_COLORS} playerX={Math.floor(playerX)} playerY={Math.floor(playerY)} playerColor="#ef9f27" fogRadius={20} />
      </div>

      {/* Interaction toast */}
      {interactMsg && (
        <div style={{ position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#231b42ee', border: '1px solid #3a2d5c', borderRadius: 10,
          padding: '8px 16px', fontSize: 12, color: '#F5ECD7', zIndex: 200 }}>
          {interactMsg}
        </div>
      )}

      {/* Menu overlay */}
      {menuOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setMenuOverlay(null)}>
          <div style={{ background: '#231b42', border: '2px solid var(--hud-accent)', borderRadius: 16, padding: 20, width: 320, maxWidth: '90%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hud-accent)', marginBottom: 12 }}>{menuOverlay}</div>
            <div style={{ fontSize: 12, color: '#9a8fbf' }}>Contenu du {menuOverlay} (à implémenter)</div>
            <button onClick={() => setMenuOverlay(null)} style={{ marginTop: 16, width: '100%', padding: '10px', background: 'var(--hud-accent)',
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-zone" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Menu */}
        <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid rgba(139,105,20,0.3)' }}>
          {['Sac', 'Sorts', 'Équip', 'Quêtes', 'Bestiaire'].map(m => (
            <button key={m} onClick={() => setMenuOverlay(m)} style={{
              flex: 1, padding: '4px 0', background: 'rgba(139,105,20,0.2)',
              border: '1px solid rgba(139,105,20,0.4)', borderRadius: 4,
              color: 'var(--hud-text)', fontSize: 9, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>

        {/* Joystick + Buttons */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          {/* Joystick */}
          <div ref={joyRef} style={{
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,105,20,0.3)',
            border: '2px solid var(--hud-btn)', position: 'relative', touchAction: 'none',
          }}
            onMouseDown={(e) => joyStart(e.clientX, e.clientY)}
            onMouseMove={(e) => { if (joyActive) joyMove(e.clientX, e.clientY) }}
            onMouseUp={joyEnd} onMouseLeave={joyEnd}
            onTouchStart={(e) => { e.preventDefault(); joyStart(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchMove={(e) => { e.preventDefault(); joyMove(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchEnd={joyEnd}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--hud-btn)',
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`,
              border: '2px solid var(--hud-text)', boxShadow: 'var(--hud-shadow)',
            }} />
          </div>

          {/* Stats */}
          <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center' }}>
            Garrigue<br />Nv 1-6
          </div>

          {/* Buttons A + B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={handleAction}
              onTouchStart={(e) => { e.preventDefault(); handleAction() }}
              style={{
                width: 52, height: 52, borderRadius: '50%', background: 'var(--hud-accent)', color: '#fff',
                border: '3px solid rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(212,83,126,0.4), var(--hud-shadow)',
              }}>A</button>
            <button onClick={() => transitionToScene('maison')} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--hud-btn)', color: 'var(--hud-text)',
              border: 'var(--hud-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: 'var(--hud-shadow)', alignSelf: 'center',
            }}>B</button>
          </div>
        </div>
      </div>
    </div>
  )
}
