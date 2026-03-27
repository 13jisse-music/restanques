'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { calculateDamage, calculateXP, checkSoloCombo } from '@/lib/combatEngine'
import { playSound } from '@/lib/assetLoader'

type CombatPhase = 'fighting' | 'victory' | 'defeat' | 'flee'

export default function SceneCombat() {
  const { sceneData, transitionToScene, previousScene } = useGameStore()
  const player = usePlayerStore()
  const combat = useCombatStore()

  // Combat state
  const [phase, setPhase] = useState<CombatPhase>('fighting')
  const [monsterHp, setMonsterHp] = useState(100)
  const [monsterMaxHp, setMonsterMaxHp] = useState(100)
  const [monsterAtb, setMonsterAtb] = useState(0)
  const [monsterAtbSpeed, setMonsterAtbSpeed] = useState(3)
  const [monsterAtk, setMonsterAtk] = useState(10)
  const [monsterDef, setMonsterDef] = useState(5)
  const [monsterName, setMonsterName] = useState('Monstre')
  const [monsterWeakness, setMonsterWeakness] = useState('Feu')
  const [monsterXp, setMonsterXp] = useState(20)

  const [spellGauge, setSpellGauge] = useState(0)
  const [isDefending, setIsDefending] = useState(false)
  const [consecutiveActions, setConsecutiveActions] = useState<string[]>([])
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [shaking, setShaking] = useState(false)
  const [playerFlash, setPlayerFlash] = useState('')
  const [monsterFlash, setMonsterFlash] = useState('')
  const [playerAnim, setPlayerAnim] = useState('')
  const [comboText, setComboText] = useState('')
  const [bossSpecialGauge, setBossSpecialGauge] = useState(0)
  const [bossSpecialActive, setBossSpecialActive] = useState(false)
  const [bossAttackCount, setBossAttackCount] = useState(0)

  const atbRef = useRef<ReturnType<typeof requestAnimationFrame>>(0)
  const lastTimeRef = useRef(0)

  // Init combat from sceneData
  useEffect(() => {
    const d = sceneData as Record<string, unknown> | null
    if (d) {
      setMonsterHp(d.hp as number || 50)
      setMonsterMaxHp(d.hp as number || 50)
      setMonsterAtk(d.atk as number || 10)
      setMonsterDef(d.def as number || 5)
      setMonsterName(d.name as string || 'Monstre')
      setMonsterWeakness(d.weakness as string || 'Feu')
      setMonsterAtbSpeed(d.atbSpeed as number || 3)
      setMonsterXp(d.xp as number || 20)
    }
  }, [sceneData])

  // ATB loop
  useEffect(() => {
    if (phase !== 'fighting') return
    let running = true
    function tick(time: number) {
      if (!running) return
      if (lastTimeRef.current) {
        const delta = (time - lastTimeRef.current) / 1000
        // Pause ATB during animations (shaking, combo text)
        if (shaking || comboText) { lastTimeRef.current = time; atbRef.current = requestAnimationFrame(tick); return }
        setMonsterAtb(prev => {
          const next = prev + delta / monsterAtbSpeed
          if (next >= 1) {
            monsterAttacks()
            return 0
          }
          return next
        })
      }
      lastTimeRef.current = time
      atbRef.current = requestAnimationFrame(tick)
    }
    atbRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(atbRef.current) }
  }, [phase, monsterAtbSpeed])

  const addLog = (msg: string) => setCombatLog(prev => [...prev.slice(-4), msg])

  // Boss special mechanics
  const isBoss = monsterHp > 300
  const bossName = monsterName.toLowerCase()

  // Monster attacks player
  const monsterAttacks = useCallback(() => {
    let atkMult = 1
    let specialMsg = ''
    const count = bossAttackCount + 1
    setBossAttackCount(count)

    // Boss special abilities
    if (isBoss) {
      // Sanglier: charge tous les 3 coups (x3 dmg + stun)
      if (bossName.includes('sanglier') && count % 3 === 0) {
        atkMult = 3; specialMsg = '🐗 CHARGE ! Degats x3 !'
        setBossSpecialActive(true); setTimeout(() => setBossSpecialActive(false), 1000)
      }
      // Mouette: debuff toutes les 4 attaques (-20% ATK)
      if (bossName.includes('mouette') && count % 4 === 0) {
        specialMsg = '🦅 CRI DE TEMPETE ! ATK -20% 2 tours'
      }
      // Tarasque: carapace aleatoire (DEF x3)
      if (bossName.includes('tarasque') && Math.random() < 0.25) {
        specialMsg = '🐢 CARAPACE ! DEF x3 pendant 2 tours'
        setBossSpecialActive(true); setTimeout(() => setBossSpecialActive(false), 2000)
      }
      // Kraken: invoque tentacules
      if (bossName.includes('kraken') && count % 5 === 0) {
        specialMsg = '🦑 TENTACULES ! 2 mini-monstres invoques'
      }
      // Mistral: change element
      if (bossName.includes('mistral') && count % 3 === 0) {
        const elements = ['Feu', 'Eau', 'Lumiere', 'Ombre']
        const newElem = elements[Math.floor(Math.random() * elements.length)]
        specialMsg = '🌪 CHANGEMENT ! Element: ' + newElem
      }
      // Mistral phase 2 (<50% PV)
      if (bossName.includes('mistral') && monsterHp < monsterMaxHp * 0.5) {
        atkMult *= 1.5
      }
    }

    if (specialMsg) { setComboText(specialMsg); setTimeout(() => setComboText(''), 2000) }

    const result = calculateDamage(Math.floor(monsterAtk * atkMult), player.def, 1, false, 0, '', '', isDefending)
    player.takeDamage(result.damage)
    setIsDefending(false)

    if (result.isMiss) {
      addLog('Le monstre rate !')
      setPlayerAnim('dodge')
    } else if (result.isCritical) {
      addLog(`CRITIQUE ! -${result.damage} PV`)
      setShaking(true); setTimeout(() => setShaking(false), 200)
      setPlayerFlash('red'); setTimeout(() => setPlayerFlash(''), 150)
    } else {
      addLog(`Le monstre attaque : -${result.damage} PV`)
      setPlayerFlash('red'); setTimeout(() => setPlayerFlash(''), 150)
    }
    playSound('/sfx/sfx_hit.mp3', 'hit')

    if (player.hp - result.damage <= 0) {
      setPhase('defeat')
    }
  }, [monsterAtk, player, isDefending])

  // Player actions
  const playCard = (action: string) => {
    if (phase !== 'fighting') return

    const newActions = [...consecutiveActions, action]
    setConsecutiveActions(newActions)

    switch (action) {
      case 'coup': {
        const result = calculateDamage(player.atk, monsterDef, 1, false, 0, '', monsterWeakness, false)
        setMonsterHp(prev => {
          const next = Math.max(0, prev - result.damage)
          if (next <= 0) setTimeout(() => setPhase('victory'), 300)
          return next
        })
        setSpellGauge(prev => Math.min(6, prev + 1))
        setMonsterFlash('red'); setTimeout(() => setMonsterFlash(''), 150)
        playSound('/sfx/sfx_hit.mp3', 'hit')

        if (result.isCritical) addLog(`CRITIQUE ! ${result.damage} dégâts !`)
        else if (result.isMiss) addLog('Raté !')
        else addLog(`Coup : ${result.damage} dégâts`)

        // Solo combo check
        const solo = checkSoloCombo(newActions)
        if (solo) {
          setComboText(solo.name + ' !'); setTimeout(() => setComboText(''), 1500)
          addLog(`COMBO : ${solo.name} !`)
        }
        break
      }
      case 'defense':
        setIsDefending(true)
        setSpellGauge(prev => Math.min(6, prev + 1))
        setPlayerFlash('blue'); setTimeout(() => setPlayerFlash(''), 150)
        addLog('Défense active (-40% dégâts)')
        playSound('/sfx/sfx_defend.mp3', 'defend')
        break
      case 'fuite': {
        const success = Math.random() < 0.7
        if (success) {
          addLog('Fuite réussie !')
          setPhase('flee')
          playSound('/sfx/sfx_flee.mp3', 'flee')
        } else {
          addLog('Fuite échouée ! Le monstre attaque !')
          monsterAttacks()
        }
        break
      }
      case 'potion':
        player.heal(30)
        addLog('Potion : +30 PV')
        setPlayerFlash('green'); setTimeout(() => setPlayerFlash(''), 200)
        playSound('/sfx/sfx_potion.mp3', 'potion')
        break
    }
  }

  // End combat
  const endCombat = () => {
    if (phase === 'victory') {
      const xp = calculateXP(monsterXp, player.level, 1)
      player.addXp(xp)
      player.addSous(Math.floor(5 + monsterXp * 0.3))
      player.addFatigue(0.5) // fatigue de combat
      playSound('/sfx/sfx_levelup.mp3', 'levelup')
    }
    if (phase === 'defeat') {
      player.respawn()
      player.addSous(-Math.floor(player.sous * 0.1))
    }
    transitionToScene(previousScene === 'maison' ? 'maison' : 'monde')
  }

  // Card component
  const Card = ({ icon, label, sub, color, disabled, onClick }: {
    icon: string; label: string; sub: string; color: string; disabled?: boolean; onClick: () => void
  }) => (
    <button onClick={disabled ? undefined : onClick} style={{
      flex: 1, background: disabled ? '#1a1232' : '#231b42', border: `2px solid ${disabled ? '#2d2252' : color}`,
      borderRadius: 10, padding: '8px 4px', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      boxShadow: disabled ? 'none' : `0 2px 8px ${color}33`,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#F5ECD7' }}>{label}</span>
      <span style={{ fontSize: 9, color }}>{sub}</span>
    </button>
  )

  // HP bar
  const HpBar = ({ hp, max, color }: { hp: number; max: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1, height: 8, background: '#3a2d5c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, (hp / max) * 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#9a8fbf', minWidth: 30 }}>{Math.max(0, hp)}</span>
    </div>
  )

  const spellReady = spellGauge >= 2

  return (
    <div style={{
      width: '100%', height: '100dvh', background: '#1a1232', display: 'flex', flexDirection: 'column',
      animation: shaking ? 'shake 0.2s ease-in-out' : undefined,
    }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-30px)} }
      `}</style>

      {/* Top bar */}
      <div style={{ padding: '6px 12px', background: '#231b42', borderBottom: '1px solid #3a2d5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#D4537E', fontWeight: 600 }}>Nv.{player.level}</div>
          <HpBar hp={player.hp} max={player.hpMax} color="#7ec850" />
        </div>
        <div style={{ padding: '0 12px', fontSize: 10, color: '#9a8fbf' }}>VS</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#e24b4a', fontWeight: 600 }}>{monsterName}</div>
          <HpBar hp={monsterHp} max={monsterMaxHp} color="#e24b4a" />
        </div>
      </div>

      {/* ATB bar */}
      <div style={{ padding: '4px 12px', background: '#1a1232' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: '#9a8fbf' }}>ATB</span>
          <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${monsterAtb * 100}%`, height: '100%', background: `linear-gradient(90deg, #ef9f27, #e24b4a)`, borderRadius: 3, transition: 'width 0.1s linear' }} />
          </div>
          <span style={{ fontSize: 9, color: '#ef9f27' }}>{Math.floor(monsterAtb * 100)}%</span>
        </div>
      </div>

      {/* Battle zone */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px', position: 'relative' }}>
        {/* Player sprite placeholder */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#D4537E',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          border: '3px solid #fff', boxShadow: playerFlash ? `0 0 20px ${playerFlash}` : '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.1s',
        }}>⚔️</div>

        {/* VS text */}
        <div style={{ fontSize: 14, color: '#3a2d5c', fontWeight: 700 }}>VS</div>

        {/* Monster sprite placeholder */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: monsterHp <= 0 ? '#333' : '#e24b4a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          border: '3px solid #fff', boxShadow: monsterFlash ? `0 0 20px ${monsterFlash}` : '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'all 0.3s', opacity: monsterHp <= 0 ? 0.3 : 1,
          transform: monsterHp <= 0 ? 'scale(0.5) rotate(15deg)' : 'none',
        }}>👹</div>

        {/* Combo text */}
        {comboText && (
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
            fontSize: 20, fontWeight: 700, color: '#ef9f27', textShadow: '0 0 10px rgba(239,159,39,0.8)',
            animation: 'floatUp 1.5s ease-out forwards',
          }}>{comboText}</div>
        )}
      </div>

      {/* Combat log */}
      <div style={{ padding: '4px 12px', maxHeight: 50, overflow: 'hidden' }}>
        {combatLog.slice(-2).map((msg, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9a8fbf', opacity: i === 0 ? 0.5 : 1 }}>{msg}</div>
        ))}
      </div>

      {/* Spell gauge */}
      <div style={{ padding: '4px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: '#7F77DD' }}>Sorts</span>
          <div style={{ flex: 1, height: 6, background: '#3a2d5c', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(spellGauge / 6) * 100}%`, height: '100%', background: '#7F77DD', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 9, color: '#7F77DD' }}>{spellGauge}/6</span>
        </div>
      </div>

      {/* Cards */}
      {phase === 'fighting' && (
        <div style={{ padding: '8px 12px 12px', background: '#231b42', borderTop: '1px solid #3a2d5c' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: spellReady ? 6 : 0 }}>
            <Card icon="⚔️" label="Coup" sub={`+${player.atk} dmg`} color="#e24b4a" onClick={() => playCard('coup')} />
            <Card icon="🛡️" label="Déf" sub="-40%" color="#85B7EB" onClick={() => playCard('defense')} />
            <Card icon="🏃" label="Fuite" sub="70%" color="#7ec850" onClick={() => playCard('fuite')} />
            <Card icon="🧪" label="Potion" sub="+30 PV" color="#ef9f27" onClick={() => playCard('potion')} />
          </div>
          {spellReady && (
            <button onClick={() => {
              setSpellGauge(prev => prev - 2)
              const result = calculateDamage(0, monsterDef, 1, true, 25, 'Feu', monsterWeakness, false)
              setMonsterHp(prev => {
                const next = Math.max(0, prev - result.damage)
                if (next <= 0) setTimeout(() => setPhase('victory'), 300)
                return next
              })
              setMonsterFlash('#7F77DD'); setTimeout(() => setMonsterFlash(''), 200)
              addLog(`Sort : ${result.damage} dégâts !${result.isElementBonus ? ' (bonus élémentaire !)' : ''}`)
              setConsecutiveActions(prev => [...prev, 'sort'])
              playSound('/sfx/sfx_spell.mp3', 'spell')
            }} style={{
              width: '100%', padding: '8px', background: '#7F77DD22', border: '2px solid #7F77DD',
              borderRadius: 10, color: '#7F77DD', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 15px rgba(127,119,221,0.3)', animation: 'pulse 1s infinite',
            }}>
              ✦ Sort disponible ! (Flamme — {spellGauge >= 4 ? '×' + Math.floor(spellGauge / 2) : ''} tap pour lancer)
            </button>
          )}
        </div>
      )}

      {/* Victory / Defeat screens */}
      {(phase === 'victory' || phase === 'defeat' || phase === 'flee') && (
        <div style={{
          padding: '20px', background: '#231b42', borderTop: '1px solid #3a2d5c',
          textAlign: 'center',
        }}>
          {phase === 'victory' && (() => {
            const xp = calculateXP(monsterXp, player.level, 1)
            const sous = Math.floor(5 + monsterXp * 0.3)
            // Simple loot based on monster
            const loots = ['Herbe', 'Cuir', 'Bois', 'Pierre', 'Fer', 'Plume', 'Graine']
            const loot1 = loots[Math.floor(Math.random() * loots.length)]
            const loot2 = Math.random() > 0.6 ? loots[Math.floor(Math.random() * loots.length)] : null
            return <>
              <div style={{ fontSize: 18, color: '#7ec850', fontWeight: 700 }}>Victoire !</div>
              <div style={{ fontSize: 13, color: '#ef9f27', marginTop: 6 }}>+{xp} XP</div>
              <div style={{ fontSize: 13, color: '#C9A84C', marginTop: 2 }}>+{sous} Sous</div>
              <div style={{ fontSize: 12, color: '#7ec850', marginTop: 4 }}>
                Loot : {loot1} x1{loot2 ? ` + ${loot2} x1` : ''}
              </div>
            </>
          })()}
          {phase === 'defeat' && (
            <>
              <div style={{ fontSize: 18, color: '#e24b4a', fontWeight: 700 }}>Défaite...</div>
              <div style={{ fontSize: 12, color: '#9a8fbf', marginTop: 4 }}>Retour à la maison. -10% Sous.</div>
            </>
          )}
          {phase === 'flee' && (
            <div style={{ fontSize: 14, color: '#7ec850' }}>Fuite réussie !</div>
          )}
          <button onClick={endCombat} style={{
            marginTop: 12, padding: '10px 32px', background: '#e91e8c', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Continuer</button>
        </div>
      )}
    </div>
  )
}
