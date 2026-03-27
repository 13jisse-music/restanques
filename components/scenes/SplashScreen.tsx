'use client'

import { useState } from 'react'
import { useGameStore, PlayerClass } from '@/store/gameStore'

const CLASSES: { id: PlayerClass; name: string; emoji: string; desc: string; color: string }[] = [
  { id: 'paladin', name: 'Jisse — Le Paladin', emoji: '⚔️', desc: 'Explore les biomes, combat les monstres, récolte les ressources', color: '#ef9f27' },
  { id: 'artisane', name: 'Mélanie — L\'Artisane', emoji: '🎨', desc: 'Craft sorts, potions, armes dans sa maison-atelier', color: '#D4537E' },
  { id: 'ombre', name: 'Quentin — L\'Ombre', emoji: '🌙', desc: 'Mode solo : explore ET craft, avec +10% échec craft', color: '#534AB7' },
]

export default function SplashScreen() {
  const [step, setStep] = useState<'title' | 'class' | 'name'>('title')
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null)
  const [playerName, setPlayerName] = useState('')
  const { setPlayer, transitionToScene } = useGameStore()

  const startGame = () => {
    if (!selectedClass || !playerName.trim()) return
    const id = crypto.randomUUID()
    setPlayer(id, playerName.trim(), selectedClass)
    transitionToScene(selectedClass === 'artisane' ? 'maison' : 'monde')
  }

  return (
    <div style={{
      width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #1a1232 0%, #2d1f54 50%, #1a1232 100%)',
      padding: '40px 20px', gap: 12, overflowY: 'auto',
    }}>
      {step === 'title' && (
        <>
          <div style={{ fontSize: 'clamp(28px, 10vw, 48px)', fontWeight: 700, color: '#e91e8c', textShadow: '0 0 20px rgba(233,30,140,0.5)', letterSpacing: 2 }}>
            RESTANQUES
          </div>
          <div style={{ fontSize: 14, color: '#9a8fbf', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            RPG coopératif provençal<br/>
            Jisse & Mélanie vs Le Mistral
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setStep('class')} style={{
              background: '#e91e8c', color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 48px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(233,30,140,0.4)',
            }}>
              Nouvelle Partie
            </button>
            <button style={{
              background: 'transparent', color: '#9a8fbf', border: '1px solid #3a2d5c',
              borderRadius: 12, padding: '10px 48px', fontSize: 13, cursor: 'pointer',
            }}>
              Continuer
            </button>
          </div>
          <div style={{ marginTop: 20, fontSize: 10, color: '#3a2d5c' }}>
            v6.0 — CDC Opus
          </div>
        </>
      )}

      {step === 'class' && (
        <>
          <div style={{ fontSize: 18, color: '#ef9f27', fontWeight: 600, marginBottom: 8 }}>Choisis ta classe</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
            {CLASSES.map((c) => (
              <button key={c.id} onClick={() => { setSelectedClass(c.id); setStep('name') }} style={{
                background: selectedClass === c.id ? c.color + '33' : '#231b42',
                border: `2px solid ${selectedClass === c.id ? c.color : '#3a2d5c'}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.color }}>{c.emoji} {c.name}</div>
                <div style={{ fontSize: 11, color: '#9a8fbf', marginTop: 4 }}>{c.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('title')} style={{
            background: 'transparent', color: '#9a8fbf', border: 'none', fontSize: 12, cursor: 'pointer', marginTop: 8,
          }}>
            ← Retour
          </button>
        </>
      )}

      {step === 'name' && selectedClass && (
        <>
          <div style={{ fontSize: 18, color: '#ef9f27', fontWeight: 600 }}>Ton nom ?</div>
          <div style={{ fontSize: 12, color: '#9a8fbf' }}>
            {CLASSES.find((c) => c.id === selectedClass)?.name}
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
          }}>
            ← Changer de classe
          </button>
        </>
      )}
    </div>
  )
}
