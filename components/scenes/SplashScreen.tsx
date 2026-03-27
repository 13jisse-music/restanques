'use client'

import { useState, useEffect } from 'react'
import { useGameStore, PlayerClass } from '@/store/gameStore'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { startRealtimeSync } from '@/lib/realtimeSync'

const CLASSES: { id: PlayerClass; name: string; title: string; emoji: string; desc: string; color: string; sprite: string; stats: string }[] = [
  { id: 'paladin', name: 'Jisse', title: 'Le Paladin', emoji: '⚔️', desc: 'Explore les biomes, combat les monstres, récolte les ressources', color: '#ef9f27', sprite: '/sprites/combat/combat_paladin.png', stats: 'ATK +++  DEF ++  Chance +' },
  { id: 'artisane', name: 'Mélanie', title: "L'Artisane", emoji: '🎨', desc: 'Craft sorts, potions, armes dans sa maison-atelier', color: '#D4537E', sprite: '/sprites/combat/combat_artisane.png', stats: 'CRAFT +++  DEF +  Sagesse ++' },
  { id: 'ombre', name: 'Quentin', title: "L'Ombre", emoji: '🌙', desc: 'Mode solo : explore ET craft, avec +10% échec craft', color: '#534AB7', sprite: '/sprites/combat/combat_ombre.png', stats: 'Critique +++  Esquive ++  Chance ++' },
]

function hasSaveSlots(): boolean {
  try {
    for (let i = 0; i < 3; i++) {
      if (localStorage.getItem(`restanques_save_${i}`)) return true
    }
  } catch {}
  return false
}

function getSaveSlots(): { slot: number; name: string; level: number; class: string; date: string }[] {
  const slots: { slot: number; name: string; level: number; class: string; date: string }[] = []
  try {
    for (let i = 0; i < 3; i++) {
      const raw = localStorage.getItem(`restanques_save_${i}`)
      if (raw) {
        const data = JSON.parse(raw)
        slots.push({ slot: i, name: data.playerName || '???', level: data.level || 1, class: data.playerClass || 'paladin', date: data.savedAt || '' })
      }
    }
  } catch {}
  return slots
}

export default function SplashScreen() {
  const [step, setStep] = useState<'splash' | 'title' | 'class' | 'name' | 'load'>('splash')
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null)
  const [hoveredClass, setHoveredClass] = useState<PlayerClass | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [pwaReady, setPwaReady] = useState(false)
  const { setPlayer, transitionToScene } = useGameStore()
  const { createSession, sessionCode } = useMultiplayerStore()
  const [showCode, setShowCode] = useState(false)

  // Splash image → auto advance after 2s
  useEffect(() => {
    const timer = setTimeout(() => setStep('title'), 2000)
    return () => clearTimeout(timer)
  }, [])

  // PWA install listener
  useEffect(() => {
    const handler = () => setPwaReady(true)
    if ((window as any).__pwaDeferred) setPwaReady(true)
    window.addEventListener('pwa-ready', handler)
    return () => window.removeEventListener('pwa-ready', handler)
  }, [])

  const installPwa = async () => {
    const deferred = (window as any).__pwaDeferred
    if (!deferred) return
    deferred.prompt()
    const result = await deferred.userChoice
    if (result.outcome === 'accepted') setPwaReady(false)
    ;(window as any).__pwaDeferred = null
  }

  const startGame = () => {
    if (!selectedClass || !playerName.trim()) return
    const id = crypto.randomUUID()
    setPlayer(id, playerName.trim(), selectedClass)
    const code = createSession()
    startRealtimeSync(code, id)
    // Clear seen stories + popups for new game
    try {
      localStorage.removeItem('restanques_stories_seen')
      localStorage.removeItem('restanques_popups_seen')
    } catch {}
    setShowCode(true)
    // Flow: intro story → tuto → first scene
    // story_intro → nextScene = 'tuto' → SceneTuto donne les récompenses → monde/maison
    setTimeout(() => transitionToScene('story', { storyId: 'story_intro', nextScene: 'tuto' }), 3000)
  }

  const loadGame = (slot: number) => {
    try {
      const raw = localStorage.getItem(`restanques_save_${slot}`)
      if (!raw) return
      const data = JSON.parse(raw)
      // Restore game state
      const id = data.playerId || crypto.randomUUID()
      setPlayer(id, data.playerName || 'Jisse', data.playerClass || 'paladin')
      // Restore player stats
      const { usePlayerStore } = require('@/store/playerStore')
      usePlayerStore.getState().setStats({
        level: data.level || 1, xp: data.xp || 0, xpNext: data.xpNext || 50,
        hp: data.hp || 100, hpMax: data.hpMax || 100,
        atk: data.atk || 10, def: data.def || 5, luck: data.luck || 5,
        sous: data.sous || 100, fatigue: data.fatigue || 0,
        bag: data.bag || [], equipment: data.equipment || {},
        equippedSpells: data.equippedSpells || [],
      })
      const code = createSession()
      startRealtimeSync(code, id)
      transitionToScene(data.lastScene || 'monde')
    } catch (e) {
      console.error('Load failed:', e)
    }
  }

  const shareSession = () => {
    const url = window.location.origin + '/join/' + sessionCode
    if (navigator.share) {
      navigator.share({ title: 'Rejoins Restanques !', text: 'Rejoins ma partie !', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien copié : ' + url)
    }
  }

  const activeClass = CLASSES.find(c => c.id === (hoveredClass || selectedClass))

  // Splash image
  if (step === 'splash') {
    return (
      <div style={{ width: '100%', height: '100dvh', background: '#1a1232', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setStep('title')}>
        <img src="/splash.png" alt="Restanques" style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', animation: 'fadeIn 0.5s ease-in' }} />
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#1a1232', position: 'relative',
      padding: '24px 16px', gap: 10, overflowY: 'auto',
    }}>
      {/* Background image — splash.png plein écran */}
      <img src="/splash.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', opacity: 1, pointerEvents: 'none',
      }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      {/* Léger gradient en bas pour lisibilité des boutons */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />

      {step === 'title' && (
        <>
          {/* Pas de texte — l'image splash.png contient déjà le titre */}
          <div style={{ flex: 1 }} /> {/* pousse les boutons vers le bas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1, width: '100%', maxWidth: 340 }}>
            <button onClick={() => setStep('class')} style={{
              background: '#e91e8c', color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 48px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(233,30,140,0.4)',
            }}>
              Nouvelle Partie
            </button>
            {hasSaveSlots() && (
              <button onClick={() => setStep('load')} style={{
                background: 'transparent', color: '#ef9f27', border: '1px solid #ef9f27',
                borderRadius: 12, padding: '10px 48px', fontSize: 13, cursor: 'pointer',
              }}>
                Continuer
              </button>
            )}
            {pwaReady && (
              <button onClick={installPwa} style={{
                background: 'transparent', color: '#7ec850', border: '1px solid #7ec850',
                borderRadius: 12, padding: '10px 48px', fontSize: 12, cursor: 'pointer',
              }}>
                📲 Installer l'app
              </button>
            )}
          </div>
          <div style={{ marginTop: 16, fontSize: 10, color: '#3a2d5c' }}>v6.0 — CDC Opus</div>
        </>
      )}

      {/* Load Game — slot selection */}
      {step === 'load' && (
        <>
          <div style={{ fontSize: 18, color: '#ef9f27', fontWeight: 600, marginBottom: 8 }}>Charger une partie</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
            {getSaveSlots().length === 0 && (
              <div style={{ color: '#9a8fbf', fontSize: 13, textAlign: 'center' }}>Aucune sauvegarde trouvée</div>
            )}
            {getSaveSlots().map((s) => (
              <button key={s.slot} onClick={() => loadGame(s.slot)} style={{
                background: '#231b42', border: '2px solid #3a2d5c', borderRadius: 12,
                padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ef9f27' }}>
                  {s.name} — Nv.{s.level}
                </div>
                <div style={{ fontSize: 11, color: '#9a8fbf', marginTop: 2 }}>
                  {CLASSES.find(c => c.id === s.class)?.title || s.class} · {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : ''}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('title')} style={{
            background: 'transparent', color: '#9a8fbf', border: 'none', fontSize: 12, cursor: 'pointer', marginTop: 8,
          }}>← Retour</button>
        </>
      )}

      {/* Class Selection — Diablo 2 style */}
      {step === 'class' && (
        <>
          <div style={{ fontSize: 18, color: '#ef9f27', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
            Choisis ton personnage
          </div>

          {/* Preview zone */}
          <div style={{ width: '100%', maxWidth: 360, height: 180, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {activeClass ? (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in' }}>
                <img src={activeClass.sprite} alt={activeClass.name}
                  style={{ width: 100, height: 100, objectFit: 'contain', filter: `drop-shadow(0 0 20px ${activeClass.color}80)`, imageRendering: 'pixelated' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div style={{ fontSize: 20, fontWeight: 700, color: activeClass.color, marginTop: 4, textShadow: `0 0 10px ${activeClass.color}60` }}>
                  {activeClass.name}
                </div>
                <div style={{ fontSize: 12, color: '#9a8fbf', fontStyle: 'italic' }}>{activeClass.title}</div>
                <div style={{ fontSize: 10, color: '#6b5e8a', marginTop: 2, fontFamily: 'monospace' }}>{activeClass.stats}</div>
              </div>
            ) : (
              <div style={{ color: '#3a2d5c', fontSize: 13, fontStyle: 'italic' }}>Sélectionne un personnage...</div>
            )}
          </div>

          {/* Character slots — Diablo 2 style horizontal */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 360 }}>
            {CLASSES.map((c) => (
              <button key={c.id}
                onMouseEnter={() => setHoveredClass(c.id)}
                onMouseLeave={() => setHoveredClass(null)}
                onClick={() => { setSelectedClass(c.id); setPlayerName(c.name); setStep('name') }}
                style={{
                  flex: 1, background: selectedClass === c.id ? `${c.color}22` : '#1a1232',
                  border: `2px solid ${selectedClass === c.id || hoveredClass === c.id ? c.color : '#2d1f54'}`,
                  borderRadius: 12, padding: '12px 6px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
                }}>
                <div style={{ fontSize: 28 }}>{c.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: '#9a8fbf', marginTop: 2 }}>{c.title}</div>
                {/* Glow effect */}
                {(selectedClass === c.id || hoveredClass === c.id) && (
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 80%, ${c.color}15, transparent 70%)`, pointerEvents: 'none' }} />
                )}
              </button>
            ))}
          </div>

          {activeClass && (
            <div style={{ fontSize: 11, color: '#9a8fbf', textAlign: 'center', maxWidth: 300, marginTop: 6 }}>
              {activeClass.desc}
            </div>
          )}

          <button onClick={() => setStep('title')} style={{
            background: 'transparent', color: '#9a8fbf', border: 'none', fontSize: 12, cursor: 'pointer', marginTop: 4,
          }}>← Retour</button>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </>
      )}

      {step === 'name' && selectedClass && (
        <>
          <div style={{ fontSize: 18, color: '#ef9f27', fontWeight: 600 }}>Ton nom ?</div>
          <div style={{ fontSize: 12, color: '#9a8fbf' }}>
            {CLASSES.find((c) => c.id === selectedClass)?.name} — {CLASSES.find((c) => c.id === selectedClass)?.title}
          </div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Entre ton nom..."
            maxLength={20}
            autoFocus
            style={{
              background: '#231b42', border: '2px solid #3a2d5c', borderRadius: 10,
              padding: '12px 16px', fontSize: 16, color: '#F5ECD7', width: '100%', maxWidth: 300,
              textAlign: 'center', outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && startGame()}
          />
          <button onClick={startGame} disabled={!playerName.trim()} style={{
            background: playerName.trim() ? '#e91e8c' : '#3a2d5c', color: 'white',
            border: 'none', borderRadius: 12, padding: '14px 48px', fontSize: 16,
            fontWeight: 600, cursor: playerName.trim() ? 'pointer' : 'default',
            opacity: playerName.trim() ? 1 : 0.5,
          }}>
            Commencer l'aventure
          </button>
          <button onClick={() => setStep('class')} style={{
            background: 'transparent', color: '#9a8fbf', border: 'none', fontSize: 12, cursor: 'pointer',
          }}>← Changer de classe</button>
        </>
      )}

      {showCode && sessionCode && (
        <>
          <div style={{ fontSize: 12, color: '#9a8fbf' }}>Code de session</div>
          <div style={{ fontSize: 32, color: '#e91e8c', fontWeight: 700, letterSpacing: 4 }}>{sessionCode}</div>
          <div style={{ fontSize: 12, color: '#9a8fbf', textAlign: 'center', maxWidth: 280 }}>
            Partage ce code pour jouer en coop !<br/>La partie commence dans 3 secondes...
          </div>
          <button onClick={shareSession} style={{
            background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 10,
            padding: '10px 24px', color: '#9a8fbf', fontSize: 12, cursor: 'pointer',
          }}>📤 Partager le lien</button>
          <button onClick={() => transitionToScene(selectedClass === 'artisane' ? 'maison' : 'monde')} style={{
            background: '#e91e8c', color: '#fff', border: 'none', borderRadius: 12,
            padding: '12px 36px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Jouer maintenant →</button>
        </>
      )}
    </div>
  )
}
