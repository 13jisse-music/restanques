'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getStoryById, markStorySeen, isStorySeen } from '@/lib/storyEngine'
import { stopMusic } from '@/lib/assetLoader'

// CDC M6 : Visual Novel plein écran
// - Image de fond (story_[id].png) ou gradient
// - Audio narration (story_[id].mp3) automatique, silence si absent
// - Texte typewriter 35ms/lettre en bas
// - Tap = accélérer / phrase suivante / fin
// - Skip en haut à droite
// - Fade noir 1s entrée/sortie
// - Marquage story_seen (Supabase + localStorage)

export default function SceneStory() {
  const { sceneData, transitionToScene, previousScene } = useGameStore()

  const storyId = (sceneData as Record<string, string> | null)?.storyId || 'story_intro'
  const nextScene = (sceneData as Record<string, string> | null)?.nextScene || previousScene || 'maison'
  const storyChain = (sceneData as Record<string, string> | null)?.storyChain || null

  const story = getStoryById(storyId)
  const texts = story?.texts || ['...']
  const title = story?.moment || 'Histoire'
  const image = story?.image || null

  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)   // true = écran noir (fade in)
  const [fadeOut, setFadeOut] = useState(false) // true = transition sortie
  const [imgLoaded, setImgLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentText = texts[textIdx] || ''
  const displayedText = currentText.slice(0, charIdx)
  const isComplete = charIdx >= currentText.length
  const isLastText = textIdx >= texts.length - 1

  // ─── Fade in (1s) ──────────────────────────────────────────────
  useEffect(() => {
    // Stop scene music, play narration audio
    stopMusic()
    const fadeTimer = setTimeout(() => setFadeIn(false), 1000) // CDC M6: fade entree 1s
    return () => clearTimeout(fadeTimer)
  }, [])

  // ─── Audio narration ───────────────────────────────────────────
  useEffect(() => {
    // CDC: "Audio narration joué automatiquement, si absent → silence"
    const audioPath = `/story/${storyId}.mp3`
    const audio = new Audio(audioPath)
    audio.volume = 0.5
    audioRef.current = audio
    audio.play().catch(() => {
      // Pas d'audio pour cette séquence → silence, c'est normal
    })
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [storyId])

  // ─── Mark as seen ──────────────────────────────────────────────
  useEffect(() => {
    markStorySeen(storyId)
  }, [storyId])

  // ─── Typewriter ────────────────────────────────────────────────
  useEffect(() => {
    setCharIdx(0)
  }, [textIdx])

  useEffect(() => {
    if (charIdx < currentText.length) {
      timerRef.current = setInterval(() => setCharIdx(prev => prev + 1), 50) // CDC M6: 50ms par lettre
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [textIdx, charIdx, currentText.length])

  // ─── Navigation ────────────────────────────────────────────────
  const goToNext = useCallback(() => {
    setFadeOut(true)
    // Fade out 1s, then transition
    setTimeout(() => {
      if (storyChain) {
        // Chain to another story (ex: boss_victoire → ending)
        transitionToScene('story', { storyId: storyChain, nextScene })
      } else {
        transitionToScene(nextScene as any)
      }
    }, 1000)
  }, [nextScene, storyChain, transitionToScene])

  const handleTap = useCallback(() => {
    if (fadeOut) return // Already transitioning

    if (!isComplete) {
      // Show all text instantly
      setCharIdx(currentText.length)
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (isLastText) {
      goToNext()
    } else {
      setTextIdx(prev => prev + 1)
    }
  }, [isComplete, isLastText, currentText.length, goToNext, fadeOut])

  const skip = useCallback(() => {
    if (fadeOut) return
    setFadeOut(true)
    setTimeout(() => {
      if (storyChain) {
        transitionToScene('story', { storyId: storyChain, nextScene })
      } else {
        transitionToScene(nextScene as any)
      }
    }, 500)
  }, [nextScene, storyChain, transitionToScene, fadeOut])

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') handleTap()
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleTap, skip])

  return (
    <div onClick={handleTap} style={{
      width: '100%', height: '100dvh', position: 'relative', cursor: 'pointer',
      background: '#000', overflow: 'hidden',
    }}>
      {/* Fade layer */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none',
        background: '#000',
        opacity: fadeIn ? 1 : fadeOut ? 1 : 0,
        transition: `opacity ${fadeIn ? '1s' : fadeOut ? '1s' : '1s'} ease-in-out`,
      }} />

      {/* Background image or gradient */}
      {image ? (
        <img src={image} alt="" onLoad={() => setImgLoaded(true)}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            position: 'absolute', top: 0, left: 0,
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.8s',
          }} />
      ) : (
        <div style={{
          width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
          background: 'linear-gradient(180deg, #0a0818 0%, #1a1232 30%, #2d1f54 60%, #e91e8c11 100%)',
        }} />
      )}

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Skip button */}
      <button onClick={(e) => { e.stopPropagation(); skip() }} style={{
        position: 'absolute', top: 16, right: 16, zIndex: 50,
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8, padding: '8px 16px', color: '#9a8fbf', fontSize: 12, cursor: 'pointer',
        backdropFilter: 'blur(4px)',
      }}>Skip ▸▸</button>

      {/* Title — shown on first text */}
      {textIdx === 0 && (
        <div style={{
          position: 'absolute', top: '10%', width: '100%', textAlign: 'center', zIndex: 10,
          opacity: fadeIn ? 0 : 1, transition: 'opacity 1.5s ease-in 0.5s',
        }}>
          <div style={{
            fontSize: 'clamp(20px, 7vw, 32px)', fontWeight: 700, color: '#e91e8c',
            textShadow: '0 0 30px rgba(233,30,140,0.5), 0 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: 2, fontFamily: 'Georgia, serif',
          }}>
            {title}
          </div>
        </div>
      )}

      {/* Text box — bottom of screen */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.95) 100%)',
        padding: '80px 24px 40px',
      }}>
        <div style={{
          fontSize: 'clamp(14px, 4vw, 17px)', color: '#F5ECD7', lineHeight: 1.8,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)', minHeight: 60,
          maxWidth: 600, margin: '0 auto',
        }}>
          {displayedText}
          {!isComplete && <span style={{ opacity: 0.6, animation: 'storyCursor 0.7s infinite' }}>▌</span>}
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {texts.map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i < textIdx ? '#e91e8c' : i === textIdx ? '#F5ECD7' : '#3a2d5c',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Hint */}
          <div style={{ fontSize: 10, color: '#6b5e8a' }}>
            {isComplete ? (isLastText ? '▶ Continuer' : 'Tap ▶') : 'Tap = accélérer'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes storyCursor {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
