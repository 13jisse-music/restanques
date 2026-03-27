'use client'

import { useCallback, useRef } from 'react'

// CDC M1: D-pad + bouton A + menu Mélanie
// D-pad = 4 flèches discrètes, hold-to-repeat (200ms initial, 100ms interval)
// Button A = gros bouton rose pour interaction contextuelle

interface HudArtisaneProps {
  onMove: (dx: number, dy: number) => void
  onAction: () => void
  menuItems: string[]
  activeMenu: string | null
  onMenuSelect: (item: string) => void
}

export default function HudArtisane({ onMove, onAction, menuItems, activeMenu, onMenuSelect }: HudArtisaneProps) {
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startMove = useCallback((dx: number, dy: number) => {
    onMove(dx, dy)
    if (moveTimerRef.current) clearInterval(moveTimerRef.current)
    const timeout = setTimeout(() => {
      moveTimerRef.current = setInterval(() => onMove(dx, dy), 100)
    }, 200)
    moveTimerRef.current = timeout as unknown as ReturnType<typeof setInterval>
  }, [onMove])

  const stopMove = useCallback(() => {
    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current)
      clearTimeout(moveTimerRef.current as unknown as ReturnType<typeof setTimeout>)
      moveTimerRef.current = null
    }
  }, [])

  const dpadBtn = (label: string, dx: number, dy: number) => (
    <button
      onMouseDown={() => startMove(dx, dy)}
      onMouseUp={stopMove}
      onMouseLeave={stopMove}
      onTouchStart={(e) => { e.preventDefault(); startMove(dx, dy) }}
      onTouchEnd={stopMove}
      style={{
        width: 38, height: 38, borderRadius: 8,
        background: 'var(--hud-btn)', color: 'var(--hud-text)',
        border: 'var(--hud-border)', boxShadow: 'var(--hud-shadow)',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >{label}</button>
  )

  return (
    <div className="controls-zone" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Menu bar */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid rgba(139,105,20,0.3)' }}>
        {menuItems.map(m => (
          <button key={m} onClick={() => onMenuSelect(m)} style={{
            flex: 1, padding: '4px 0',
            background: activeMenu === m ? 'rgba(212,83,126,0.3)' : 'rgba(139,105,20,0.2)',
            border: '1px solid rgba(139,105,20,0.4)', borderRadius: 4,
            color: 'var(--hud-text)', fontSize: 9, cursor: 'pointer',
          }}>{m}</button>
        ))}
      </div>

      {/* D-pad + Action */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        {/* D-pad */}
        <div style={{ display: 'grid', gridTemplateColumns: '38px 38px 38px', gridTemplateRows: '38px 38px 38px', gap: 2 }}>
          <div />
          {dpadBtn('↑', 0, -1)}
          <div />
          {dpadBtn('←', -1, 0)}
          <div style={{ width: 38, height: 38 }} />
          {dpadBtn('→', 1, 0)}
          <div />
          {dpadBtn('↓', 0, 1)}
          <div />
        </div>

        {/* Center info */}
        <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center' }}>
          Maison
        </div>

        {/* Button A */}
        <button
          onClick={onAction}
          onTouchStart={(e) => { e.preventDefault(); onAction() }}
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
  )
}
