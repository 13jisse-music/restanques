"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { sounds } from "../lib/sounds";
import { GardenPlot, GameState } from "../components/GameTypes";
import { GardenPanel } from "./GardenPanel";
import { KitchenPanel } from "./KitchenPanel";
import { ArmoryPanel } from "./ArmoryPanel";
import { SpellSalon } from "./SpellSalon";
import { BedroomPanel } from "./BedroomPanel";
import { ShopCounter } from "./ShopCounter";

// Home is 20×20 tiles, 5 rooms + garden
const HW = 20, HH = 20, HT = 28;
type Room = "garden"|"kitchen"|"armory"|"salon"|"bedroom"|"shop"|null;

interface HomeTile { type: "floor"|"wall"|"door"|"garden"|"furniture"; room: Room; emoji?: string }

function genHome(): HomeTile[][] {
  const m: HomeTile[][] = Array.from({length:HH}, () => Array.from({length:HW}, () => ({type:"floor" as const, room: null})));
  // Walls border
  for (let i = 0; i < HW; i++) { m[0][i] = {type:"wall",room:null}; m[HH-1][i] = {type:"wall",room:null}; }
  for (let i = 0; i < HH; i++) { m[i][0] = {type:"wall",room:null}; m[i][HW-1] = {type:"wall",room:null}; }
  // Room definitions: [y1,y2,x1,x2,room,emoji]
  const rooms: [number,number,number,number,Room,string][] = [
    [1,6,1,9,"kitchen","🍳"], [1,6,10,19,"armory","⚔️"],
    [7,13,1,9,"salon","✨"], [7,13,10,19,"bedroom","🛏️"],
    [14,19,1,9,"shop","💰"], [14,19,10,19,"garden","🌿"],
  ];
  for (const [y1,y2,x1,x2,room,emoji] of rooms) {
    for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) {
      m[y][x] = { type: room === "garden" ? "garden" : "floor", room, emoji: undefined };
    }
    // Room walls (horizontal dividers)
    if (y1 > 1) for (let x = x1; x < x2; x++) m[y1][x] = {type:"wall",room};
    // Room label
    m[y1+1][x1+1] = {type:"furniture",room,emoji};
    // Door in wall
    const doorX = Math.floor((x1+x2)/2);
    if (y1 > 1) m[y1][doorX] = {type:"door",room};
  }
  // Vertical divider
  for (let y = 1; y < HH-1; y++) {
    if (m[y][9].type !== "door") m[y][9] = {type:"wall",room:m[y][9].room};
  }
  // Doors in vertical wall
  m[4][9] = {type:"door",room:"kitchen"};
  m[10][9] = {type:"door",room:"salon"};
  m[16][9] = {type:"door",room:"shop"};
  return m;
}

interface HomeMapProps {
  gs: GameState;
  onUpdateGs: (u: Partial<GameState>) => void;
  onExit: () => void;
  playerEmoji: string;
  playerName: string;
  canCraft: boolean;
  craftFail: number;
}

export function HomeMap({ gs, onUpdateGs, onExit, playerEmoji, playerName, canCraft, craftFail }: HomeMapProps) {
  const [homeMap] = useState(() => genHome());
  const [hx, setHx] = useState(10 * HT);
  const [hy, setHy] = useState(10 * HT);
  const [activeRoom, setActiveRoom] = useState<Room>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef({active:false,dx:0,dy:0});

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.width = window.innerWidth; cvs.height = window.innerHeight;
    const onR = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    if (activeRoom) return;
    let run = true;
    const loop = () => {
      if (!run) return;
      let dx = 0, dy = 0;
      const k = keysRef.current, j = joyRef.current;
      if (k.has("arrowleft")||k.has("a")||k.has("q")) dx -= 1;
      if (k.has("arrowright")||k.has("d")) dx += 1;
      if (k.has("arrowup")||k.has("z")||k.has("w")) dy -= 1;
      if (k.has("arrowdown")||k.has("s")) dy += 1;
      if (j.active) { dx += j.dx; dy += j.dy; }
      if (dx || dy) {
        const len = Math.sqrt(dx*dx+dy*dy);
        const spd = 3;
        const nx = hx + (dx/len)*spd, ny = hy + (dy/len)*spd;
        const tx = Math.floor(nx/HT), ty = Math.floor(ny/HT);
        if (tx >= 0 && tx < HW && ty >= 0 && ty < HH) {
          const t = homeMap[ty][tx];
          if (t.type !== "wall") {
            setHx(nx); setHy(ny);
            // Check room interaction
            if (t.type === "door" || t.type === "furniture") {
              if (t.room && !activeRoom) {
                sounds.open();
                setActiveRoom(t.room);
              }
            }
          }
        }
      }
      draw();
      if (run) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { run = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom, hx, hy]);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#2A1A0A"; ctx.fillRect(0, 0, W, H);
    const cx = hx - W/2, cy = hy - H/2;
    for (let ty = 0; ty < HH; ty++) for (let tx = 0; tx < HW; tx++) {
      const t = homeMap[ty][tx];
      const sx = tx * HT - cx, sy = ty * HT - cy;
      if (sx < -HT || sx > W + HT || sy < -HT || sy > H + HT) continue;
      switch (t.type) {
        case "floor": ctx.fillStyle = "#D4B896"; break;
        case "wall": ctx.fillStyle = "#5C4033"; break;
        case "door": ctx.fillStyle = "#8B6F47"; break;
        case "garden": ctx.fillStyle = "#6D9E2A"; break;
        case "furniture": ctx.fillStyle = "#D4B896"; break;
      }
      ctx.fillRect(sx, sy, HT, HT);
      if (t.emoji) { ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.fillText(t.emoji, sx+HT/2, sy+HT/2+6); }
    }
    // Player
    ctx.font = "24px serif"; ctx.textAlign = "center";
    ctx.fillText(playerEmoji, W/2, H/2+8);
    ctx.font = "bold 10px sans-serif"; ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
    ctx.strokeText(playerName, W/2, H/2-16);
    ctx.fillText(playerName, W/2, H/2-16);
  }, [hx, hy, homeMap, playerEmoji, playerName]);

  const joyStart = (e: React.TouchEvent) => {
    joyRef.current.active = true;
    const el = e.currentTarget.getBoundingClientRect();
    const ox = e.touches[0].clientX - el.left - el.width/2;
    const oy = e.touches[0].clientY - el.top - el.height/2;
    const l = Math.sqrt(ox*ox+oy*oy);
    if (l > 5) { joyRef.current.dx = ox/l; joyRef.current.dy = oy/l; }
  };
  const joyMove = (e: React.TouchEvent) => {
    if (!joyRef.current.active) return;
    const el = e.currentTarget.getBoundingClientRect();
    const ox = e.touches[0].clientX - el.left - el.width/2;
    const oy = e.touches[0].clientY - el.top - el.height/2;
    const l = Math.sqrt(ox*ox+oy*oy);
    if (l > 5) { joyRef.current.dx = ox/l; joyRef.current.dy = oy/l; } else { joyRef.current.dx = 0; joyRef.current.dy = 0; }
  };
  const joyEnd = () => { joyRef.current.active = false; joyRef.current.dx = 0; joyRef.current.dy = 0; };

  const closeRoom = () => { setActiveRoom(null); sounds.close(); };

  return (
    <div style={{position:"fixed",inset:0,background:"#2A1A0A",touchAction:"none"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}} />
      {/* HUD */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"6px 10px",display:"flex",justifyContent:"space-between",background:"linear-gradient(rgba(0,0,0,.7),transparent)"}}>
        <span style={{color:"#DAA520",fontSize:14,fontWeight:"bold"}}>🏠 Maison Mélanie</span>
        <button onClick={onExit} style={{background:"rgba(139,0,0,.4)",border:"1px solid #F44",borderRadius:8,color:"#FFF",padding:"4px 12px",fontSize:12,cursor:"pointer"}}>🚪 Sortir</button>
      </div>
      {/* Joystick */}
      {!activeRoom && (
        <div onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
          style={{position:"absolute",bottom:20,left:20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.12)",border:"2px solid rgba(255,255,255,.2)",zIndex:10,touchAction:"none"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.25)"}} />
        </div>
      )}
      {/* Room panels */}
      {activeRoom === "garden" && <GardenPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom === "kitchen" && <KitchenPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom === "armory" && <ArmoryPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} canCraft={canCraft} craftFail={craftFail} />}
      {activeRoom === "salon" && <SpellSalon gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} canCraft={canCraft} />}
      {activeRoom === "bedroom" && <BedroomPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom === "shop" && <ShopCounter gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
    </div>
  );
}
