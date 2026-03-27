'use client'

// CDC M2: Barre ATB monstre — remplit progressivement, gradient orange-rouge, % affiché

interface ATBBarProps {
  value: number // 0-1
  speed: number // seconds to fill
}

export default function ATBBar({ value, speed }: ATBBarProps) {
  return (
    <div style={{ padding: '4px 12px', background: '#1a1232' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#9a8fbf', minWidth: 22 }}>ATB</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${value * 100}%`, height: '100%',
            background: `linear-gradient(90deg, #ef9f27, #e24b4a)`,
            borderRadius: 3, transition: 'width 0.1s linear',
          }} />
        </div>
        <span style={{ fontSize: 9, color: value > 0.8 ? '#e24b4a' : '#ef9f27', minWidth: 26 }}>
          {Math.floor(value * 100)}%
        </span>
      </div>
    </div>
  )
}
