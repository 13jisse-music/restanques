"use client";
import { useState, useEffect } from "react";

interface Slide { image?: string; text: string; }

export function StorySequence({ slides, onComplete }: { slides: Slide[]; onComplete: () => void }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [imgFailed, setImgFailed] = useState<Set<number>>(new Set());

  useEffect(() => { setTimeout(() => setFade(false), 100); }, []);

  const next = () => {
    setFade(true);
    setTimeout(() => {
      if (idx < slides.length - 1) { setIdx(idx + 1); setFade(false); }
      else onComplete();
    }, 500);
  };

  const slide = slides[idx];
  const hasImg = slide.image && !imgFailed.has(idx);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", flexDirection: "column", justifyContent: "flex-end", opacity: fade ? 0 : 1, transition: "opacity 0.5s ease" }}>
      {hasImg && <img
        src={slide.image}
        alt=""
        onError={() => setImgFailed((s) => new Set(s).add(idx))}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />}
      <div style={{ position: "relative", zIndex: 1, background: "rgba(0,0,0,0.75)", padding: "20px 16px 24px", backdropFilter: "blur(4px)" }}>
        <p style={{ color: "#FFF8E7", fontSize: 15, lineHeight: 1.7, fontFamily: "'Courier New',monospace", margin: 0, textAlign: "center" }}>{slide.text}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 14 }}>
          <button onClick={next} style={{ background: "linear-gradient(145deg, #7A9E3F, #5A7E2F)", color: "#FFF", border: "2px solid #3D5E1A", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: "bold", fontFamily: "'Courier New',monospace", cursor: "pointer" }}>
            {idx < slides.length - 1 ? "Suivant →" : "Commencer !"}
          </button>
        </div>
        <div style={{ position: "absolute", top: -36, right: 12 }}>
          <button onClick={onComplete} style={{ background: "rgba(0,0,0,0.5)", color: "#D4C5A9", border: "1px solid #8B7355", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Courier New',monospace" }}>Passer ⏭️</button>
        </div>
      </div>
      {/* Dots */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
        {slides.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#F4D03F" : "rgba(255,255,255,0.3)" }} />)}
      </div>
    </div>
  );
}
