'use client'

import { useGameStore } from '@/store/gameStore'

export default function WeatherOverlay() {
  const weather = useGameStore(s => s.weather)

  if (weather === 'clear') return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, transition: 'opacity 2s' }}>
      {weather === 'rain' && (
        <>
          <style>{`
            @keyframes rainDrop { 0%{transform:translateY(-10px);opacity:0} 10%{opacity:0.6} 100%{transform:translateY(100vh);opacity:0} }
          `}</style>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${(i * 2.5) % 100}%`, top: -10,
              width: 1, height: 12, background: 'rgba(133,183,235,0.5)', borderRadius: 1,
              animation: `rainDrop ${0.5 + Math.random() * 0.5}s linear ${Math.random() * 2}s infinite`,
            }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(100,130,180,0.08)' }} />
        </>
      )}

      {weather === 'fog' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,200,220,0.25)', backdropFilter: 'blur(1px)' }} />
      )}

      {weather === 'wind' && (
        <>
          <style>{`
            @keyframes windParticle { 0%{transform:translateX(-20px);opacity:0} 20%{opacity:0.4} 100%{transform:translateX(100vw);opacity:0} }
          `}</style>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: -20, top: `${(i * 5) % 100}%`,
              width: 15 + Math.random() * 20, height: 1, background: 'rgba(245,236,215,0.2)', borderRadius: 1,
              animation: `windParticle ${1 + Math.random() * 2}s linear ${Math.random() * 3}s infinite`,
            }} />
          ))}
        </>
      )}
    </div>
  )
}
