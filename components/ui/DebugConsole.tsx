'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { MONSTERS } from '@/data/monsters'

// DEBUG CONSOLE — Menu testeur pour debugger le jeu
// Accessible via triple-tap sur le nom du joueur dans TopBar
// Permet : teleportation, items, level, test boss, rapport bug

export default function DebugConsole({ onClose }: { onClose: () => void }) {
  const { transitionToScene, currentScene, playerClass, playerName } = useGameStore()
  const player = usePlayerStore()
  const [bugText, setBugText] = useState('')
  const [bugSent, setBugSent] = useState(false)
  const [tab, setTab] = useState<'teleport' | 'player' | 'combat' | 'bug'>('teleport')

  // Teleport to any scene
  const teleport = (scene: string, data?: Record<string, unknown>) => {
    transitionToScene(scene as any, data)
    onClose()
  }

  // Give items
  const giveItem = (id: string, qty: number) => {
    player.addToInventory(id, qty)
  }

  // Set level
  const setLevel = (lv: number) => {
    const xpNeeded = 50
    player.setStats({ level: lv, xp: 0, xpNext: Math.floor(xpNeeded * Math.pow(1.3, lv - 1)), hp: 100 + lv * 5, hpMax: 100 + lv * 5, atk: 10 + lv * 2, def: 5 + lv })
  }

  // Test specific boss
  const testBoss = (monsterId: string) => {
    const m = MONSTERS.find(mon => mon.id === monsterId)
    if (m) {
      transitionToScene('combat', { name: m.name, hp: m.hp, atk: m.atk, def: m.def, weakness: m.weakness, atbSpeed: m.atbSpeed, xp: m.xp })
      onClose()
    }
  }

  // Send bug report to Telegram
  const sendBug = async () => {
    if (!bugText.trim()) return
    const state = {
      scene: currentScene,
      class: playerClass,
      name: playerName,
      level: player.level,
      hp: `${player.hp}/${player.hpMax}`,
      sous: player.sous,
      fatigue: Math.round(player.fatigue),
      bag: player.bag.map(b => `${b.itemId}x${b.quantity}`).join(', ') || 'vide',
      spells: player.equippedSpells.map(s => s.spellId).join(', ') || 'aucun',
    }
    const msg = `BUG REPORT\n\n${bugText}\n\n--- ETAT ---\nScene: ${state.scene}\nClasse: ${state.class} (${state.name})\nNv.${state.level} | PV: ${state.hp}\nSous: ${state.sous} | Fatigue: ${state.fatigue}%\nSac: ${state.bag}\nSorts: ${state.spells}`

    try {
      await fetch('https://api.telegram.org/bot8745661004:AAGJffmkzEK6GfI0wfgVj0K8XboyWDpiCRY/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: '8064044229', text: msg })
      })
      setBugSent(true)
      setTimeout(() => { setBugSent(false); setBugText('') }, 2000)
    } catch { alert('Erreur envoi') }
  }

  const scenes = [
    { id: 'splash', label: 'Ecran titre', emoji: '🎮' },
    { id: 'tuto', label: 'Tutoriel', emoji: '📖' },
    { id: 'maison', label: 'Maison Melanie', emoji: '🏠' },
    { id: 'monde', label: 'Garrigue', emoji: '🌿', data: { biome: 'garrigue' } },
    { id: 'monde', label: 'Calanques', emoji: '🏖', data: { biome: 'calanques' } },
    { id: 'monde', label: 'Mines', emoji: '⛏', data: { biome: 'mines' } },
    { id: 'monde', label: 'Mer', emoji: '🌊', data: { biome: 'mer' } },
    { id: 'monde', label: 'Restanques', emoji: '🏔', data: { biome: 'restanques' } },
    { id: 'craft', label: 'Craft Salon', emoji: '✦', data: { atelier: 'salon' } },
    { id: 'craft', label: 'Craft Cuisine', emoji: '🍳', data: { atelier: 'cuisine' } },
    { id: 'craft', label: 'Craft Armurerie', emoji: '⚒', data: { atelier: 'armurerie' } },
    { id: 'commerce', label: 'Commerce', emoji: '💰' },
    { id: 'donjon', label: 'Donjon Demi-boss', emoji: '🏰', data: { type: 'demiboss', biome: 'garrigue' } },
    { id: 'donjon', label: 'Donjon Boss', emoji: '👑', data: { type: 'boss', biome: 'garrigue' } },
  ]

  const bosses = MONSTERS.filter(m => m.type.includes('Boss') || m.type.includes('boss') || m.type === 'Demi-boss')

  const items = [
    { id: 'potion_soin', name: 'Potion soin', qty: 5 },
    { id: 'herbe_med', name: 'Herbe med', qty: 10 },
    { id: 'antidote', name: 'Antidote', qty: 5 },
    { id: 'bois', name: 'Bois', qty: 10 },
    { id: 'pierre', name: 'Pierre', qty: 10 },
    { id: 'fer', name: 'Fer', qty: 5 },
    { id: 'graine', name: 'Graine', qty: 5 },
    { id: 'lavande', name: 'Lavande', qty: 5 },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, overflow: 'auto' }}
      onClick={onClose}>
      <div style={{ maxWidth: 400, margin: '20px auto', background: '#120e24', border: '2px solid #e91e8c', borderRadius: 16, padding: 16 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e91e8c' }}>Debug Console</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Etat actuel */}
        <div style={{ background: '#0a0818', borderRadius: 8, padding: 8, marginBottom: 10, fontSize: 10, color: '#9a8fbf' }}>
          Scene: <b style={{ color: '#ef9f27' }}>{currentScene}</b> | {playerClass} Nv.{player.level} | PV: {player.hp}/{player.hpMax} | Sous: {player.sous} | Fatigue: {Math.round(player.fatigue)}% | Sac: {player.bag.length}/{player.bagMaxSlots}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {(['teleport', 'player', 'combat', 'bug'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '6px 4px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
              background: tab === t ? '#e91e8c' : '#2d1f54', color: '#fff', border: 'none', fontWeight: tab === t ? 700 : 400,
            }}>{t === 'teleport' ? '🗺 Teleport' : t === 'player' ? '⚡ Joueur' : t === 'combat' ? '⚔ Boss' : '🐛 Bug'}</button>
          ))}
        </div>

        {/* TELEPORT */}
        {tab === 'teleport' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {scenes.map((s, i) => (
              <button key={i} onClick={() => teleport(s.id, s.data)} style={{
                padding: '8px 6px', background: '#231b42', border: '1px solid #3a2d5c', borderRadius: 8,
                color: '#F5ECD7', fontSize: 11, cursor: 'pointer', textAlign: 'left',
              }}>{s.emoji} {s.label}</button>
            ))}
          </div>
        )}

        {/* PLAYER */}
        {tab === 'player' && (
          <div>
            <div style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600, marginBottom: 6 }}>Niveau</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              {[1, 5, 10, 15, 20, 25, 30].map(lv => (
                <button key={lv} onClick={() => setLevel(lv)} style={{
                  padding: '4px 10px', background: player.level === lv ? '#e91e8c' : '#2d1f54',
                  border: 'none', borderRadius: 6, color: '#fff', fontSize: 10, cursor: 'pointer',
                }}>Nv.{lv}</button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600, marginBottom: 6 }}>Soin rapide</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              <button onClick={() => player.setStats({ hp: player.hpMax, fatigue: 0 })} style={{
                padding: '6px 12px', background: '#7ec850', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10, cursor: 'pointer',
              }}>Full PV + 0 Fatigue</button>
              <button onClick={() => player.addSous(1000)} style={{
                padding: '6px 12px', background: '#ef9f27', border: 'none', borderRadius: 6, color: '#fff', fontSize: 10, cursor: 'pointer',
              }}>+1000 Sous</button>
            </div>

            <div style={{ fontSize: 11, color: '#ef9f27', fontWeight: 600, marginBottom: 6 }}>Items</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {items.map(item => (
                <button key={item.id} onClick={() => giveItem(item.id, item.qty)} style={{
                  padding: '4px 8px', background: '#231b42', border: '1px solid #3a2d5c', borderRadius: 6,
                  color: '#F5ECD7', fontSize: 9, cursor: 'pointer',
                }}>{item.name} x{item.qty}</button>
              ))}
            </div>
          </div>
        )}

        {/* COMBAT TEST */}
        {tab === 'combat' && (
          <div>
            <div style={{ fontSize: 11, color: '#e24b4a', fontWeight: 600, marginBottom: 6 }}>Test Boss Direct</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bosses.map(m => (
                <button key={m.id} onClick={() => testBoss(m.id)} style={{
                  padding: '8px 10px', background: '#231b42', border: '1px solid #3a2d5c', borderRadius: 8,
                  color: '#F5ECD7', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: m.type.includes('Boss') ? '#e91e8c' : '#ef9f27' }}>{m.name}</span>
                  <span style={{ color: '#9a8fbf', fontSize: 9 }}>{m.biome} | PV:{m.hp} ATK:{m.atk}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BUG REPORT */}
        {tab === 'bug' && (
          <div>
            <div style={{ fontSize: 11, color: '#e24b4a', fontWeight: 600, marginBottom: 6 }}>Signaler un bug</div>
            <div style={{ fontSize: 9, color: '#9a8fbf', marginBottom: 6 }}>Decris le probleme. L etat du jeu (scene, PV, inventaire...) sera envoye automatiquement.</div>
            <textarea value={bugText} onChange={e => setBugText(e.target.value)} placeholder="Decris le bug ici..."
              style={{
                width: '100%', height: 80, background: '#0a0818', border: '1px solid #3a2d5c', borderRadius: 8,
                color: '#F5ECD7', padding: 8, fontSize: 12, resize: 'none', outline: 'none',
              }} />
            <button onClick={sendBug} disabled={bugSent} style={{
              marginTop: 6, width: '100%', padding: '10px', background: bugSent ? '#7ec850' : '#e24b4a',
              border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{bugSent ? 'Envoye sur Telegram !' : 'Envoyer le rapport'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
