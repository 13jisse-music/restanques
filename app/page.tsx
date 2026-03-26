'use client'

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

  return <Scene />
}
