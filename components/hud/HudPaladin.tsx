'use client'

import { useRef, useState } from 'react'

// CDC M4: Joystick + A + B + menu Jisse
// Joystick = analogique 68×68px, A = action, B = menu

interface HudPaladinProps {
  onJoyMove: (dx: number, dy: number) => void
  onJoyEnd: () => void
  onAction: () => void
  onMenu: () => void
  onSave?: () => void
  menuItems: string[]
  activeMenu: string | null
  onMenuSelect: (item: string) => void
  joyDX?: number
  joyDY?: number
  biomeLabel?: string
}

export default function HudPaladin({
  onJoyMove, onJoyEnd, onAction, onMenu, onSave,
  menuItems, activeMenu, onMenuSelect,
  joyDX = 0, joyDY = 0, biomeLabel = 'Garrigue',
}: HudPaladinProps) {
  const joyRef = useRef<HTMLDivElement>(null)
  const joyCenterRef = useRef({ x: 0, y: 0 })
  const [joyActive, setJoyActive] = useState(false)

  const joyStart = (cx: number, cy: number) => {
    const rect = joyRef.current?.getBoundingClientRect()
    if (!rect) return
    joyCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setJoyActive(true)
    joyMoveHandler(cx, cy)
  }

  const joyMoveHandler = (cx: number, cy: number) => {
    const c = joyCenterRef.current
    let dx = (cx - c.x) / 34, dy = (cy - c.y) / 34
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 1) { dx /= dist; dy /= dist }
    onJoyMove(dx, dy)
  }

  const joyEndHandler = () => {
    setJoyActive(false)
    onJoyEnd()
  }

  const knobX = joyDX * 24, knobY = joyDY * 24

  return (
    <div className="controls-zone" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Menu strip */}
      <div style={{ display: 'flex', gap: 2, padding: '4px 8px', borderBottom: '1px solid rgba(139,105,20,0.3)' }}>
        {menuItems.map(m => (
          <button key={m} onClick={() => onMenuSelect(m)} style={{
            flex: 1, padding: '4px 0', background: activeMenu === m ? 'rgba(212,83,126,0.3)' : 'rgba(139,105,20,0.2)',
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
          onMouseMove={(e) => { if (joyActive) joyMoveHandler(e.clientX, e.clientY) }}
          onMouseUp={joyEndHandler} onMouseLeave={joyEndHandler}
          onTouchStart={(e) => { e.preventDefault(); joyStart(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={(e) => { e.preventDefault(); joyMoveHandler(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={joyEndHandler}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--hud-btn)',
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`,
            border: '2px solid var(--hud-text)', boxShadow: 'var(--hud-shadow)',
          }} />
        </div>

        {/* Center: save + info */}
        <div style={{ fontSize: 10, color: '#9a8fbf', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>{biomeLabel}</span>
          {onSave && (
            <button onClick={onSave} style={{
              padding: '4px 12px', background: 'rgba(126,200,80,0.2)', border: '1px solid rgba(126,200,80,0.4)',
              borderRadius: 6, color: '#7ec850', fontSize: 9, cursor: 'pointer',
            }}>💾 Save</button>
          )}
        </div>

        {/* Buttons A + B */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={onAction}
            onTouchStart={(e) => { e.preventDefault(); onAction() }}
            style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--hud-accent)', color: '#fff',
              border: '3px solid rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(212,83,126,0.4), var(--hud-shadow)',
            }}>A</button>
          <button onClick={onMenu} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--hud-btn)', color: 'var(--hud-text)',
            border: 'var(--hud-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            boxShadow: 'var(--hud-shadow)', alignSelf: 'center',
          }}>B</button>
        </div>
      </div>
    </div>
  )
}
