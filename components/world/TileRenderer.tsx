'use client'

import { useRef, useEffect } from 'react'

interface TileRendererProps {
  map: number[][]
  tileColors: Record<number, string>
  tileSize: number
  cameraX: number
  cameraY: number
  viewportW: number
  viewportH: number
  entities?: { x: number; y: number; color: string; label?: string }[]
}

export default function TileRenderer({
  map, tileColors, tileSize, cameraX, cameraY,
  viewportW, viewportH, entities
}: TileRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    for (let dy = 0; dy < tilesY; dy++) {
      for (let dx = 0; dx < tilesX; dx++) {
        const mapX = startX + dx
        const mapY = startY + dy
        if (mapX < 0 || mapY < 0 || mapY >= map.length || mapX >= (map[0]?.length || 0)) continue

        const tileId = map[mapY][mapX]
        const color = tileColors[tileId] || '#333'
        const screenX = dx * tileSize + offsetX
        const screenY = dy * tileSize + offsetY

        ctx.fillStyle = color
        ctx.fillRect(screenX, screenY, tileSize, tileSize)

        ctx.strokeStyle = 'rgba(0,0,0,0.1)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(screenX, screenY, tileSize, tileSize)

        if (tileId >= 10 && tileId < 30) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          ctx.font = `${tileSize * 0.5}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const emojis: Record<number, string> = {
            10: '✦', 11: '🍳', 12: '⚒', 13: '🛏', 14: '💰', 15: '📦',
            20: '🌱', 22: '🌀',
          }
          ctx.fillText(emojis[tileId] || '?', screenX + tileSize / 2, screenY + tileSize / 2)
        }
      }
    }

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
  }, [map, tileColors, tileSize, cameraX, cameraY, viewportW, viewportH, entities])

  return <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
}
