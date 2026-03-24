"use client";
import { useRef, useCallback } from "react";

interface DPadProps {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

// D-pad classique en overlay semi-transparent (remplace le joystick qui buggait)
export function Joystick({ onMove, onStop }: DPadProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMove = useCallback((dx: number, dy: number) => {
    onMove(dx, dy);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => onMove(dx, dy), 250);
  }, [onMove]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    onStop();
  }, [onStop]);

  const btnStyle = {
    width: 48, height: 48, borderRadius: 10,
    background: "rgba(255,255,255,0.15)",
    border: "2px solid rgba(255,255,255,0.25)",
    color: "rgba(255,255,255,0.7)",
    fontSize: 20, fontWeight: "bold" as const,
    display: "flex", alignItems: "center" as const, justifyContent: "center" as const,
    cursor: "pointer", touchAction: "none" as const,
    backdropFilter: "blur(4px)",
  };

  const dirs: [string, number, number, string][] = [
    ["u", 0, -1, "▲"], ["l", -1, 0, "◀"], ["r", 1, 0, "▶"], ["d", 0, 1, "▼"],
  ];

  return (
    <div style={{ position: "fixed", bottom: 16, left: 12, zIndex: 10, display: "grid", gridTemplateAreas: `". u ." "l . r" ". d ."`, gap: 3 }}>
      {dirs.map(([a, dx, dy, ch]) => (
        <button key={a} style={{ ...btnStyle, gridArea: a }}
          onMouseDown={() => startMove(dx, dy)} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={(e) => { e.preventDefault(); startMove(dx, dy); }}
          onTouchEnd={(e) => { e.preventDefault(); stop(); }}
        >{ch}</button>
      ))}
    </div>
  );
}
