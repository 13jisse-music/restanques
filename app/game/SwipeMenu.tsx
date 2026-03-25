"use client";
import { useState, useRef, useCallback } from "react";

// Swipe left = menu panel, swipe right = map
interface Props {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
}

export function SwipeMenu({ onSwipeLeft, onSwipeRight, children }: Props) {
  const touchRef = useRef<{x:number;y:number;t:number}|null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    touchRef.current = null;
    if (dt > 500 || Math.abs(dy) > Math.abs(dx)) return; // too slow or vertical
    if (Math.abs(dx) < 60) return; // too short
    if (dx < 0) onSwipeLeft(); // swipe left = menu
    else onSwipeRight(); // swipe right = map
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{position:"absolute",inset:0}}>
      {children}
    </div>
  );
}
