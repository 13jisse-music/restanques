'use client'

// CDC M2: 4 cartes permanentes + sorts en main (max 3)
// Badges visuels: ATK rouge, DEF bleu, RUN vert, xN potion

interface CardProps {
  icon: string
  label: string
  badge: string
  badgeColor: string
  sub: string
  color: string
  disabled?: boolean
  onClick: () => void
}

function Card({ icon, label, badge, badgeColor, sub, color, disabled, onClick }: CardProps) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      flex: 1, background: disabled ? '#1a1232' : '#231b42',
      border: `2px solid ${disabled ? '#2d2252' : color}`,
      borderRadius: 10, padding: '6px 4px', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 1, position: 'relative',
      boxShadow: disabled ? 'none' : `0 2px 8px ${color}33`,
    }}>
      {/* CDC M2: Badge visuel */}
      <span style={{
        position: 'absolute', top: -4, right: -4, fontSize: 8, fontWeight: 700,
        background: badgeColor, color: '#fff', padding: '1px 4px', borderRadius: 6,
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
      }}>{badge}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: '#F5ECD7' }}>{label}</span>
      <span style={{ fontSize: 8, color }}>{sub}</span>
    </button>
  )
}

// Spell element colors
const SPELL_COLORS: Record<string, string> = {
  flamme: '#e24b4a', boule_feu: '#e24b4a', meteore: '#e24b4a', brasier: '#e24b4a',
  vague: '#85B7EB', blizzard: '#85B7EB', tsunami: '#85B7EB',
  soin: '#7ec850', bouclier_divin: '#C9A84C', resurrection: '#C9A84C', lumiere: '#F5ECD7',
  poison: '#534AB7', vol_vie: '#534AB7', neant: '#2d1f54',
}

const SPELL_NAMES: Record<string, string> = {
  flamme: 'Flamme', boule_feu: 'Boule feu', meteore: 'Meteore', brasier: 'Brasier',
  vague: 'Vague', blizzard: 'Blizzard', tsunami: 'Tsunami',
  soin: 'Soin', bouclier_divin: 'Bouclier', resurrection: 'Resurrect', lumiere: 'Lumiere',
  poison: 'Poison', vol_vie: 'Vol vie', neant: 'Neant',
}

interface CardDeckProps {
  playerAtk: number
  onCoup: () => void
  onDefense: () => void
  onFuite: () => void
  onPotion: () => void
  onSpell?: (idx?: number) => void
  spellReady: boolean
  spellGauge: number
  potionCount?: number
  spellHand?: string[]
  playerThreat?: number
  stamina?: number
  staminaCosts?: Record<string, number>
  disabled?: boolean
}

export default function CardDeck({ playerAtk, onCoup, onDefense, onFuite, onPotion, onSpell, spellReady, spellGauge, potionCount = 0, spellHand = [], playerThreat = 0, stamina = 999, staminaCosts = {}, disabled }: CardDeckProps) {
  const noPotions = potionCount <= 0
  const noStamina = (action: string) => stamina < (staminaCosts[action] || 0)

  return (
    <div style={{ padding: '6px 12px 10px', background: '#231b42', borderTop: '1px solid #3a2d5c' }}>
      {/* 4 cartes permanentes */}
      <div style={{ display: 'flex', gap: 5, marginBottom: spellHand.length > 0 ? 6 : 0 }}>
        <Card icon="⚔️" label="Coup" badge={`${staminaCosts.coup||20}`} badgeColor={noStamina('coup') ? '#666' : '#4a90c4'} sub={`+${playerAtk}`} color="#e24b4a" disabled={disabled || noStamina('coup')} onClick={onCoup} />
        <Card icon="🛡️" label="Def" badge={`${staminaCosts.defense||10}`} badgeColor={noStamina('defense') ? '#666' : '#4a90c4'} sub="-40%" color="#85B7EB" disabled={disabled || noStamina('defense')} onClick={onDefense} />
        <Card icon="🏃" label="Fuite" badge={`${staminaCosts.fuite||15}`} badgeColor={noStamina('fuite') ? '#666' : '#4a90c4'} sub="70%" color="#7ec850" disabled={disabled || noStamina('fuite')} onClick={onFuite} />
        <Card icon="🧪" label="Potion" badge={noPotions ? '0' : `x${potionCount}`} badgeColor={noPotions || noStamina('potion') ? '#666' : '#ef9f27'} sub={noPotions ? 'vide' : '+30'} color="#ef9f27" disabled={disabled || noPotions || noStamina('potion')} onClick={onPotion} />
      </div>

      {/* CDC M2: Sorts en main (max 3 cartes sort) */}
      {spellHand.length > 0 && (
        <div style={{ display: 'flex', gap: 5 }}>
          {spellHand.map((spellId, i) => {
            const color = SPELL_COLORS[spellId] || '#7F77DD'
            const name = SPELL_NAMES[spellId] || spellId
            return (
              <button key={i} onClick={disabled ? undefined : () => onSpell?.(i)} style={{
                flex: 1, padding: '6px 4px',
                background: color + '22', border: `2px solid ${color}`,
                borderRadius: 10, color, fontSize: 11, fontWeight: 600,
                cursor: disabled ? 'default' : 'pointer',
                boxShadow: `0 0 12px ${color}44`,
                animation: disabled ? 'none' : 'spellGlow 1.5s infinite',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <span>{name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Jauge info */}
      {spellHand.length === 0 && spellGauge > 0 && (
        <div style={{ fontSize: 9, color: '#534AB7', textAlign: 'center', marginTop: 2 }}>
          Jauge sort: {spellGauge}/6 (sort a 2)
        </div>
      )}

      <style>{`@keyframes spellGlow { 0%,100%{box-shadow:0 0 8px var(--glow,#7F77DD44)} 50%{box-shadow:0 0 16px var(--glow,#7F77DD66)} }`}</style>
    </div>
  )
}
