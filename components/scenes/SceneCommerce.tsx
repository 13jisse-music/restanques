'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'

// Price tiers
const PRICE_TIERS: Record<string, number> = { Commun: 10, Base: 10, Avance: 50, Rare: 200, Legendaire: 500, Boss: 1000, Sumo: 150 }

interface ShopItem { id: string; name: string; emoji: string; tier: string; quantity: number }

// Sample items for demo
const JISSE_ITEMS: ShopItem[] = [
  { id: 'herbe_med', name: 'Herbe medicinale', emoji: '🌿', tier: 'Commun', quantity: 8 },
  { id: 'bois', name: 'Bois', emoji: '🪵', tier: 'Commun', quantity: 12 },
  { id: 'fer', name: 'Fer', emoji: '⬜', tier: 'Commun', quantity: 5 },
  { id: 'cuir', name: 'Cuir', emoji: '🟤', tier: 'Commun', quantity: 3 },
  { id: 'venin', name: 'Venin', emoji: '💚', tier: 'Avance', quantity: 2 },
]
const MELANIE_ITEMS: ShopItem[] = [
  { id: 'potion_soin', name: 'Potion de soin', emoji: '🧪', tier: 'Base', quantity: 4 },
  { id: 'sort_flamme', name: 'Sort Flamme', emoji: '🔥', tier: 'Commun', quantity: 1 },
  { id: 'epee_lavande', name: 'Epee de lavande', emoji: '⚔️', tier: 'Base', quantity: 1 },
]

export default function SceneCommerce() {
  const { transitionToScene } = useGameStore()
  const player = usePlayerStore()
  const [jItems, setJItems] = useState(JISSE_ITEMS)
  const [mItems, setMItems] = useState(MELANIE_ITEMS)
  const [log, setLog] = useState<string[]>([])
  const [discount, setDiscount] = useState<Record<string, number>>({})

  const getPrice = (item: ShopItem) => {
    const base = PRICE_TIERS[item.tier] || 10
    const disc = discount[item.id] || 0
    return Math.max(0, Math.floor(base * (1 - disc)))
  }

  const buyFromJisse = (item: ShopItem) => {
    const price = getPrice(item)
    setJItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0))
    setMItems(prev => { const ex = prev.find(i => i.id === item.id); if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { ...item, quantity: 1 }] })
    player.addSous(-price)
    setLog(prev => [...prev.slice(-4), `Melanie achete ${item.name} a Jisse pour ${price}S`])
  }

  const buyFromMelanie = (item: ShopItem) => {
    const price = getPrice(item)
    setMItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0))
    setJItems(prev => { const ex = prev.find(i => i.id === item.id); if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { ...item, quantity: 1 }] })
    player.addSous(price)
    setLog(prev => [...prev.slice(-4), `Jisse achete ${item.name} a Melanie pour ${price}S`])
  }

  const setItemDiscount = (id: string, d: number) => setDiscount(prev => ({ ...prev, [id]: d }))

  const ItemCard = ({ item, side, onBuy }: { item: ShopItem; side: 'jisse' | 'melanie'; onBuy: () => void }) => (
    <div style={{ background: '#2d2252', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 20 }}>{item.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#F5ECD7', fontWeight: 500 }}>{item.name}</div>
        <div style={{ fontSize: 9, color: '#9a8fbf' }}>x{item.quantity} | {getPrice(item)}S</div>
      </div>
      {side === 'melanie' && (
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 0.1, 0.5, 1].map(d => (
            <button key={d} onClick={() => setItemDiscount(item.id, d)} style={{
              padding: '2px 4px', fontSize: 8, borderRadius: 3, cursor: 'pointer',
              background: discount[item.id] === d ? '#e91e8c' : '#3a2d5c', color: '#fff', border: 'none',
            }}>{d === 0 ? 'x1' : d === 1 ? '🎁' : `-${d * 100}%`}</button>
          ))}
        </div>
      )}
      <button onClick={onBuy} style={{
        padding: '4px 10px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
        background: side === 'jisse' ? '#D4537E' : '#ef9f27', color: '#fff', border: 'none', fontWeight: 600,
      }}>{side === 'jisse' ? '← Acheter' : 'Acheter →'}</button>
    </div>
  )

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '1px solid #3a2d5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600 }}>💰 Comptoir</div>
          <div style={{ fontSize: 10, color: '#9a8fbf' }}>Sous : {player.sous}</div>
        </div>
        <button onClick={() => transitionToScene('maison')} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 8, padding: '6px 14px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>← Retour</button>
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex', gap: 8, padding: 12 }}>
        {/* Jisse side */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#ef9f27', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>⚔️ Jisse</div>
          {jItems.map(item => <ItemCard key={item.id} item={item} side="jisse" onBuy={() => buyFromJisse(item)} />)}
          {!jItems.length && <div style={{ fontSize: 11, color: '#9a8fbf', textAlign: 'center', padding: 20 }}>Rien a vendre</div>}
        </div>

        {/* Separator */}
        <div style={{ width: 2, background: '#3a2d5c', borderRadius: 1 }} />

        {/* Melanie side */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#D4537E', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>🎨 Melanie</div>
          {mItems.map(item => <ItemCard key={item.id} item={item} side="melanie" onBuy={() => buyFromMelanie(item)} />)}
          {!mItems.length && <div style={{ fontSize: 11, color: '#9a8fbf', textAlign: 'center', padding: 20 }}>Rien a vendre</div>}
        </div>
      </div>

      {/* Transaction log */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #3a2d5c' }}>
        <div style={{ fontSize: 10, color: '#9a8fbf', fontWeight: 500, marginBottom: 4 }}>Historique</div>
        {log.map((l, i) => <div key={i} style={{ fontSize: 10, color: '#7ec850', opacity: i < log.length - 1 ? 0.5 : 1 }}>{l}</div>)}
        {!log.length && <div style={{ fontSize: 10, color: '#3a2d5c' }}>Aucune transaction</div>}
      </div>
    </div>
  )
}
