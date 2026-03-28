// useSkin — CDC M1: Charge les images skin si disponibles, sinon fallback CSS variables
// Usage: const bgUrl = useSkin('skin_ctrl_bg.png')
// Retourne l'URL de l'image si chargée, null sinon (= utiliser var(--hud-*) CSS)

'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

const skinCache = new Map<string, string | null>()

export function useSkin(filename: string): string | null {
  const currentSkin = useGameStore(s => s.currentSkin)
  const key = `${currentSkin}/${filename}`
  const [url, setUrl] = useState<string | null>(skinCache.get(key) ?? null)

  useEffect(() => {
    if (skinCache.has(key)) {
      setUrl(skinCache.get(key)!)
      return
    }
    const img = new Image()
    const src = `/skins/${currentSkin}/${filename}`
    img.onload = () => { skinCache.set(key, src); setUrl(src) }
    img.onerror = () => { skinCache.set(key, null); setUrl(null) }
    img.src = src
  }, [key, currentSkin, filename])

  return url
}

// Skin-aware background style helper
export function skinBg(url: string | null, fallbackColor: string): React.CSSProperties {
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: fallbackColor }
}
