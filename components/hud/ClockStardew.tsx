'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useSkin } from '@/lib/useSkin'

// 1 cycle = 20 min real time = 24h game time
const CYCLE_MS = 20 * 60 * 1000
const UPDATE_MS = 500

export default function ClockStardew() {
  const { dayNightCycle, updateDayNight } = useGameStore()
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      updateDayNight(UPDATE_MS / CYCLE_MS)
      setTick(t => t + 1)
    }, UPDATE_MS)
    return () => clearInterval(interval)
  }, [updateDayNight])

  // Convert 0-1 cycle to game hours (0 = 6:00, 0.5 = 18:00)
  const gameHour = ((dayNightCycle * 24) + 6) % 24
  const h = Math.floor(gameHour)
  const m = Math.floor((gameHour - h) * 60)
  const isDay = h >= 6 && h < 20
  const angleDeg = dayNightCycle * 360

  const clockFrame = useSkin('skin_clock_frame.png')

  return (
    <div style={{
      position: 'absolute', top: 4, left: 4, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(26,18,50,0.85)', borderRadius: 8,
      padding: '3px 8px 3px 4px', border: '1px solid rgba(139,105,20,0.4)',
      ...(clockFrame ? { backgroundImage: `url(${clockFrame})`, backgroundSize: 'cover' } : {}),
    }}>
      {/* Clock dial */}
      <div style={{ width: 28, height: 28, position: 'relative' }}>
        {/* Background: day/night halves */}
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
          {/* Day half (top) */}
          <path d="M14,0 A14,14 0 0,1 14,28 L14,14 Z" fill="#87CEEB" />
          {/* Night half (bottom) */}
          <path d="M14,28 A14,14 0 0,1 14,0 L14,14 Z" fill="#2d1f54" />
          {/* Border */}
          <circle cx="14" cy="14" r="13" fill="none" stroke="#8B6914" strokeWidth="1.5" />
          {/* Sun marker top */}
          <text x="14" y="7" textAnchor="middle" fontSize="6" fill="#ef9f27">☼</text>
          {/* Moon marker bottom */}
          <text x="14" y="24" textAnchor="middle" fontSize="6" fill="#9a8fbf">☽</text>
          {/* Hand */}
          <line
            x1="14" y1="14"
            x2={14 + 9 * Math.sin(angleDeg * Math.PI / 180)}
            y2={14 - 9 * Math.cos(angleDeg * Math.PI / 180)}
            stroke="#e24b4a" strokeWidth="1.5" strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="14" cy="14" r="2" fill="#e24b4a" />
        </svg>
      </div>
      {/* Time text */}
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: isDay ? '#ef9f27' : '#85B7EB' }}>
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 8, color: '#9a8fbf' }}>
          {isDay ? 'Jour' : 'Nuit'}
        </div>
      </div>
    </div>
  )
}
