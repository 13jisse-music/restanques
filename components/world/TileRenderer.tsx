'use client'

import { useRef, useEffect, useState } from 'react'

// CDC M4: TileRenderer — affiche les vraies tiles PNG si disponibles, sinon fallback couleur
// Chaque tileId a un mapping vers un fichier PNG dans /sprites/tiles/parts/

interface TileRendererProps {
  map: number[][]
  tileColors: Record<number, string>
  tileSize: number
  cameraX: number
  cameraY: number
  viewportW: number
  viewportH: number
  entities?: { x: number; y: number; color: string; label?: string }[]
  biome?: string // pour charger les tiles du bon biome
}

// Mapping tileId → fichier PNG par biome
const TILE_SPRITES: Record<string, Record<number, string>> = {
  garrigue: {
    0: 'tile_garrigue_herbe.png', 1: 'tile_chemin_garrigue.png', 2: 'tile_rocher.png',
    3: 'tile_buisson_thym.png', 4: 'tile_eau.png', 5: 'tile_lavande.png',
    6: 'tile_olivier.png', 20: 'tile_souche.png', 21: 'tile_garrigue_herbe2.png', 22: 'tile_champignon.png',
  },
  maison_ext: {
    0: 'tile_herbe_1.png', 1: 'tile_chemin_terre.png', 4: 'tile_eau.png',
    5: 'tile_fleurs_rouges.png', 20: 'tile_bac_vide.png', 21: 'tile_arbre_olivier.png',
    22: 'tile_portail.png', 23: 'tile_cloture_bois.png',
  },
  maison_int: {
    3: 'tile_sol_bois.png', 2: 'tile_mur_pierre.png',
    10: 'tile_table_enchantee.png', 11: 'tile_four_cuisine.png', 12: 'tile_enclume.png',
    13: 'tile_lit.png', 14: 'tile_comptoir.png', 15: 'tile_coffre.png',
  },
  calanques: {
    0: 'tile_calcaire.png', 1: 'tile_sable.png', 4: 'tile_eau_turquoise.png',
    3: 'tile_pin_maritime.png', 5: 'tile_coquillage.png',
  },
  mines: {
    0: 'tile_pierre_sombre.png', 1: 'tile_mur_mine.png', 4: 'tile_lave.png',
    3: 'tile_champignon_mine.png', 5: 'tile_cristal_bleu.png',
  },
  mer: {
    0: 'tile_ocean_profond.png', 1: 'tile_pont_bateau.png', 4: 'tile_vague.png',
    5: 'tile_ile_sable.png',
  },
  restanques: {
    0: 'tile_terrasse.png', 1: 'tile_herbe_vent.png', 3: 'tile_ruine.png',
    5: 'tile_cristal_vent.png',
  },
}

// Cache for loaded tile images
const tileImageCache = new Map<string, HTMLImageElement | null>()

function loadTileImage(filename: string): HTMLImageElement | null {
  if (tileImageCache.has(filename)) return tileImageCache.get(filename)!
  const img = new Image()
  img.src = `/sprites/tiles/parts/${filename}`
  img.onload = () => tileImageCache.set(filename, img)
  img.onerror = () => tileImageCache.set(filename, null)
  tileImageCache.set(filename, null) // null until loaded
  return null
}

// Emoji fallbacks for special tiles
const TILE_EMOJIS: Record<number, string> = {
  10: '✦', 11: '🍳', 12: '⚒', 13: '🛏', 14: '💰', 15: '📦', 20: '🌱', 22: '🌀',
}

export default function TileRenderer({
  map, tileColors, tileSize, cameraX, cameraY,
  viewportW, viewportH, entities, biome
}: TileRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spriteLoadTick, setSpriteLoadTick] = useState(0)

  // Preload tile sprites for current biome
  useEffect(() => {
    const sprites = TILE_SPRITES[biome || 'garrigue'] || {}
    Object.values(sprites).forEach(filename => loadTileImage(filename))
    // Also load maison tiles
    Object.values(TILE_SPRITES.maison_ext || {}).forEach(filename => loadTileImage(filename))
    Object.values(TILE_SPRITES.maison_int || {}).forEach(filename => loadTileImage(filename))
    // Retry after images load
    const timer = setTimeout(() => setSpriteLoadTick(t => t + 1), 500)
    return () => clearTimeout(timer)
  }, [biome])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = viewportW
    canvas.height = viewportH

    const tilesX = Math.ceil(viewportW / tileSize) + 2
    const tilesY = Math.ceil(viewportH / tileSize) + 2
    const startX = Math.floor(cameraX - tilesX / 2)
    const startY = Math.floor(cameraY - tilesY / 2)
    const offsetX = -(cameraX - Math.floor(cameraX)) * tileSize - (tilesX / 2 - Math.floor(tilesX / 2)) * tileSize
    const offsetY = -(cameraY - Math.floor(cameraY)) * tileSize - (tilesY / 2 - Math.floor(tilesY / 2)) * tileSize

    ctx.fillStyle = '#1a1232'
    ctx.fillRect(0, 0, viewportW, viewportH)
    ctx.imageSmoothingEnabled = false

    // Get sprite mapping for current biome
    const sprites = TILE_SPRITES[biome || 'garrigue'] || {}

    for (let dy = 0; dy < tilesY; dy++) {
      for (let dx = 0; dx < tilesX; dx++) {
        const mapX = startX + dx
        const mapY = startY + dy
        if (mapX < 0 || mapY < 0 || mapY >= map.length || mapX >= (map[0]?.length || 0)) continue

        const tileId = map[mapY][mapX]
        const screenX = dx * tileSize + offsetX
        const screenY = dy * tileSize + offsetY

        // Try to draw PNG tile sprite first
        const spriteName = sprites[tileId]
        const spriteImg = spriteName ? tileImageCache.get(spriteName) : null

        if (spriteImg) {
          // Draw real tile sprite
          ctx.drawImage(spriteImg, screenX, screenY, tileSize, tileSize)
        } else {
          // Fallback: colored rectangle
          ctx.fillStyle = tileColors[tileId] || '#333'
          ctx.fillRect(screenX, screenY, tileSize, tileSize)

          // Grid lines (subtle)
          ctx.strokeStyle = 'rgba(0,0,0,0.08)'
          ctx.lineWidth = 0.5
          ctx.strokeRect(screenX, screenY, tileSize, tileSize)
        }

        // Special tile emoji overlays (only if no sprite loaded)
        if (!spriteImg && tileId >= 10 && tileId < 30) {
          const emoji = TILE_EMOJIS[tileId]
          if (emoji) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.font = `${tileSize * 0.5}px serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(emoji, screenX + tileSize / 2, screenY + tileSize / 2)
          }
        }
      }
    }

    // Draw entities (players, NPCs, monsters)
    if (entities) {
      entities.forEach(e => {
        const ex = (e.x - startX) * tileSize + offsetX
        const ey = (e.y - startY) * tileSize + offsetY
        ctx.fillStyle = e.color
        ctx.beginPath()
        ctx.arc(ex + tileSize / 2, ey + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
        if (e.label) {
          ctx.fillStyle = '#fff'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(e.label, ex + tileSize / 2, ey - 2)
        }
      })
    }
  }, [map, tileColors, tileSize, cameraX, cameraY, viewportW, viewportH, entities, biome, spriteLoadTick])

  return <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
}
