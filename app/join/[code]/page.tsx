'use client'

import { useState } from 'react'
import { useMultiplayerStore } from '@/store/multiplayerStore'
import { useGameStore, PlayerClass } from '@/store/gameStore'

const CLASSES: { id: PlayerClass; name: string; emoji: string; desc: string; color: string }[] = [
  { id: 'paladin', name: 'Jisse — Le Paladin', emoji: '⚔️', desc: 'Explore et combat', color: '#ef9f27' },
  { id: 'artisane', name: 'Mélanie — L\'Artisane', emoji: '🎨', desc: 'Craft et gestion', color: '#D4537E' },
  { id: 'ombre', name: 'Quentin — L\'Ombre', emoji: '🌙', desc: 'Solo polyvalent', color: '#534AB7' },
]

export default function JoinPage({ params }: { params: { code: string } }) {
  const [playerName, setPlayerName] = useState('')
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null)
  const [joined, setJoined] = useState(false)
  const { joinSession } = useMultiplayerStore()
  const { setPlayer, transitionToScene } = useGameStore()

  const handleJoin = () => {
    if (!selectedClass || !playerName.trim()) return
    const id = crypto.randomUUID()
    setPlayer(id, playerName.trim(), selectedClass)
    joinSession(params.code)
    setJoined(true)
    setTimeout(() => {
      transitionToScene(selectedClass === 'artisane' ? 'maison' : 'monde')
    }, 1500)
  }

  const shareLink = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: 'Rejoins Restanques !', text: 'Rejoins ma partie !', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien copié !')
    }
  }

  if (joined) {
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1232', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 24, color: '#7ec850', fontWeight: 700 }}>Connexion...</div>
        <div style={{ fontSize: 14, color: '#9a8fbf' }}>Session {params.code}</div>
        <div style={{ fontSize: 40, animation: 'pulse 1s infinite' }}>🎮</div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #1a1232, #2d1f54)', padding: '40px 20px', gap: 16 }}>
      <div style={{ fontSize: 12, color: '#9a8fbf' }}>Rejoindre la session</div>
      <div style={{ fontSize: 28, color: '#e91e8c', fontWeight: 700, letterSpacing: 4 }}>{params.code}</div>

      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600, marginBottom: 8 }}>Choisis ta classe</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CLASSES.map(c => (
            <button key={c.id} onClick={() => setSelectedClass(c.id)} style={{
              background: selectedClass === c.id ? c.color + '33' : '#231b42',
              border: `2px solid ${selectedClass === c.id ? c.color : '#3a2d5c'}`,
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.color }}>{c.emoji} {c.name}</span>
              <div style={{ fontSize: 11, color: '#9a8fbf', marginTop: 2 }}>{c.desc}</div>
            </button>
          ))}
        </div>

        {selectedClass && (
          <>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="Ton nom..." maxLength={20} autoFocus
              style={{ width: '100%', marginTop: 12, background: '#231b42', border: '2px solid #3a2d5c',
                borderRadius: 10, padding: '12px 16px', fontSize: 16, color: '#F5ECD7', textAlign: 'center', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />

            <button onClick={handleJoin} disabled={!playerName.trim()} style={{
              width: '100%', marginTop: 12, padding: '14px', background: playerName.trim() ? '#e91e8c' : '#3a2d5c',
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600,
              cursor: playerName.trim() ? 'pointer' : 'default', opacity: playerName.trim() ? 1 : 0.5,
            }}>Rejoindre !</button>
          </>
        )}
      </div>

      <button onClick={shareLink} style={{
        marginTop: 8, background: 'transparent', border: '1px solid #3a2d5c', borderRadius: 8,
        padding: '8px 16px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer',
      }}>📤 Partager ce lien</button>
    </div>
  )
}
