'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import TileRenderer from '@/components/world/TileRenderer'
import ClockStardew from '@/components/hud/ClockStardew'
import Minimap from '@/components/hud/Minimap'
import TopBar from '@/components/hud/TopBar'
import HudArtisane from '@/components/hud/HudArtisane'
import CharacterSheet from '@/components/ui/CharacterSheet'
import ContextualPopup from '@/components/ui/ContextualPopup'
import { generateMaisonMap, TILE_COLORS, TILE_WALKABLE, TILE_INTERACTIVE, SPAWN_X, SPAWN_Y, MAP_W, MAP_H, GARDEN_PLOTS } from '@/data/maps/maison'
import { allPlayersInMaison, broadcastSleep } from '@/lib/realtimeSync'
import { isDay, getGameHour } from '@/lib/dayNightCycle'
import { getDarkness } from '@/lib/dayNightCycle'
import { playPlaceholderSound } from '@/lib/assetLoader'
import { shouldShowPopup, markPopupSeen } from '@/lib/storyEngine'

const TILE_SIZE = 48

// Garden seeds — CDC M1: 4 seeds with base growth times
const SEEDS: Record<string, { name: string; growthSec: number; emoji: string }> = {
  herbe: { name: 'Herbe', growthSec: 240, emoji: '🌿' },
  lavande: { name: 'Lavande', growthSec: 360, emoji: '💜' },
  champignon: { name: 'Champignon', growthSec: 600, emoji: '🍄' },
  baies: { name: 'Baies', growthSec: 480, emoji: '🫐' },
}
const ARTISANE_BONUS = 0.5

// Day creatures — CDC M1: Limaces, Corbeaux, Taupes (levels 1-7, 2-3 max)
const DAY_CREATURES = [
  { name: 'Limace du jardin', hp: 20, atk: 4, def: 1, weakness: 'Feu', atbSpeed: 4, xp: 5 },
  { name: 'Corbeau chapardeur', hp: 25, atk: 6, def: 2, weakness: 'Ombre', atbSpeed: 2, xp: 8 },
  { name: 'Taupe géante', hp: 35, atk: 8, def: 4, weakness: 'Eau', atbSpeed: 3.5, xp: 11 },
]

export default function SceneMaison() {
  const [map] = useState(() => generateMaisonMap())
  const [playerX, setPlayerX] = useState(SPAWN_X)
  const [playerY, setPlayerY] = useState(SPAWN_Y)
  const [viewW, setViewW] = useState(390)
  const [viewH, setViewH] = useState(500)
  const [interactMsg, setInteractMsg] = useState<string | null>(null)
  const [gardenOverlay, setGardenOverlay] = useState<number | null>(null)
  const [menuOverlay, setMenuOverlay] = useState<string | null>(null)
  const [showCharSheet, setShowCharSheet] = useState(false)
  const [popupKey, setPopupKey] = useState<string | null>(null)

  // CDC M1: Death respawn invulnerability (3s flash)
  const [invulnerable, setInvulnerable] = useState(false)
  const [flashVisible, setFlashVisible] = useState(true)

  // Garden state
  const [gardenState, setGardenState] = useState<{ seedId: string | null; plantedAt: number | null }[]>([
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
    { seedId: null, plantedAt: null },
  ])
  const [, setGardenTick] = useState(0)

  // Day creatures (exterior only, daytime)
  const [creatures, setCreatures] = useState<{ x: number; y: number; data: typeof DAY_CREATURES[0] }[]>([])

  const { transitionToScene, playerClass, playerName, dayNightCycle } = useGameStore()
  const player = usePlayerStore()
  const displayName = playerName || (playerClass === 'artisane' ? 'Mélanie' : playerClass === 'paladin' ? 'Jisse' : 'Quentin')

  // CDC M1: Death respawn check — if coming from death, start invulnerable
  useEffect(() => {
    const prev = useGameStore.getState().previousScene
    if (prev === 'combat' && player.hp <= player.hpMax * 0.5) {
      // Respawned from death
      setInvulnerable(true)
      const flashInterval = setInterval(() => setFlashVisible(v => !v), 150)
      setTimeout(() => {
        setInvulnerable(false)
        setFlashVisible(true)
        clearInterval(flashInterval)
      }, 3000)
    }
  }, [])

  // Garden timer tick (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setGardenTick(t => t + 1)
      // CDC M1: Check if any plant is ready → notification sound
      gardenState.forEach((plot) => {
        if (plot.seedId && plot.plantedAt) {
          const seed = SEEDS[plot.seedId]
          const growthMs = seed.growthSec * 1000 * (playerClass === 'artisane' ? ARTISANE_BONUS : 1)
          const elapsed = Date.now() - plot.plantedAt
          // Play sound exactly when it finishes (within 1s window)
          if (elapsed >= growthMs && elapsed < growthMs + 1000) {
            playPlaceholderSound('notification')
          }
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [gardenState, playerClass])

  // CDC M1: Day creature spawning (daytime only, 2-3 max, exterior zone)
  useEffect(() => {
    const spawnCreatures = () => {
      if (!isDay(dayNightCycle)) {
        setCreatures([]) // CDC M1: night = safe, no creatures
        return
      }
      const count = 2 + Math.floor(Math.random() * 2) // 2-3
      const spawned: typeof creatures = []
      for (let i = 0; i < count; i++) {
        // Spawn in exterior area (y > 70 roughly)
        const x = 10 + Math.floor(Math.random() * (MAP_W - 20))
        const y = Math.floor(MAP_H * 0.7) + Math.floor(Math.random() * (MAP_H * 0.25))
        const data = DAY_CREATURES[Math.floor(Math.random() * DAY_CREATURES.length)]
        spawned.push({ x, y, data })
      }
      setCreatures(spawned)
    }
    spawnCreatures()
    const interval = setInterval(spawnCreatures, 120000) // respawn every 2min
    return () => clearInterval(interval)
  }, [dayNightCycle])

  // Creature collision check
  useEffect(() => {
    if (invulnerable) return
    for (const c of creatures) {
      if (Math.abs(c.x - playerX) + Math.abs(c.y - playerY) < 2) {
        showPopup('first_combat')
        transitionToScene('combat', c.data)
        break
      }
    }
  }, [playerX, playerY, creatures, invulnerable, transitionToScene])

  // Viewport
  useEffect(() => {
    const update = () => { setViewW(window.innerWidth); setViewH(window.innerHeight - 120 - 24) }
    update(); window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Popup helper
  const showPopup = (key: string) => {
    if (shouldShowPopup(key)) { setPopupKey(key); markPopupSeen(key); setTimeout(() => setPopupKey(null), 5000) }
  }

  // Move player (tile-based, D-pad)
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
    player.addFatigue(0.005) // walking fatigue
  }, [map, playerX, playerY, player])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch(e.key) {
        case 'ArrowUp': case 'w': tryMove(0, -1); break
        case 'ArrowDown': case 's': tryMove(0, 1); break
        case 'ArrowLeft': case 'a': tryMove(-1, 0); break
        case 'ArrowRight': case 'd': tryMove(1, 0); break
        case ' ': case 'Enter': handleAction(); break
        case 'c': setShowCharSheet(prev => !prev); break
        case 'Escape': setMenuOverlay(null); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tryMove, playerX, playerY])

  // Save game
  const saveGame = () => {
    try {
      const state = usePlayerStore.getState()
      const gameState = useGameStore.getState()
      const data = {
        playerId: gameState.playerId, playerName: gameState.playerName, playerClass: gameState.playerClass,
        lastScene: 'maison',
        level: state.level, xp: state.xp, xpNext: state.xpNext,
        hp: state.hp, hpMax: state.hpMax, atk: state.atk, def: state.def, luck: state.luck,
        sous: state.sous, fatigue: state.fatigue,
        bag: state.bag, equipment: state.equipment, equippedSpells: state.equippedSpells,
        gardenState, savedAt: new Date().toISOString(),
      }
      localStorage.setItem('restanques_save_0', JSON.stringify(data))
    } catch {}
  }

  // Action button (A)
  const handleAction = useCallback(() => {
    // CDC M1: Sumo NPC interaction
    if (sumoActive && Math.abs(playerX - sumoX) <= 1 && Math.abs(playerY - sumoY) <= 1) {
      const msgs = [
        '🐱 Sumo : "Miaou ! Je connais 3 recettes secrètes... Potion Sumo, Collier Sumo, et Ronronnement."',
        '🐱 Sumo : "Craft au Salon pour les débloquer ! -20% réussite mais +50% puissance."',
        '🐱 Sumo : "Apporte-moi du poisson et je te montrerai mes secrets..."',
      ]
      setInteractMsg(msgs[Math.floor(Math.random() * msgs.length)])
      playPlaceholderSound('npc_talk')
      setTimeout(() => setInteractMsg(null), 4000)
      return
    }

    const dirs = [[0,-1],[0,1],[-1,0],[1,0],[0,0]]
    for (const [dx, dy] of dirs) {
      const tx = playerX + dx, ty = playerY + dy
      if (tx < 0 || ty < 0 || ty >= MAP_H || tx >= MAP_W) continue
      const tile = map[ty]?.[tx]
      const action = TILE_INTERACTIVE[tile]
      if (!action) continue

      if (action === 'jardin') {
        showPopup('first_garden')
        const plotIdx = GARDEN_PLOTS.findIndex(p => p.x === tx && p.y === ty)
        if (plotIdx >= 0) {
          const plot = gardenState[plotIdx]
          if (plot.seedId && plot.plantedAt) {
            const seed = SEEDS[plot.seedId]
            const growthMs = seed.growthSec * 1000 * (playerClass === 'artisane' ? ARTISANE_BONUS : 1)
            const elapsed = Date.now() - plot.plantedAt
            if (elapsed >= growthMs) {
              // CDC M1: Harvest — add to inventory + random seed recovery
              player.addToInventory(plot.seedId, 2)
              if (Math.random() < 0.4) player.addToInventory('graine', 1)
              setGardenState(prev => prev.map((p, i) => i === plotIdx ? { seedId: null, plantedAt: null } : p))
              setInteractMsg('🌾 Récolte : ' + seed.name + ' x2 !')
              playPlaceholderSound('harvest')
            } else {
              const remain = Math.ceil((growthMs - elapsed) / 1000)
              setInteractMsg(seed.emoji + ' En croissance... ' + Math.floor(remain / 60) + 'm' + (remain % 60) + 's')
            }
          } else {
            setGardenOverlay(plotIdx)
          }
        }
        setTimeout(() => setInteractMsg(null), 2000)
        return
      }

      if (action === 'chambre') {
        // CDC M1: Sleep — all players must be in maison
        if (!allPlayersInMaison()) {
          setInteractMsg('⏳ Attendez que tous les joueurs soient à la maison')
          setTimeout(() => setInteractMsg(null), 3000)
        } else {
          // CDC M1: Full restore + save + purge debuffs
          usePlayerStore.getState().setStats({ hp: usePlayerStore.getState().hpMax, fatigue: 0 })
          broadcastSleep()
          saveGame()
          setInteractMsg('🛏 Repos... PV restaurés, fatigue à 0, partie sauvegardée !')
          playPlaceholderSound('levelup')
          setTimeout(() => setInteractMsg(null), 2500)
        }
        return
      }

      if (action === 'portail') {
        // CDC M1: Portal to Jisse biomes with malus
        const currentHp = usePlayerStore.getState().hp
        const currentDef = usePlayerStore.getState().def
        usePlayerStore.getState().setStats({
          hp: Math.max(1, Math.floor(currentHp * 0.7)),  // -30% PV
          def: Math.floor(currentDef * 0.8),               // -20% DEF
        })
        setInteractMsg('🌀 Portail ! -30% PV, -20% DEF temporaire')
        playPlaceholderSound('portal')
        setTimeout(() => transitionToScene('monde'), 1000)
        return
      }

      if (action === 'salon') {
        showPopup('first_craft')
        transitionToScene('craft', { atelier: 'salon' })
        return
      }
      if (action === 'cuisine') {
        showPopup('first_craft')
        transitionToScene('craft', { atelier: 'cuisine' })
        return
      }
      if (action === 'armurerie') {
        showPopup('first_craft')
        transitionToScene('craft', { atelier: 'armurerie' })
        return
      }
      if (action === 'comptoir') {
        showPopup('first_shop')
        transitionToScene('commerce')
        return
      }
      if (action === 'coffre') {
        // CDC M1: Storage — show real storage
        const storage = player.storage
        setInteractMsg(`📦 Coffre — ${storage.length} types stockés, ${player.bag.length}/${player.bagMaxSlots} dans le sac`)
        setTimeout(() => setInteractMsg(null), 2500)
        return
      }
    }
  }, [playerX, playerY, map, gardenState, playerClass, player, transitionToScene])

  // CDC M1: Sumo NPC appears after 10 crafts
  const sumoActive = player.totalCrafts >= 10
  const sumoX = Math.floor(MAP_W / 2) + 3
  const sumoY = Math.floor(MAP_H / 2) + 2

  // Sumo interaction check (inside handleAction won't work since it checks tiles)
  useEffect(() => {
    if (!sumoActive) return
    if (Math.abs(playerX - sumoX) <= 1 && Math.abs(playerY - sumoY) <= 1) {
      // Player is near Sumo — show dialogue on next A press (handled below)
    }
  }, [playerX, playerY, sumoActive])

  // Entities for TileRenderer
  const allEntities = [
    { x: playerX, y: playerY, color: playerClass === 'artisane' ? '#D4537E' : '#ef9f27', label: displayName },
    ...(sumoActive ? [{ x: sumoX, y: sumoY, color: '#ef9f27', label: '🐱 Sumo' }] : []),
    ...creatures.map(c => ({ x: c.x, y: c.y, color: '#e24b4a', label: c.data.name })),
    ...GARDEN_PLOTS.map((p, i) => {
      const plot = gardenState[i]
      if (!plot.seedId) return null
      const seed = SEEDS[plot.seedId]
      const growthMs = seed.growthSec * 1000 * (playerClass === 'artisane' ? ARTISANE_BONUS : 1)
      const ready = plot.plantedAt && (Date.now() - plot.plantedAt) >= growthMs
      return { x: p.x, y: p.y, color: ready ? '#7ec850' : '#C9A84C', label: ready ? '🌾' : seed.emoji }
    }).filter(Boolean) as { x: number; y: number; color: string; label: string }[],
  ]

  const darkness = getDarkness(dayNightCycle)

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'hidden', position: 'relative' }}>
      {/* CDC M1: TopBar (composant réutilisable) */}
      <TopBar />

      {/* Game Canvas */}
      <div style={{ marginTop: 24, height: viewH, position: 'relative' }}>
        <TileRenderer map={map} tileColors={TILE_COLORS} tileSize={TILE_SIZE}
          cameraX={playerX} cameraY={playerY} viewportW={viewW} viewportH={viewH}
          entities={allEntities} />
        <ClockStardew />
        <Minimap map={map} tileColors={TILE_COLORS} playerX={playerX} playerY={playerY}
          playerColor={playerClass === 'artisane' ? '#D4537E' : '#ef9f27'} />
        {/* Night overlay */}
        {darkness > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: `rgba(5,3,20,${darkness})`, pointerEvents: 'none', zIndex: 35, transition: 'background 2s' }} />
        )}
      </div>

      {/* CDC M1: Death invulnerability flash */}
      {invulnerable && !flashVisible && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.15)', pointerEvents: 'none', zIndex: 40 }} />
      )}

      {/* Interaction toast */}
      {interactMsg && (
        <div style={{ position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#231b42ee', border: '1px solid #3a2d5c', borderRadius: 10,
          padding: '8px 16px', fontSize: 12, color: '#F5ECD7', zIndex: 200,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          {interactMsg}
        </div>
      )}

      {/* Contextual popup */}
      <ContextualPopup triggerKey={popupKey || ''} show={!!popupKey} />

      {/* Character Sheet */}
      {showCharSheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowCharSheet(false)}>
          <div onClick={e => e.stopPropagation()}><CharacterSheet onClose={() => setShowCharSheet(false)} /></div>
        </div>
      )}

      {/* Garden overlay — choose seed */}
      {gardenOverlay !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'safe center', justifyContent: 'center', padding: '20px 0', overflowY: 'auto' }}
          onClick={() => setGardenOverlay(null)}>
          <div style={{ background: '#231b42', border: '2px solid #7ec850', borderRadius: 16,
            padding: 20, width: 300, maxWidth: '90%', margin: 'auto' }}
            onClick={e => e.stopPropagation()}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'safe center', justifyContent: 'center', padding: '20px 0', overflowY: 'auto' }}
          onClick={() => setMenuOverlay(null)}>
          <div style={{ background: '#231b42', border: '2px solid var(--hud-accent)', borderRadius: 16,
            padding: 20, width: 320, maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto', margin: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hud-accent)', marginBottom: 12 }}>{menuOverlay}</div>
            <div style={{ fontSize: 12, color: '#9a8fbf', lineHeight: 1.8 }}>
              {menuOverlay === 'Sac' && (
                player.bag.length === 0
                  ? <div>Sac vide. Explore et récolte !</div>
                  : <div>{player.bag.map((item, i) => (
                    <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #2d1f54' }}>
                      {item.itemId} <span style={{ color: '#ef9f27' }}>x{item.quantity}</span>
                    </div>
                  ))}</div>
              )}
              {menuOverlay === 'Sorts' && (
                player.equippedSpells.length === 0
                  ? <div>Aucun sort. Va au Salon (✦) pour crafter !</div>
                  : <div>{player.equippedSpells.map((s, i) => (
                    <div key={i}>Slot {s.slot}: {s.spellId} {s.usesRemaining !== null ? `(${s.usesRemaining})` : '(∞)'}</div>
                  ))}</div>
              )}
              {menuOverlay === 'Équip' && (
                <div>{(['arme', 'armure', 'casque', 'gants', 'bottes', 'amulette'] as const).map(slot => (
                  <div key={slot} style={{ padding: '2px 0' }}>
                    <span style={{ color: '#ef9f27', textTransform: 'capitalize' }}>{slot}</span>: {player.equipment[slot]?.itemId || '—'}
                  </div>
                ))}</div>
              )}
              {menuOverlay === 'Perso' && (
                <div>
                  <div style={{ color: playerClass === 'artisane' ? '#D4537E' : '#ef9f27', fontWeight: 600 }}>{displayName}</div>
                  <div>Niveau : {player.level} | XP : {player.xp}/{player.xpNext}</div>
                  <div>PV : {player.hp}/{player.hpMax} | ATK : {player.atk} | DEF : {player.def}</div>
                  <div>Sous : {player.sous} 💰 | Fatigue : {Math.round(player.fatigue)}%</div>
                  <div>Chance : {player.luck} | Sac : {player.bag.length}/{player.bagMaxSlots}</div>
                </div>
              )}
              {menuOverlay === 'Livres' && (
                <div>
                  <div>📖 Grimoire des sorts ({player.equippedSpells.length}/20)</div>
                  <div>📖 Livre de cuisine (0/20)</div>
                  <div>📖 Catalogue d'armes (0/20)</div>
                  <div>📖 Chroniques — tap pour relire les stories</div>
                </div>
              )}
            </div>
            <button onClick={() => setMenuOverlay(null)} style={{
              marginTop: 16, width: '100%', padding: '10px', background: 'var(--hud-accent)',
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Fermer</button>
          </div>
        </div>
      )}

      {/* CDC M1: HudArtisane (D-pad + A + menu) */}
      <HudArtisane
        onMove={tryMove}
        onAction={handleAction}
        menuItems={['Sac', 'Sorts', 'Équip', 'Perso', 'Livres']}
        activeMenu={menuOverlay}
        onMenuSelect={setMenuOverlay}
      />
    </div>
  )
}
