'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'

// Story data
const STORIES: Record<string, { title: string; texts: string[]; image?: string }> = {
  story_intro: {
    title: "Le Mistral se reveille",
    texts: [
      "La Provence est en danger.",
      "Le Mistral, un esprit ancien et furieux, s'est reveille dans les hauteurs des Restanques.",
      "Son souffle glace descend des terrasses ancestrales et menace de tout devaster.",
      "Jisse et Melanie vivent dans leur bastide provencale avec leur chat Sumo.",
      "Quand le vent se leve et que les creatures deviennent hostiles, ils comprennent qu'ils sont les seuls a pouvoir sauver la Provence.",
      "Leur voyage les menera a travers cinq terres... jusqu'au sommet des Restanques.",
    ],
    image: "/story/intro1.png",
  },
  story_garrigue_entree: {
    title: "La Garrigue",
    texts: [
      "Premieres collines, lavande a perte de vue.",
      "Marius le berger les accueille avec mefiance.",
      "Le Sanglier geant terrorise la region depuis des semaines.",
      "Il faudra traverser la garrigue, trouver le donjon du Grand Cerf, et vaincre le boss pour ouvrir le portail.",
    ],
    image: "/story/story_restanques_intro.png",
  },
  story_garrigue_boss_victoire: {
    title: "Victoire sur le Sanglier",
    texts: [
      "Le Sanglier geant tombe.",
      "Le portail vers les Calanques s'ouvre dans un eclat de lumiere bleue.",
      "Le Mistral gronde au loin... ce n'etait que le debut.",
    ],
  },
  story_ending: {
    title: "Epilogue",
    texts: [
      "Le vent se calme. La Provence respire.",
      "Les restanques brillent sous le soleil couchant.",
      "Jisse et Melanie rentrent a la maison. Ensemble.",
      "Sumo ronronne sur le rebord de la fenetre.",
      "Un nouveau voyage commence peut-etre...",
    ],
    image: "/story/ending1.png",
  },
}

export default function SceneStory() {
  const { sceneData, transitionToScene, previousScene } = useGameStore()
  const storyId = (sceneData as Record<string, string> | null)?.storyId || 'story_intro'
  const nextScene = (sceneData as Record<string, string> | null)?.nextScene || previousScene || 'maison'
  const story = STORIES[storyId] || STORIES.story_intro

  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [fade, setFade] = useState(1) // 1=black, 0=visible
  const [imgLoaded, setImgLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentText = story.texts[textIdx] || ''
  const displayedText = currentText.slice(0, charIdx)
  const isComplete = charIdx >= currentText.length
  const isLastText = textIdx >= story.texts.length - 1

  // Fade in
  useEffect(() => { setTimeout(() => setFade(0), 100) }, [])

  // Typewriter
  useEffect(() => {
    if (charIdx < currentText.length) {
      timerRef.current = setInterval(() => setCharIdx(prev => prev + 1), 40)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [textIdx, charIdx, currentText.length])

  // Tap handler
  const handleTap = useCallback(() => {
    if (!isComplete) {
      setCharIdx(currentText.length) // show all text instantly
    } else if (isLastText) {
      // End story
      setFade(1)
      setTimeout(() => transitionToScene(nextScene as any), 800)
    } else {
      setTextIdx(prev => prev + 1)
      setCharIdx(0)
    }
  }, [isComplete, isLastText, currentText.length, nextScene, transitionToScene])

  const skip = () => {
    setFade(1)
    setTimeout(() => transitionToScene(nextScene as any), 500)
  }

  return (
    <div onClick={handleTap} style={{
      width: '100%', height: '100dvh', position: 'relative', cursor: 'pointer',
      background: '#000', transition: 'opacity 0.8s', opacity: 1 - fade,
    }}>
      {/* Background image or gradient */}
      {story.image ? (
        <img src={story.image} alt="" onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
          background: 'linear-gradient(180deg, #1a1232 0%, #2d1f54 50%, #e91e8c22 100%)' }} />
      )}

      {/* Skip button */}
      <button onClick={(e) => { e.stopPropagation(); skip() }} style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8, padding: '6px 14px', color: '#9a8fbf', fontSize: 11, cursor: 'pointer',
      }}>Skip ▸▸</button>

      {/* Title */}
      {textIdx === 0 && (
        <div style={{ position: 'absolute', top: '15%', width: '100%', textAlign: 'center', zIndex: 5 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e91e8c', textShadow: '0 0 20px rgba(233,30,140,0.5)' }}>
            {story.title}
          </div>
        </div>
      )}

      {/* Text box */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 30%)',
        padding: '60px 20px 30px',
      }}>
        <div style={{ fontSize: 15, color: '#F5ECD7', lineHeight: 1.6, textShadow: '0 1px 3px rgba(0,0,0,0.8)', minHeight: 50 }}>
          {displayedText}
          {!isComplete && <span style={{ opacity: 0.5 }}>|</span>}
        </div>
        <div style={{ fontSize: 10, color: '#9a8fbf', marginTop: 8, textAlign: 'center' }}>
          {isComplete ? (isLastText ? 'Tap pour continuer' : `${textIdx + 1}/${story.texts.length} — Tap pour la suite`) : 'Tap pour accelerer'}
        </div>
      </div>

      {/* Audio (try to play, ignore errors) */}
      {story.image && (
        <audio src={`/story/${storyId}.mp3`} autoPlay onError={() => {}} style={{ display: 'none' }} />
      )}
    </div>
  )
}
