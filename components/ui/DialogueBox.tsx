'use client'

import { useState, useEffect, useRef } from 'react'

// CDC M4: NPC dialogue with portrait, typewriter, quest accept/refuse

interface DialogueBoxProps {
  npcName: string
  portrait?: string // path to 256x256 portrait
  texts: string[]   // lines of dialogue
  quest?: { id: string; desc: string; reward: string } | null
  onClose: () => void
  onAcceptQuest?: (questId: string) => void
}

export default function DialogueBox({ npcName, portrait, texts, quest, onClose, onAcceptQuest }: DialogueBoxProps) {
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [showQuest, setShowQuest] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentText = texts[textIdx] || ''
  const displayedText = currentText.slice(0, charIdx)
  const isComplete = charIdx >= currentText.length
  const isLastText = textIdx >= texts.length - 1

  // Typewriter effect
  useEffect(() => {
    setCharIdx(0)
  }, [textIdx])

  useEffect(() => {
    if (charIdx < currentText.length) {
      timerRef.current = setInterval(() => setCharIdx(prev => prev + 1), 30)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [textIdx, charIdx, currentText.length])

  const handleTap = () => {
    if (!isComplete) {
      setCharIdx(currentText.length)
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (isLastText) {
      if (quest && !showQuest) {
        setShowQuest(true)
      } else {
        onClose()
      }
    } else {
      setTextIdx(prev => prev + 1)
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 250,
      background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.85) 20%)',
      padding: '40px 16px 20px',
    }} onClick={handleTap}>
      <div style={{
        background: 'rgba(35,27,66,0.95)', border: '1px solid #C9A84C',
        borderRadius: 12, padding: '14px 16px', maxWidth: 440, margin: '0 auto',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }}>
        {/* NPC header with portrait */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          {portrait ? (
            <img src={portrait} alt={npcName} style={{
              width: 48, height: 48, borderRadius: 8, objectFit: 'cover',
              border: '2px solid #C9A84C', imageRendering: 'pixelated',
            }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 8, background: '#2d1f54',
              border: '2px solid #C9A84C', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 24,
            }}>👤</div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#C9A84C' }}>{npcName}</div>
            <div style={{ fontSize: 9, color: '#6b5e8a' }}>
              {textIdx + 1}/{texts.length}{quest ? ' · Quête disponible' : ''}
            </div>
          </div>
        </div>

        {/* Dialogue text */}
        {!showQuest ? (
          <div style={{ fontSize: 13, color: '#d0c8e4', lineHeight: 1.7, minHeight: 40 }}>
            {displayedText}
            {!isComplete && <span style={{ opacity: 0.5, animation: 'dlgBlink 0.7s infinite' }}>▌</span>}
          </div>
        ) : (
          /* Quest panel */
          <div>
            <div style={{ fontSize: 12, color: '#ef9f27', fontWeight: 600, marginBottom: 6 }}>📜 Quête : {quest!.desc}</div>
            <div style={{ fontSize: 11, color: '#7ec850', marginBottom: 10 }}>Récompense : {quest!.reward}</div>
            <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { onAcceptQuest?.(quest!.id); onClose() }} style={{
                flex: 1, padding: '10px', background: '#7ec850', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Accepter</button>
              <button onClick={onClose} style={{
                flex: 1, padding: '10px', background: '#3a2d5c', color: '#9a8fbf', border: 'none',
                borderRadius: 8, fontSize: 12, cursor: 'pointer',
              }}>Refuser</button>
            </div>
          </div>
        )}

        {/* Hint */}
        {!showQuest && (
          <div style={{ fontSize: 9, color: '#6b5e8a', textAlign: 'center', marginTop: 6 }}>
            {isComplete ? (isLastText ? (quest ? '▶ Voir la quête' : '▶ Fermer') : 'Tap ▶') : 'Tap = accélérer'}
          </div>
        )}
      </div>
      <style>{`@keyframes dlgBlink { 0%,100%{opacity:0.5} 50%{opacity:0} }`}</style>
    </div>
  )
}
