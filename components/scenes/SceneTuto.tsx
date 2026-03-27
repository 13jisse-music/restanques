'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { usePlayerStore } from '@/store/playerStore'

const STEPS = [
  { title:'Bienvenue, aventurier !', icon:'🧙', text:'Je suis le Grand Sage Olivier. Je vais t\'apprendre les bases pour survivre dans les terres de Provence.', action:'Tap pour continuer' },
  { title:'Se deplacer', icon:'🕹️', text:'Jisse utilise le JOYSTICK (cercle a gauche) pour se deplacer librement. Melanie utilise le D-PAD (4 fleches) pour avancer case par case.', action:'Compris !' },
  { title:'Interagir', icon:'🅰️', text:'Le BOUTON A (gros bouton rose) permet d\'interagir : parler a un PNJ, recolter une ressource, ouvrir un coffre, utiliser un meuble.', action:'Compris !' },
  { title:'Le combat', icon:'⚔️', text:'Quand tu touches un monstre, le combat se lance. Tu as 4 cartes : COUP (attaque), DEFENSE (-40% degats), FUITE (70% chance), POTION (+30 PV). Le monstre attaque quand sa barre ATB est pleine !', action:'Compris !' },
  { title:'Les sorts', icon:'✦', text:'Chaque COUP ou DEFENSE remplit ta jauge de sort. A 2 actions, un sort apparait ! Tu peux accumuler jusqu\'a 3 sorts en main. Les sorts suivent le cycle : Feu > Ombre > Lumiere > Eau > Feu.', action:'Compris !' },
  { title:'Le craft', icon:'⚒', text:'Melanie craft les sorts, potions et armes dans sa maison. Va sur un atelier (table, four, enclume) et appuie sur A. Un mini-jeu Merge 4x4 se lance : fusionne les ingredients identiques pour creer l\'objet !', action:'Compris !' },
  { title:'Le commerce', icon:'💰', text:'Jisse recolte les ressources, Melanie les transforme. Au comptoir de la maison, vous echangez vos objets. Les visiteurs PNJ viennent aussi acheter au comptoir le jour.', action:'Compris !' },
  { title:'Le jardin', icon:'🌱', text:'Melanie a 4 bacs de plantation dans son jardin. Plante des graines (bouton A sur un bac vide), attends que ca pousse (timer), puis recolte ! L\'Artisane pousse 2x plus vite.', action:'Compris !' },
  { title:'Jour et nuit', icon:'🌙', text:'Un cycle jour/nuit dure 20 minutes. La nuit, les creatures sont plus dangereuses dehors mais la maison est safe. Dors dans le lit pour restaurer tes PV et sauvegarder.', action:'Compris !' },
  { title:'Pret a partir !', icon:'🎒', text:'Voici ton equipement de depart et quelques graines. Bonne chance, aventurier ! La Provence compte sur toi.', action:'Commencer l\'aventure !' },
]

export default function SceneTuto() {
  const [step, setStep] = useState(0)
  const { transitionToScene, playerClass } = useGameStore()
  const player = usePlayerStore()

  const current = STEPS[step]
  const isLast = step >= STEPS.length - 1

  const next = () => {
    if (isLast) {
      // Give starting rewards
      player.addSous(50)
      transitionToScene(playerClass === 'artisane' ? 'maison' : 'monde')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100dvh', background: 'linear-gradient(180deg, #1a1232, #2d1f54)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: 16 }} onClick={next}>

      {/* Sage portrait */}
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#231b42', border: '3px solid #8B6914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        {current.icon}
      </div>

      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
        {current.title}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? '#C9A84C' : '#3a2d5c' }} />
        ))}
      </div>

      {/* Text */}
      <div style={{ maxWidth: 340, background: '#231b42', border: '1px solid #3a2d5c', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#c0b8d4', lineHeight: 1.8, textAlign: 'center' }}>
        {current.text}
      </div>

      {/* Action button */}
      <button onClick={(e) => { e.stopPropagation(); next() }} style={{
        background: isLast ? '#7ec850' : '#C9A84C', color: '#fff', border: 'none', borderRadius: 12,
        padding: '14px 36px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        boxShadow: isLast ? '0 4px 15px rgba(126,200,80,0.4)' : '0 4px 15px rgba(201,168,76,0.3)',
      }}>
        {current.action}
      </button>

      {/* Skip */}
      <button onClick={(e) => { e.stopPropagation(); transitionToScene(playerClass === 'artisane' ? 'maison' : 'monde') }} style={{
        background: 'transparent', border: 'none', color: '#3a2d5c', fontSize: 11, cursor: 'pointer',
      }}>
        Passer le tutoriel
      </button>

      {/* Step counter */}
      <div style={{ fontSize: 10, color: '#3a2d5c' }}>{step + 1}/{STEPS.length}</div>
    </div>
  )
}
