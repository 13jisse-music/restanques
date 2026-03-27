'use client'

// CDC M2: 4 cartes permanentes + sort conditionnel
// Coup (⚔️), Défense (🛡️), Fuite (🏃), Potion (🧪)

interface CardProps {
  icon: string
  label: string
  sub: string
  color: string
  disabled?: boolean
  onClick: () => void
}

function Card({ icon, label, sub, color, disabled, onClick }: CardProps) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      flex: 1, background: disabled ? '#1a1232' : '#231b42',
      border: `2px solid ${disabled ? '#2d2252' : color}`,
      borderRadius: 10, padding: '8px 4px', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 2,
      boxShadow: disabled ? 'none' : `0 2px 8px ${color}33`,
      transition: 'transform 0.1s',
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#F5ECD7' }}>{label}</span>
      <span style={{ fontSize: 9, color }}>{sub}</span>
    </button>
  )
}

interface CardDeckProps {
  playerAtk: number
  onCoup: () => void
  onDefense: () => void
  onFuite: () => void
  onPotion: () => void
  onSpell?: () => void
  spellReady: boolean
  spellGauge: number
  disabled?: boolean
}

export default function CardDeck({ playerAtk, onCoup, onDefense, onFuite, onPotion, onSpell, spellReady, spellGauge, disabled }: CardDeckProps) {
  return (
    <div style={{ padding: '8px 12px 12px', background: '#231b42', borderTop: '1px solid #3a2d5c' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: spellReady ? 6 : 0 }}>
        <Card icon="⚔️" label="Coup" sub={`+${playerAtk}`} color="#e24b4a" disabled={disabled} onClick={onCoup} />
        <Card icon="🛡️" label="Déf" sub="-40%" color="#85B7EB" disabled={disabled} onClick={onDefense} />
        <Card icon="🏃" label="Fuite" sub="70%" color="#7ec850" disabled={disabled} onClick={onFuite} />
        <Card icon="🧪" label="Potion" sub="+30" color="#ef9f27" disabled={disabled} onClick={onPotion} />
      </div>
      {spellReady && onSpell && (
        <button onClick={disabled ? undefined : onSpell} style={{
          width: '100%', padding: '8px',
          background: '#7F77DD22', border: '2px solid #7F77DD',
          borderRadius: 10, color: '#7F77DD', fontSize: 12, fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer',
          boxShadow: '0 0 15px rgba(127,119,221,0.3)',
          animation: disabled ? 'none' : 'pulse 1s infinite',
        }}>
          ✦ Sort disponible ! ({spellGauge >= 4 ? `×${Math.floor(spellGauge / 2)} ` : ''}tap pour lancer)
        </button>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
    </div>
  )
}
