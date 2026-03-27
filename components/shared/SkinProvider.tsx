'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const SKINS = [
  { id: 'provence', name: 'Provence', desc: 'Couleurs chaudes provençales', preview: '#8B6914' },
  { id: 'medieval', name: 'Médiéval', desc: 'Tons sombres et mystérieux', preview: '#4a4a6a' },
  { id: 'retro', name: 'Rétro', desc: 'Néon 80s cyberpunk', preview: '#00e5ff' },
]

export default function SkinProvider() {
  const { currentSkin, setSkin } = useGameStore()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 8, left: 8, zIndex: 500,
        width: 28, height: 28, borderRadius: '50%',
        background: SKINS.find(s => s.id === currentSkin)?.preview || '#8B6914',
        border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }} title="Changer de skin" />
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 8, left: 8, zIndex: 500,
      background: '#1a1232', border: '2px solid #3a2d5c', borderRadius: 12,
      padding: 12, width: 200,
    }}>
      <div style={{ fontSize: 12, color: '#ef9f27', fontWeight: 600, marginBottom: 8 }}>🎨 Skin</div>
      {SKINS.map(skin => (
        <button key={skin.id} onClick={() => { setSkin(skin.id); setOpen(false) }} style={{
          width: '100%', padding: '8px 10px', marginBottom: 4,
          background: currentSkin === skin.id ? `${skin.preview}22` : 'transparent',
          border: `1px solid ${currentSkin === skin.id ? skin.preview : '#2d1f54'}`,
          borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: skin.preview, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: currentSkin === skin.id ? skin.preview : '#F5ECD7' }}>{skin.name}</div>
            <div style={{ fontSize: 9, color: '#9a8fbf' }}>{skin.desc}</div>
          </div>
        </button>
      ))}
      <button onClick={() => setOpen(false)} style={{
        width: '100%', padding: '4px', background: 'transparent',
        border: 'none', color: '#9a8fbf', fontSize: 10, cursor: 'pointer', marginTop: 4,
      }}>Fermer</button>
    </div>
  )
}
