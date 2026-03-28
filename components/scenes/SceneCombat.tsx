'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { calculateDamage, calculateXP, checkSoloCombo } from '@/lib/combatEngine'
import { playSound, playMusic } from '@/lib/assetLoader'
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
  // CDC M8: Stun (Sanglier charge)
  const [playerStunned, setPlayerStunned] = useState(false)

  // CDC M2: Spell hand — max 3 sorts en main, tirage sans remise
  const [spellHand, setSpellHand] = useState<string[]>([])
  const [spellPool, setSpellPool] = useState<string[]>(() => {
    const equipped = player.equippedSpells?.map((s: { spellId: string }) => s.spellId) || ['flamme', 'soin', 'poison']
    return [...equipped]
  })
  // CDC M2: Fiche perso accessible pendant combat
  const [showCharSheet, setShowCharSheet] = useState(false)

  // CDC M2: Coop Tag Team state (sync via M7 Realtime)
  const [coopPartner, setCoopPartner] = useState<{ name: string; hp: number; atk: number; class: string } | null>(null)
  const connectedPlayers = useGameStore(s => s.connectedPlayers)
  const isCoopCombat = connectedPlayers.length > 0

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
      // CDC M2: Boss music
      const isBossMonster = (d.hp as number || 0) > 300
      if (isBossMonster) playMusic('/music/boss.mp3')
      else playMusic('/music/combat.mp3')

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

  // Boss special mechanics — CDC M2: Boss ATB plus lent (+50%)
  const isBoss = monsterMaxHp > 300
  const bossName = monsterName.toLowerCase()

  // CDC M2: Boss ATB speed adjustment (slower = higher number)
  useEffect(() => {
    if (isBoss) setMonsterAtbSpeed(prev => prev < 5 ? prev * 1.5 : prev)
  }, [isBoss])

  // Monster attacks player
  const monsterAttacks = useCallback(() => {
    let atkMult = 1
    let specialMsg = ''
    const count = bossAttackCount + 1
    setBossAttackCount(count)

    // Boss special abilities
    if (isBoss) {
      // Sanglier: charge tous les 3 coups (x3 dmg + CDC M8: stun 1 tour = skip player next action)
      if (bossName.includes('sanglier') && count % 3 === 0) {
        atkMult = 3; specialMsg = '🐗 CHARGE ! Degats x3 + Stun ! (Defense = esquive+riposte)'
        setBossSpecialActive(true); setTimeout(() => setBossSpecialActive(false), 1000)
        setPlayerStunned(true) // CDC M8: stun — player skips next action
      }
      // Mouette: debuff toutes les 4 attaques (-20% ATK, CDC M8: sort Blanc = purge)
      if (bossName.includes('mouette') && count % 4 === 0) {
        specialMsg = '🦅 CRI DE TEMPETE ! ATK -20% 2 tours (sort Blanc = purge)'
        setMouetteDebuffTurns(2)
      }
      // Tarasque: carapace aleatoire (DEF x3, CDC M8: sort Eau = brise + stun boss)
      if (bossName.includes('tarasque') && Math.random() < 0.25) {
        specialMsg = '🐢 CARAPACE ! DEF x3 2 tours (sort Eau = brise carapace)'
        setTarasqueArmorTurns(2)
        setBossSpecialActive(true); setTimeout(() => setBossSpecialActive(false), 2000)
      }
      // Kraken: invoque 2 tentacules (100 HP each, must kill before Kraken)
      if (bossName.includes('kraken') && count % 5 === 0 && krakenTentacles <= 0) {
        specialMsg = '🦑 TENTACULES ! 2 mini-monstres (100 PV chacun) !'
        setKrakenTentacles(200) // 2 x 100 HP total, damage goes to tentacles first
      }
      // CDC M8: Mistral change element ET faiblesse REELLEMENT (pas cosmétique)
      if (bossName.includes('mistral') && count % 3 === 0) {
        const elements = ['Feu', 'Eau', 'Lumiere', 'Ombre']
        const weaknesses: Record<string, string> = { Feu: 'Eau', Eau: 'Feu', Lumiere: 'Ombre', Ombre: 'Lumiere' }
        const newElem = elements[Math.floor(Math.random() * elements.length)]
        setMonsterWeakness(weaknesses[newElem] || 'Feu') // CDC M8: REEL changement de faiblesse
        specialMsg = '🌪 CHANGEMENT ! Element: ' + newElem + ' → Faiblesse: ' + (weaknesses[newElem] || 'Feu')
      }
      // Mistral phase 2 (<50% PV)
      if (bossName.includes('mistral') && monsterHp < monsterMaxHp * 0.5) {
        atkMult *= 1.5
      }
    }

    if (specialMsg) { setComboText(specialMsg); setTimeout(() => setComboText(''), 2000) }

    // CDC M2: Menace affecte ciblage — plus de menace = plus de degats recus
    const threatMult = playerThreat > 10 ? 1.2 : playerThreat > 5 ? 1.1 : 1
    // CDC M2: Apply Mouette debuff (player ATK reduced)
    const playerDefWithDebuff = mouetteDebuffTurns > 0 ? Math.floor(player.def * 0.8) : player.def
    if (mouetteDebuffTurns > 0) setMouetteDebuffTurns(t => t - 1)

    const result = calculateDamage(Math.floor(monsterAtk * atkMult * threatMult), playerDefWithDebuff, 1, false, 0, '', '', isDefending)
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
    // CDC M8: Stun check — skip action if stunned
    if (playerStunned) { setPlayerStunned(false); addLog('Etourdi ! Action sautee.'); return }

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
      case 'potion': {
        // CDC M2: Potion consomme l'inventaire
        const potionItem = player.bag.find(b => b.itemId.includes('potion') || b.itemId.includes('soin') || b.itemId === 'herbe_med')
        if (!potionItem) { addLog('Pas de potion !'); break }
        const healAmt = potionItem.itemId.includes('soin_plus') ? 60 : 30
        player.removeFromInventory(potionItem.itemId, 1)
        player.heal(healAmt)
        addLog(`Potion ${potionItem.itemId} : +${healAmt} PV`)
        setPlayerFlash('green'); setTimeout(() => setPlayerFlash(''), 200)
        playSound('/sfx/sfx_potion.mp3', 'potion')
        break
      }
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
      // CDC M7: Coop death — broadcast to other players
      if (isCoopCombat) {
        const { handleCoopDeath } = require('@/lib/realtimeSync')
        handleCoopDeath(useGameStore.getState().playerId || '', playerClass)
      } else {
        player.respawn()
      }
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

  const spellReady = spellGauge >= 2 && spellHand.length < 3

  // Auto-draw spell when gauge reaches threshold
  useEffect(() => {
    if (spellGauge >= 2 && spellHand.length < 3 && spellPool.length > 0) {
      const drawn = spellPool[0]
      setSpellHand(prev => [...prev, drawn])
      setSpellPool(prev => prev.slice(1))
      setSpellGauge(prev => prev - 2)
      // Refill pool if empty
      if (spellPool.length <= 1) {
        const equipped = player.equippedSpells?.map((s: { spellId: string }) => s.spellId) || ['flamme', 'soin', 'poison']
        setSpellPool([...equipped])
      }
    }
  }, [spellGauge])

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

  // Cast spell handler — CDC M2: joue le premier sort de la main
  const castSpell = (spellIdx?: number) => {
    const idx = spellIdx ?? 0
    if (idx >= spellHand.length) return
    const spellId = spellHand[idx]
    setSpellHand(prev => prev.filter((_, i) => i !== idx))
    // CDC M10: Decrement usesRemaining on equipped spell
    const equipped = player.equippedSpells.find(s => s.spellId === spellId)
    if (equipped && equipped.usesRemaining !== null && equipped.usesRemaining > 0) {
      player.setStats({ equippedSpells: player.equippedSpells.map(s => s.spellId === spellId && s.usesRemaining !== null ? { ...s, usesRemaining: s.usesRemaining - 1 } : s) })
    }
    // Get spell element from sorts data
    const ELEM_MAP: Record<string, string> = { flamme:'Feu', boule_feu:'Feu', meteore:'Feu', brasier:'Feu', vague:'Eau', blizzard:'Eau', tsunami:'Eau', soin:'Lumiere', bouclier_divin:'Lumiere', resurrection:'Lumiere', lumiere:'Lumiere', poison:'Ombre', vol_vie:'Ombre', neant:'Ombre' }
    const spellElement = ELEM_MAP[spellId] || 'Feu'
    const spellPower = spellId.includes('meteore') || spellId.includes('tsunami') || spellId.includes('neant') ? 80 : spellId.includes('boule') || spellId.includes('blizzard') || spellId.includes('vol') ? 35 : 25
    const result = calculateDamage(0, monsterDef, 1, true, spellPower, spellElement, monsterWeakness, false)
    setMonsterHp(prev => {
      const next = Math.max(0, prev - result.damage)
      if (next <= 0) setTimeout(() => setPhase('victory'), 300)
      return next
    })
    setMonsterFlash('#7F77DD'); setTimeout(() => setMonsterFlash(''), 200)
    addLog(`Sort : ${result.damage} dégâts !${result.isElementBonus ? ' (bonus élémentaire !)' : ''}`)
    // CDC M8: Contre-mecaniques boss via sorts
    if (spellElement === 'Lumiere' && mouetteDebuffTurns > 0) {
      setMouetteDebuffTurns(0)
      addLog('✨ Sort Blanc purge le debuff Mouette !')
    }
    if (spellElement === 'Eau' && tarasqueArmorTurns > 0) {
      setTarasqueArmorTurns(0)
      addLog('💧 Sort Eau brise la carapace Tarasque !')
      setPlayerStunned(false) // bonus: stun le boss (skip son prochain tour)
    }
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

      {/* CDC M2: Fiche perso button */}
      <div style={{ position: 'absolute', top: 50, right: 8, zIndex: 20 }}>
        <button onClick={() => setShowCharSheet(!showCharSheet)} style={{
          padding: '3px 8px', background: '#2d1f54', border: '1px solid #534AB7', borderRadius: 6,
          color: '#9a8fbf', fontSize: 9, cursor: 'pointer',
        }}>Perso</button>
      </div>
      {showCharSheet && (
        <div style={{ position: 'absolute', top: 70, right: 8, zIndex: 30, background: '#1a1232', border: '1px solid #534AB7', borderRadius: 8, padding: 10, width: 180, fontSize: 10, color: '#F5ECD7' }}>
          <div style={{ fontWeight: 600, color: '#e91e8c', marginBottom: 4 }}>Nv.{player.level} {playerClass}</div>
          <div>PV: {player.hp}/{player.hpMax}</div>
          <div>ATK: {player.atk} | DEF: {player.def}</div>
          <div>Luck: {player.luck}</div>
          <div>Fatigue: {Math.round(player.fatigue)}%</div>
          <div style={{ marginTop: 6, borderTop: '1px solid #534AB733', paddingTop: 4, color: '#7F77DD', fontWeight: 600 }}>Spellbook</div>
          {(player.equippedSpells || []).map((s, i) => (
            <div key={i} style={{ color: '#9a8fbf' }}>✦ {s.spellId} {s.usesRemaining !== null ? `(x${s.usesRemaining})` : ''}</div>
          ))}
          <div style={{ marginTop: 4, color: '#ef9f27' }}>En main: {spellHand.join(', ') || 'vide'}</div>
          <div>Jauge: {spellGauge}/6 | Menace: {playerThreat}</div>
        </div>
      )}

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
          potionCount={player.bag.filter(b => b.itemId.includes('potion') || b.itemId.includes('soin') || b.itemId === 'herbe_med').reduce((s, b) => s + b.quantity, 0)}
          spellHand={spellHand}
          playerThreat={playerThreat}
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

      <style>{`
        @keyframes victoryPop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes victoryFanfare { 0% { opacity:0;transform:translateY(20px) } 100% { opacity:1;transform:translateY(0) } }
        @keyframes defeatFade { 0% { opacity:0 } 100% { opacity:1 } }
      `}</style>
    </div>
  )
}
