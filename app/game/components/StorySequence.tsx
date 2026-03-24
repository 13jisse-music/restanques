"use client";
import { useState, useEffect, useRef } from "react";
import { sounds } from "../../lib/sounds";

interface Slide { image?: string; text: string; }

export function StorySequence({ slides, onComplete, musicId = "story" }: { slides: Slide[]; onComplete: () => void; musicId?: string }) {
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [textDone, setTextDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [imgFailed, setImgFailed] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    sounds.stopMusic();
    sounds.storyActive = true;
    setTimeout(() => sounds.playMusic(musicId), 100);
    return () => { sounds.storyActive = false; clearInterval(timerRef.current); };
  }, [musicId]);

  // Typewriter effect — reset on slide change
  useEffect(() => {
    const text = slides[idx]?.text || "";
    setCharIdx(0);
    setTextDone(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCharIdx(prev => {
        const next = prev + 1;
        if (next >= text.length) {
          setTextDone(true);
          clearInterval(timerRef.current);
          return text.length;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(timerRef.current);
  }, [idx, slides]);

  const handleTap = () => {
    if (!textDone) {
      // Skip typewriter — show full text
      clearInterval(timerRef.current);
      setCharIdx(slides[idx]?.text.length || 0);
      setTextDone(true);
      return;
    }
    // Next slide
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
  if (!slide) return null;
  const hasImg = slide.image && !imgFailed.has(idx);
  const displayText = slide.text.slice(0, charIdx);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", touchAction: "none" }} onClick={handleTap}>
      {/* Image background */}
      {hasImg && <img
        src={slide.image} alt=""
        onError={() => setImgFailed(s => new Set(s).add(idx))}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", backgroundColor: "#000",
          opacity: fading ? 0 : 1, transition: "opacity 0.5s",
        }}
      />}

      {/* Text box — centered, fixed width */}
      <div style={{
        position: "absolute", bottom: "15%", left: "50%",
        transform: "translateX(-50%)",
        width: "88%", maxWidth: 360, padding: "20px 24px",
        background: "rgba(0,0,0,0.8)", borderRadius: 16,
        border: "1px solid rgba(218,165,32,0.3)",
        opacity: fading ? 0 : 1, transition: "opacity 0.5s",
      }}>
        <div style={{
          color: "#FFF8E7", fontSize: 17, lineHeight: 1.8,
          fontFamily: "'Crimson Text', Georgia, serif", textAlign: "center",
          textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
          letterSpacing: 0.3, minHeight: 50,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {displayText}
          {!textDone && <span style={{ opacity: 0.6 }}>▌</span>}
        </div>

        {textDone && <div style={{
          marginTop: 12, textAlign: "center", fontSize: 13,
          color: "#DAA520", fontFamily: "'Crimson Text', serif",
          letterSpacing: 2,
        }}>
          {idx < slides.length - 1 ? "Tap → Suivant" : "Tap → Commencer !"}
        </div>}
      </div>

      {/* Skip button */}
      <button onClick={(e) => { e.stopPropagation(); onComplete(); }} style={{
        position: "absolute", top: 16, right: 16, zIndex: 1,
        background: "rgba(0,0,0,0.5)", color: "#D4C5A9",
        border: "1px solid rgba(139,115,85,0.5)", borderRadius: 8,
        padding: "8px 14px", fontSize: 12, cursor: "pointer",
      }}>Passer ⏭️</button>

      {/* Dots */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
        {slides.map((_, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i === idx ? "#DAA520" : "rgba(255,255,255,0.3)" }} />)}
      </div>
    </div>
  );
}
