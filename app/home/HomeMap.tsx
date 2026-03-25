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
  // Doors between salon and cuisine (wide)
  m[41][50] = {type:"door", room:"salon"};
  m[42][50] = {type:"door", room:"salon"};
  m[43][50] = {type:"door", room:"salon"};

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
  // Doors between armory and shop (wide)
  m[47][50] = {type:"door", room:"armory"};
  m[48][50] = {type:"door", room:"armory"};
  m[49][50] = {type:"door", room:"armory"};

  // Doors in horizontal wall y=45 (wider for easier navigation)
  m[45][44] = {type:"door", room:"salon"};
  m[45][45] = {type:"door", room:"salon"};
  m[45][46] = {type:"door", room:"salon"};
  m[45][54] = {type:"door", room:"kitchen"};
  m[45][55] = {type:"door", room:"kitchen"};
  m[45][56] = {type:"door", room:"kitchen"};

  // Front door (south wall) to exit the house — wide
  m[houseY2][49] = {type:"door", room:null};
  m[houseY2][50] = {type:"door", room:null};
  m[houseY2][51] = {type:"door", room:null};

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

// Nuisibles de la zone safe
const NUISIBLES = [
  {emoji:"🐛",name:"Chenille",hp:4,atk:1,drop:"graine"},
  {emoji:"🐌",name:"Escargot",hp:5,atk:1,drop:"herbe"},
  {emoji:"🪲",name:"Scarabee",hp:6,atk:2,drop:"branche"},
  {emoji:"🐸",name:"Grenouille",hp:7,atk:2,drop:"graine_rare"},
];
interface Nuisible { x:number; y:number; type:number; alive:boolean }

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
  const [hy, setHy] = useState(44 * HT); // Start in hallway between rooms, not inside a wall
  const [activeRoom, setActiveRoom] = useState<Room>(null);
  // Nuisibles vivants dans la zone safe
  const [nuisibles, setNuisibles] = useState<Nuisible[]>(() => {
    const spots = [[38,36],[62,36],[38,64],[62,64],[50,33],[50,67],[37,50],[63,50]];
    return spots.map(([nx,ny],i) => ({x:nx*HT,y:ny*HT,type:i%4,alive:true}));
  });
  const [nuisibleCombat, setNuisibleCombat] = useState<{idx:number;hp:number;maxHp:number}|null>(null);
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
            // Portail → exit (auto on step)
            if (t.type === "portail") { sounds.open(); onExit(); }
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
    // Nuisibles
    for (const n of nuisibles) {
      if (!n.alive) continue;
      const nx = n.x - cx, ny = n.y - cy;
      if (nx < -HT || nx > W+HT || ny < -HT || ny > H+HT) continue;
      ctx.font = "20px serif"; ctx.textAlign = "center";
      ctx.fillText(NUISIBLES[n.type].emoji, nx+HT/2, ny+HT/2+6);
    }
    // Player
    ctx.font = "24px serif"; ctx.textAlign = "center";
    ctx.fillText(playerEmoji, W/2, H/2+8);
    ctx.font = "bold 10px sans-serif"; ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
    ctx.strokeText(playerName, W/2, H/2-16);
    ctx.fillText(playerName, W/2, H/2-16);
  }, [hx, hy, homeMap, playerEmoji, playerName, nuisibles]);

  // Nuisible movement (slow patrol every 2s)
  useEffect(() => {
    if (activeRoom || nuisibleCombat) return;
    const iv = setInterval(() => {
      setNuisibles(prev => prev.map(n => {
        if (!n.alive) return n;
        const dx = (Math.random()-0.5) * 2 > 0 ? HT : -HT;
        const dy = (Math.random()-0.5) * 2 > 0 ? HT : -HT;
        const nx = n.x + (Math.random()>0.5?dx:0);
        const ny = n.y + (Math.random()>0.5?dy:0);
        const tx = Math.floor(nx/HT), ty = Math.floor(ny/HT);
        if (tx>=35&&tx<=65&&ty>=30&&ty<=70&&homeMap[ty]?.[tx]?.type==="outdoor") return {...n,x:nx,y:ny};
        return n;
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [activeRoom, nuisibleCombat, homeMap]);

  // Check collision with nuisibles
  useEffect(() => {
    if (activeRoom || nuisibleCombat) return;
    const ptx = Math.floor(hx/HT), pty = Math.floor(hy/HT);
    for (let i=0; i<nuisibles.length; i++) {
      const n = nuisibles[i]; if (!n.alive) continue;
      const ntx = Math.floor(n.x/HT), nty = Math.floor(n.y/HT);
      if (Math.abs(ptx-ntx)<=1 && Math.abs(pty-nty)<=1) {
        const nui = NUISIBLES[n.type];
        setNuisibleCombat({idx:i, hp:nui.hp, maxHp:nui.hp});
        sounds.hit();
        break;
      }
    }
  }, [hx, hy, nuisibles, activeRoom, nuisibleCombat]);

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

  // TAP on canvas to interact with furniture/coffre/resource
  const handleCanvasTap = useCallback((clientX: number, clientY: number) => {
    if (activeRoom || nuisibleCombat) return;
    const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const tapWorldX = (clientX - rect.left) + hx - cvs.width/2;
    const tapWorldY = (clientY - rect.top) + hy - cvs.height/2;
    const tx = Math.floor(tapWorldX / HT), ty = Math.floor(tapWorldY / HT);
    if (tx < 0 || tx >= HW || ty < 0 || ty >= HH) return;
    // Must be adjacent (within 2 tiles)
    const ptx = Math.floor(hx / HT), pty = Math.floor(hy / HT);
    if (Math.abs(tx - ptx) > 2 || Math.abs(ty - pty) > 2) return;
    const t = homeMap[ty][tx];
    if (t.type === "furniture" && t.room) { sounds.open(); setActiveRoom(t.room); }
    if (t.type === "coffre") { sounds.open(); /* chest panel */ }
    if (t.type === "resource" && t.emoji) {
      // Harvest resource
      homeMap[ty][tx] = { type: "outdoor", room: null };
      const resMap: Record<string, string> = { "🌿": "herbe", "🪵": "branche", "💜": "lavande", "🪨": "pierre" };
      const resId = resMap[t.emoji] || "herbe";
      onUpdateGs({ bag: { ...gs.bag, [resId]: (gs.bag[resId] || 0) + 1 } });
      sounds.harvest();
    }
  }, [activeRoom, nuisibleCombat, hx, hy, homeMap, gs, onUpdateGs]);

  return (
    <div style={{position:"fixed",inset:0,background:"#3A5A2A",touchAction:"none"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}}
        onClick={(e) => handleCanvasTap(e.clientX, e.clientY)} />
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
      {/* Nuisible combat — simplified Puyo (tap to attack) */}
      {nuisibleCombat && (() => {
        const nui = NUISIBLES[nuisibles[nuisibleCombat.idx].type];
        return <div style={{position:"absolute",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>{nui.emoji}</div>
          <div style={{color:"#FFF",fontSize:16,fontWeight:"bold"}}>{nui.name}</div>
          <div style={{width:120,height:8,background:"#333",borderRadius:4,margin:"8px auto"}}>
            <div style={{height:"100%",background:"#F44336",borderRadius:4,width:`${(nuisibleCombat.hp/nuisibleCombat.maxHp)*100}%`,transition:"width .2s"}} />
          </div>
          <div style={{color:"#F88",fontSize:12,marginBottom:16}}>HP {nuisibleCombat.hp}/{nuisibleCombat.maxHp}</div>
          <div style={{color:"#AAA",fontSize:11,marginBottom:8}}>Tapez pour attaquer !</div>
          <button onClick={() => {
            const dmg = Math.max(1, gs.stats.atk + gs.stats.mag);
            const newHp = nuisibleCombat.hp - dmg;
            sounds.hit();
            if (newHp <= 0) {
              // Victory
              sounds.victory();
              setNuisibles(prev => prev.map((n,i) => i===nuisibleCombat.idx ? {...n,alive:false} : n));
              // Drop loot
              const drop = nui.drop;
              onUpdateGs({bag:{...gs.bag,[drop]:(gs.bag[drop]||0)+1}, sous:gs.sous+2});
              setNuisibleCombat(null);
              // Respawn nuisible in 3 minutes
              const idx = nuisibleCombat.idx;
              setTimeout(() => setNuisibles(prev => prev.map((n,i) => i===idx ? {...n,alive:true} : n)), 180000);
            } else {
              // Enemy attacks back
              const eDmg = Math.max(1, nui.atk - gs.stats.def);
              onUpdateGs({hp: Math.max(1, gs.hp - eDmg)});
              setNuisibleCombat({...nuisibleCombat, hp:newHp});
            }
          }} style={{padding:"14px 40px",background:"linear-gradient(135deg,#E53935,#C62828)",color:"#FFF",border:"2px solid #FFD700",borderRadius:12,fontSize:18,fontWeight:"bold",cursor:"pointer"}}>
            ⚔️ Attaquer !
          </button>
          <button onClick={() => setNuisibleCombat(null)} style={{marginTop:8,padding:"8px 20px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,color:"#AAA",fontSize:12,cursor:"pointer"}}>🏃 Fuir</button>
        </div>;
      })()}

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
