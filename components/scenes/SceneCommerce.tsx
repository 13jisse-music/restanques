'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore, InventoryItem } from '@/store/playerStore'
import { isDay } from '@/lib/dayNightCycle'
import { playPlaceholderSound } from '@/lib/assetLoader'

// CDC M5: Commerce — dual inventory, NPC visitors, satisfaction, pricing

const PRICE_TIERS: Record<string, number> = { Commun: 10, Base: 10, Avance: 50, Rare: 200, Legendaire: 500, Boss: 1000, Sumo: 150 }

// Item → tier mapping (simplified)
const ITEM_TIERS: Record<string, string> = {
  herbe: 'Commun', herbe_med: 'Commun', bois: 'Commun', pierre: 'Commun', fer: 'Commun',
  cuir: 'Commun', lavande: 'Commun', graine: 'Commun', plume: 'Commun', baie: 'Commun',
  venin: 'Avance', cristal: 'Avance', corail: 'Avance', perle: 'Avance',
  potion_soin: 'Base', potion_force: 'Base', antidote: 'Base',
  flamme: 'Commun', soin: 'Commun', epee_lavande: 'Base',
  potion_soin_plus: 'Avance', boule_feu: 'Rare', blizzard: 'Rare',
}

// NPC visitor demand (random items they want to buy)
const VISITOR_DEMANDS = [
  { name: 'Fermier', wants: ['potion_soin', 'antidote'], emoji: '👨‍🌾' },
  { name: 'Marchand', wants: ['lavande', 'herbe_med', 'baie'], emoji: '🧔' },
  { name: 'Aventurier', wants: ['flamme', 'potion_force', 'epee_lavande'], emoji: '🗡️' },
  { name: 'Herboriste', wants: ['herbe', 'herbe_med', 'champignon'], emoji: '🌿' },
  { name: 'Forgeron', wants: ['fer', 'bois', 'cuir'], emoji: '⚒️' },
]

function getItemPrice(itemId: string, discount = 0): number {
  const tier = ITEM_TIERS[itemId] || 'Commun'
  return Math.max(1, Math.floor((PRICE_TIERS[tier] || 10) * (1 - discount)))
}

export default function SceneCommerce() {
  const { transitionToScene, dayNightCycle } = useGameStore()
  const player = usePlayerStore()
  const [log, setLog] = useState<string[]>([])
  const [discount, setDiscount] = useState<Record<string, number>>({})

  // CDC M5: NPC visitor (daytime only, every 3-8 min game time)
  const [visitor, setVisitor] = useState<typeof VISITOR_DEMANDS[0] | null>(null)
  const [visitorTimer, setVisitorTimer] = useState(0)

  useEffect(() => {
    if (!isDay(dayNightCycle)) { setVisitor(null); return }
    const interval = setInterval(() => {
      setVisitorTimer(t => {
        if (t <= 0) {
          // Spawn new visitor
          const v = VISITOR_DEMANDS[Math.floor(Math.random() * VISITOR_DEMANDS.length)]
          setVisitor(v)
          return 180 + Math.floor(Math.random() * 300) // 3-8 min
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [dayNightCycle])

  const sellToVisitor = (itemId: string) => {
    if (!visitor) return
    const price = getItemPrice(itemId) * 1.2 // Visitors pay +20%
    if (player.removeFromInventory(itemId, 1)) {
      player.addSous(Math.floor(price))
      setLog(prev => [...prev.slice(-4), `${visitor.emoji} ${visitor.name} achète ${itemId} pour ${Math.floor(price)}S`])
      playPlaceholderSound('chest')
      player.addXp(5)
      // Visitor satisfied → leaves
      setVisitor(null)
      setVisitorTimer(120 + Math.floor(Math.random() * 180))
    }
  }

  const sellItem = (itemId: string) => {
    const price = getItemPrice(itemId, discount[itemId] || 0)
    if (player.removeFromInventory(itemId, 1)) {
      player.addSous(price)
      setLog(prev => [...prev.slice(-4), `Vendu ${itemId} pour ${price}S`])
      playPlaceholderSound('chest')
    }
  }

  const buyItem = (itemId: string) => {
    const price = getItemPrice(itemId)
    if (player.sous >= price) {
      player.addSous(-price)
      player.addToInventory(itemId, 1)
      setLog(prev => [...prev.slice(-4), `Acheté ${itemId} pour ${price}S`])
    }
  }

  return (
    <div style={{ width: '100%', height: '100dvh', background: '#1a1232', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#231b42', borderBottom: '1px solid #3a2d5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600 }}>💰 Comptoir</div>
          <div style={{ fontSize: 10, color: '#9a8fbf' }}>Sous : {player.sous} · {player.bag.length}/{player.bagMaxSlots} objets</div>
        </div>
        <button onClick={() => transitionToScene('maison')} style={{ background: '#2d2252', border: '1px solid #3a2d5c', borderRadius: 8, padding: '6px 14px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer' }}>← Retour</button>
      </div>

      {/* CDC M5: NPC Visitor */}
      {visitor && (
        <div style={{ margin: '8px 12px', padding: '10px 14px', background: '#7ec85022', border: '1px solid #7ec850', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#7ec850', fontWeight: 600 }}>{visitor.emoji} Visiteur : {visitor.name}</div>
          <div style={{ fontSize: 10, color: '#9a8fbf', marginTop: 2 }}>Cherche : {visitor.wants.join(', ')}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {visitor.wants.map(w => {
              const has = player.bag.find(b => b.itemId === w)
              return (
                <button key={w} onClick={() => has && sellToVisitor(w)} disabled={!has} style={{
                  padding: '4px 10px', fontSize: 10, borderRadius: 6, cursor: has ? 'pointer' : 'default',
                  background: has ? '#7ec850' : '#3a2d5c', color: '#fff', border: 'none',
                  opacity: has ? 1 : 0.4,
                }}>
                  {w} ({Math.floor(getItemPrice(w) * 1.2)}S)
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Inventory — sell */}
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 12, color: '#ef9f27', fontWeight: 600, marginBottom: 6 }}>🎒 Mon inventaire — vendre</div>
        {player.bag.length === 0 ? (
          <div style={{ fontSize: 11, color: '#3a2d5c', textAlign: 'center', padding: 16 }}>Sac vide</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {player.bag.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#231b42', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: '#F5ECD7', flex: 1 }}>{item.itemId} <span style={{ color: '#9a8fbf' }}>x{item.quantity}</span></span>
                <span style={{ fontSize: 10, color: '#ef9f27' }}>{getItemPrice(item.itemId)}S</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0, 0.1, 0.5, 1].map(d => (
                    <button key={d} onClick={() => setDiscount(prev => ({ ...prev, [item.itemId]: d }))} style={{
                      padding: '2px 4px', fontSize: 7, borderRadius: 3, cursor: 'pointer',
                      background: (discount[item.itemId] || 0) === d ? '#e91e8c' : '#3a2d5c', color: '#fff', border: 'none',
                    }}>{d === 0 ? 'x1' : d === 1 ? '🎁' : `-${d * 100}%`}</button>
                  ))}
                </div>
                <button onClick={() => sellItem(item.itemId)} style={{
                  padding: '4px 10px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
                  background: '#ef9f27', color: '#fff', border: 'none', fontWeight: 600,
                }}>Vendre</button>
              </div>
            ))}
          </div>
        )}
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
