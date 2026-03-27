'use client'

import { useState, useEffect, useCallback } from 'react'
import { shouldShowPopup, markPopupSeen } from '@/lib/storyEngine'

// CDC M6 : Popups contextuelles
// Première fois qu'un événement se produit → tooltip en haut
// Disparaît après 5 secondes ou tap
// Chaque popup ne s'affiche qu'UNE fois

interface ContextualPopupProps {
  triggerKey: string // ex: 'first_combat', 'first_craft'
  show: boolean      // condition externe pour déclencher
}

export default function ContextualPopup({ triggerKey, show }: ContextualPopupProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    const msg = shouldShowPopup(triggerKey)
    if (msg) {
      setMessage(msg)
      setVisible(true)
      markPopupSeen(triggerKey)
      const timer = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [show, triggerKey])

  const dismiss = useCallback(() => {
    setVisible(false)
  }, [])

  if (!visible || !message) return null

  return (
    <div onClick={dismiss} style={{
      position: 'fixed', top: 40, left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, cursor: 'pointer', maxWidth: '90%',
      animation: 'popupSlideIn 0.4s ease-out',
    }}>
      <div style={{
        background: 'rgba(35,27,66,0.95)', border: '1px solid #C9A84C',
        borderRadius: 12, padding: '10px 18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(201,168,76,0.2)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: 13, color: '#F5ECD7', lineHeight: 1.5, textAlign: 'center' }}>
          {message}
        </div>
        <div style={{ fontSize: 9, color: '#6b5e8a', textAlign: 'center', marginTop: 4 }}>
          tap pour fermer
        </div>
      </div>
      <style>{`
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Raccourci pour les scènes : hook qui gère le popup
export function useContextualPopup() {
  const [activePopup, setActivePopup] = useState<string | null>(null)

  const trigger = useCallback((key: string) => {
    const msg = shouldShowPopup(key)
    if (msg) {
      setActivePopup(key)
      markPopupSeen(key)
    }
  }, [])

  return { activePopup, trigger, PopupComponent: activePopup ? ContextualPopup : null }
}
