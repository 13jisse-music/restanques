'use client'

import { useState } from 'react'
import ComboIndicator from './ComboIndicator'

// CDC M2: Zone de combat avec sprites, animations, combo window
// Sprites: /sprites/combat/combat_[class].png et combat_[monster].png
// Animations: hit flash, attack translate, death scale/rotate, critical text

interface BattleFieldProps {
  playerSprite?: string  // path to player combat sprite
  monsterSprite?: string // path to monster combat sprite
  monsterName: string
  monsterHp: number
  monsterMaxHp: number
  playerFlash: string    // '' | 'red' | 'blue' | 'green'
  monsterFlash: string
  playerAnim: string     // '' | 'attack' | 'dodge'
  comboText: string | null
  comboWindowActive?: boolean
  isBoss?: boolean
  bossSpecialActive?: boolean
  shaking?: boolean
}

export default function BattleField({
  playerSprite, monsterSprite, monsterName, monsterHp, monsterMaxHp,
  playerFlash, monsterFlash, playerAnim, comboText, comboWindowActive,
  isBoss, bossSpecialActive, shaking,
}: BattleFieldProps) {
  const [playerImgError, setPlayerImgError] = useState(false)
  const [monsterImgError, setMonsterImgError] = useState(false)
  const monsterDead = monsterHp <= 0
  const monsterSize = isBoss ? 140 : 80 // CDC M2: Boss sprite plus grand (192px source, 140px display)

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 20px', position: 'relative',
      animation: shaking ? 'battleShake 0.2s ease-in-out' : undefined,
    }}>
      {/* Player sprite */}
      <div style={{
        width: 80, height: 80, borderRadius: isBoss ? 12 : '50%',
        background: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '3px solid #fff', overflow: 'hidden',
        boxShadow: playerFlash ? `0 0 20px ${playerFlash}` : '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.1s, transform 0.15s',
        transform: playerAnim === 'attack' ? 'translateX(30px)' : 'none',
        animation: playerAnim === 'dodge' ? 'dodgeAnim 0.4s ease-out' : undefined,
      }}>
        {playerSprite && !playerImgError ? (
          <img src={playerSprite} alt="Player" onError={() => setPlayerImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        ) : (
          <span style={{ fontSize: 30 }}>⚔️</span>
        )}
      </div>

      {/* VS */}
      <div style={{ fontSize: 14, color: '#3a2d5c', fontWeight: 700 }}>VS</div>

      {/* Monster sprite */}
      <div style={{
        width: monsterSize, height: monsterSize, borderRadius: isBoss ? 12 : '50%',
        background: monsterDead ? '#333' : bossSpecialActive ? '#ff4444' : '#e24b4a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `3px solid ${isBoss ? '#ef9f27' : '#fff'}`, overflow: 'hidden',
        boxShadow: monsterFlash ? `0 0 20px ${monsterFlash}` : isBoss ? '0 0 15px rgba(239,159,39,0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'all 0.3s',
        opacity: monsterDead ? 0.3 : 1,
        transform: monsterDead ? 'scale(0.5) rotate(15deg)' : bossSpecialActive ? 'scale(1.05)' : 'none',
      }}>
        {monsterSprite && !monsterImgError ? (
          <img src={monsterSprite} alt={monsterName} onError={() => setMonsterImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        ) : (
          <span style={{ fontSize: isBoss ? 36 : 30 }}>👹</span>
        )}
      </div>

      {/* Combo indicator */}
      <ComboIndicator text={comboText} comboWindowActive={comboWindowActive} />

      <style>{`
        @keyframes battleShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes dodgeAnim { 0%{transform:translateX(0);opacity:1} 30%{transform:translateX(-20px);opacity:0.5} 60%{transform:translateX(-15px);opacity:0.7} 100%{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  )
}
