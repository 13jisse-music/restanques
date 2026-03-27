'use client'

import { useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'

// CDC M5: Overlay inventaire avec tri et détails

interface InventoryPanelProps {
  onClose: () => void
}

type SortMode = 'name' | 'quantity' | 'type'

export default function InventoryPanel({ onClose }: InventoryPanelProps) {
  const player = usePlayerStore()
  const [sortMode, setSortMode] = useState<SortMode>('name')

  const sorted = [...player.bag].sort((a, b) => {
    if (sortMode === 'quantity') return b.quantity - a.quantity
    if (sortMode === 'type') return a.itemId.localeCompare(b.itemId)
    return a.itemId.localeCompare(b.itemId)
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#1a1232', border: '2px solid #ef9f27', borderRadius: 16, padding: 20, width: 340, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ef9f27' }}>🎒 Sac ({player.bag.length}/{player.bagMaxSlots})</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        {/* CDC M5: Tri buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {([['name', 'A→Z'], ['quantity', 'Qté ↓'], ['type', 'Type']] as [SortMode, string][]).map(([mode, label]) => (
            <button key={mode} onClick={() => setSortMode(mode)} style={{
              flex: 1, padding: '4px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
              background: sortMode === mode ? '#ef9f27' : '#2d2252', color: '#fff', border: 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* Slots grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
          {Array(player.bagMaxSlots).fill(0).map((_, i) => {
            const item = sorted[i]
            return (
              <div key={i} style={{
                aspectRatio: '1', background: item ? '#231b42' : '#1a1232',
                border: `1px solid ${item ? '#3a2d5c' : '#2d1f54'}`, borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', fontSize: 10,
              }}>
                {item ? (
                  <>
                    <span style={{ fontSize: 14, color: '#F5ECD7' }}>{item.itemId.slice(0, 4)}</span>
                    <span style={{ fontSize: 8, color: '#ef9f27', position: 'absolute', bottom: 2, right: 4 }}>×{item.quantity}</span>
                  </>
                ) : (
                  <span style={{ color: '#2d1f54' }}>—</span>
                )}
              </div>
            )
          })}
        </div>

        {/* List view */}
        {sorted.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sorted.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#231b42', borderRadius: 6, border: '1px solid #2d1f54' }}>
                <span style={{ fontSize: 11, color: '#F5ECD7' }}>{item.itemId}</span>
                <span style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600 }}>×{item.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#3a2d5c', fontSize: 13, textAlign: 'center', padding: 16 }}>Sac vide</div>
        )}

        <div style={{ marginTop: 10, fontSize: 9, color: '#6b5e8a', textAlign: 'center' }}>
          Stockage maison : {player.storage.length} types · Max par slot : {player.bagMaxStack}
        </div>
      </div>
    </div>
  )
}
