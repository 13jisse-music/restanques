'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { calculateDamage, calculateXP, checkSoloCombo } from '@/lib/combatEngine'
import { playSound } from '@/lib/assetLoader'
import { triggerBossBefore, triggerBossAfter, triggerStory, isStorySeen, getBossStoryMap } from '@/lib/storyEngine'
import { markBossDefeated } from '@/lib/biomeLoader'
import ATBBar from '@/components/combat/ATBBar'
import BattleField from '@/components/combat/BattleField'
import CardDeck from '@/components/combat/CardDeck'
import SpellGauge from '@/components/combat/SpellGauge'
import { MONSTERS } from '@/data/monsters'

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
  const [comboWindowActive, setComboWindowActive] = useState(false)
  const comboWindowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [comboCountdown, setComboCountdown] = useState(0) // CDC M2: visual 2s countdown

  // CDC M2: Boss debuff tracking
  const [mouetteDebuffTurns, setMouetteDebuffTurns] = useState(0)
  const [tarasqueArmorTurns, setTarasqueArmorTurns] = useState(0)
  const [krakenTentacles, setKrakenTentacles] = useState(0)

  // CDC M2: Threat tracking (coop)
  const [playerThreat, setPlayerThreat] = useState(0)

  // CDC M2: Mystery rider Quentin
  const [mysteryRiderActive, setMysteryRiderActive] = useState(false)

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

      // M6: Story trigger before boss/demi-boss combat (one-time)
      const name = d.name as string || ''
      const beforeStoryId = triggerBossBefore(name)
      if (beforeStoryId) {
        // Redirect to story, which will come back to combat after
        transitionToScene('story', { storyId: beforeStoryId, nextScene: 'combat', ...d })
      }
      // CDC M2: Mystery rider Quentin (10% chance)
      if (Math.random() < 0.1) {
        setTimeout(() => {
          setMysteryRiderActive(true)
          setComboText('🌙 Cavalier Mystère !')
          // Auto-play poison card
          const poisonDmg = Math.floor(5 + (player.luck * 0.5))
          setMonsterHp(prev => Math.max(0, prev - poisonDmg * 3))
          addLog(`L'Ombre frappe ! Poison ${poisonDmg}×3 = ${poisonDmg * 3} dégâts`)
          setTimeout(() => { setMysteryRiderActive(false); setComboText('') }, 2000)
        }, 5000 + Math.random() * 10000)
      }
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
      // Mouette: debuff toutes les 4 attaques (-20% ATK pendant 2 tours)
      if (bossName.includes('mouette') && count % 4 === 0) {
        specialMsg = '🦅 CRI DE TEMPETE ! ATK -20% 2 tours'
        setMouetteDebuffTurns(2) // real debuff applied below in damage calc
      }
      // Tarasque: carapace aleatoire (DEF x3 pendant 2 tours)
      if (bossName.includes('tarasque') && Math.random() < 0.25) {
        specialMsg = '🐢 CARAPACE ! DEF x3 pendant 2 tours'
        setTarasqueArmorTurns(2) // real armor applied below
        setBossSpecialActive(true); setTimeout(() => setBossSpecialActive(false), 2000)
      }
      // Kraken: invoque 2 tentacules (100 HP each, must kill before Kraken)
      if (bossName.includes('kraken') && count % 5 === 0 && krakenTentacles <= 0) {
        specialMsg = '🦑 TENTACULES ! 2 mini-monstres (100 PV chacun) !'
        setKrakenTentacles(200) // 2 x 100 HP total, damage goes to tentacles first
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

    // CDC M2: Apply Mouette debuff (player ATK reduced)
    const playerDefWithDebuff = mouetteDebuffTurns > 0 ? Math.floor(player.def * 0.8) : player.def
    if (mouetteDebuffTurns > 0) setMouetteDebuffTurns(t => t - 1)

    const result = calculateDamage(Math.floor(monsterAtk * atkMult), playerDefWithDebuff, 1, false, 0, '', '', isDefending)
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

    // CDC M2: Threat tracking
    if (action === 'coup') setPlayerThreat(t => t + 3)
    else if (action === 'sort') setPlayerThreat(t => t + 1)
    // Decrement Tarasque armor
    if (tarasqueArmorTurns > 0) setTarasqueArmorTurns(t => t - 1)

    switch (action) {
      case 'coup': {
        // CDC M2: Tarasque armor = DEF x3, Kraken tentacles absorb damage
        const effectiveDef = tarasqueArmorTurns > 0 ? monsterDef * 3 : monsterDef
        const result = calculateDamage(player.atk, effectiveDef, 1, false, 0, '', monsterWeakness, false)

        if (krakenTentacles > 0) {
          // Damage goes to tentacles first
          const newTent = Math.max(0, krakenTentacles - result.damage)
          setKrakenTentacles(newTent)
          addLog(`Coup tentacules : ${result.damage} (reste ${newTent} PV)`)
          if (newTent <= 0) addLog('🦑 Tentacules détruites !')
        } else {
          setMonsterHp(prev => {
            const next = Math.max(0, prev - result.damage)
            if (next <= 0) setTimeout(() => setPhase('victory'), 300)
            return next
          })
          if (result.isCritical) addLog(`CRITIQUE ! ${result.damage} dégâts !`)
          else if (result.isMiss) addLog('Raté !')
          else addLog(`Coup : ${result.damage} dégâts`)
        }

        setSpellGauge(prev => Math.min(6, prev + 1))
        setMonsterFlash('red'); setTimeout(() => setMonsterFlash(''), 150)
        setPlayerAnim('attack'); setTimeout(() => setPlayerAnim(''), 150)
        playSound('/sfx/sfx_hit.mp3', 'hit')

        // Solo combo check
        const solo = checkSoloCombo(newActions)
        if (solo) {
          setComboText(solo.name + ' !'); setTimeout(() => setComboText(''), 1500)
          addLog(`COMBO : ${solo.name} !`)
        }

        // CDC M2: Coup de grâce (monster <10% + coup = execution)
        if (monsterHp > 0 && monsterHp <= monsterMaxHp * 0.1) {
          addLog('💀 COUP DE GRÂCE !')
          setMonsterHp(0)
          setTimeout(() => setPhase('victory'), 300)
        }
        break
      }
      case 'defense':
        setIsDefending(true)
        setSpellGauge(prev => Math.min(6, prev + 1))
        setPlayerFlash('blue'); setTimeout(() => setPlayerFlash(''), 150)
        // CDC M2: Contre-attaque si ATB monstre > 90%
        if (monsterAtb > 0.9) {
          addLog('⚡ CONTRE-ATTAQUE ! Bloque 100% + riposte 50%')
          setComboText('Contre-attaque !'); setTimeout(() => setComboText(''), 1500)
          const riposteDmg = Math.floor(player.atk * 0.5)
          setMonsterHp(prev => Math.max(0, prev - riposteDmg))
          setMonsterAtb(0) // reset ATB
        } else {
          addLog('Défense active (-40% dégâts)')
        }
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
      player.addFatigue(0.5)
      playSound('/sfx/sfx_levelup.mp3', 'levelup')

      // CDC M5: Demi-boss kill → +2 bag slots (peau → sac upgrade)
      const bossMap = getBossStoryMap()
      const isDemiBoss = Object.entries(bossMap).some(([name, info]) => name === monsterName && info.before?.includes('demiboss'))
      if (isDemiBoss && player.bagMaxSlots < 15) {
        player.setStats({ bagMaxSlots: Math.min(15, player.bagMaxSlots + 2) })
        markBossDefeated(monsterName)
      }
      // Boss kill → mark defeated for portal unlock
      if (bossMap[monsterName]) {
        markBossDefeated(monsterName)
      }
    }
    if (phase === 'defeat') {
      player.respawn()
      player.addSous(-Math.floor(player.sous * 0.1))
      // M6: Game over story if dead against boss/demi-boss (first time)
      const bossMap = getBossStoryMap()
      if (bossMap[monsterName] && !isStorySeen('story_gameover')) {
        triggerStory('story_gameover', 'maison')
        return
      }
    }

    // M6: Victory story for boss/demi-boss
    if (phase === 'victory') {
      const returnScene = previousScene === 'maison' ? 'maison' : 'monde'
      if (triggerBossAfter(monsterName, returnScene)) {
        return
      }
    }

    transitionToScene(previousScene === 'maison' ? 'maison' : 'monde')
  }

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

  // Resolve sprites — CDC M2: use real combat sprites
  const playerClass = useGameStore.getState().playerClass || 'paladin'
  const playerSprite = `/sprites/combat/combat_${playerClass}.png`
  const monsterData = MONSTERS.find(m => m.name === monsterName)
  const monsterSprite = monsterData ? `/sprites/combat/${monsterData.sprite}` : null

  // Combo window: activate for 2s after any player action
  // CDC M2: Combo window with visible 2s countdown
  const startComboWindow = () => {
    setComboWindowActive(true)
    setComboCountdown(2)
    if (comboWindowTimer.current) clearTimeout(comboWindowTimer.current)
    const countInterval = setInterval(() => setComboCountdown(c => { if (c <= 0.1) { clearInterval(countInterval); return 0 } return +(c - 0.1).toFixed(1) }), 100)
    comboWindowTimer.current = setTimeout(() => { setComboWindowActive(false); setComboCountdown(0); clearInterval(countInterval) }, 2000)
  }

  // Cast spell handler
  const castSpell = () => {
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
    startComboWindow()
    playSound('/sfx/sfx_spell.mp3', 'spell')
  }

  return (
    <div style={{
      width: '100%', height: '100dvh', background: '#1a1232', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar — HP comparison */}
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

      {/* CDC M2: ATBBar component */}
      <ATBBar value={monsterAtb} speed={monsterAtbSpeed} />

      {/* CDC M2: BattleField with sprites, animations, combo */}
      <BattleField
        playerSprite={playerSprite}
        monsterSprite={monsterSprite || undefined}
        monsterName={monsterName}
        monsterHp={monsterHp}
        monsterMaxHp={monsterMaxHp}
        playerFlash={playerFlash}
        monsterFlash={monsterFlash}
        playerAnim={playerAnim}
        comboText={comboText || null}
        comboWindowActive={comboWindowActive}
        isBoss={isBoss}
        bossSpecialActive={bossSpecialActive}
        shaking={shaking}
      />

      {/* CDC M2: Status indicators (debuffs, tentacles, combo timer, threat) */}
      <div style={{ padding: '2px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 9 }}>
        {mouetteDebuffTurns > 0 && <span style={{ color: '#85B7EB', background: '#85B7EB22', padding: '1px 6px', borderRadius: 4 }}>🦅 ATK-20% ({mouetteDebuffTurns}t)</span>}
        {tarasqueArmorTurns > 0 && <span style={{ color: '#ef9f27', background: '#ef9f2722', padding: '1px 6px', borderRadius: 4 }}>🐢 DEF×3 ({tarasqueArmorTurns}t)</span>}
        {krakenTentacles > 0 && <span style={{ color: '#534AB7', background: '#534AB722', padding: '1px 6px', borderRadius: 4 }}>🦑 Tentacules {krakenTentacles}PV</span>}
        {comboWindowActive && <span style={{ color: '#ef9f27', background: '#ef9f2722', padding: '1px 6px', borderRadius: 4, animation: 'pulse 0.5s infinite' }}>⚡ Combo {comboCountdown.toFixed(1)}s</span>}
        {playerThreat > 0 && <span style={{ color: '#e24b4a', background: '#e24b4a22', padding: '1px 6px', borderRadius: 4 }}>🎯 Menace {playerThreat}</span>}
        {mysteryRiderActive && <span style={{ color: '#534AB7', background: '#534AB722', padding: '1px 6px', borderRadius: 4 }}>🌙 Cavalier Mystère !</span>}
      </div>

      {/* Combat log */}
      <div style={{ padding: '4px 12px', maxHeight: 50, overflow: 'hidden' }}>
        {combatLog.slice(-2).map((msg, i) => (
          <div key={i} style={{ fontSize: 10, color: '#9a8fbf', opacity: i === 0 ? 0.5 : 1 }}>{msg}</div>
        ))}
      </div>

      {/* CDC M2: SpellGauge component */}
      <SpellGauge value={spellGauge} />

      {/* CDC M2: CardDeck component */}
      {phase === 'fighting' && (
        <CardDeck
          playerAtk={player.atk}
          onCoup={() => { playCard('coup'); startComboWindow() }}
          onDefense={() => { playCard('defense'); startComboWindow() }}
          onFuite={() => playCard('fuite')}
          onPotion={() => playCard('potion')}
          onSpell={castSpell}
          spellReady={spellReady}
          spellGauge={spellGauge}
        />
      )}

      {/* Victory / Defeat / Flee screens */}
      {(phase === 'victory' || phase === 'defeat' || phase === 'flee') && (
        <div style={{ padding: '20px', background: '#231b42', borderTop: '1px solid #3a2d5c', textAlign: 'center' }}>
          {phase === 'victory' && (() => {
            const xp = calculateXP(monsterXp, player.level, 1)
            const sous = Math.floor(5 + monsterXp * 0.3)
            const loots = monsterData?.drops.split(',').map(s => s.trim()) || ['Herbe', 'Cuir']
            const loot1 = loots[0] || 'Matériau'
            const loot2 = loots.length > 1 && Math.random() > 0.5 ? loots[1] : null
            return <>
              <div style={{ fontSize: 18, color: '#7ec850', fontWeight: 700, animation: 'victoryPop 0.5s ease-out' }}>✨ Victoire !</div>
              <div style={{ fontSize: 13, color: '#ef9f27', marginTop: 6 }}>+{xp} XP</div>
              <div style={{ fontSize: 13, color: '#C9A84C', marginTop: 2 }}>+{sous} Sous</div>
              <div style={{ fontSize: 12, color: '#7ec850', marginTop: 4 }}>Loot : {loot1}{loot2 ? ` + ${loot2}` : ''}</div>
            </>
          })()}
          {phase === 'defeat' && (
            <>
              <div style={{ fontSize: 18, color: '#e24b4a', fontWeight: 700 }}>Défaite...</div>
              <div style={{ fontSize: 12, color: '#9a8fbf', marginTop: 4 }}>Retour à la maison. -10% Sous.</div>
            </>
          )}
          {phase === 'flee' && <div style={{ fontSize: 14, color: '#7ec850' }}>Fuite réussie !</div>}
          <button onClick={endCombat} style={{
            marginTop: 12, padding: '10px 32px', background: '#e91e8c', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Continuer</button>
        </div>
      )}

      <style>{`@keyframes victoryPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}
