"use client";
import { useRef, useEffect, useState } from "react";
import { TILES, MW, MH, CAMP_POS, type GameWorld } from "../../lib/constants";

interface MinimapProps {
  world: GameWorld;
  playerPos: { x: number; y: number };
  otherPlayer: { x: number; y: number } | null;
  enemyPositions: Record<number, { x: number; y: number }>;
  visible: boolean;
}

export function Minimap({ world, playerPos, otherPlayer, enemyPositions, visible }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw tiles
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const tile = world.m[y]?.[x] || "g";
        const t = TILES[tile];
        ctx.fillStyle = t?.bg || "#7BB33A";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Camp — orange 3×3
    ctx.fillStyle = "#E67E22";
    ctx.fillRect(CAMP_POS.x - 1, CAMP_POS.y - 1, 3, 3);

    // Villages — white 2×2
    ctx.fillStyle = "#FFFFFF";
    world.villages.forEach((v) => ctx.fillRect(v.x, v.y, 2, 2));

    // Enemies — red 1×1
    ctx.fillStyle = "#D94F4F";
    Object.values(enemyPositions).forEach((ep) => ctx.fillRect(ep.x, ep.y, 1, 1));

    // Other player — pink 2×2
    if (otherPlayer) {
      ctx.fillStyle = "#E88EAD";
      ctx.fillRect(otherPlayer.x - 1, otherPlayer.y - 1, 2, 2);
    }

    // Player — yellow 3×3 with white border
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = blink ? "#FFFFFF" : "#000000";
    ctx.fillRect(playerPos.x - 2, playerPos.y - 2, 5, 5);
    ctx.fillStyle = "#F4D03F";
    ctx.fillRect(playerPos.x - 1, playerPos.y - 1, 3, 3);
  }, [world, playerPos, otherPlayer, enemyPositions, visible]);

  // Re-render blink
  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Redraw just the player area
      const blink = Math.floor(Date.now() / 400) % 2 === 0;
      // Clear player area
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const px = playerPos.x + dx, py = playerPos.y + dy;
          if (px >= 0 && px < MW && py >= 0 && py < MH) {
            ctx.fillStyle = TILES[world.m[py]?.[px]]?.bg || "#7BB33A";
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
      ctx.fillStyle = blink ? "#FFFFFF" : "#000000";
      ctx.fillRect(playerPos.x - 2, playerPos.y - 2, 5, 5);
      ctx.fillStyle = "#F4D03F";
      ctx.fillRect(playerPos.x - 1, playerPos.y - 1, 3, 3);
    }, 400);
    return () => clearInterval(iv);
  }, [visible, playerPos, world]);

  const [expanded, setExpanded] = useState(false);
  if (!visible) return null;
  const sz = expanded ? 160 : 90;

  return (
    <canvas
      ref={canvasRef}
      width={MW} height={MH}
      onClick={() => setExpanded(!expanded)}
      style={{
        position: "fixed", top: 40, right: 8, zIndex: 10,
        width: sz, height: sz,
        border: "2px solid rgba(255,215,0,0.5)",
        borderRadius: 8,
        imageRendering: "pixelated",
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        background: "#1A1410",
        opacity: 0.85,
        transition: "width 0.2s, height 0.2s",
        cursor: "pointer",
      }}
    />
  );
}
