'use client'

import { useState } from 'react'
import { getAllStories, isStorySeen } from '@/lib/storyEngine'

// CDC M6: Chroniques — relire les stories vues

interface BookViewerProps {
  onClose: () => void
  onReplay: (storyId: string) => void
}

export default function BookViewer({ onClose, onReplay }: BookViewerProps) {
  const stories = getAllStories()
  const seen = stories.filter(s => isStorySeen(s.id))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#1a1232', border: '2px solid #C9A84C', borderRadius: 16, padding: 20, width: 360, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#C9A84C', fontFamily: 'Georgia, serif' }}>📖 Chroniques</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: '#9a8fbf', marginBottom: 10 }}>{seen.length}/{stories.length} séquences vues</div>
        {stories.map(s => {
          const viewed = isStorySeen(s.id)
          return (
            <div key={s.id} style={{
              display: 'flex', gap: 8, padding: '6px 8px', marginBottom: 3,
              background: viewed ? '#C9A84C11' : '#231b42',
              border: `1px solid ${viewed ? '#C9A84C44' : '#2d1f54'}`,
              borderRadius: 8, alignItems: 'center', cursor: viewed ? 'pointer' : 'default',
              opacity: viewed ? 1 : 0.4,
            }} onClick={() => viewed && onReplay(s.id)}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{viewed ? '📜' : '🔒'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: viewed ? '#F5ECD7' : '#3a2d5c' }}>{s.moment}</div>
                <div style={{ fontSize: 9, color: '#6b5e8a' }}>{s.texts[0]?.slice(0, 40)}...</div>
              </div>
              {viewed && <span style={{ fontSize: 9, color: '#C9A84C' }}>▶</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
