'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import TileRenderer from '@/components/world/TileRenderer'
import ClockStardew from '@/components/hud/ClockStardew'
import Minimap from '@/components/hud/Minimap'
import { generateMaisonMap, TILE_COLORS, TILE_WALKABLE, TILE_INTERACTIVE, SPAWN_X, SPAWN_Y, MAP_W, MAP_H, GARDEN_PLOTS } from '@/data/maps/maison'

const TILE_SIZE = 48 // 16px * 3

// Garden seed data
const SEEDS: Record<string, { name: string; growthSec: number; emoji: string }> = {
  herbe: { name: 'Herbe', growthSec: 240, emoji: '🌿' },
  lavande: { name: 'Lavande', growthSec: 360, emoji: '💜' },
  champignon: { name: 'Champignon', growthSec: 600, emoji: '🍄' },
  baies: { name: 'Baies', growthSec: 480, emoji: '🫐' },
}
const ARTISANE_BONUS = 0.5 // divide growth time by 2

export default function SceneMaison() {
  const [map] = useState(() => generateMaisonMap())
  const [playerX, setPlayerX] = useState(SPAWN_X)
  const [playerY, setPlayerY] = useState(SPAWN_Y)
  const [viewW, setViewW] = useState(390)
  const [viewH, setViewH] = useState(500)
  const [interactMsg, setInteractMsg] = useState<string | null>(null)
  const [gardenOverlay, setGardenOverlay] = useState<number | null>(null) // plot index
  const [menuOverlay, setMenuOverlay] = useState<string | null>(null)
  const [gardenState, setGardenState] = useState<{ seedId: string | null; plantedAt: number | null }[]>([
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
  ])
  const [, setGardenTick] = useState(0) // force re-render for timers
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transitionToScene = useGameStore(s => s.transitionToScene)
  const playerClass = useGameStore(s => s.playerClass)

  // Garden timer tick
  useEffect(() => {
    const interval = setInterval(() => setGardenTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Viewport resize
  useEffect(() => {
    const update = () => {
      setViewW(window.innerWidth)
      setViewH(window.innerHeight - 130 - 28) // minus HUD + topbar
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Move player
  const tryMove = useCallback((dx: number, dy: number) => {
    setPlayerX(prev => {
      const nx = prev + dx
      const ny = playerY + dy
      if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return prev
      const tile = map[ny]?.[nx]
      if (tile === undefined) return prev
      if (TILE_WALKABLE.has(tile) || TILE_INTERACTIVE[tile]) {
        if (dy !== 0) setPlayerY(ny)
        return nx
      }
      return prev
    })
    if (dy !== 0) {
      setPlayerY(prev => {
        const ny = prev + dy
        if (ny < 0 || ny >= MAP_H) return prev
        const tile = map[ny]?.[playerX + (dx || 0)]
        if (tile === undefined) return prev
        if (TILE_WALKABLE.has(tile) || TILE_INTERACTIVE[tile]) return ny
        return prev
      })
    }
  }, [map, playerX, playerY])

  // D-pad hold logic
  const startMove = useCallback((dx: number, dy: number) => {
    tryMove(dx, dy)
    if (moveTimerRef.current) clearInterval(moveTimerRef.current)
    const timeout = setTimeout(() => {
      moveTimerRef.current = setInterval(() => tryMove(dx, dy), 100)
    }, 200)
    moveTimerRef.current = timeout as unknown as ReturnType<typeof setInterval>
  }, [tryMove])

  const stopMove = useCallback(() => {
    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current)
      clearTimeout(moveTimerRef.current as unknown as ReturnType<typeof setTimeout>)
      moveTimerRef.current = null
    }
  }, [])

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch(e.key) {
        case 'ArrowUp': case 'w': tryMove(0, -1); break
        case 'ArrowDown': case 's': tryMove(0, 1); break
        case 'ArrowLeft': case 'a': tryMove(-1, 0); break
        case 'ArrowRight': case 'd': tryMove(1, 0); break
        case ' ': case 'Enter': handleAction(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tryMove, playerX, playerY])

  // Action button (A)
  const handleAction = useCallback(() => {
    // Check adjacent tiles for interactive objects
    const dirs = [[0,-1],[0,1],[-1,0],[1,0],[0,0]]
    for (const [dx, dy] of dirs) {
      const tx = playerX + dx
      const ty = playerY + dy
      if (tx < 0 || ty < 0 || ty >= MAP_H || tx >= MAP_W) continue
      const tile = map[ty]?.[tx]
      const action = TILE_INTERACTIVE[tile]
      if (action) {
        if (action === 'jardin') {
          // Find which garden plot
          const plotIdx = GARDEN_PLOTS.findIndex(p => p.x === tx && p.y === ty)
          if (plotIdx >= 0) {
            const plot = gardenState[plotIdx]
            if (plot.seedId && plot.plantedAt) {
              const seed = SEEDS[plot.seedId]
              const growthMs = seed.growthSec * 1000 * (playerClass === 'artisane' ? ARTISANE_BONUS : 1)
              const elapsed = Date.now() - plot.plantedAt
              if (elapsed >= growthMs) {
                // Harvest
                setGardenState(prev => prev.map((p, i) => i === plotIdx ? { seedId: null, plantedAt: null } : p))
                setInteractMsg('🌾 Récolte : ' + seed.name + ' x2 !')
                setTimeout(() => setInteractMsg(null), 2000)
              } else {
                const remain = Math.ceil((growthMs - elapsed) / 1000)
                setInteractMsg(seed.emoji + ' En croissance... ' + Math.floor(remain / 60) + 'm' + (remain % 60) + 's')
                setTimeout(() => setInteractMsg(null), 2000)
              }
            } else {
              setGardenOverlay(plotIdx)
            }
          }
        } else if (action === 'chambre') {
          setInteractMsg('🛏 Repos... PV restaurés, fatigue à 0 !')
          usePlayerStore.getState().setStats({ hp: usePlayerStore.getState().hpMax, fatigue: 0 })
          setTimeout(() => setInteractMsg(null), 2000)
        } else if (action === 'portail') {
          setInteractMsg('🌀 Portail vers les biomes de Jisse (-30% PV, -20% DEF)')
          setTimeout(() => setInteractMsg(null), 2500)
        } else {
          const labels: Record<string, string> = {
            salon: '✦ Salon — Craft de sorts (Module M3)',
            cuisine: '🍳 Cuisine — Potions & plats (Module M3)',
            armurerie: '⚒ Armurerie — Armes & armures (Module M3)',
            comptoir: '💰 Comptoir — Commerce (Module M5)',
            coffre: '📦 Coffre — Stockage',
          }
          setInteractMsg(labels[action] || action)
          setTimeout(() => setInteractMsg(null), 2500)
        }
        return
      }
    }
  }, [playerX, playerY, map])

  // D-pad button style
  const dpadBtn = (label: string, dx: number, dy: number, extra?: React.CSSProperties) => (
    <button
      onMouseDown={() => startMove(dx, dy)}
      onMouseUp={stopMove}
      onMouseLeave={stopMove}
      onTouchStart={(e) => { e.preventDefault(); startMove(dx, dy) }}
      onTouchEnd={stopMove}
      style={{
        width: 44, height: 44, borderRadius: 8,
        background: 'var(--hud-btn)', color: 'var(--hud-text)',
        border: 'var(--hud-border)', boxShadow: 'var(--hud-shadow)',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
        ...extra,
      }}
    >{label}</button>
  )

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'hidden', position: 'relative' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span style={{ fontSize: 11, color: 'var(--hud-accent)', fontWeight: 600 }}>Mélanie</span>
        <span style={{ fontSize: 10, color: '#9a8fbf' }}>Nv.{usePlayerStore.getState().level}</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(usePlayerStore.getState().hp / usePlayerStore.getState().hpMax) * 100}%`, height: '100%', background: '#7ec850', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 9, color: '#9a8fbf' }}>{usePlayerStore.getState().hp}/{usePlayerStore.getState().hpMax}</span>
        <span style={{ fontSize: 10, color: '#ef9f27' }}>💰{usePlayerStore.getState().sous}</span>
      </div>

      {/* Game Canvas */}
      <div style={{ marginTop: 28, height: viewH, position: 'relative' }}>
        <TileRenderer
          map={map}
          tileColors={TILE_COLORS}
          tileSize={TILE_SIZE}
          cameraX={playerX}
          cameraY={playerY}
          viewportW={viewW}
          viewportH={viewH}
          entities={[{ x: playerX, y: playerY, color: '#D4537E', label: 'Mélanie' }]}
        />
        <ClockStardew />
        <Minimap
          map={map}
          tileColors={TILE_COLORS}
          playerX={playerX}
          playerY={playerY}
          playerColor="#D4537E"
        />
      </div>

      {/* Interaction toast */}
      {interactMsg && (
        <div style={{
          position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#231b42ee', border: '1px solid #3a2d5c', borderRadius: 10,
          padding: '8px 16px', fontSize: 12, color: '#F5ECD7', zIndex: 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        }}>
          {interactMsg}
        </div>
      )}

      {/* Garden overlay — choose seed */}
      {gardenOverlay !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setGardenOverlay(null)}>
          <div style={{
            background: '#231b42', border: '2px solid #7ec850', borderRadius: 16,
            padding: 20, width: 300, maxWidth: '90%',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#7ec850', marginBottom: 12 }}>🌱 Bac {gardenOverlay + 1} — Planter</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(SEEDS).map(([id, seed]) => {
                const growthSec = seed.growthSec * (playerClass === 'artisane' ? ARTISANE_BONUS : 1)
                return (
                  <button key={id} onClick={() => {
                    setGardenState(prev => prev.map((p, i) => i === gardenOverlay ? { seedId: id, plantedAt: Date.now() } : p))
                    setGardenOverlay(null)
                    setInteractMsg(seed.emoji + ' ' + seed.name + ' plantée ! Prête dans ' + Math.floor(growthSec / 60) + 'min')
                    setTimeout(() => setInteractMsg(null), 2000)
                  }} style={{
                    background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 10,
                    padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: '#F5ECD7' }}>{seed.emoji} {seed.name}</span>
                    <span style={{ fontSize: 10, color: '#9a8fbf' }}>{Math.floor(growthSec / 60)}min</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setGardenOverlay(null)} style={{
              marginTop: 12, width: '100%', padding: '8px', background: 'transparent',
              border: '1px solid #3a2d5c', borderRadius: 8, color: '#9a8fbf', fontSize: 11, cursor: 'pointer',
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Menu overlay */}
      {menuOverlay && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setMenuOverlay(null)}>
          <div style={{
            background: '#231b42', border: '2px solid var(--hud-accent)', borderRadius: 16,
            padding: 20, width: 320, maxWidth: '90%', maxHeight: '70vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hud-accent)', marginBottom: 12 }}>{menuOverlay}</div>
            <div style={{ fontSize: 12, color: '#9a8fbf', lineHeight: 1.8 }}>
              {menuOverlay === 'Sac' && <div>Inventaire vide pour l'instant.<br/>Explore et récolte pour remplir ton sac !</div>}
              {menuOverlay === 'Sorts' && <div>Aucun sort crafté.<br/>Va au Salon (✦) pour crafter tes premiers sorts.</div>}
              {menuOverlay === 'Équip' && <div>
                <div>Arme : —</div><div>Armure : —</div><div>Casque : —</div>
                <div>Gants : —</div><div>Bottes : —</div><div>Amulette : —</div>
              </div>}
              {menuOverlay === 'Perso' && <div>
                <div style={{ color: '#D4537E', fontWeight: 600 }}>Mélanie — Artisane</div>
                <div>Niveau : {usePlayerStore.getState().level}</div>
                <div>PV : {usePlayerStore.getState().hp}/{usePlayerStore.getState().hpMax}</div>
                <div>ATK : {usePlayerStore.getState().atk} | DEF : {usePlayerStore.getState().def}</div>
                <div>Sous : {usePlayerStore.getState().sous} 💰</div>
                <div>Fatigue : {Math.round(usePlayerStore.getState().fatigue)}%</div>
              </div>}
              {menuOverlay === 'Livres' && <div>
                <div>📖 Grimoire des sorts (0/20)</div>
                <div>📖 Livre de cuisine (0/20)</div>
                <div>📖 Catalogue d'armes (0/20)</div>
                <div>📖 Chroniques (vide)</div>
              </div>}
            </div>
            <button onClick={() => setMenuOverlay(null)} style={{
              marginTop: 16, width: '100%', padding: '10px', background: 'var(--hud-accent)',
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Controls Zone */}
      <div className="controls-zone" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Menu bar */}
        <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid rgba(139,105,20,0.3)' }}>
          {['Sac', 'Sorts', 'Équip', 'Perso', 'Livres'].map(m => (
            <button key={m} onClick={() => setMenuOverlay(m)} style={{
              flex: 1, padding: '4px 0', background: menuOverlay === m ? 'rgba(212,83,126,0.3)' : 'rgba(139,105,20,0.2)',
              border: '1px solid rgba(139,105,20,0.4)', borderRadius: 4,
              color: 'var(--hud-text)', fontSize: 9, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>

        {/* D-pad + Action */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          {/* D-pad */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 44px', gridTemplateRows: '44px 44px 44px', gap: 2 }}>
            <div />
            {dpadBtn('↑', 0, -1)}
            <div />
            {dpadBtn('←', -1, 0)}
            <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#3a2d5c' }}>
              {playerX},{playerY}
            </div>
            {dpadBtn('→', 1, 0)}
            <div />
            {dpadBtn('↓', 0, 1)}
            <div />
          </div>

          {/* Stats */}
          <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center', lineHeight: 1.8 }}>
            <div>Biome : Maison</div>
            <div>Pos : {playerX}, {playerY}</div>
          </div>

          {/* Button A */}
          <button
            onClick={handleAction}
            onTouchStart={(e) => { e.preventDefault(); handleAction() }}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--hud-accent)', color: '#fff',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 10px rgba(212,83,126,0.4), var(--hud-shadow)',
              fontSize: 20, fontWeight: 700, cursor: 'pointer',
            }}
          >A</button>
        </div>
      </div>
    </div>
  )
}
