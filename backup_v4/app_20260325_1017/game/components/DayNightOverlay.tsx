"use client";
import { useState, useEffect } from "react";

// 1 cycle = 10 minutes réelles = 600s
const CYCLE_MS = 10 * 60 * 1000;

export function DayNightOverlay() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      setTime(((Date.now() - start) % CYCLE_MS) / CYCLE_MS);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  let color = "transparent";
  let opacity = 0;
  if (time < 0.15) { color = "rgba(255,180,100,0.08)"; opacity = 1 - time / 0.15; }
  else if (time < 0.45) { color = "transparent"; opacity = 0; }
  else if (time < 0.55) { color = "rgba(255,100,50,0.12)"; opacity = (time - 0.45) / 0.1; }
  else if (time < 0.90) { color = "rgba(15,15,50,0.35)"; opacity = 1; }
  else { color = "rgba(255,180,100,0.08)"; opacity = (time - 0.90) / 0.1; }

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5,
      backgroundColor: color, opacity,
      transition: "background-color 2s ease, opacity 2s ease",
    }} />
  );
}

export function isNight(startTime: number): boolean {
  const t = ((Date.now() - startTime) % CYCLE_MS) / CYCLE_MS;
  return t >= 0.55 && t < 0.90;
}
