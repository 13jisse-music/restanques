'use client'

import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { SORTS } from '@/data/sorts'
import { EQUIPMENT } from '@/data/equipment'

interface CharacterSheetProps {
  onClose?: () => void
}

export default function CharacterSheet({ onClose }: CharacterSheetProps) {
  const { playerName, playerClass } = useGameStore()
  const player = usePlayerStore()

  const classLabel = playerClass === 'paladin' ? 'Le Paladin' : playerClass === 'artisane' ? "L'Artisane" : "L'Ombre"
  const classColor = playerClass === 'paladin' ? '#ef9f27' : playerClass === 'artisane' ? '#D4537E' : '#534AB7'
  const xpPct = player.xpNext > 0 ? (player.xp / player.xpNext) * 100 : 0

  const equippedSorts = player.equippedSpells.map(s => {
    const spell = SORTS.find(sp => sp.id === s.spellId)
    return { ...s, spell }
  })

  const equipSlots = (['arme', 'armure', 'casque', 'gants', 'bottes', 'amulette'] as const)

  const classEquipInfo = EQUIPMENT.map(e => ({
    slot: e.slot,
    desc: playerClass === 'paladin' ? e.paladin : playerClass === 'artisane' ? e.artisane : e.ombre,
  }))

  return (
    <div style={{
      background: '#1a1232', border: `2px solid ${classColor}`, borderRadius: 16,
      padding: 20, width: 340, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
      color: '#F5ECD7', fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: classColor }}>{playerName || 'Héros'}</div>
          <div style={{ fontSize: 12, color: '#9a8fbf', fontStyle: 'italic' }}>{classLabel}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef9f27' }}>Nv. {player.level}</div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8fbf', fontSize: 16, cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#9a8fbf', marginBottom: 2 }}>XP: {player.xp} / {player.xpNext}</div>
        <div style={{ height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${xpPct}%`, height: '100%', background: '#ef9f27', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: 13, fontWeight: 600, color: classColor, marginBottom: 6 }}>📊 Statistiques</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, marginBottom: 16 }}>
        <div>❤️ PV: <span style={{ color: '#7ec850' }}>{player.hp}/{player.hpMax}</span></div>
        <div>⚔️ ATK: <span style={{ color: '#ef9f27' }}>{player.atk}</span></div>
        <div>🛡️ DEF: <span style={{ color: '#5ba8ef' }}>{player.def}</span></div>
        <div>🍀 Chance: <span style={{ color: '#D4537E' }}>{player.luck}</span></div>
        <div>💰 Sous: <span style={{ color: '#ef9f27' }}>{player.sous}</span></div>
        <div>😴 Fatigue: <span style={{ color: player.fatigue > 70 ? '#e24b4a' : '#9a8fbf' }}>{Math.round(player.fatigue)}%</span></div>
      </div>

      {/* Equipment */}
      <div style={{ fontSize: 13, fontWeight: 600, color: classColor, marginBottom: 6 }}>⚔️ Équipement</div>
      <div style={{ fontSize: 11, marginBottom: 16 }}>
        {equipSlots.map(slot => {
          const equipped = player.equipment[slot]
          const info = classEquipInfo.find(e => e.slot.toLowerCase() === slot)
          return (
            <div key={slot} style={{ padding: '4px 0', borderBottom: '1px solid #2d1f54', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9a8fbf', textTransform: 'capitalize' }}>{slot}</span>
              <span style={{ color: equipped ? '#ef9f27' : '#3a2d5c' }}>
                {equipped ? `${equipped.itemId} (Nv.${equipped.level})` : info?.desc || '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Spells */}
      <div style={{ fontSize: 13, fontWeight: 600, color: classColor, marginBottom: 6 }}>✨ Sorts équipés</div>
      <div style={{ fontSize: 11, marginBottom: 16 }}>
        {equippedSorts.length === 0 ? (
          <div style={{ color: '#3a2d5c', fontStyle: 'italic' }}>Aucun sort — Craft-en au Salon !</div>
        ) : equippedSorts.map((s, i) => (
          <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #2d1f54', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: s.spell?.color === 'Rouge' ? '#e24b4a' : s.spell?.color === 'Bleu' ? '#5ba8ef' : s.spell?.color === 'Blanc' ? '#F5ECD7' : '#534AB7' }}>
              {s.spell?.name || s.spellId}
            </span>
            <span style={{ color: '#9a8fbf', fontSize: 10 }}>
              Slot {s.slot} · {s.usesRemaining === null ? '∞' : `${s.usesRemaining} uses`}
            </span>
          </div>
        ))}
      </div>

      {/* Inventory summary */}
      <div style={{ fontSize: 13, fontWeight: 600, color: classColor, marginBottom: 6 }}>🎒 Inventaire ({player.bag.length}/{player.bagMaxSlots})</div>
      <div style={{ fontSize: 11 }}>
        {player.bag.length === 0 ? (
          <div style={{ color: '#3a2d5c', fontStyle: 'italic' }}>Sac vide</div>
        ) : player.bag.map((item, i) => (
          <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #2d1f54' }}>
            {item.itemId} <span style={{ color: '#9a8fbf' }}>x{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
