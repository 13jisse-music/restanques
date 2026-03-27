'use client'

// CDC M2: Combo text flottant + combo window indicator (2s pulsing circle)

interface ComboIndicatorProps {
  text: string | null
  comboWindowActive?: boolean // true = within 2s combo window
}

export default function ComboIndicator({ text, comboWindowActive }: ComboIndicatorProps) {
  return (
    <>
      {/* Combo window indicator — pulsing circle */}
      {comboWindowActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 80, height: 80, borderRadius: '50%',
          border: '2px solid rgba(239,159,39,0.4)',
          animation: 'comboWindowPulse 1s infinite',
          pointerEvents: 'none', zIndex: 5,
        }} />
      )}

      {/* Combo text floating */}
      {text && (
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
          fontSize: 20, fontWeight: 700, color: '#ef9f27',
          textShadow: '0 0 10px rgba(239,159,39,0.8), 0 2px 4px rgba(0,0,0,0.8)',
          animation: 'comboFloat 1.5s ease-out forwards',
          whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {text}
        </div>
      )}

      <style>{`
        @keyframes comboWindowPulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes comboFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-15px) scale(1.1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.9); }
        }
      `}</style>
    </>
  )
}
