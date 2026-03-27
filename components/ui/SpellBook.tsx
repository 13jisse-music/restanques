'use client'

import { usePlayerStore } from '@/store/playerStore'
import { SORTS } from '@/data/sorts'

interface SpellBookProps {
  onClose: () => void
}

export default function SpellBook({ onClose }: SpellBookProps) {
  const player = usePlayerStore()

  const colorMap: Record<string, string> = { Rouge: '#e24b4a', Bleu: '#5ba8ef', Blanc: '#F5ECD7', Noir: '#534AB7' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#1a1232', border: '2px solid #7F77DD', borderRadius: 16, padding: 20, width: 340, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#7F77DD' }}>✦ Grimoire</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: '#9a8fbf', marginBottom: 8 }}>
          Équipés : {player.equippedSpells.length}/3
        </div>
        {SORTS.map(spell => {
          const equipped = player.equippedSpells.find(s => s.spellId === spell.id)
          return (
            <div key={spell.id} style={{
              display: 'flex', gap: 8, padding: '6px 8px', marginBottom: 4,
              background: equipped ? '#7F77DD11' : '#231b42',
              border: `1px solid ${equipped ? '#7F77DD' : '#2d1f54'}`,
              borderRadius: 8, alignItems: 'center',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[spell.color] || '#999', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: equipped ? '#F5ECD7' : '#6b5e8a', fontWeight: equipped ? 600 : 400 }}>{spell.name}</div>
                <div style={{ fontSize: 9, color: '#6b5e8a' }}>{spell.effect} · {spell.tier}</div>
              </div>
              {equipped && <span style={{ fontSize: 9, color: '#7F77DD' }}>Slot {equipped.slot}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
