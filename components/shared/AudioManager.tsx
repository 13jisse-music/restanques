'use client'

import { useEffect } from 'react'
import { useGameStore, SceneId } from '@/store/gameStore'
import { playMusic, stopMusic, preloadGameAssets } from '@/lib/assetLoader'

const SCENE_MUSIC: Partial<Record<SceneId, string>> = {
  splash: '/music/theme.mp3',
  monde: '/music/garrigue.mp3',
  maison: '/music/theme.mp3',
  combat: '/music/combat.mp3',
  story: '/music/story.mp3',
  tuto: '/music/theme.mp3',
  donjon: '/music/combat.mp3',
}

export default function AudioManager() {
  const scene = useGameStore(s => s.currentScene)

  // Preload assets once
  useEffect(() => {
    preloadGameAssets()
  }, [])

  // Play music matching current scene
  useEffect(() => {
    const musicPath = SCENE_MUSIC[scene]
    if (musicPath) {
      playMusic(musicPath, 0.25)
    } else {
      stopMusic()
    }
  }, [scene])

  return null
}
