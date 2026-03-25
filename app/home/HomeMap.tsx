"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { sounds } from "../lib/sounds";
import { GardenPlot, GameState, CombatState, Mob, PUYO_W, PUYO_H } from "../components/GameTypes";
import { mkGrid } from "../components/PuyoHelpers";
import { GardenPanel } from "./GardenPanel";
import { KitchenPanel } from "./KitchenPanel";
import { ArmoryPanel } from "./ArmoryPanel";
import { SpellSalon } from "./SpellSalon";
import { BedroomPanel } from "./BedroomPanel";
import { ShopCounter } from "./ShopCounter";
import { CombatScreen } from "../game/CombatScreen";

const HW = 100, HH = 100, HT = 28;
type Room = "garden"|"kitchen"|"armory"|"salon"|"bedroom"|"shop"|null;
interface HomeTile { type: "floor"|"wall"|"door"|"garden"|"furniture"|"outdoor"|"resource"|"coffre"|"portail"; room: Room; emoji?: string }

// Nuisibles
const NUIS = [
  {emoji:"🐛",name:"Chenille",hp:4,atk:1,lv:1,drops:["graine"],sous:[1,2] as [number,number]},
  {emoji:"🐌",name:"Escargot",hp:5,atk:1,lv:1,drops:["herbe"],sous:[1,3] as [number,number]},
  {emoji:"🪲",name:"Scarabee",hp:6,atk:2,lv:2,drops:["branche"],sous:[2,3] as [number,number]},
  {emoji:"🐸",name:"Grenouille",hp:7,atk:2,lv:2,drops:["graine_rare"],sous:[2,4] as [number,number]},
];
interface Nui { x:number; y:number; type:number; alive:boolean }

function genHome(): HomeTile[][] {
  const m: HomeTile[][] = Array.from({length:HH}, () => Array.from({length:HW}, () => ({type:"outdoor" as const, room: null})));
  const safeX1=35,safeY1=30,safeX2=65,safeY2=70;
  const rng=()=>Math.random();
  for(let y=safeY1;y<safeY2;y++) for(let x=safeX1;x<safeX2;x++) {
    const r=rng();
    if(r<.04) m[y][x]={type:"resource",room:null,emoji:"🌿"};
    else if(r<.07) m[y][x]={type:"resource",room:null,emoji:"🪵"};
    else if(r<.09) m[y][x]={type:"resource",room:null,emoji:"💜"};
    else if(r<.105) m[y][x]={type:"resource",room:null,emoji:"🪨"};
    else m[y][x]={type:"outdoor",room:null};
  }
  // Maison
  const hx1=40,hy1=38,hx2=60,hy2=53;
  for(let x=hx1;x<=hx2;x++){m[hy1][x]={type:"wall",room:null};m[hy2][x]={type:"wall",room:null};}
  for(let y=hy1;y<=hy2;y++){m[y][hx1]={type:"wall",room:null};m[y][hx2]={type:"wall",room:null};}
  for(let y=hy1+1;y<hy2;y++) for(let x=hx1+1;x<hx2;x++) m[y][x]={type:"floor",room:null};
  // Salon top-left
  for(let y=hy1+1;y<=44;y++) for(let x=hx1+1;x<=49;x++) m[y][x]={type:"floor",room:"salon"};
  m[hy1+1][hx1+1]={type:"furniture",room:"salon",emoji:"✨"};
  for(let x=hx1+1;x<hx2;x++) m[45][x]={type:"wall",room:null};
  // Cuisine top-right
  for(let y=hy1+1;y<=44;y++) for(let x=51;x<hx2;x++) m[y][x]={type:"floor",room:"kitchen"};
  m[hy1+1][51]={type:"furniture",room:"kitchen",emoji:"🍳"};
  // Vertical wall x=50
  for(let y=hy1+1;y<=44;y++) m[y][50]={type:"wall",room:null};
  m[41][50]={type:"door",room:"salon"}; m[42][50]={type:"door",room:"salon"}; m[43][50]={type:"door",room:"salon"};
  // Armurerie bottom-left
  for(let y=46;y<hy2;y++) for(let x=hx1+1;x<=49;x++) m[y][x]={type:"floor",room:"armory"};
  m[46][hx1+1]={type:"furniture",room:"armory",emoji:"⚔️"};
  // Chambre + Comptoir bottom-right
  for(let y=46;y<=48;y++) for(let x=51;x<hx2;x++) m[y][x]={type:"floor",room:"bedroom"};
  m[46][51]={type:"furniture",room:"bedroom",emoji:"🛏️"};
  for(let x=51;x<hx2;x++) m[49][x]={type:"wall",room:null};
  for(let y=50;y<hy2;y++) for(let x=51;x<hx2;x++) m[y][x]={type:"floor",room:"shop"};
  m[50][51]={type:"furniture",room:"shop",emoji:"💰"};
  for(let y=46;y<hy2;y++) m[y][50]={type:"wall",room:null};
  m[47][50]={type:"door",room:"armory"}; m[48][50]={type:"door",room:"armory"}; m[49][50]={type:"door",room:"armory"};
  // Doors horizontal wall y=45
  m[45][44]={type:"door",room:"salon"}; m[45][45]={type:"door",room:"salon"}; m[45][46]={type:"door",room:"salon"};
  m[45][54]={type:"door",room:"kitchen"}; m[45][55]={type:"door",room:"kitchen"}; m[45][56]={type:"door",room:"kitchen"};
  // Front door wide
  m[hy2][49]={type:"door",room:null}; m[hy2][50]={type:"door",room:null}; m[hy2][51]={type:"door",room:null};
  // Jardin
  const gsx=43,gsy=55;
  for(let py=0;py<4;py++) for(let px=0;px<4;px++) {
    const gx=gsx+px*4,gy=gsy+py*4;
    for(let dy=0;dy<3;dy++) for(let dx=0;dx<3;dx++) if(gy+dy<HH&&gx+dx<HW) m[gy+dy][gx+dx]={type:"garden",room:"garden",emoji:(dy===1&&dx===1)?"🌱":undefined};
  }
  m[hy2+1][52]={type:"coffre",room:null,emoji:"📦"};
  m[safeY2-1][50]={type:"portail",room:null,emoji:"🚪"};
  return m;
}

interface HomeMapProps {
  gs: GameState; onUpdateGs: (u: Partial<GameState>) => void; onExit: () => void;
  playerEmoji: string; playerName: string; canCraft: boolean; craftFail: number;
}

export function HomeMap({ gs, onUpdateGs, onExit, playerEmoji, playerName, canCraft, craftFail }: HomeMapProps) {
  const [homeMap] = useState(genHome);
  const [hx, setHx] = useState(50*HT);
  const [hy, setHy] = useState(44*HT);
  const [activeRoom, setActiveRoom] = useState<Room>(null);
  const [combat, setCombat] = useState<CombatState|null>(null);
  const [nuisibles, setNuisibles] = useState<Nui[]>(() => {
    const spots=[[38,36],[62,36],[38,64],[62,64],[50,33],[50,67],[37,50],[63,50]];
    return spots.map(([nx,ny],i)=>({x:nx*HT,y:ny*HT,type:i%4,alive:true}));
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef({active:false,dx:0,dy:0});
  const lastTRef = useRef(0);
  const mobsRef = useRef<Mob[]>([]);

  useEffect(()=>{
    const kd=(e:KeyboardEvent)=>{keysRef.current.add(e.key.toLowerCase());e.preventDefault();};
    const ku=(e:KeyboardEvent)=>keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown",kd); window.addEventListener("keyup",ku);
    return ()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);};
  },[]);

  useEffect(()=>{
    const cvs=canvasRef.current; if(!cvs) return;
    cvs.width=window.innerWidth; cvs.height=window.innerHeight;
    const r=()=>{cvs.width=window.innerWidth;cvs.height=window.innerHeight;};
    window.addEventListener("resize",r); return ()=>window.removeEventListener("resize",r);
  },[]);

  // Main loop — MEME mouvement que le monde extérieur
  useEffect(()=>{
    if(activeRoom||combat) return;
    let run=true;
    const loop=(time:number)=>{
      if(!run) return;
      const dt=lastTRef.current?(time-lastTRef.current)/1000:0.016;
      lastTRef.current=time;
      let dx=0,dy=0;
      const k=keysRef.current,j=joyRef.current;
      if(k.has("arrowleft")||k.has("a")||k.has("q")) dx-=1;
      if(k.has("arrowright")||k.has("d")) dx+=1;
      if(k.has("arrowup")||k.has("z")||k.has("w")) dy-=1;
      if(k.has("arrowdown")||k.has("s")) dy+=1;
      if(j.active){dx+=j.dx;dy+=j.dy;}
      if(dx||dy){
        const len=Math.sqrt(dx*dx+dy*dy);
        const spd=90*dt;
        const nx=hx+(dx/len)*spd,ny=hy+(dy/len)*spd;
        const tx=Math.floor(nx/HT),ty=Math.floor(ny/HT);
        if(tx>=0&&tx<HW&&ty>=0&&ty<HH){
          const t=homeMap[ty][tx];
          if(t.type!=="wall"){
            setHx(nx);setHy(ny);
            if(t.type==="portail"){sounds.open();onExit();}
          }
        }
      }
      // Nuisible collision → Puyo combat
      const ptx=Math.floor(hx/HT),pty=Math.floor(hy/HT);
      for(let i=0;i<nuisibles.length;i++){
        const n=nuisibles[i]; if(!n.alive) continue;
        const ntx=Math.floor(n.x/HT),nty=Math.floor(n.y/HT);
        if(Math.abs(ptx-ntx)<=1&&Math.abs(pty-nty)<=1){
          const nui=NUIS[n.type];
          const mob:Mob={id:`nui_${i}`,mId:`nui_${n.type}`,x:n.x,y:n.y,hp:nui.hp,maxHp:nui.hp,atk:nui.atk,lv:nui.lv,drops:nui.drops,sous:nui.sous,emoji:nui.emoji,name:nui.name,dir:0,moveT:0};
          mobsRef.current=[mob];
          setCombat({enemy:mob,grid:mkGrid(),playerHp:gs.hp,enemyHp:nui.hp,turn:0,combo:0,msg:`${nui.emoji} ${nui.name} !`,phase:"play",selected:null,animating:false});
          setNuisibles(prev=>prev.map((nn,ii)=>ii===i?{...nn,alive:false}:nn));
          sounds.hit();
          const idx=i; setTimeout(()=>setNuisibles(prev=>prev.map((nn,ii)=>ii===idx?{...nn,alive:true}:nn)),180000);
          break;
        }
      }
      draw(); if(run) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return ()=>{run=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeRoom,combat,hx,hy]);

  // Nuisible patrol
  useEffect(()=>{
    if(activeRoom||combat) return;
    const iv=setInterval(()=>{
      setNuisibles(prev=>prev.map(n=>{
        if(!n.alive) return n;
        const dx=(Math.random()-.5)*2>0?HT:-HT,dy=(Math.random()-.5)*2>0?HT:-HT;
        const nx=n.x+(Math.random()>.5?dx:0),ny=n.y+(Math.random()>.5?dy:0);
        const tx=Math.floor(nx/HT),ty=Math.floor(ny/HT);
        if(tx>=35&&tx<=65&&ty>=30&&ty<=70&&homeMap[ty]?.[tx]?.type==="outdoor") return {...n,x:nx,y:ny};
        return n;
      }));
    },2000);
    return ()=>clearInterval(iv);
  },[activeRoom,combat,homeMap]);

  const draw=useCallback(()=>{
    const cvs=canvasRef.current; if(!cvs) return;
    const ctx=cvs.getContext("2d"); if(!ctx) return;
    const W=cvs.width,H=cvs.height;
    ctx.clearRect(0,0,W,H); ctx.fillStyle="#3A5A2A"; ctx.fillRect(0,0,W,H);
    const cx=hx-W/2,cy=hy-H/2;
    for(let ty=0;ty<HH;ty++) for(let tx=0;tx<HW;tx++){
      const t=homeMap[ty][tx],sx=tx*HT-cx,sy=ty*HT-cy;
      if(sx<-HT||sx>W+HT||sy<-HT||sy>H+HT) continue;
      switch(t.type){
        case"floor":ctx.fillStyle="#D4B896";break;case"wall":ctx.fillStyle="#5C4033";break;
        case"door":ctx.fillStyle="#8B6F47";break;case"garden":ctx.fillStyle="#6D9E2A";break;
        case"furniture":ctx.fillStyle="#D4B896";break;case"outdoor":ctx.fillStyle=(tx+ty)%2===0?"#4A7A3A":"#3E6E30";break;
        case"resource":ctx.fillStyle="#4A7A3A";break;case"coffre":ctx.fillStyle="#4A7A3A";break;case"portail":ctx.fillStyle="#6A4A2A";break;
      }
      ctx.fillRect(sx,sy,HT,HT);
      if(t.emoji){ctx.font="18px serif";ctx.textAlign="center";ctx.fillText(t.emoji,sx+HT/2,sy+HT/2+6);}
    }
    for(const n of nuisibles){
      if(!n.alive) continue; const nx=n.x-cx,ny=n.y-cy;
      if(nx<-HT||nx>W+HT||ny<-HT||ny>H+HT) continue;
      ctx.font="20px serif";ctx.textAlign="center";ctx.fillText(NUIS[n.type].emoji,nx+HT/2,ny+HT/2+6);
    }
    ctx.font="24px serif";ctx.textAlign="center";ctx.fillText(playerEmoji,W/2,H/2+8);
    ctx.font="bold 10px sans-serif";ctx.fillStyle="#FFF";ctx.strokeStyle="#000";ctx.lineWidth=2;
    ctx.strokeText(playerName,W/2,H/2-16);ctx.fillText(playerName,W/2,H/2-16);
  },[hx,hy,homeMap,playerEmoji,playerName,nuisibles]);

  // TAP canvas → furniture/resource
  const handleTap=useCallback((cx:number,cy:number)=>{
    if(activeRoom||combat) return;
    const cvs=canvasRef.current; if(!cvs) return;
    const rect=cvs.getBoundingClientRect();
    const wx=(cx-rect.left)+hx-cvs.width/2,wy=(cy-rect.top)+hy-cvs.height/2;
    const tx=Math.floor(wx/HT),ty=Math.floor(wy/HT);
    if(tx<0||tx>=HW||ty<0||ty>=HH) return;
    const ptx=Math.floor(hx/HT),pty=Math.floor(hy/HT);
    if(Math.abs(tx-ptx)>3||Math.abs(ty-pty)>3) return;
    const t=homeMap[ty][tx];
    if(t.type==="furniture"&&t.room){sounds.open();setActiveRoom(t.room);}
    if(t.type==="resource"&&t.emoji){
      homeMap[ty][tx]={type:"outdoor",room:null};
      const rm:Record<string,string>={"🌿":"herbe","🪵":"branche","💜":"lavande","🪨":"pierre"};
      const rid=rm[t.emoji]||"herbe";
      onUpdateGs({bag:{...gs.bag,[rid]:(gs.bag[rid]||0)+1}});sounds.harvest();
    }
  },[activeRoom,combat,hx,hy,homeMap,gs,onUpdateGs]);

  const endCombat=useCallback((won:boolean,newHp:number,drop?:string,sousGain?:number)=>{
    if(won&&drop) onUpdateGs({bag:{...gs.bag,[drop]:(gs.bag[drop]||0)+1},sous:gs.sous+(sousGain||0),hp:newHp});
    else onUpdateGs({hp:Math.max(1,Math.floor(gs.maxHp/2))});
    setCombat(null);
  },[gs,onUpdateGs]);

  const addToBag=useCallback((item:string)=>{onUpdateGs({bag:{...gs.bag,[item]:(gs.bag[item]||0)+1}});},[gs,onUpdateGs]);
  const gainXp=useCallback((a:number)=>{onUpdateGs({xp:gs.xp+a});},[gs,onUpdateGs]);
  const closeRoom=()=>{setActiveRoom(null);sounds.close();};

  // Joystick handlers
  const joyStart=(e:React.TouchEvent)=>{
    joyRef.current.active=true;const el=e.currentTarget.getBoundingClientRect();
    const ox=e.touches[0].clientX-el.left-el.width/2,oy=e.touches[0].clientY-el.top-el.height/2;
    const l=Math.sqrt(ox*ox+oy*oy);if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}
  };
  const joyMove=(e:React.TouchEvent)=>{
    if(!joyRef.current.active) return;const el=e.currentTarget.getBoundingClientRect();
    const ox=e.touches[0].clientX-el.left-el.width/2,oy=e.touches[0].clientY-el.top-el.height/2;
    const l=Math.sqrt(ox*ox+oy*oy);if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}else{joyRef.current.dx=0;joyRef.current.dy=0;}
  };
  const joyEnd=()=>{joyRef.current.active=false;joyRef.current.dx=0;joyRef.current.dy=0;};

  return (
    <div style={{position:"fixed",inset:0,background:"#3A5A2A",touchAction:"none"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}}
        onTouchEnd={(e)=>{const t=e.changedTouches[0];if(t)handleTap(t.clientX,t.clientY);}}
        onClick={(e)=>handleTap(e.clientX,e.clientY)} />
      {/* HUD */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(rgba(0,0,0,.7),transparent)"}}>
        <span style={{color:"#DAA520",fontSize:14,fontWeight:"bold"}}>🏠 Maison</span>
        <span style={{color:"#4CAF50",fontSize:12}}>❤️{gs.hp}/{gs.maxHp} ☀️{gs.sous}</span>
        <button onClick={onExit} style={{background:"rgba(139,0,0,.4)",border:"1px solid #F44",borderRadius:8,color:"#FFF",padding:"4px 12px",fontSize:12,cursor:"pointer"}}>🚪 Sortir</button>
      </div>
      {/* Joystick */}
      {!activeRoom&&!combat&&(
        <div onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
          style={{position:"absolute",bottom:20,left:20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.12)",border:"2px solid rgba(255,255,255,.2)",zIndex:10,touchAction:"none"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.25)"}} />
        </div>
      )}
      {/* PUYO COMBAT pour nuisibles */}
      {combat&&<CombatScreen combat={combat} setCombat={setCombat} stats={gs.stats} playerClass={{id:"artisane",name:"Artisane",emoji:"🎨",desc:"",baseStats:gs.stats,hp:gs.maxHp,sous:gs.sous,combatMul:1,speed:1,detect:4,canCraft:true,craftFail:0,harvestTap:3,lvlUp:{always:"mag",p50:"def",p25:"vit"}}} maxHp={gs.maxHp} lv={gs.lv} onEnd={endCombat} addToBag={addToBag} gainXp={gainXp} mobsRef={mobsRef} />}
      {/* Room panels */}
      {activeRoom==="garden"&&<GardenPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom==="kitchen"&&<KitchenPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom==="armory"&&<ArmoryPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} canCraft={canCraft} craftFail={craftFail} />}
      {activeRoom==="salon"&&<SpellSalon gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} canCraft={canCraft} />}
      {activeRoom==="bedroom"&&<BedroomPanel gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
      {activeRoom==="shop"&&<ShopCounter gs={gs} onUpdateGs={onUpdateGs} onClose={closeRoom} />}
    </div>
  );
}
