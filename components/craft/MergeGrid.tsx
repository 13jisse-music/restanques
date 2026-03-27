'use client'

import { useState, useRef, useCallback } from 'react'

export interface Ingredient {
  id: string
  name: string
  emoji: string
  level: number
  color: string
}

interface MergeGridProps {
  ingredients: Ingredient[] // ingredients to place on grid
  targetLevel: number // level needed to complete
  targetCount: number // how many merged ingredients needed
  timeLimit?: number // seconds, 0 = no timer
  onComplete: (success: boolean) => void
  onCancel: () => void
}

const GRID = 4
const CELL = 72

export default function MergeGrid({ ingredients, targetLevel, targetCount, timeLimit, onComplete, onCancel }: MergeGridProps) {
  // Grid: 4x4, each cell = Ingredient | null
  const [grid, setGrid] = useState<(Ingredient | null)[]>(() => {
    const cells: (Ingredient | null)[] = new Array(GRID * GRID).fill(null)
    // Place ingredients randomly
    const positions = Array.from({ length: GRID * GRID }, (_, i) => i)
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    ingredients.forEach((ing, idx) => {
      if (idx < positions.length) cells[positions[idx]] = { ...ing }
    })
    return cells
  })

  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [mergeFlash, setMergeFlash] = useState<number | null>(null)
  const [timer, setTimer] = useState(timeLimit || 0)
  const [completed, setCompleted] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Timer
  useState(() => {
    if (!timeLimit) return
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(interval); onComplete(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  })

  // Check win condition
  const checkWin = useCallback((cells: (Ingredient | null)[]) => {
    const merged = cells.filter(c => c && c.level >= targetLevel)
    if (merged.length >= targetCount) {
      setCompleted(true)
      setTimeout(() => onComplete(true), 500)
    }
  }, [targetLevel, targetCount, onComplete])

  // Get adjacent cells
  const getAdjacent = (idx: number): number[] => {
    const r = Math.floor(idx / GRID), c = idx % GRID
    const adj: number[] = []
    if (r > 0) adj.push((r - 1) * GRID + c)
    if (r < GRID - 1) adj.push((r + 1) * GRID + c)
    if (c > 0) adj.push(r * GRID + (c - 1))
    if (c < GRID - 1) adj.push(r * GRID + (c + 1))
    return adj
  }

  // Touch/mouse handlers
  const getGridPos = (clientX: number, clientY: number) => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const col = Math.floor(x / CELL)
    const row = Math.floor(y / CELL)
    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return null
    return row * GRID + col
  }

  const startDrag = (idx: number, clientX: number, clientY: number) => {
    if (!grid[idx] || completed) return
    setDragging(idx)
    const rect = gridRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({ x: clientX - rect.left - (idx % GRID) * CELL, y: clientY - rect.top - Math.floor(idx / GRID) * CELL })
      setDragPos({ x: clientX, y: clientY })
    }
  }

  const moveDrag = (clientX: number, clientY: number) => {
    if (dragging === null) return
    setDragPos({ x: clientX, y: clientY })
  }

  const endDrag = (clientX: number, clientY: number) => {
    if (dragging === null) return
    const target = getGridPos(clientX, clientY)

    if (target !== null && target !== dragging) {
      const newGrid = [...grid]
      const src = newGrid[dragging]
      const dst = newGrid[target]

      if (dst && src && src.id === dst.id && src.level === dst.level && getAdjacent(dragging).includes(target)) {
        // Merge!
        newGrid[target] = { ...src, level: src.level + 1 }
        newGrid[dragging] = null
        setMergeFlash(target)
        setTimeout(() => setMergeFlash(null), 300)
        try { navigator.vibrate?.(50) } catch {}
        setGrid(newGrid)
        checkWin(newGrid)
      } else if (!dst) {
        // Move to empty cell
        newGrid[target] = src
        newGrid[dragging] = null
        setGrid(newGrid)
      }
    }

    setDragging(null)
  }

  const mergedCount = grid.filter(c => c && c.level >= targetLevel).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#ef9f27', fontWeight: 600 }}>Merge les ingredients !</div>
        <div style={{ fontSize: 11, color: '#9a8fbf' }}>
          Glisse les identiques ensemble pour fusionner — {mergedCount}/{targetCount} au niveau {targetLevel}
        </div>
      </div>

      {/* Timer */}
      {timeLimit ? (
        <div style={{ fontSize: 16, color: timer < 10 ? '#e24b4a' : '#ef9f27', fontWeight: 700 }}>
          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </div>
      ) : null}

      {/* Grid */}
      <div
        ref={gridRef}
        style={{
          display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`, gridTemplateRows: `repeat(${GRID}, ${CELL}px)`,
          gap: 2, background: '#3a2d5c', borderRadius: 12, padding: 4,
          border: '2px solid #8B6914', touchAction: 'none',
        }}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={(e) => endDrag(e.clientX, e.clientY)}
        onMouseLeave={() => setDragging(null)}
        onTouchMove={(e) => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEnd={(e) => { const t = e.changedTouches[0]; endDrag(t.clientX, t.clientY) }}
      >
        {grid.map((cell, idx) => (
          <div
            key={idx}
            style={{
              width: CELL, height: CELL, background: mergeFlash === idx ? '#7ec85044' : '#231b42',
              borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: mergeFlash === idx ? '2px solid #7ec850' : '1px solid #3a2d5c44',
              opacity: dragging === idx ? 0.3 : 1, cursor: cell ? 'grab' : 'default',
              transition: 'background 0.2s, border 0.2s',
            }}
            onMouseDown={(e) => startDrag(idx, e.clientX, e.clientY)}
            onTouchStart={(e) => { e.preventDefault(); startDrag(idx, e.touches[0].clientX, e.touches[0].clientY) }}
          >
            {cell && (
              <>
                <span style={{ fontSize: 28 }}>{cell.emoji}</span>
                <span style={{ fontSize: 9, color: cell.color, fontWeight: 600 }}>
                  Nv{cell.level}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Dragging overlay */}
      {dragging !== null && grid[dragging] && (
        <div style={{
          position: 'fixed', left: dragPos.x - 30, top: dragPos.y - 30,
          width: 60, height: 60, background: '#231b42ee', borderRadius: 12,
          border: '2px solid #e91e8c', display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 999, fontSize: 32,
          boxShadow: '0 4px 15px rgba(233,30,140,0.4)',
        }}>
          {grid[dragging]?.emoji}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          padding: '8px 20px', background: '#2d2252', border: '1px solid #3a2d5c',
          borderRadius: 8, color: '#9a8fbf', fontSize: 12, cursor: 'pointer',
        }}>Annuler</button>
      </div>

      {/* Completed overlay */}
      {completed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 32, color: '#7ec850', fontWeight: 700, textShadow: '0 0 20px rgba(126,200,80,0.8)' }}>
            Merge complet !
          </div>
        </div>
      )}
    </div>
  )
}
