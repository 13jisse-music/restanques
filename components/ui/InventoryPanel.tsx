'use client'

import { usePlayerStore } from '@/store/playerStore'

// CDC M5: Overlay inventaire avec tri et détails

interface InventoryPanelProps {
  onClose: () => void
}

export default function InventoryPanel({ onClose }: InventoryPanelProps) {
  const player = usePlayerStore()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#1a1232', border: '2px solid #ef9f27', borderRadius: 16, padding: 20, width: 340, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ef9f27' }}>🎒 Inventaire ({player.bag.length}/{player.bagMaxSlots})</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        {player.bag.length === 0 ? (
          <div style={{ color: '#3a2d5c', fontSize: 13, textAlign: 'center', padding: 20 }}>Sac vide</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {player.bag.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#231b42', borderRadius: 8, border: '1px solid #2d1f54' }}>
                <span style={{ fontSize: 12, color: '#F5ECD7' }}>{item.itemId}</span>
                <span style={{ fontSize: 12, color: '#ef9f27', fontWeight: 600 }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 10, color: '#6b5e8a', textAlign: 'center' }}>
          Stockage maison : {player.storage.length} types
        </div>
      </div>
    </div>
  )
}
