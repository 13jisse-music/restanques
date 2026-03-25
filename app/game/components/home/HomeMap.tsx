"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Joystick } from "../Joystick";

// ─── HOME TILE TYPES ───
interface HomeTile {
  type: string;
  walkable: boolean;
  roomId?: string;
  emoji?: string;
  gardenSlot?: number;
}

interface HomeRoom {
  id: string;
  name: string;
  emoji: string;
  x: number; y: number;
  w: number; h: number;
}

interface GardenPlot {
  seed: string | null;
  plantedAt: number;
  growTime: number;
}

interface HomeMapProps {
  playerName: string;
  playerEmoji: string;
  playerClass: string;
  hp: number;
  maxHp: number;
  sous: number;
  lvl: number;
  timeOfDay: number;
  inventory: { id: string; qty: number }[];
  garden: GardenPlot[];
  otherPlayer?: { name: string; emoji: string; x: number; y: number } | null;
  onOpenRoom: (roomId: string) => void;
  onOpenChest: () => void;
  onPortal: () => void;
  onOpenMenu: () => void;
  onOpenMap: () => void;
}

// ─── GENERATE HOME MAP ───
const HOME_W = 50;
const HOME_H = 50;

function generateHomeMap(): { tiles: HomeTile[][]; rooms: HomeRoom[]; gardenPlots: { x: number; y: number; slot: number }[]; chestPos: { x: number; y: number }; portalPos: { x: number; y: number }; spawnPos: { x: number; y: number } } {
  const tiles: HomeTile[][] = Array.from({ length: HOME_H }, () =>
    Array.from({ length: HOME_W }, () => ({ type: "grass", walkable: true }))
  );

  // House walls (center area, 22x16)
  const hx = 14, hy = 18, hw = 22, hh = 14;
  for (let y = hy; y < hy + hh; y++) {
    for (let x = hx; x < hx + hw; x++) {
      if (y === hy || y === hy + hh - 1 || x === hx || x === hx + hw - 1) {
        tiles[y][x] = { type: "wall", walkable: false, emoji: "🧱" };
      } else {
        tiles[y][x] = { type: "floor", walkable: true };
      }
    }
  }

  // Rooms
  const rooms: HomeRoom[] = [
    { id: "salon", name: "Salon des Sorts", emoji: "✨", x: hx + 1, y: hy + 1, w: 6, h: 5 },
    { id: "cuisine", name: "Cuisine", emoji: "🍳", x: hx + 8, y: hy + 1, w: 6, h: 5 },
    { id: "armurerie", name: "Armurerie", emoji: "⚔️", x: hx + 15, y: hy + 1, w: 6, h: 5 },
    { id: "chambre", name: "Chambre", emoji: "🛏️", x: hx + 1, y: hy + 7, w: 6, h: 5 },
    { id: "comptoir", name: "Comptoir", emoji: "🏪", x: hx + 8, y: hy + 7, w: 6, h: 5 },
  ];

  // Place room floors and walls between rooms
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        tiles[y][x] = { type: "room_floor", walkable: true, roomId: room.id };
      }
    }
    // Room label in center
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);
    tiles[cy][cx] = { type: "room_floor", walkable: true, roomId: room.id, emoji: room.emoji };
  }

  // Internal walls between rooms (vertical dividers)
  for (let y = hy + 1; y < hy + hh - 1; y++) {
    tiles[y][hx + 7] = { type: "wall", walkable: false };
    tiles[y][hx + 14] = { type: "wall", walkable: false };
  }
  // Horizontal divider
  for (let x = hx + 1; x < hx + hw - 1; x++) {
    tiles[hy + 6][x] = { type: "wall", walkable: false };
  }
  // Door openings
  tiles[hy + 6][hx + 3] = { type: "door", walkable: true, emoji: "🚪" }; // salon-chambre
  tiles[hy + 6][hx + 10] = { type: "door", walkable: true, emoji: "🚪" }; // cuisine-comptoir
  tiles[hy + 3][hx + 7] = { type: "door", walkable: true, emoji: "🚪" }; // salon-cuisine
  tiles[hy + 3][hx + 14] = { type: "door", walkable: true, emoji: "🚪" }; // cuisine-armurerie
  tiles[hy + 9][hx + 7] = { type: "door", walkable: true, emoji: "🚪" }; // chambre-comptoir

  // Main entrance
  tiles[hy + hh - 1][hx + Math.floor(hw / 2)] = { type: "door", walkable: true, emoji: "🚪" };

  // Garden plots (north of house, 4x4 grid)
  const gardenPlots: { x: number; y: number; slot: number }[] = [];
  const gx = hx + 5, gy = hy - 6;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const px = gx + col * 2;
      const py = gy + row * 2;
      const slot = row * 4 + col;
      tiles[py][px] = { type: "garden_plot", walkable: true, gardenSlot: slot, emoji: "🌱" };
      gardenPlots.push({ x: px, y: py, slot });
    }
  }

  // Path from garden to house
  for (let y = gy + 7; y <= hy; y++) {
    tiles[y][hx + Math.floor(hw / 2)] = { type: "path", walkable: true };
  }
  // Path from house entrance down
  for (let y = hy + hh; y < hy + hh + 4; y++) {
    tiles[y][hx + Math.floor(hw / 2)] = { type: "path", walkable: true };
  }

  // Chest (south of house)
  const chestPos = { x: hx + Math.floor(hw / 2) - 3, y: hy + hh + 2 };
  tiles[chestPos.y][chestPos.x] = { type: "chest", walkable: true, emoji: "📦" };

  // Portal (south-east)
  const portalPos = { x: hx + Math.floor(hw / 2) + 3, y: hy + hh + 2 };
  tiles[portalPos.y][portalPos.x] = { type: "portal", walkable: true, emoji: "🚪" };

  // Scatter some resources in safe zone
  const safeResources = ["🌿", "💜", "🪵"];
  for (let i = 0; i < 20; i++) {
    const rx = 3 + Math.floor(Math.random() * (HOME_W - 6));
    const ry = 3 + Math.floor(Math.random() * (HOME_H - 6));
    if (tiles[ry][rx].type === "grass" && Math.abs(rx - 25) + Math.abs(ry - 25) > 5) {
      tiles[ry][rx] = { type: "grass", walkable: true, emoji: safeResources[Math.floor(Math.random() * safeResources.length)] };
    }
  }

  const spawnPos = { x: hx + Math.floor(hw / 2), y: hy + Math.floor(hh / 2) };

  return { tiles, rooms, gardenPlots, chestPos, portalPos, spawnPos };
}

// Memoize home map
let cachedHome: ReturnType<typeof generateHomeMap> | null = null;
function getHomeMap() {
  if (!cachedHome) cachedHome = generateHomeMap();
  return cachedHome;
}

// ─── TILE COLORS ───
const TILE_BG: Record<string, string> = {
  grass: "#7BB33A",
  floor: "#D4B896",
  room_floor: "#E8D5A3",
  wall: "#5C4033",
  door: "#8B6914",
  garden_plot: "#4A7A1A",
  path: "#C9A87C",
  chest: "#7BB33A",
  portal: "#7BB33A",
};

export function HomeMap({
  playerName, playerEmoji, playerClass, hp, maxHp, sous, lvl, timeOfDay,
  inventory, garden, otherPlayer,
  onOpenRoom, onOpenChest, onPortal, onOpenMenu, onOpenMap,
}: HomeMapProps) {
  const home = getHomeMap();
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: home.spawnPos.x, y: home.spawnPos.y });
  const [moveDir, setMoveDir] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const moveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [notification, setNotification] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  // Calculate CELL size
  const W = typeof window !== "undefined" ? window.innerWidth : 360;
  const H = typeof window !== "undefined" ? window.innerHeight : 700;
  const CELL = Math.floor(Math.min(W / 11, H / 15));
  const viewCols = Math.ceil(W / CELL) + 2;
  const viewRows = Math.ceil(H / CELL) + 2;

  // ─── MOVEMENT ───
  const handleJoystick = useCallback((dx: number, dy: number) => {
    setMoveDir({ dx, dy });
  }, []);

  useEffect(() => {
    if (moveDir.dx === 0 && moveDir.dy === 0) {
      if (moveRef.current) { clearInterval(moveRef.current); moveRef.current = null; }
      return;
    }
    if (moveRef.current) return;
    moveRef.current = setInterval(() => {
      setPos(p => {
        const speed = playerClass === "ombre" ? 0.15 : 0.1;
        let nx = p.x + moveDir.dx * speed;
        let ny = p.y + moveDir.dy * speed;
        // Clamp
        nx = Math.max(1, Math.min(HOME_W - 2, nx));
        ny = Math.max(1, Math.min(HOME_H - 2, ny));
        // Collision
        const tileX = Math.round(nx);
        const tileY = Math.round(ny);
        if (tileY >= 0 && tileY < HOME_H && tileX >= 0 && tileX < HOME_W) {
          const tile = home.tiles[tileY][tileX];
          if (!tile.walkable) return p;
        }
        return { x: nx, y: ny };
      });
    }, 1000 / 60);
    return () => { if (moveRef.current) { clearInterval(moveRef.current); moveRef.current = null; } };
  }, [moveDir, playerClass]);

  // ─── DETECT ROOM / INTERACTIONS ───
  useEffect(() => {
    const tileX = Math.round(pos.x);
    const tileY = Math.round(pos.y);
    if (tileY < 0 || tileY >= HOME_H || tileX < 0 || tileX >= HOME_W) return;
    const tile = home.tiles[tileY][tileX];

    if (tile.roomId && tile.roomId !== currentRoom) {
      setCurrentRoom(tile.roomId);
      const room = home.rooms.find(r => r.id === tile.roomId);
      if (room) setNotification(`${room.emoji} ${room.name}`);
    } else if (!tile.roomId && currentRoom) {
      setCurrentRoom(null);
    }
  }, [pos, currentRoom]);

  // ─── TAP HANDLER ───
  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const tileX = Math.round(pos.x);
    const tileY = Math.round(pos.y);
    if (tileY < 0 || tileY >= HOME_H || tileX < 0 || tileX >= HOME_W) return;
    const tile = home.tiles[tileY][tileX];

    if (tile.roomId) {
      onOpenRoom(tile.roomId);
    } else if (tile.type === "chest") {
      onOpenChest();
    } else if (tile.type === "portal") {
      onPortal();
    } else if (tile.gardenSlot !== undefined) {
      onOpenRoom("garden");
    }
  }, [pos, onOpenRoom, onOpenChest, onPortal]);

  // ─── NOTIFICATION TIMER ───
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(""), 2000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // ─── RENDER ───
  const startCol = Math.max(0, Math.floor(pos.x) - Math.floor(viewCols / 2));
  const startRow = Math.max(0, Math.floor(pos.y) - Math.floor(viewRows / 2));
  const offsetX = (pos.x - startCol - Math.floor(viewCols / 2)) * CELL;
  const offsetY = (pos.y - startRow - Math.floor(viewRows / 2)) * CELL;

  // Day/night filter
  const isNight = timeOfDay >= 0.55;
  const nightOpacity = isNight ? 0.3 : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#1A1410", overflow: "hidden" }}
      onClick={handleTap as any}>
      {/* TOP BAR */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 8px", height: 36,
        background: "linear-gradient(rgba(0,0,0,0.6), transparent)",
        color: "#FFF", fontSize: 11,
      }}>
        <div>❤️{hp}/{maxHp} Nv.{lvl}</div>
        <div>☀️{sous}</div>
        <button onClick={(e) => { e.stopPropagation(); onOpenMenu(); }} style={{ background: "none", border: "none", color: "#FFF", fontSize: 18, cursor: "pointer" }}>⚙️</button>
      </div>

      {/* MAP TILES */}
      <div style={{
        position: "absolute",
        left: -offsetX,
        top: -offsetY,
        transform: `translate(${W / 2 - CELL / 2}px, ${H / 2 - CELL / 2}px)`,
      }}>
        {Array.from({ length: viewRows + 2 }).map((_, ri) => {
          const y = startRow + ri;
          if (y < 0 || y >= HOME_H) return null;
          return Array.from({ length: viewCols + 2 }).map((_, ci) => {
            const x = startCol + ci;
            if (x < 0 || x >= HOME_W) return null;
            const tile = home.tiles[y][x];
            const bg = TILE_BG[tile.type] || "#7BB33A";
            const screenX = (x - startCol) * CELL;
            const screenY = (y - startRow) * CELL;

            // Garden plot state
            let gardenEmoji = tile.emoji;
            if (tile.gardenSlot !== undefined) {
              const plot = garden[tile.gardenSlot];
              if (plot?.seed) {
                const elapsed = (Date.now() - plot.plantedAt) / 1000;
                if (elapsed >= plot.growTime) {
                  gardenEmoji = "🌾"; // Ready!
                } else {
                  gardenEmoji = "🌱";
                }
              }
            }

            return (
              <div key={`${y}-${x}`} style={{
                position: "absolute",
                left: screenX, top: screenY,
                width: CELL, height: CELL,
                background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: CELL * 0.6,
                borderRight: "1px solid rgba(0,0,0,0.05)",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}>
                {gardenEmoji || tile.emoji || ""}
              </div>
            );
          });
        })}

        {/* PLAYER */}
        <div style={{
          position: "absolute",
          left: (pos.x - startCol) * CELL - CELL * 0.3,
          top: (pos.y - startRow) * CELL - CELL * 0.3,
          width: CELL * 1.6, height: CELL * 1.6,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8E4466, #5C2D42)",
          border: "2px solid #F4D03F",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: CELL * 0.7,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          zIndex: 20,
          transition: "left 50ms, top 50ms",
        }}>{playerEmoji}</div>

        {/* Other player */}
        {otherPlayer && (
          <div style={{
            position: "absolute",
            left: (otherPlayer.x - startCol) * CELL,
            top: (otherPlayer.y - startRow) * CELL,
            width: CELL, height: CELL,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4A6E1F, #2D4A0F)",
            border: "2px solid #F4D03F",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: CELL * 0.5, opacity: 0.75, zIndex: 19,
          }}>
            {otherPlayer.emoji}
            <div style={{ position: "absolute", bottom: -12, fontSize: 7, color: "#FFF", whiteSpace: "nowrap" }}>{otherPlayer.name}</div>
          </div>
        )}
      </div>

      {/* Night overlay */}
      {nightOpacity > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(10,10,40,${nightOpacity})`, pointerEvents: "none", zIndex: 30 }} />}

      {/* Room indicator */}
      {currentRoom && (
        <div style={{
          position: "absolute", top: 42, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)", color: "#FFD700", fontSize: 12,
          padding: "4px 12px", borderRadius: 12, zIndex: 40,
          border: "1px solid rgba(218,165,32,0.3)",
        }}>
          {home.rooms.find(r => r.id === currentRoom)?.emoji} {home.rooms.find(r => r.id === currentRoom)?.name}
          <div style={{ fontSize: 9, color: "#AAA", textAlign: "center" }}>Tap pour ouvrir</div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div style={{
          position: "absolute", bottom: 120, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)", color: "#FFF", fontSize: 13,
          padding: "8px 16px", borderRadius: 12, zIndex: 50,
        }}>{notification}</div>
      )}

      {/* JOYSTICK */}
      <Joystick onMove={handleJoystick} onStop={() => setMoveDir({ dx: 0, dy: 0 })} />

      {/* Quick access buttons */}
      <div style={{
        position: "absolute", right: 8, bottom: 100, zIndex: 40,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <button onClick={(e) => { e.stopPropagation(); onOpenRoom("salon"); }}
          style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid #DAA520", color: "#FFF", fontSize: 18, cursor: "pointer" }}>✨</button>
        <button onClick={(e) => { e.stopPropagation(); onOpenRoom("cuisine"); }}
          style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid #DAA520", color: "#FFF", fontSize: 18, cursor: "pointer" }}>🍳</button>
        <button onClick={(e) => { e.stopPropagation(); onOpenRoom("armurerie"); }}
          style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid #DAA520", color: "#FFF", fontSize: 18, cursor: "pointer" }}>⚔️</button>
      </div>
    </div>
  );
}
