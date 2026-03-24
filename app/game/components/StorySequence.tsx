"use client";
import { useState, useEffect, useRef } from "react";
import { sounds } from "../../lib/sounds";

interface Slide { image?: string; text: string; }

export function StorySequence({ slides, onComplete, musicId = "story" }: { slides: Slide[]; onComplete: () => void; musicId?: string }) {
  const [idx, setIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [textDone, setTextDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [imgFailed, setImgFailed] = useState<Set<number>>(new Set());
  const typewriterRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    sounds.stopMusic();
    sounds.storyActive = true;
    setTimeout(() => sounds.playMusic(musicId), 100);
    return () => { sounds.storyActive = false; clearInterval(typewriterRef.current); };
  }, [musicId]);

  // Typewriter effect
  useEffect(() => {
    const text = slides[idx]?.text || "";
    setDisplayedText("");
    setTextDone(false);
    let i = 0;
    clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      if (i >= text.length) { setDisplayedText(text); setTextDone(true); clearInterval(typewriterRef.current); }
      else setDisplayedText(text.slice(0, i));
    }, 30);
    return () => clearInterval(typewriterRef.current);
  }, [idx, slides]);

  const handleTap = () => {
    if (!textDone) {
      // Skip typewriter → show full text
      clearInterval(typewriterRef.current);
      setDisplayedText(slides[idx]?.text || "");
      setTextDone(true);
      return;
    }
    // Go to next slide
    setFading(true);
    setTimeout(() => {
      if (idx < slides.length - 1) {
        setIdx(i => i + 1);
        setFading(false);
      } else {
        onComplete();
      }
    }, 500);
  };

  const slide = slides[idx];
  const hasImg = slide?.image && !imgFailed.has(idx);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000" }} onClick={handleTap}>
      {/* Image — contain so nothing is cut */}
      {hasImg && <img
        src={slide.image} alt=""
        onError={() => setImgFailed(s => new Set(s).add(idx))}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", backgroundColor: "#000",
          opacity: fading ? 0 : 1, transition: "opacity 0.5s",
        }}
      />}

      {/* Text centered over image */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "85%", padding: 24,
        background: "rgba(0,0,0,0.7)", borderRadius: 16,
        opacity: fading ? 0 : 1, transition: "opacity 0.5s",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <p style={{
          color: "#FFF8E7", fontSize: 18, lineHeight: 1.8,
          fontFamily: "'Crimson Text', Georgia, serif", textAlign: "center",
          textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
          letterSpacing: 0.3, margin: 0, minHeight: 60,
        }}>{displayedText}<span style={{ opacity: textDone ? 0 : 1, animation: "blink 0.8s infinite" }}>|</span></p>

        {textDone && <div style={{
          marginTop: 16, fontSize: 14, color: "#DAA520",
          fontFamily: "'Crimson Text', serif", letterSpacing: 2,
          opacity: 1, animation: "fadeIn 0.5s ease",
        }}>
          {idx < slides.length - 1 ? "Tap pour continuer →" : "Tap pour commencer !"}
        </div>}
      </div>

      {/* Skip */}
      <button onClick={(e) => { e.stopPropagation(); onComplete(); }} style={{
        position: "absolute", top: 16, right: 16, zIndex: 1,
        background: "rgba(0,0,0,0.5)", color: "#D4C5A9",
        border: "1px solid #8B7355", borderRadius: 6,
        padding: "6px 12px", fontSize: 12, cursor: "pointer",
      }}>Passer ⏭️</button>

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12 }}>
        {slides.map((_, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i === idx ? "#DAA520" : "rgba(255,255,255,0.4)" }} />)}
      </div>
    </div>
  );
}
