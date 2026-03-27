'use client'

import { useState } from 'react'

type Tab = 'assets' | 'skins' | 'recipes' | 'pnj' | 'stats'

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd] = useState('')
  const [tab, setTab] = useState<Tab>('assets')
  const [uploads, setUploads] = useState<{ name: string; type: string; size: number; date: string }[]>([])
  const [msg, setMsg] = useState('')

  if (!auth) {
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1232', gap: 12 }}>
        <div style={{ fontSize: 20, color: '#e91e8c', fontWeight: 700 }}>Admin Panel</div>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Mot de passe"
          style={{ background: '#231b42', border: '2px solid #3a2d5c', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#F5ECD7', textAlign: 'center', outline: 'none' }}
          onKeyDown={e => { if (e.key === 'Enter') setAuth(pwd === 'restanques2026') }} />
        <button onClick={() => setAuth(pwd === 'restanques2026')} style={{
          background: '#e91e8c', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Entrer</button>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'assets', label: 'Assets', icon: '📦' },
    { id: 'skins', label: 'Skins', icon: '🎨' },
    { id: 'recipes', label: 'Recettes', icon: '⚒' },
    { id: 'pnj', label: 'PNJ', icon: '👤' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ]

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(f => {
      setUploads(prev => [...prev, { name: f.name, type: f.type, size: f.size, date: new Date().toLocaleString('fr-FR') }])
    })
    setMsg(files.length + ' fichier(s) ajouté(s)')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: '#1a1232' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '2px solid #e91e8c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, color: '#e91e8c', fontWeight: 700 }}>Admin Restanques</div>
        <button onClick={() => setAuth(false)} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 6, padding: '4px 12px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>Déconnexion</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 16px', background: '#0f0b20' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px', background: tab === t.id ? '#e91e8c22' : 'transparent',
            border: tab === t.id ? '1px solid #e91e8c' : '1px solid #2a2252',
            borderRadius: 6, color: tab === t.id ? '#e91e8c' : '#9a8fbf', fontSize: 11, cursor: 'pointer',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {msg && <div style={{ background: '#7ec85022', border: '1px solid #7ec850', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7ec850', marginBottom: 12 }}>{msg}</div>}

        {tab === 'assets' && (
          <div>
            <div style={{ fontSize: 16, color: '#ef9f27', fontWeight: 600, marginBottom: 12 }}>Upload Assets</div>
            <div style={{ background: '#231b42', border: '2px dashed #3a2d5c', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13, color: '#9a8fbf', marginBottom: 8 }}>Glisse tes fichiers ici ou clique pour choisir</div>
              <input type="file" multiple accept=".png,.jpg,.mp3,.wav" onChange={handleUpload}
                style={{ fontSize: 12, color: '#9a8fbf' }} />
              <div style={{ fontSize: 10, color: '#3a2d5c', marginTop: 8 }}>PNG, JPG, MP3, WAV — Max 10MB par fichier</div>
            </div>
            {uploads.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#9a8fbf', marginBottom: 6 }}>Fichiers uploadés ({uploads.length})</div>
                {uploads.map((u, i) => (
                  <div key={i} style={{ background: '#231b42', borderRadius: 6, padding: '6px 10px', marginBottom: 3, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#F5ECD7' }}>{u.name}</span>
                    <span style={{ color: '#9a8fbf' }}>{Math.round(u.size / 1024)}KB — {u.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'skins' && (
          <div>
            <div style={{ fontSize: 16, color: '#D4537E', fontWeight: 600, marginBottom: 12 }}>Gestion Skins</div>
            {['Provence (défaut)', 'Médiéval', 'Rétro'].map(s => (
              <div key={s} style={{ background: '#231b42', borderRadius: 8, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#F5ECD7' }}>{s}</span>
                <span style={{ fontSize: 10, color: s === 'Provence (défaut)' ? '#7ec850' : '#3a2d5c' }}>{s === 'Provence (défaut)' ? 'Actif' : 'Inactif'}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'recipes' && (
          <div>
            <div style={{ fontSize: 16, color: '#ef9f27', fontWeight: 600, marginBottom: 12 }}>Gestion Recettes</div>
            <div style={{ fontSize: 12, color: '#9a8fbf' }}>14 sorts + 20 cuisine + 20 armurerie = 54 recettes</div>
            <div style={{ fontSize: 11, color: '#3a2d5c', marginTop: 8 }}>Éditeur de recettes à venir — pour l'instant les recettes sont dans le code (data/recipes.ts)</div>
          </div>
        )}

        {tab === 'pnj' && (
          <div>
            <div style={{ fontSize: 16, color: '#ef9f27', fontWeight: 600, marginBottom: 12 }}>Gestion PNJ</div>
            <div style={{ fontSize: 12, color: '#9a8fbf' }}>21 PNJ — éditeur à venir</div>
          </div>
        )}

        {tab === 'stats' && (
          <div>
            <div style={{ fontSize: 16, color: '#85B7EB', fontWeight: 600, marginBottom: 12 }}>Statistiques</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['Modules', '8/11'], ['Assets', '196 prompts'], ['Sprites produits', '~15'], ['Biomes codés', '2/6'],
                ['Boss codés', '2/10'], ['PNJ codés', '5/21'], ['Sorts', '14'], ['Recettes', '40']].map(([k, v]) => (
                <div key={k} style={{ background: '#231b42', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#9a8fbf' }}>{k}</div>
                  <div style={{ fontSize: 14, color: '#F5ECD7', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
