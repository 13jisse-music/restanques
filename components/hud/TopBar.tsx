'use client'

import { useState, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { useGameStore } from '@/store/gameStore'
import dynamic from 'next/dynamic'

const DebugConsole = dynamic(() => import('@/components/ui/DebugConsole'), { ssr: false })

// CDC M1: Barre PV, fatigue, Sous, niveau + warning fatigue + debug console (triple-tap nom)
export default function TopBar() {
  const { playerName, playerClass } = useGameStore()
  const player = usePlayerStore()
  const [showDebug, setShowDebug] = useState(false)
  const codeBuffer = useRef('')

  // Code secret : tape "debug" sur le clavier pour ouvrir la console
  if (typeof window !== 'undefined' && !codeBuffer.current) {
    window.addEventListener('keydown', (e) => {
      codeBuffer.current += e.key.toLowerCase()
      if (codeBuffer.current.length > 10) codeBuffer.current = codeBuffer.current.slice(-10)
      if (codeBuffer.current.includes('debug')) {
        setShowDebug(true)
        codeBuffer.current = ''
      }
    })
  }

  const classColor = playerClass === 'paladin' ? '#ef9f27' : playerClass === 'artisane' ? '#D4537E' : '#534AB7'
  const displayName = playerName || (playerClass === 'artisane' ? 'Mélanie' : playerClass === 'paladin' ? 'Jisse' : 'Quentin')
  const hpPct = player.hpMax > 0 ? (player.hp / player.hpMax) * 100 : 0
  const hpColor = player.hp < player.hpMax * 0.25 ? '#e24b4a' : player.hp < player.hpMax * 0.5 ? '#ef9f27' : '#7ec850'

  // Warning fatigue
  const fatigueWarning = player.fatigue > 80
  const fatigueCritical = player.fatigue > 95

  return (
    <>
      <div className="top-bar" style={fatigueWarning ? { borderBottom: `2px solid ${fatigueCritical ? '#e24b4a' : '#ef9f27'}` } : undefined}>
        <span style={{ fontSize: 11, color: classColor, fontWeight: 600, cursor: 'pointer' }}
          onDoubleClick={() => setShowDebug(true)}>{displayName}</span>
        <span style={{ fontSize: 10, color: '#9a8fbf' }}>Nv.{player.level}</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: hpColor, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 9, color: hpColor, fontWeight: hpPct < 25 ? 700 : 400 }}>{player.hp}/{player.hpMax}</span>
        <span style={{ fontSize: 10, color: '#ef9f27' }}>💰{player.sous}</span>
        {player.fatigue > 10 && (
          <span style={{
            fontSize: 9,
            color: fatigueCritical ? '#e24b4a' : player.fatigue > 70 ? '#ef9f27' : '#9a8fbf',
            fontWeight: fatigueWarning ? 700 : 400,
            animation: fatigueCritical ? 'fatiguePulse 0.5s infinite' : undefined,
          }}>
            😴{Math.round(player.fatigue)}%
          </span>
        )}
      </div>
      {/* Warning overlay quand fatigue critique */}
      {fatigueCritical && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
          border: '3px solid #e24b4a',
          animation: 'fatigueFlash 1s infinite',
        }} />
      )}
      {showDebug && <DebugConsole onClose={() => setShowDebug(false)} />}
      <style>{`
        @keyframes fatiguePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fatigueFlash { 0%,100%{border-color:#e24b4a00} 50%{border-color:#e24b4a66} }
      `}</style>
    </>
  )
}
