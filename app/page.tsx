'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import SceneMaison from '@/components/scenes/SceneMaison'
import SceneMonde from '@/components/scenes/SceneMonde'
import SceneCombat from '@/components/scenes/SceneCombat'
import SceneCraft from '@/components/scenes/SceneCraft'
import SceneCommerce from '@/components/scenes/SceneCommerce'
import SceneStory from '@/components/scenes/SceneStory'
import SceneTuto from '@/components/scenes/SceneTuto'
import SceneDonjon from '@/components/scenes/SceneDonjon'
import SplashScreen from '@/components/scenes/SplashScreen'

const SCENES: Record<string, React.ComponentType> = {
  splash: SplashScreen,
  maison: SceneMaison,
  monde: SceneMonde,
  combat: SceneCombat,
  craft: SceneCraft,
  commerce: SceneCommerce,
  story: SceneStory,
  tuto: SceneTuto,
  donjon: SceneDonjon,
}

export default function GamePage() {
  const currentScene = useGameStore((s) => s.currentScene)
  const Scene = SCENES[currentScene] || SplashScreen
  const [fadeOut, setFadeOut] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const prevScene = useRef(currentScene)

  // Fade transition between scenes (except story which has its own fade)
  useEffect(() => {
    if (prevScene.current !== currentScene) {
      setFadeIn(true)
      setTimeout(() => setFadeIn(false), 300)
      prevScene.current = currentScene
    }
  }, [currentScene])

  return (
    <>
      <Scene />
      {/* Fade overlay on scene change */}
      {fadeIn && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0818', zIndex: 9999,
          pointerEvents: 'none',
          animation: 'sceneFade 0.3s ease-out forwards',
        }} />
      )}
      <style>{`@keyframes sceneFade { 0%{opacity:1} 100%{opacity:0} }`}</style>
    </>
  )
}
