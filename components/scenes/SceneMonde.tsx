'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import TileRenderer from '@/components/world/TileRenderer'
import ClockStardew from '@/components/hud/ClockStardew'
import Minimap from '@/components/hud/Minimap'
import TopBar from '@/components/hud/TopBar'
import WeatherOverlay from '@/components/world/WeatherOverlay'
import { rollWeather } from '@/lib/weatherEngine'
import { getDarkness } from '@/lib/dayNightCycle'
import { sendPosition, broadcastDeath } from '@/lib/realtimeSync'
import { pollGamepad } from '@/lib/gamepad'
import CharacterSheet from '@/components/ui/CharacterSheet'
import ContextualPopup from '@/components/ui/ContextualPopup'
import DialogueBox from '@/components/ui/DialogueBox'
import { isStorySeen, triggerBiomeEntry, shouldShowPopup, markPopupSeen } from '@/lib/storyEngine'
import { loadBiome, BiomeId, BiomeData, getMonsterData, getPNJData, getQuestForPNJ, isBiomeUnlocked } from '@/lib/biomeLoader'
import { MAP_W, MAP_H, MapEntity } from '@/data/maps/garrigue'
import { MONSTERS } from '@/data/monsters'
import { playPlaceholderSound } from '@/lib/assetLoader'

const TILE_SIZE = 48
const LERP_SPEED = 0.15

export default function SceneMonde() {
  // CDC M4: Multi-biome support — load biome from sceneData or default garrigue
  const sceneData = useGameStore(s => s.sceneData) as Record<string, string> | null
  const biomeId = (sceneData?.biome as BiomeId) || 'garrigue'

  const [biome] = useState<BiomeData>(() => loadBiome(biomeId))
  const [monsters, setMonsters] = useState<MapEntity[]>(() => biome.monsters)
  const [playerX, setPlayerX] = useState(biome.spawnX)
  const [playerY, setPlayerY] = useState(biome.spawnY)
  const [cameraX, setCameraX] = useState(biome.spawnX)
  const [cameraY, setCameraY] = useState(biome.spawnY)
  const [viewW, setViewW] = useState(390)
  const [viewH, setViewH] = useState(500)
  const [interactMsg, setInteractMsg] = useState<string | null>(null)
  const [menuOverlay, setMenuOverlay] = useState<string | null>(null)
  const [showCharSheet, setShowCharSheet] = useState(false)

  // CDC M4: NPC dialogue
  const [dialogueNPC, setDialogueNPC] = useState<{ name: string; portrait?: string; texts: string[]; quest?: { id: string; desc: string; reward: string } } | null>(null)

  // CDC M4: Harvest multi-hit (3 for wood/stone, 1 for herbs)
  const [harvestTarget, setHarvestTarget] = useState<{ x: number; y: number; hitsLeft: number } | null>(null)

  // Joystick state
  const [joyActive, setJoyActive] = useState(false)
  const joyDXRef = useRef(0)
  const joyDYRef = useRef(0)
  const [joyDX, setJoyDX] = useState(0)
  const [joyDY, setJoyDY] = useState(0)
  const joyRef = useRef<HTMLDivElement>(null)
  const joyCenterRef = useRef({ x: 0, y: 0 })
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0)
  const posRef = useRef({ x: biome.spawnX, y: biome.spawnY })
  const camRef = useRef({ x: biome.spawnX, y: biome.spawnY })

  const { transitionToScene, setWeather, playerName, playerClass } = useGameStore()
  const player = usePlayerStore()

  // M6: Story trigger — biome entry (one-time, uses current biome)
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerBiomeEntry(biomeId, 'monde')
    }, 300)
    return () => clearTimeout(timer)
  }, [biomeId])

  // CDC M4: Monster respawn every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setMonsters(loadBiome(biomeId).monsters)
    }, 120000)
    return () => clearInterval(interval)
  }, [biomeId])

  // M6: Contextual popup state
  const [popupKey, setPopupKey] = useState<string | null>(null)
  const showPopup = (key: string) => {
    if (shouldShowPopup(key)) {
      setPopupKey(key)
      markPopupSeen(key)
      setTimeout(() => setPopupKey(null), 5000)
    }
  }

  // Weather changes every 5-10 min
  useEffect(() => {
    const changeWeather = () => { setWeather(rollWeather()); setTimeout(changeWeather, (5 + Math.random() * 5) * 60000) }
    const timer = setTimeout(changeWeather, (5 + Math.random() * 5) * 60000)
    return () => clearTimeout(timer)
  }, [setWeather])

  // Fatigue
  useEffect(() => {
    const interval = setInterval(() => {
      if (joyDXRef.current !== 0 || joyDYRef.current !== 0) {
        player.addFatigue(0.01)
      }
      const hour = ((useGameStore.getState().dayNightCycle * 24) + 6) % 24
      if (hour >= 20 || hour < 6) player.addFatigue(0.05)
      if (player.fatigue >= 100) {
        player.respawn()
        const pid = useGameStore.getState().playerId
        const pclass = useGameStore.getState().playerClass
        if (pid && pclass) broadcastDeath(pid, pclass)
        transitionToScene('maison')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [player, transitionToScene])

  // Viewport
  useEffect(() => {
    const update = () => { setViewW(window.innerWidth); setViewH(window.innerHeight - 120 - 24) }
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
    joyDXRef.current = dx; joyDYRef.current = dy
    setJoyDX(dx); setJoyDY(dy)
  }

  const joyEnd = () => {
    setJoyActive(false)
    joyDXRef.current = 0; joyDYRef.current = 0
    setJoyDX(0); setJoyDY(0)
  }

  // Check if tile is walkable
  const canWalk = useCallback((x: number, y: number): boolean => {
    const tx = Math.floor(x), ty = Math.floor(y)
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false
    const tile = biome.map[ty]?.[tx]
    if (tile === undefined) return false
    return biome.walkable.has(tile) || tile === 10 || tile === 11
  }, [biome.map])

  // Movement loop with camera interpolation (Bug #4 fix)
  useEffect(() => {
    let lastTime = 0
    function tick(time: number) {
      if (lastTime) {
        const dt = Math.min((time - lastTime) / 1000, 0.05)
        // Gamepad support
        const gp = pollGamepad()
        if (gp) { joyDXRef.current = gp.axisX; joyDYRef.current = gp.axisY; if (gp.btnA) handleAction() }

        let dx = joyDXRef.current, dy = joyDYRef.current
        if (dx !== 0 || dy !== 0) {
          if (Math.abs(dx) > Math.abs(dy)) { dy = 0 } else { dx = 0 }
          const weatherMod = useGameStore.getState().weather === 'wind' ? 0.7 : 1
          const speed = 3.5 * weatherMod
          const pos = posRef.current
          const nx = pos.x + dx * speed * dt
          const ny = pos.y + dy * speed * dt
          if (dx !== 0 && canWalk(nx, pos.y)) pos.x = nx
          if (dy !== 0 && canWalk(pos.x, ny)) pos.y = ny
          setPlayerX(pos.x)
          setPlayerY(pos.y)
          const pid = useGameStore.getState().playerId
          if (pid) sendPosition(pid, pos.x, pos.y, biomeId, player.hp)
        }

        // Smooth camera interpolation (lerp)
        const cam = camRef.current
        cam.x += (posRef.current.x - cam.x) * LERP_SPEED
        cam.y += (posRef.current.y - cam.y) * LERP_SPEED
        setCameraX(cam.x)
        setCameraY(cam.y)
      }
      lastTime = time
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [canWalk])

  // Check monster collision
  useEffect(() => {
    const px = Math.floor(playerX), py = Math.floor(playerY)
    for (const m of monsters) {
      const dist = Math.abs(m.x - px) + Math.abs(m.y - py)
      if (dist < 2) {
        showPopup('first_combat')
        transitionToScene('combat', { name: m.name, hp: (m as any).hp || 30, atk: (m as any).atk || 8, def: (m as any).def || 3, weakness: (m as any).weakness || 'Feu', atbSpeed: (m as any).atbSpeed || 3, xp: (m as any).xp || 15 })
        break
      }
    }
  }, [Math.floor(playerX), Math.floor(playerY), monsters, transitionToScene])

  // Action
  const handleAction = useCallback(() => {
    const px = Math.floor(posRef.current.x), py = Math.floor(posRef.current.y)
    const dirs = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]
    for (const [dx, dy] of dirs) {
      const tx = px + dx, ty = py + dy
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue
      const tile = biome.map[ty]?.[tx]
      const action = biome.interactive[tile]
      if (action === 'pnj') {
        // CDC M4: Full NPC dialogue with portrait + quest
        showPopup('first_pnj')
        const pnj = biome.pnjs.find(e => Math.abs(e.x - tx) <= 1 && Math.abs(e.y - ty) <= 1)
        if (pnj) {
          const pnjData = getPNJData(pnj.id)
          const quest = getQuestForPNJ(pnj.id)
          const texts = pnjData
            ? [`Bienvenue ! Je suis ${pnj.name}, ${pnjData.personality}.`, pnjData.role === 'Shop herbes' ? 'Je vends des herbes rares.' : `J'ai besoin d'aide...`]
            : [`${pnj.name} : "Bienvenue dans ${biome.name} !"`]
          setDialogueNPC({
            name: pnj.name || 'PNJ',
            portrait: `/portraits/npc_${biomeId}_${pnj.id}_portrait.png`,
            texts,
            quest: quest ? { id: quest.id, desc: quest.desc, reward: quest.reward } : undefined,
          })
        }
        playPlaceholderSound('npc_talk')
        return
      }
      if (action === 'portail_home') {
        transitionToScene('maison')
        return
      }
      if (action === 'portail_next') {
        // CDC M4: Portal to next biome — check if unlocked
        showPopup('first_portal')
        if (biome.nextBiome) {
          if (isBiomeUnlocked(biome.nextBiome)) {
            playPlaceholderSound('portal')
            transitionToScene('monde', { biome: biome.nextBiome })
          } else {
            setInteractMsg('🔒 Portail verrouillé — Vaincre le boss pour ouvrir')
            setTimeout(() => setInteractMsg(null), 3000)
          }
        } else {
          setInteractMsg('🏔 Fin du monde — Pas de biome suivant')
          setTimeout(() => setInteractMsg(null), 2000)
        }
        return
      }
      if (action === 'portail_prev') {
        if (biome.prevBiome === 'maison') {
          transitionToScene('maison')
        } else {
          playPlaceholderSound('portal')
          transitionToScene('monde', { biome: biome.prevBiome })
        }
        return
      }
      if (action === 'portail_maison') { transitionToScene('maison'); return }
      if (action === 'portail_calanques') {
        showPopup('first_portal')
        if (isBiomeUnlocked('calanques')) {
          playPlaceholderSound('portal')
          transitionToScene('monde', { biome: 'calanques' })
        } else {
          setInteractMsg('🔒 Portail verrouillé — Vaincre le Sanglier géant pour ouvrir')
          setTimeout(() => setInteractMsg(null), 3000)
        }
        return
      }
      if (action === 'donjon') {
        transitionToScene('donjon', { biome: biomeId })
        return
      }
      if (action === 'resource') {
        // CDC M4: Harvest multi-hit (wood=3, stone=3, herb=1)
        showPopup('first_resource')
        if (harvestTarget && harvestTarget.x === tx && harvestTarget.y === ty) {
          const left = harvestTarget.hitsLeft - 1
          if (left <= 0) {
            player.addToInventory(tile === 20 ? 'bois' : tile === 22 ? 'pierre' : 'herbe', 1)
            setInteractMsg('🪓 Récolte ! +1 matériau')
            setHarvestTarget(null)
            player.addFatigue(0.2)
            playPlaceholderSound('harvest')
          } else {
            setHarvestTarget({ x: tx, y: ty, hitsLeft: left })
            setInteractMsg(`🪓 ${left} coups restants...`)
          }
        } else {
          const hits = tile === 21 ? 1 : 3 // herb=1hit, wood/stone=3
          if (hits === 1) {
            player.addToInventory('herbe', 1)
            setInteractMsg('🌿 +1 Herbe')
            playPlaceholderSound('harvest')
          } else {
            setHarvestTarget({ x: tx, y: ty, hitsLeft: hits - 1 })
            setInteractMsg(`🪓 ${hits - 1} coups restants...`)
          }
        }
        setTimeout(() => setInteractMsg(null), 1500)
        return
      }
      if (action === 'buisson') {
        // CDC M4: Mimic 5% chance
        if (Math.random() < 0.05) {
          setInteractMsg('⚠️ Mimic !')
          const mimicData = { name: 'Mimic buisson', hp: 45, atk: 14, def: 9, weakness: 'Feu', atbSpeed: 2, xp: 32 }
          setTimeout(() => transitionToScene('combat', mimicData), 500)
        } else {
          player.addToInventory('herbe', 1)
          setInteractMsg('🌿 +1 Herbe')
          playPlaceholderSound('harvest')
        }
        setTimeout(() => setInteractMsg(null), 1500)
        return
      }
    }
  }, [biome, biomeId, transitionToScene, harvestTarget, player])

  // Keyboard
  useEffect(() => {
    const keys = new Set<string>()
    function updateJoy() {
      let dx = 0, dy = 0
      if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1
      if (keys.has('ArrowRight') || keys.has('d')) dx += 1
      if (keys.has('ArrowUp') || keys.has('w')) dy -= 1
      if (keys.has('ArrowDown') || keys.has('s')) dy += 1
      joyDXRef.current = dx; joyDYRef.current = dy
      setJoyDX(dx); setJoyDY(dy)
    }
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key)
      updateJoy()
      if (e.key === ' ' || e.key === 'Enter') handleAction()
      if (e.key === 'Escape' || e.key === 'b') toggleMainMenu()
      if (e.key === 'c') setShowCharSheet(prev => !prev)
    }
    const onUp = (e: KeyboardEvent) => { keys.delete(e.key); updateJoy() }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [handleAction])

  // Save game (Bug #9)
  const saveGame = (slot: number = 0) => {
    try {
      const state = usePlayerStore.getState()
      const gameState = useGameStore.getState()
      const data = {
        playerId: gameState.playerId,
        playerName: gameState.playerName,
        playerClass: gameState.playerClass,
        lastScene: 'monde',
        level: state.level, xp: state.xp, xpNext: state.xpNext,
        hp: state.hp, hpMax: state.hpMax,
        atk: state.atk, def: state.def, luck: state.luck,
        sous: state.sous, fatigue: state.fatigue,
        bag: state.bag, equipment: state.equipment,
        equippedSpells: state.equippedSpells,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(`restanques_save_${slot}`, JSON.stringify(data))
      setInteractMsg('💾 Partie sauvegardée !')
      setTimeout(() => setInteractMsg(null), 2000)
    } catch (e) {
      setInteractMsg('❌ Erreur sauvegarde')
      setTimeout(() => setInteractMsg(null), 2000)
    }
  }

  // Toggle main menu (Bug #12 — B button)
  const toggleMainMenu = () => {
    if (menuOverlay === 'MainMenu') {
      setMenuOverlay(null)
    } else {
      setMenuOverlay('MainMenu')
    }
  }

  // Display name
  const displayName = playerName || 'Jisse'

  // Entities for TileRenderer
  const allEntities = [
    { x: playerX, y: playerY, color: '#ef9f27', label: displayName },
    ...biome.entities.filter(e => e.type === 'pnj').map(e => ({ x: e.x, y: e.y, color: '#ef9f27', label: e.name })),
    ...biome.entities.filter(e => e.type.includes('portail')).map(e => ({ x: e.x, y: e.y, color: '#e91e8c', label: e.name })),
    ...monsters.map(m => ({ x: m.x, y: m.y, color: '#e24b4a', label: m.name })),
  ]

  const knobX = joyDX * 24, knobY = joyDY * 24
  const darkness = getDarkness(useGameStore.getState().dayNightCycle)

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'hidden', position: 'relative' }}>
      {/* CDC M4: TopBar component */}
      <TopBar />

      {/* Game Canvas — uses smoothed camera */}
      <div style={{ marginTop: 24, height: viewH, position: 'relative' }}>
        <TileRenderer map={biome.map} tileColors={biome.colors} tileSize={TILE_SIZE}
          cameraX={cameraX} cameraY={cameraY} viewportW={viewW} viewportH={viewH} entities={allEntities} />
        <ClockStardew />
        <Minimap map={biome.map} tileColors={biome.colors} playerX={Math.floor(playerX)} playerY={Math.floor(playerY)} playerColor="#ef9f27" fogRadius={20} />
        <WeatherOverlay />
        {/* Night darkness overlay — Bug #10 fix: proper dark blue, not white */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35,
          transition: 'background 2s',
          background: darkness > 0 ? `rgba(5,3,20,${darkness})` : 'transparent',
        }} />
      </div>

      {/* Interaction toast */}
      {interactMsg && (
        <div style={{ position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#231b42ee', border: '1px solid #3a2d5c', borderRadius: 10,
          padding: '8px 16px', fontSize: 12, color: '#F5ECD7', zIndex: 200 }}>
          {interactMsg}
        </div>
      )}

      {/* M6: Contextual popup (first-time tooltips) */}
      <ContextualPopup triggerKey={popupKey || ''} show={!!popupKey} />

      {/* CDC M4: NPC Dialogue Box */}
      {dialogueNPC && (
        <DialogueBox
          npcName={dialogueNPC.name}
          portrait={dialogueNPC.portrait}
          texts={dialogueNPC.texts}
          quest={dialogueNPC.quest}
          onClose={() => setDialogueNPC(null)}
          onAcceptQuest={(questId) => {
            setInteractMsg(`📜 Quête acceptée : ${questId}`)
            setTimeout(() => setInteractMsg(null), 2000)
          }}
        />
      )}

      {/* Character Sheet overlay */}
      {showCharSheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowCharSheet(false)}>
          <div onClick={e => e.stopPropagation()}>
            <CharacterSheet onClose={() => setShowCharSheet(false)} />
          </div>
        </div>
      )}

      {/* Menu overlay — Bug #12 fix: B button shows real main menu */}
      {menuOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'safe center', justifyContent: 'center', padding: '20px 0', overflowY: 'auto' }}
          onClick={() => setMenuOverlay(null)}>
          <div style={{ background: '#231b42', border: '2px solid var(--hud-accent)', borderRadius: 16, padding: menuOverlay === 'Carte' ? 0 : 20, width: menuOverlay === 'Carte' ? '95%' : 320, maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto', margin: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {menuOverlay === 'Carte' ? (
              <div style={{ position: 'relative' }}>
                <img src="/story/art_map_garrigue.png" style={{ width: '100%', borderRadius: 16, display: 'block' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <img src="/story/map_garrigue.png" style={{ width: '100%', borderRadius: 16, display: 'block' }} />
                <div style={{ padding: '8px 12px', fontSize: 10, color: '#9a8fbf', textAlign: 'center' }}>
                  Points : PNJ (orange) | Portails (rose/violet) | Donjon (marron) | Boss (rouge)
                </div>
                <button onClick={() => setMenuOverlay(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
              </div>
            ) : menuOverlay === 'MainMenu' ? (
              /* Bug #8+12: Main Menu with save/quit/character */
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e91e8c', marginBottom: 16, textAlign: 'center' }}>⏸ Menu</div>
                {[
                  { label: '📋 Fiche personnage', action: () => { setMenuOverlay(null); setShowCharSheet(true) } },
                  { label: '🎒 Inventaire', action: () => setMenuOverlay('Sac') },
                  { label: '✨ Sorts', action: () => setMenuOverlay('Sorts') },
                  { label: '⚔️ Équipement', action: () => setMenuOverlay('Équip') },
                  { label: '📜 Quêtes', action: () => setMenuOverlay('Quêtes') },
                  { label: '🗺️ Carte', action: () => setMenuOverlay('Carte') },
                  { label: '💾 Sauvegarder', action: () => { saveGame(0); setMenuOverlay(null) } },
                  { label: '🏠 Retour au titre', action: () => { saveGame(0); transitionToScene('splash' as any) } },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    width: '100%', padding: '10px 16px', marginBottom: 6,
                    background: 'rgba(139,105,20,0.15)', border: '1px solid rgba(139,105,20,0.3)',
                    borderRadius: 8, color: '#F5ECD7', fontSize: 13, textAlign: 'left',
                    cursor: 'pointer',
                  }}>{item.label}</button>
                ))}
                <button onClick={() => setMenuOverlay(null)} style={{ marginTop: 8, width: '100%', padding: '10px', background: 'var(--hud-accent)',
                  border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hud-accent)', marginBottom: 12 }}>{menuOverlay}</div>
                <div style={{ fontSize: 12, color: '#9a8fbf' }}>
                  {menuOverlay === 'Sac' && `Inventaire : ${player.bag.length} objet${player.bag.length > 1 ? 's' : ''}`}
                  {menuOverlay === 'Sac' && player.bag.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {player.bag.map((item, i) => (
                        <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #2d1f54' }}>
                          {item.itemId} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  )}
                  {menuOverlay === 'Sorts' && (player.equippedSpells.length > 0
                    ? player.equippedSpells.map((s, i) => <div key={i}>{s.spellId} (slot {s.slot})</div>)
                    : 'Aucun sort équipé. Craft-en au Salon !'
                  )}
                  {menuOverlay === 'Équip' && (
                    <div>
                      {(['arme', 'armure', 'casque', 'gants', 'bottes', 'amulette'] as const).map(slot => (
                        <div key={slot} style={{ padding: '3px 0', borderBottom: '1px solid #2d1f54' }}>
                          <span style={{ color: '#ef9f27', textTransform: 'capitalize' }}>{slot}</span>: {player.equipment[slot]?.itemId || '—'}
                        </div>
                      ))}
                    </div>
                  )}
                  {menuOverlay === 'Quêtes' && 'Parle aux PNJ pour recevoir des quêtes.'}
                </div>
                <button onClick={() => setMenuOverlay(null)} style={{ marginTop: 16, width: '100%', padding: '10px', background: 'var(--hud-accent)',
                  border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-zone" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Menu strip */}
        <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid rgba(139,105,20,0.3)' }}>
          {['Sac', 'Sorts', 'Équip', 'Quêtes', 'Carte'].map(m => (
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

          {/* Center: save + stats */}
          <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{biome.name} · Nv {biome.levelRange[0]}-{biome.levelRange[1]}</span>
            <button onClick={() => saveGame(0)} style={{
              padding: '4px 12px', background: 'rgba(126,200,80,0.2)', border: '1px solid rgba(126,200,80,0.4)',
              borderRadius: 6, color: '#7ec850', fontSize: 9, cursor: 'pointer',
            }}>💾 Save</button>
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
            <button onClick={toggleMainMenu} style={{
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
