"use client";
import { useState, useEffect } from "react";

interface Slide { image?: string; text: string; }

export function StorySequence({ slides, onComplete }: { slides: Slide[]; onComplete: () => void }) {
  const [idx, setIdx] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [imgFailed, setImgFailed] = useState<Set<number>>(new Set());

  useEffect(() => { setTimeout(() => setTextVisible(true), 300); }, []);

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
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: textVisible ? 0.6 : 0, transition: "opacity 0.5s" }}
      />}

      {/* Text + buttons — centered, fades in/out */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
        opacity: textVisible ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <p style={{
          color: "#FFF8E7", fontSize: 17, lineHeight: 1.8,
          fontFamily: "'Courier New',monospace", textAlign: "center",
          maxWidth: 340, textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}>{slide.text}</p>

        <button onClick={next} style={{
          marginTop: 24, background: "linear-gradient(145deg, #7A9E3F, #5A7E2F)",
          color: "#FFF", border: "2px solid #3D5E1A", borderRadius: 10,
          padding: "14px 36px", fontSize: 16, fontWeight: "bold",
          fontFamily: "'Courier New',monospace", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
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
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {slides.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#F4D03F" : "rgba(255,255,255,0.25)", transition: "background 0.3s" }} />)}
      </div>
    </div>
  );
}
