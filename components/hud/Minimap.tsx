'use client'

import { useRef, useEffect } from 'react'

interface MinimapProps {
  map: number[][]
  tileColors: Record<number, string>
  playerX: number
  playerY: number
  playerColor: string
  fogRadius?: number
  size?: number
  entities?: { x: number; y: number; color: string }[]
}

export default function Minimap({
  map, tileColors, playerX, playerY, playerColor,
  fogRadius = 12, size = 68, entities
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !map.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    const mapH = map.length
    const mapW = map[0]?.length || 0
    const scaleX = size / mapW
    const scaleY = size / mapH

    // Draw map
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = map[y][x]
        const dist = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2)

        if (dist > fogRadius) {
          ctx.fillStyle = '#0a0a1a'
        } else {
          ctx.fillStyle = tileColors[tile] || '#333'
          // Dim edges of fog
          if (dist > fogRadius * 0.7) {
            ctx.globalAlpha = 1 - (dist - fogRadius * 0.7) / (fogRadius * 0.3)
          }
        }

        ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY))
        ctx.globalAlpha = 1
      }
    }

    // Draw entities
    if (entities) {
      entities.forEach(e => {
        const dist = Math.sqrt((e.x - playerX) ** 2 + (e.y - playerY) ** 2)
        if (dist > fogRadius) return
        ctx.fillStyle = e.color
        ctx.beginPath()
        ctx.arc(e.x * scaleX + scaleX / 2, e.y * scaleY + scaleY / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw player (always visible, with white border)
    ctx.fillStyle = playerColor
    ctx.beginPath()
    ctx.arc(playerX * scaleX + scaleX / 2, playerY * scaleY + scaleY / 2, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()

  }, [map, tileColors, playerX, playerY, playerColor, fogRadius, size, entities])

  return (
    <div style={{
      position: 'absolute', top: 4, right: 4, zIndex: 50,
      border: '2px solid rgba(139,105,20,0.6)', borderRadius: 6,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
