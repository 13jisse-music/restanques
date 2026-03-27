'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'
import { markPopupSeen } from '@/lib/storyEngine'

// CDC M6 : Tutoriel avec Grand Sage Olivier
// - Zone séparée AVANT le jeu (après story_intro)
// - 10 étapes : image + texte court + action à faire
// - Récompense fin : équipement de départ + 5 graines + 50 Sous

interface TutoStep {
  title: string
  icon: string
  text: string
  action: string
  image?: string // illustration
  highlight?: string // élément à mettre en valeur
}

const STEPS: TutoStep[] = [
  {
    title: 'Bienvenue, aventurier !',
    icon: '🧙',
    text: 'Je suis le Grand Sage Olivier. La Provence a besoin de toi. Laisse-moi t\'apprendre les bases avant de partir.',
    action: 'Continuer',
    image: '/story/story_restanques_intro.png',
  },
  {
    title: 'Se déplacer',
    icon: '🕹️',
    text: 'Jisse utilise le JOYSTICK (cercle à gauche) pour explorer librement. Mélanie utilise le D-PAD (4 flèches) pour avancer case par case dans sa maison.',
    action: 'Compris !',
    highlight: 'joystick',
  },
  {
    title: 'Interagir',
    icon: '🅰️',
    text: 'Le BOUTON A (gros bouton rose) permet d\'interagir : parler à un PNJ, récolter une ressource, ouvrir un coffre.',
    action: 'Compris !',
    highlight: 'bouton-a',
  },
  {
    title: 'Le combat',
    icon: '⚔️',
    text: 'Quand tu touches un monstre, le combat se lance ! Tu as 4 cartes : COUP, DÉFENSE (-40% dégâts), FUITE (70% chance), et POTION (+30 PV).',
    action: 'Compris !',
  },
  {
    title: 'La barre ATB',
    icon: '⏱️',
    text: 'Le monstre attaque quand sa barre ATB est pleine. Tu dois jouer tes cartes vite ! Les boss ont des attaques spéciales redoutables.',
    action: 'Compris !',
  },
  {
    title: 'Les sorts',
    icon: '✦',
    text: 'Chaque action remplit ta jauge de sort. À 2 points, un sort apparaît ! Accumule jusqu\'à 6 points pour des sorts plus puissants. Cycle : Feu > Ombre > Lumière > Eau.',
    action: 'Compris !',
  },
  {
    title: 'Le craft',
    icon: '⚒️',
    text: 'Mélanie craft sorts, potions et armes dans sa maison. Va sur un atelier et appuie sur A. Un mini-jeu Merge 4×4 se lance : fusionne les ingrédients !',
    action: 'Compris !',
  },
  {
    title: 'Le commerce',
    icon: '💰',
    text: 'Jisse récolte les ressources, Mélanie les transforme. Au comptoir, vous échangez vos objets. Les PNJ viennent aussi acheter le jour.',
    action: 'Compris !',
  },
  {
    title: 'Le jardin',
    icon: '🌱',
    text: 'Mélanie a 4 bacs de plantation. Plante des graines (A sur un bac vide), attends que ça pousse, puis récolte ! L\'Artisane pousse 2× plus vite.',
    action: 'Compris !',
  },
  {
    title: 'Jour et nuit',
    icon: '🌙',
    text: 'Un cycle jour/nuit dure 20 minutes. La nuit, les créatures sont plus dangereuses. Dors dans le lit pour restaurer tes PV et sauvegarder.',
    action: 'Compris !',
  },
  {
    title: 'Prêt à partir !',
    icon: '🎒',
    text: 'Voici ton équipement de départ et quelques graines. Bonne chance ! 5 biomes t\'attendent, du Sanglier géant jusqu\'au Mistral lui-même.',
    action: '⚔️ Commencer l\'aventure !',
    image: '/story/intro1.png',
  },
]

export default function SceneTuto() {
  const [step, setStep] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const [showReward, setShowReward] = useState(false)
  const { transitionToScene, playerClass, playerName } = useGameStore()
  const player = usePlayerStore()

  const current = STEPS[step]
  const isLast = step >= STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  useEffect(() => {
    setTimeout(() => setFadeIn(false), 100)
  }, [])

  const next = useCallback(() => {
    if (isLast) {
      // Give starting rewards
      player.addSous(50)
      player.addToInventory('graine', 5)
      // Mark tutorial popups as already explained
      ;['first_combat', 'first_craft', 'first_garden', 'first_pnj', 'first_resource', 'first_night', 'first_shop'].forEach(markPopupSeen)
      setShowReward(true)
      setTimeout(() => {
        transitionToScene(playerClass === 'artisane' ? 'maison' : 'monde')
      }, 3000)
    } else {
      setStep(s => s + 1)
    }
  }, [isLast, player, playerClass, transitionToScene])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') next()
      if (e.key === 'Escape') {
        transitionToScene(playerClass === 'artisane' ? 'maison' : 'monde')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, playerClass, transitionToScene])

  // Reward screen
  if (showReward) {
    return (
      <div style={{
        width: '100%', minHeight: '100dvh',
        background: 'radial-gradient(ellipse at center, #2d1f54 0%, #1a1232 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 20, animation: 'fadeInReward 0.5s ease-in',
      }}>
        <div style={{ fontSize: 48 }}>🎁</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ef9f27' }}>Récompenses !</div>
        <div style={{ fontSize: 14, color: '#F5ECD7', textAlign: 'center', lineHeight: 2 }}>
          💰 +50 Sous<br/>
          🌱 +5 Graines<br/>
          ⚔️ Équipement de départ
        </div>
        <div style={{ fontSize: 12, color: '#9a8fbf', marginTop: 8 }}>
          L'aventure commence...
        </div>
        <style>{`@keyframes fadeInReward { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', minHeight: '100dvh', position: 'relative',
      background: 'linear-gradient(180deg, #0a0818 0%, #1a1232 40%, #2d1f54 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px', gap: 12, overflowY: 'auto',
      opacity: fadeIn ? 0 : 1, transition: 'opacity 1s ease-in',
    }} onClick={next}>

      {/* Background image (subtle) */}
      {current.image && (
        <img src={current.image} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.15, pointerEvents: 'none',
        }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      )}

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 340, height: 4, background: '#2d1f54', borderRadius: 2, overflow: 'hidden', zIndex: 5 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#C9A84C', borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>

      {/* Sage portrait */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%', zIndex: 5,
        background: 'linear-gradient(135deg, #231b42, #3a2d5c)',
        border: '3px solid #C9A84C', boxShadow: '0 0 20px rgba(201,168,76,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
        marginTop: 20,
      }}>
        {current.icon}
      </div>

      {/* Sage name */}
      <div style={{ fontSize: 11, color: '#C9A84C', fontStyle: 'italic', zIndex: 5 }}>
        Grand Sage Olivier
      </div>

      {/* Title */}
      <div style={{
        fontSize: 22, fontWeight: 700, color: '#C9A84C', textAlign: 'center',
        fontFamily: 'Georgia, serif', textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        zIndex: 5,
      }}>
        {current.title}
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 5, zIndex: 5 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 16 : 7, height: 7, borderRadius: 4,
            background: i < step ? '#C9A84C' : i === step ? '#F5ECD7' : '#2d1f54',
            border: i === step ? '1px solid #C9A84C' : 'none',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Text bubble */}
      <div style={{
        maxWidth: 360, width: '100%', zIndex: 5,
        background: 'rgba(35,27,66,0.95)', border: '1px solid #3a2d5c',
        borderRadius: 16, padding: '20px 24px', position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Speech bubble arrow */}
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
          borderBottom: '8px solid rgba(35,27,66,0.95)',
        }} />
        <div style={{
          fontSize: 14, color: '#d0c8e4', lineHeight: 1.9, textAlign: 'center',
        }}>
          {current.text}
        </div>
      </div>

      {/* Player name hint */}
      {step === 0 && playerName && (
        <div style={{ fontSize: 12, color: '#9a8fbf', zIndex: 5, fontStyle: 'italic' }}>
          Bienvenue, {playerName} !
        </div>
      )}

      {/* Action button */}
      <button onClick={(e) => { e.stopPropagation(); next() }} style={{
        background: isLast ? 'linear-gradient(135deg, #7ec850, #5fa33d)' : 'linear-gradient(135deg, #C9A84C, #a88930)',
        color: '#fff', border: 'none', borderRadius: 14, zIndex: 5,
        padding: '14px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        boxShadow: isLast ? '0 4px 20px rgba(126,200,80,0.4)' : '0 4px 20px rgba(201,168,76,0.3)',
        letterSpacing: 0.5,
      }}>
        {current.action}
      </button>

      {/* Skip */}
      <button onClick={(e) => {
        e.stopPropagation()
        player.addSous(50)
        player.addToInventory('graine', 5)
        transitionToScene(playerClass === 'artisane' ? 'maison' : 'monde')
      }} style={{
        background: 'transparent', border: 'none', color: '#3a2d5c',
        fontSize: 11, cursor: 'pointer', zIndex: 5, marginTop: 8,
      }}>
        Passer le tutoriel →
      </button>

      {/* Step counter */}
      <div style={{ fontSize: 10, color: '#2d1f54', zIndex: 5 }}>{step + 1}/{STEPS.length}</div>
    </div>
  )
}
