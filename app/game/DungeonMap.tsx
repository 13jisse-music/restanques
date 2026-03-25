"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { sounds } from "../lib/sounds";
import { mkRng } from "../components/PuyoHelpers";
import { MONSTERS, RES } from "../data/game-data";
import { Mob, TILE_PX } from "../components/GameTypes";

const DW = 20, DH = 20, DT = 32;

type DTile = "floor"|"wall"|"chest"|"exit"|"trap"|"boss_door";

function genDungeon(seed: number, biome: string): { map: DTile[][]; mobs: Mob[]; chests: {x:number;y:number;item:string}[] } {
  const rng = mkRng(seed);
  const map: DTile[][] = Array.from({length:DH}, () => Array.from({length:DW}, () => "wall" as DTile));
  // Carve rooms
  const rooms: {x:number;y:number;w:number;h:number}[] = [];
  for (let i = 0; i < 6; i++) {
    const w = 3 + Math.floor(rng()*4), h = 3 + Math.floor(rng()*4);
    const x = 1 + Math.floor(rng()*(DW-w-2)), y = 1 + Math.floor(rng()*(DH-h-2));
    rooms.push({x,y,w,h});
    for (let ry=y;ry<y+h;ry++) for (let rx=x;rx<x+w;rx++) map[ry][rx] = "floor";
  }
  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i-1], b = rooms[i];
    let cx = a.x+Math.floor(a.w/2), cy = a.y+Math.floor(a.h/2);
    const tx = b.x+Math.floor(b.w/2), ty = b.y+Math.floor(b.h/2);
    while (cx!==tx||cy!==ty) {
      if (cx!==tx) cx+=cx<tx?1:-1; else cy+=cy<ty?1:-1;
      if (cy>=0&&cy<DH&&cx>=0&&cx<DW) map[cy][cx] = "floor";
    }
  }
  // Place exit in last room
  const last = rooms[rooms.length-1];
  map[last.y+1][last.x+1] = "boss_door";
  // Place chests and traps
  const chests: {x:number;y:number;item:string}[] = [];
  const pool = MONSTERS[biome] || MONSTERS.garrigue;
  const mobs: Mob[] = [];
  let mid = 0;
  for (let y=1;y<DH-1;y++) for (let x=1;x<DW-1;x++) {
    if (map[y][x] !== "floor") continue;
    const r = rng();
    if (r < 0.03) {
      map[y][x] = "chest";
      const items = ["herbe","pierre","fer","cristal","lavande"];
      chests.push({x,y,item: items[Math.floor(rng()*items.length)]});
    } else if (r < 0.06) {
      map[y][x] = "trap";
    } else if (r < 0.1 && pool.length > 0) {
      const m = pool[Math.floor(rng()*pool.length)];
      mobs.push({id:`dm${mid++}`,mId:m.id,x:x*DT,y:y*DT,hp:m.hp,maxHp:m.hp,atk:m.atk,lv:m.lv,drops:m.drops,sous:m.sous,emoji:m.emoji,name:m.name,dir:rng()*Math.PI*2,moveT:0});
    }
  }
  return {map, mobs, chests};
}

interface Props {
  seed: number; biome: string;
  onBossDoor: () => void;
  onExit: (loot: Record<string,number>) => void;
  playerEmoji: string;
}

export function DungeonMap({ seed, biome, onBossDoor, onExit, playerEmoji }: Props) {
  const [{map, mobs, chests}] = useState(() => genDungeon(seed, biome));
  const [dx, setDx] = useState(2*DT);
  const [dy, setDy] = useState(2*DT);
  const [loot, setLoot] = useState<Record<string,number>>({});
  const [msg, setMsg] = useState("Explorez le donjon...");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef({active:false,dx:0,dy:0});

  useEffect(() => {
    const kd = (e:KeyboardEvent) => {keysRef.current.add(e.key.toLowerCase());e.preventDefault();};
    const ku = (e:KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown",kd); window.addEventListener("keyup",ku);
    return () => {window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);};
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current; if(!cvs) return;
    cvs.width=window.innerWidth; cvs.height=window.innerHeight;
  }, []);

  useEffect(() => {
    let run = true;
    const loop = () => {
      if (!run) return;
      let mx=0, my=0; const k=keysRef.current, j=joyRef.current;
      if (k.has("arrowleft")||k.has("a")||k.has("q")) mx-=1;
      if (k.has("arrowright")||k.has("d")) mx+=1;
      if (k.has("arrowup")||k.has("z")||k.has("w")) my-=1;
      if (k.has("arrowdown")||k.has("s")) my+=1;
      if (j.active){mx+=j.dx;my+=j.dy;}
      if (mx||my) {
        const len=Math.sqrt(mx*mx+my*my); const spd=3;
        const nx=dx+(mx/len)*spd, ny=dy+(my/len)*spd;
        const tx=Math.floor(nx/DT), ty=Math.floor(ny/DT);
        if (tx>=0&&tx<DW&&ty>=0&&ty<DH&&map[ty][tx]!=="wall") {
          setDx(nx); setDy(ny);
          if (map[ty][tx]==="chest") {
            const c=chests.find(c=>c.x===tx&&c.y===ty);
            if (c) {setLoot(l=>({...l,[c.item]:(l[c.item]||0)+1}));setMsg(`+1 ${c.item}`);sounds.open();map[ty][tx]="floor";}
          }
          if (map[ty][tx]==="trap") {setMsg("Piege !");sounds.hit();map[ty][tx]="floor";}
          if (map[ty][tx]==="boss_door") {onBossDoor();}
        }
      }
      // Draw
      const cvs=canvasRef.current; if(!cvs) {requestAnimationFrame(loop); return;}
      const ctx=cvs.getContext("2d"); if(!ctx) {requestAnimationFrame(loop); return;}
      const W=cvs.width, H=cvs.height;
      ctx.fillStyle="#0A0A0A"; ctx.fillRect(0,0,W,H);
      const cx=dx-W/2, cy=dy-H/2;
      for (let ty=0;ty<DH;ty++) for (let tx=0;tx<DW;tx++) {
        const sx=tx*DT-cx, sy=ty*DT-cy;
        if (sx<-DT||sx>W+DT||sy<-DT||sy>H+DT) continue;
        const t=map[ty][tx];
        ctx.fillStyle=t==="wall"?"#2A1A0A":t==="chest"?"#DAA520":t==="trap"?"#660000":t==="boss_door"?"#8B0000":"#3D2B1F";
        ctx.fillRect(sx,sy,DT,DT);
        if (t==="chest"){ctx.font="18px serif";ctx.textAlign="center";ctx.fillText("📦",sx+DT/2,sy+DT/2+6);}
        if (t==="boss_door"){ctx.font="18px serif";ctx.textAlign="center";ctx.fillText("🚪",sx+DT/2,sy+DT/2+6);}
        if (t==="trap"){ctx.font="14px serif";ctx.textAlign="center";ctx.fillText("💀",sx+DT/2,sy+DT/2+5);}
      }
      // Mobs
      for (const m of mobs) {
        if(m.hp<=0) continue;
        const mx2=m.x-cx, my2=m.y-cy;
        ctx.font="20px serif";ctx.textAlign="center";ctx.fillText(m.emoji,mx2,my2+6);
      }
      // Player
      ctx.font="24px serif";ctx.textAlign="center";ctx.fillText(playerEmoji,W/2,H/2+8);
      // Fog of war (simple radial)
      const grd=ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,200);
      grd.addColorStop(0,"rgba(0,0,0,0)"); grd.addColorStop(1,"rgba(0,0,0,.85)");
      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
      if (run) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {run=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dx, dy]);

  const joyStart = (e:React.TouchEvent) => {joyRef.current.active=true;const el=e.currentTarget.getBoundingClientRect();const ox=e.touches[0].clientX-el.left-el.width/2,oy=e.touches[0].clientY-el.top-el.height/2;const l=Math.sqrt(ox*ox+oy*oy);if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}};
  const joyMove = (e:React.TouchEvent) => {if(!joyRef.current.active)return;const el=e.currentTarget.getBoundingClientRect();const ox=e.touches[0].clientX-el.left-el.width/2,oy=e.touches[0].clientY-el.top-el.height/2;const l=Math.sqrt(ox*ox+oy*oy);if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}else{joyRef.current.dx=0;joyRef.current.dy=0;}};
  const joyEnd = () => {joyRef.current.active=false;joyRef.current.dx=0;joyRef.current.dy=0;};

  return (
    <div style={{position:"fixed",inset:0,background:"#0A0A0A",touchAction:"none"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}} />
      <div style={{position:"absolute",top:8,left:0,right:0,zIndex:10,textAlign:"center"}}>
        <div style={{color:"#DAA520",fontSize:14,fontWeight:"bold"}}>Donjon {biome}</div>
        <div style={{color:"#AAA",fontSize:11}}>{msg}</div>
      </div>
      <button onClick={()=>onExit(loot)} style={{position:"absolute",top:8,right:8,zIndex:10,background:"rgba(139,0,0,.4)",border:"1px solid #F44",borderRadius:8,color:"#FFF",padding:"4px 12px",fontSize:11,cursor:"pointer"}}>Fuir</button>
      <div onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
        style={{position:"absolute",bottom:20,left:20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.1)",border:"2px solid rgba(255,255,255,.15)",zIndex:10,touchAction:"none"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.2)"}} />
      </div>
    </div>
  );
}
