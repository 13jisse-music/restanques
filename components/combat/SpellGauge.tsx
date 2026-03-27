'use client'

// CDC M2: Jauge de sorts — remplit par Coup/Défense (+1), seuils 2/4/6

interface SpellGaugeProps {
  value: number // 0-6
  max?: number
}

export default function SpellGauge({ value, max = 6 }: SpellGaugeProps) {
  return (
    <div style={{ padding: '4px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#7F77DD', minWidth: 28 }}>Sorts</span>
        <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: `${(value / max) * 100}%`, height: '100%',
            background: value >= 2 ? '#7F77DD' : '#4a4470',
            borderRadius: 3, transition: 'width 0.3s',
          }} />
          {/* Threshold markers */}
          {[2, 4].map(t => (
            <div key={t} style={{
              position: 'absolute', left: `${(t / max) * 100}%`, top: 0, bottom: 0,
              width: 1, background: value >= t ? '#F5ECD7' : '#6b5e8a',
            }} />
          ))}
        </div>
        <span style={{ fontSize: 9, color: '#7F77DD', minWidth: 20 }}>{value}/{max}</span>
      </div>
    </div>
  )
}
