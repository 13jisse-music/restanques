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

// Home is 100×100 tiles: maison + jardin + zone safe
const HW = 100, HH = 100, HT = 28;
type Room = "garden"|"kitchen"|"armory"|"salon"|"bedroom"|"shop"|null;

interface HomeTile { type: "floor"|"wall"|"door"|"garden"|"furniture"|"outdoor"|"resource"|"coffre"|"portail"; room: Room; emoji?: string }

function genHome(): HomeTile[][] {
  const m: HomeTile[][] = Array.from({length:HH}, () => Array.from({length:HW}, () => ({type:"outdoor" as const, room: null})));

  // ── Zone safe border (~30x30 around center) ──
  const safeX1 = 35, safeY1 = 30, safeX2 = 65, safeY2 = 70;

  // Fill zone safe with outdoor ground + scattered resources
  const rng = () => Math.random();
  for (let y = safeY1; y < safeY2; y++) {
    for (let x = safeX1; x < safeX2; x++) {
      const r = rng();
      if (r < 0.04) {
        m[y][x] = {type:"resource", room:null, emoji:"🌿"}; // herbe
      } else if (r < 0.07) {
        m[y][x] = {type:"resource", room:null, emoji:"🪵"}; // branche
      } else if (r < 0.09) {
        m[y][x] = {type:"resource", room:null, emoji:"💜"}; // lavande
      } else if (r < 0.105) {
        m[y][x] = {type:"resource", room:null, emoji:"🪨"}; // pierre
      } else {
        m[y][x] = {type:"outdoor", room:null};
      }
    }
  }

  // ── MAISON at center (~50,50), 20×15 interior ──
  const houseX1 = 40, houseY1 = 38, houseX2 = 60, houseY2 = 53;

  // Outer walls of the house
  for (let x = houseX1; x <= houseX2; x++) {
    m[houseY1][x] = {type:"wall", room:null};
    m[houseY2][x] = {type:"wall", room:null};
  }
  for (let y = houseY1; y <= houseY2; y++) {
    m[y][houseX1] = {type:"wall", room:null};
    m[y][houseX2] = {type:"wall", room:null};
  }

  // Fill interior with floor
  for (let y = houseY1+1; y < houseY2; y++) {
    for (let x = houseX1+1; x < houseX2; x++) {
      m[y][x] = {type:"floor", room:null};
    }
  }

  // ── Room definitions inside the house ──
  // Top-left: Salon (40-49, 38-44)
  for (let y = houseY1+1; y <= 44; y++) for (let x = houseX1+1; x <= 49; x++) m[y][x] = {type:"floor", room:"salon"};
  m[houseY1+1][houseX1+1] = {type:"furniture", room:"salon", emoji:"✨"};
  // Horizontal wall at y=45
  for (let x = houseX1+1; x < houseX2; x++) m[45][x] = {type:"wall", room:null};

  // Top-right: Cuisine (51-59, 38-44)
  for (let y = houseY1+1; y <= 44; y++) for (let x = 51; x < houseX2; x++) m[y][x] = {type:"floor", room:"kitchen"};
  m[houseY1+1][51] = {type:"furniture", room:"kitchen", emoji:"🍳"};

  // Vertical wall at x=50 (top half)
  for (let y = houseY1+1; y <= 44; y++) m[y][50] = {type:"wall", room:null};
  // Door between salon and cuisine
  m[42][50] = {type:"door", room:"salon"};

  // Bottom-left: Armurerie (40-49, 46-52)
  for (let y = 46; y < houseY2; y++) for (let x = houseX1+1; x <= 49; x++) m[y][x] = {type:"floor", room:"armory"};
  m[46][houseX1+1] = {type:"furniture", room:"armory", emoji:"⚔️"};

  // Bottom-right split: Chambre (51-59, 46-48) + Comptoir (51-59, 50-52)
  for (let y = 46; y <= 48; y++) for (let x = 51; x < houseX2; x++) m[y][x] = {type:"floor", room:"bedroom"};
  m[46][51] = {type:"furniture", room:"bedroom", emoji:"🛏️"};

  // Wall at y=49 (right side only)
  for (let x = 51; x < houseX2; x++) m[49][x] = {type:"wall", room:null};

  for (let y = 50; y < houseY2; y++) for (let x = 51; x < houseX2; x++) m[y][x] = {type:"floor", room:"shop"};
  m[50][51] = {type:"furniture", room:"shop", emoji:"💰"};

  // Vertical wall at x=50 (bottom half)
  for (let y = 46; y < houseY2; y++) m[y][50] = {type:"wall", room:null};
  // Door between armory and shop
  m[48][50] = {type:"door", room:"armory"};

  // Doors in horizontal wall y=45
  m[45][45] = {type:"door", room:"salon"};   // salon → armory
  m[45][55] = {type:"door", room:"kitchen"}; // kitchen → bedroom

  // Front door (south wall) to exit the house
  m[houseY2][50] = {type:"door", room:null};

  // ── JARDIN south of house (4×4 parcelles, each 3×3) ──
  const gardenStartX = 43, gardenStartY = 55;
  for (let py = 0; py < 4; py++) {
    for (let px = 0; px < 4; px++) {
      const gx = gardenStartX + px * 4;
      const gy = gardenStartY + py * 4;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          if (gy+dy < HH && gx+dx < HW) {
            m[gy+dy][gx+dx] = {type:"garden", room:"garden", emoji: (dy === 1 && dx === 1) ? "🌱" : undefined};
          }
        }
      }
    }
  }

  // ── COFFRE outside near the door ──
  m[houseY2+1][52] = {type:"coffre", room:null, emoji:"📦"};

  // ── PORTAIL at edge of zone safe ──
  m[safeY2-1][50] = {type:"portail", room:null, emoji:"🚪"};

  // ── Nuisibles spawn points (visual markers) ──
  const nuisibleSpots = [[37,35],[63,35],[37,65],[63,65],[50,32],[50,68],[36,50],[64,50]];
  for (const [nx,ny] of nuisibleSpots) {
    if (m[ny] && m[ny][nx] && m[ny][nx].type === "outdoor") {
      m[ny][nx] = {type:"outdoor", room:null, emoji:"🐛"};
    }
  }

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
  const [hx, setHx] = useState(50 * HT);
  const [hy, setHy] = useState(50 * HT);
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
            // Coffre interaction
            if (t.type === "coffre") {
              sounds.open();
              // Could open inventory or chest panel
            }
            // Portail → exit
            if (t.type === "portail") {
              sounds.open();
              onExit();
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
    ctx.fillStyle = "#3A5A2A"; ctx.fillRect(0, 0, W, H); // outdoor green background
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
        case "outdoor": ctx.fillStyle = (tx+ty)%2===0 ? "#4A7A3A" : "#3E6E30"; break;
        case "resource": ctx.fillStyle = "#4A7A3A"; break;
        case "coffre": ctx.fillStyle = "#4A7A3A"; break;
        case "portail": ctx.fillStyle = "#6A4A2A"; break;
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
    <div style={{position:"fixed",inset:0,background:"#3A5A2A",touchAction:"none"}}>
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
