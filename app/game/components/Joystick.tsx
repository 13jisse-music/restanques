"use client";
import { useRef, useState, useCallback } from "react";

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

export function Joystick({ onMove, onStop }: JoystickProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDirRef = useRef<{ dx: number; dy: number } | null>(null);

  const startMove = useCallback((dx: number, dy: number) => {
    lastDirRef.current = { dx, dy };
    onMove(dx, dy);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (lastDirRef.current) onMove(lastDirRef.current.dx, lastDirRef.current.dy);
    }, 180);
  }, [onMove]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    lastDirRef.current = null;
    setOffset({ x: 0, y: 0 });
    onStop();
  }, [onStop]);

  const handleTouch = useCallback((e: React.TouchEvent, isStart = false) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) { stop(); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (isStart) centerRef.current = { x: cx, y: cy };
    const center = centerRef.current || { x: cx, y: cy };
    const dx = touch.clientX - center.x;
    const dy = touch.clientY - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOff = 30;
    const clampedX = Math.max(-maxOff, Math.min(maxOff, dx));
    const clampedY = Math.max(-maxOff, Math.min(maxOff, dy));
    setOffset({ x: clampedX, y: clampedY });

    if (dist < 12) return; // dead zone
    // Determine direction
    if (Math.abs(dx) > Math.abs(dy)) {
      const dir = dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
      if (!lastDirRef.current || lastDirRef.current.dx !== dir.dx || lastDirRef.current.dy !== dir.dy) startMove(dir.dx, dir.dy);
    } else {
      const dir = dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
      if (!lastDirRef.current || lastDirRef.current.dx !== dir.dx || lastDirRef.current.dy !== dir.dy) startMove(dir.dx, dir.dy);
    }
  }, [startMove, stop]);

  return (
    <div
      onTouchStart={(e) => handleTouch(e, true)}
      onTouchMove={(e) => handleTouch(e)}
      onTouchEnd={(e) => { e.preventDefault(); stop(); }}
      style={{
        position: "fixed", bottom: 16, left: 16, zIndex: 10,
        width: 110, height: 110, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
        border: "2px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        touchAction: "none",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,0.3)",
        border: "2px solid rgba(255,255,255,0.45)",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 && offset.y === 0 ? "transform 0.15s" : "none",
      }} />
    </div>
  );
}
