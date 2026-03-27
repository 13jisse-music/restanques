'use client'

import { usePlayerStore } from '@/store/playerStore'
import { useGameStore } from '@/store/gameStore'

// CDC M1: Barre PV, fatigue, Sous, niveau — réutilisable dans toutes les scènes
export default function TopBar() {
  const { playerName, playerClass } = useGameStore()
  const player = usePlayerStore()

  const classColor = playerClass === 'paladin' ? '#ef9f27' : playerClass === 'artisane' ? '#D4537E' : '#534AB7'
  const displayName = playerName || (playerClass === 'artisane' ? 'Mélanie' : playerClass === 'paladin' ? 'Jisse' : 'Quentin')
  const hpPct = player.hpMax > 0 ? (player.hp / player.hpMax) * 100 : 0

  return (
    <div className="top-bar">
      <span style={{ fontSize: 11, color: classColor, fontWeight: 600 }}>{displayName}</span>
      <span style={{ fontSize: 10, color: '#9a8fbf' }}>Nv.{player.level}</span>
      <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${hpPct}%`, height: '100%', background: player.hp < player.hpMax * 0.25 ? '#e24b4a' : '#7ec850', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 9, color: '#9a8fbf' }}>{player.hp}/{player.hpMax}</span>
      <span style={{ fontSize: 10, color: '#ef9f27' }}>💰{player.sous}</span>
      {player.fatigue > 10 && (
        <span style={{ fontSize: 9, color: player.fatigue > 70 ? '#e24b4a' : '#9a8fbf' }}>
          😴{Math.round(player.fatigue)}%
        </span>
      )}
    </div>
  )
}
