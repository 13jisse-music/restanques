'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ALL_RECIPES, Recipe } from '@/data/recipes'
import { MONSTERS, Monster } from '@/data/monsters'
import { PNJ_LIST, PNJ } from '@/data/pnj'
import { SORTS } from '@/data/sorts'

type Tab = 'assets' | 'skins' | 'recipes' | 'pnj' | 'monsters' | 'stats'

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd] = useState('')
  const [tab, setTab] = useState<Tab>('stats')
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  // Stats
  const [dbStats, setDbStats] = useState<Record<string, number>>({})

  // CRUD state
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null)
  const [editPNJ, setEditPNJ] = useState<PNJ | null>(null)
  const [editMonster, setEditMonster] = useState<Monster | null>(null)
  const [recipeFilter, setRecipeFilter] = useState<string>('all')
  const [monsterFilter, setMonsterFilter] = useState<string>('all')

  // Load stats from Supabase
  const loadStats = useCallback(async () => {
    try {
      const [players, sessions, stories, bestiary] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('story_seen').select('id', { count: 'exact', head: true }),
        supabase.from('bestiary').select('id', { count: 'exact', head: true }),
      ])
      setDbStats({
        players: players.count || 0,
        activeSessions: sessions.count || 0,
        storiesSeen: stories.count || 0,
        monstersKilled: bestiary.count || 0,
      })
    } catch { /* offline fallback */ }
  }, [])

  useEffect(() => { if (auth) loadStats() }, [auth, loadStats])

  if (!auth) {
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1232', gap: 12 }}>
        <div style={{ fontSize: 20, color: '#e91e8c', fontWeight: 700 }}>Admin Restanques</div>
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
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'assets', label: 'Assets', icon: '📦' },
    { id: 'recipes', label: 'Recettes', icon: '⚒' },
    { id: 'monsters', label: 'Monstres', icon: '👹' },
    { id: 'pnj', label: 'PNJ', icon: '👤' },
    { id: 'skins', label: 'Skins', icon: '🎨' },
  ]

  // CDC M9: Upload to Supabase Storage bucket "assets"
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, dest: string) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    let count = 0
    for (const file of Array.from(files)) {
      try {
        const path = `${dest}/${file.name}`
        const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
        if (!error) count++
        else setMsg('Erreur: ' + error.message)
      } catch (err) {
        setMsg('Upload échoué: ' + file.name)
      }
    }
    setUploading(false)
    setMsg(`${count}/${files.length} fichier(s) uploadé(s) dans ${dest}/`)
    setTimeout(() => setMsg(''), 3000)
  }

  // Export data as JSON
  const exportJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const stat = (label: string, value: string | number, color = '#F5ECD7') => (
    <div style={{ background: '#231b42', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: '#9a8fbf' }}>{label}</div>
      <div style={{ fontSize: 16, color, fontWeight: 600 }}>{value}</div>
    </div>
  )

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: '#1a1232' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '2px solid #e91e8c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, color: '#e91e8c', fontWeight: 700 }}>Admin Restanques</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadStats} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 6, padding: '4px 12px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>↻ Refresh</button>
          <button onClick={() => setAuth(false)} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 6, padding: '4px 12px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 12px', background: '#0f0b20', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', background: tab === t.id ? '#e91e8c22' : 'transparent',
            border: tab === t.id ? '1px solid #e91e8c' : '1px solid #2a2252',
            borderRadius: 6, color: tab === t.id ? '#e91e8c' : '#9a8fbf', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {msg && <div style={{ background: '#7ec85022', border: '1px solid #7ec850', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7ec850', marginBottom: 12 }}>{msg}</div>}

        {/* ===== STATS ===== */}
        {tab === 'stats' && (
          <div>
            <div style={{ fontSize: 16, color: '#85B7EB', fontWeight: 600, marginBottom: 12 }}>Statistiques du jeu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16 }}>
              {stat('Joueurs Supabase', dbStats.players || 0, '#7ec850')}
              {stat('Sessions actives', dbStats.activeSessions || 0, '#ef9f27')}
              {stat('Stories vues', dbStats.storiesSeen || 0, '#e91e8c')}
              {stat('Monstres tués', dbStats.monstersKilled || 0, '#e24b4a')}
            </div>
            <div style={{ fontSize: 13, color: '#9a8fbf', fontWeight: 600, marginBottom: 8 }}>Contenu du jeu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
              {stat('Modules', '11/11 ✓', '#7ec850')}
              {stat('Monstres', MONSTERS.length)}
              {stat('Sorts', SORTS.length)}
              {stat('Recettes', ALL_RECIPES.length)}
              {stat('PNJ', PNJ_LIST.length)}
              {stat('Assets prompts', '305')}
              {stat('Biomes', '6 (5 jouables)')}
              {stat('Boss', '5 + 5 demi')}
            </div>
          </div>
        )}

        {/* ===== ASSETS UPLOAD ===== */}
        {tab === 'assets' && (
          <div>
            <div style={{ fontSize: 16, color: '#ef9f27', fontWeight: 600, marginBottom: 12 }}>Upload vers Supabase Storage</div>
            {['sprites/world', 'sprites/combat', 'sprites/tiles/parts', 'sprites/items', 'portraits', 'story', 'music', 'skins/provence'].map(dest => (
              <div key={dest} style={{ background: '#231b42', borderRadius: 8, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#F5ECD7' }}>📁 {dest}/</span>
                <label style={{ padding: '4px 12px', background: '#e91e8c', color: '#fff', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                  Upload
                  <input type="file" multiple accept=".png,.jpg,.mp3" onChange={e => handleUpload(e, dest)} style={{ display: 'none' }} />
                </label>
              </div>
            ))}
            {uploading && <div style={{ fontSize: 12, color: '#ef9f27', marginTop: 8 }}>⏳ Upload en cours...</div>}
          </div>
        )}

        {/* ===== RECETTES CRUD ===== */}
        {tab === 'recipes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, color: '#ef9f27', fontWeight: 600 }}>Recettes ({ALL_RECIPES.length})</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'salon', 'cuisine', 'armurerie'].map(f => (
                  <button key={f} onClick={() => setRecipeFilter(f)} style={{
                    padding: '4px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
                    background: recipeFilter === f ? '#ef9f27' : '#2d2252', color: '#fff', border: 'none',
                  }}>{f === 'all' ? 'Tous' : f}</button>
                ))}
                <button onClick={() => exportJSON(ALL_RECIPES, 'recipes.json')} style={{
                  padding: '4px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer', background: '#534AB7', color: '#fff', border: 'none',
                }}>Export JSON</button>
              </div>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {ALL_RECIPES.filter(r => recipeFilter === 'all' || r.atelier === recipeFilter).map(recipe => (
                <div key={recipe.id} style={{ background: '#231b42', borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 18, marginRight: 6 }}>{recipe.emoji}</span>
                    <span style={{ fontSize: 12, color: '#F5ECD7' }}>{recipe.name}</span>
                    <span style={{ fontSize: 9, color: '#9a8fbf', marginLeft: 6 }}>{recipe.tier} · {recipe.biome}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#7ec850' }}>{recipe.effect}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MONSTRES CRUD ===== */}
        {tab === 'monsters' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, color: '#e24b4a', fontWeight: 600 }}>Monstres ({MONSTERS.length})</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'Garrigue', 'Calanques', 'Mines', 'Mer', 'Restanques', 'Maison'].map(f => (
                  <button key={f} onClick={() => setMonsterFilter(f)} style={{
                    padding: '3px 6px', fontSize: 8, borderRadius: 4, cursor: 'pointer',
                    background: monsterFilter === f ? '#e24b4a' : '#2d2252', color: '#fff', border: 'none',
                  }}>{f === 'all' ? 'Tous' : f}</button>
                ))}
                <button onClick={() => exportJSON(MONSTERS, 'monsters.json')} style={{
                  padding: '3px 6px', fontSize: 8, borderRadius: 4, cursor: 'pointer', background: '#534AB7', color: '#fff', border: 'none',
                }}>JSON</button>
              </div>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {MONSTERS.filter(m => monsterFilter === 'all' || m.biome === monsterFilter).map(m => (
                <div key={m.id} style={{ background: '#231b42', borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, color: m.type.includes('Boss') ? '#e91e8c' : m.type === 'Demi-boss' ? '#ef9f27' : '#F5ECD7', fontWeight: m.type.includes('Boss') || m.type === 'Demi-boss' ? 700 : 400 }}>{m.name}</span>
                    <span style={{ fontSize: 9, color: '#9a8fbf', marginLeft: 6 }}>{m.type} · {m.biome}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9a8fbf', display: 'flex', gap: 8 }}>
                    <span>PV {m.hp}</span>
                    <span>ATK {m.atk}</span>
                    <span>DEF {m.def}</span>
                    <span style={{ color: '#ef9f27' }}>XP {m.xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PNJ ===== */}
        {tab === 'pnj' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, color: '#C9A84C', fontWeight: 600 }}>PNJ ({PNJ_LIST.length})</div>
              <button onClick={() => exportJSON(PNJ_LIST, 'pnj.json')} style={{
                padding: '4px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer', background: '#534AB7', color: '#fff', border: 'none',
              }}>Export JSON</button>
            </div>
            {PNJ_LIST.map(p => (
              <div key={p.id} style={{ background: '#231b42', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: '#9a8fbf' }}>{p.biome}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9a8fbf', marginTop: 2 }}>{p.personality}</div>
                <div style={{ fontSize: 10, color: '#7ec850', marginTop: 2 }}>Quête: {p.quest} → {p.reward}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===== SKINS ===== */}
        {tab === 'skins' && (
          <div>
            <div style={{ fontSize: 16, color: '#D4537E', fontWeight: 600, marginBottom: 12 }}>Skins (3 thèmes)</div>
            {[
              { name: 'Provence', desc: 'Bois chaud, or, rose — défaut', color: '#8B6914', active: true },
              { name: 'Médiéval', desc: 'Sombre, pierre, acier', color: '#4a4a6a', active: false },
              { name: 'Rétro', desc: 'Néon cyan/rose, cyberpunk', color: '#00e5ff', active: false },
            ].map(s => (
              <div key={s.name} style={{ background: '#231b42', border: `1px solid ${s.active ? s.color : '#2d1f54'}`, borderRadius: 8, padding: '12px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: s.color }} />
                    <span style={{ fontSize: 13, color: '#F5ECD7', fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9a8fbf', marginTop: 2 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 10, color: s.active ? '#7ec850' : '#3a2d5c' }}>{s.active ? '✓ Actif' : 'Inactif'}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: '#9a8fbf' }}>
              27 éléments UI skinnables · Upload les skins via l'onglet Assets → skins/provence/
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
