"use client";
import { useState, useEffect } from "react";
import { sounds } from "../../lib/sounds";

interface Slide { image?: string; text: string; }

export function StorySequence({ slides, onComplete, musicId = "story" }: { slides: Slide[]; onComplete: () => void; musicId?: string }) {
  const [idx, setIdx] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [imgFailed, setImgFailed] = useState<Set<number>>(new Set());

  useEffect(() => { setTimeout(() => setTextVisible(true), 300); sounds.playMusic(musicId); }, [musicId]);

  const next = () => {
    setTextVisible(false);
    setTimeout(() => {
      if (idx < slides.length - 1) {
        setIdx((i) => i + 1);
        setTimeout(() => setTextVisible(true), 300);
      } else {
        onComplete();
      }
    }, 500);
  };

  const slide = slides[idx];
  const hasImg = slide.image && !imgFailed.has(idx);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000" }}>
      {/* Image behind (if exists) */}
      {hasImg && <img
        src={slide.image} alt=""
        onError={() => setImgFailed((s) => new Set(s).add(idx))}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: textVisible ? 1 : 0, transition: "opacity 0.8s" }}
      />}

      {/* Text at BOTTOM over gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.85) 25%)",
        padding: "60px 20px 20px",
        opacity: textVisible ? 1 : 0, transition: "opacity 0.5s ease",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <p style={{
          color: "#FFF8E7", fontSize: 18, lineHeight: 1.8,
          fontFamily: "'Crimson Text', Georgia, serif", textAlign: "center",
          maxWidth: 340, textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
          letterSpacing: 0.3, margin: 0,
        }}>{slide.text}</p>

        <button onClick={next} style={{
          marginTop: 16, background: "linear-gradient(135deg, #6B8E23, #556B2F)",
          color: "#FFF8E7", border: "2px solid #DAA520", borderRadius: 12,
          padding: "12px 32px", fontSize: 16, fontWeight: "bold",
          fontFamily: "'Crimson Text', Georgia, serif", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)", letterSpacing: 2,
        }}>
          {idx < slides.length - 1 ? "Suivant →" : "Commencer !"}
        </button>
      </div>

      {/* Skip button */}
      <button onClick={onComplete} style={{
        position: "absolute", top: 16, right: 16, zIndex: 1,
        background: "rgba(0,0,0,0.4)", color: "#D4C5A9",
        border: "1px solid #8B7355", borderRadius: 6,
        padding: "6px 12px", fontSize: 12, cursor: "pointer",
        fontFamily: "'Courier New',monospace",
      }}>Passer ⏭️</button>

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12 }}>
        {slides.map((_, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i === idx ? "#DAA520" : "rgba(255,255,255,0.4)", transition: "background 0.3s" }} />)}
      </div>
    </div>
  );
}
