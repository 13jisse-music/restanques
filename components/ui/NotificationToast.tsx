'use client'

import { useState, useEffect } from 'react'

// CDC M4: Toast notification system — shows messages at top of screen

interface Toast { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error' }

let toastId = 0
let toastCallback: ((toast: Toast) => void) | null = null

export function showToast(message: string, type: Toast['type'] = 'info') {
  toastCallback?.({ id: ++toastId, message, type })
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastCallback = (toast: Toast) => {
      setToasts(prev => [...prev.slice(-3), toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    }
    return () => { toastCallback = null }
  }, [])

  if (toasts.length === 0) return null

  const colors = { info: '#C9A84C', success: '#7ec850', warning: '#ef9f27', error: '#e24b4a' }

  return (
    <div style={{ position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 600, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'rgba(35,27,66,0.95)', border: `1px solid ${colors[t.type]}`,
          borderRadius: 10, padding: '8px 16px', fontSize: 12, color: '#F5ECD7',
          boxShadow: `0 4px 15px rgba(0,0,0,0.5), 0 0 8px ${colors[t.type]}33`,
          animation: 'toastIn 0.3s ease-out',
          maxWidth: '90vw', textAlign: 'center',
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
