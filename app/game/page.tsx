"use client";
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CLASSES } from "../data/classes";
import {
  BIOMES, MONSTERS, BOSSES, RES, BIOME_RES,
  EQUIPMENT, RECIPES, TOOLS, NPCS, STORY, PORTALS, FORTRESS_POS, BAG_SIZES,
} from "../data/game-data";
import { sounds } from "../lib/sounds";
import {
  MapTile, Mob, CombatState, FloatMsg, GameState, Pos,
  TILE_PX, MAP_W, MAP_H, PUYO_W, PUYO_H, GEM_COLORS, defaultGameState,
} from "../components/GameTypes";
import { mkGrid, findMatches, applyGravity, swapGems, mkRng } from "../components/PuyoHelpers";
import { Panel, hudBtn, menuBtn } from "../components/Panel";
import { HomeMap } from "../home/HomeMap";
import { CombatScreen } from "./CombatScreen";
import { GameHUD } from "./GameHUD";
import { Onboarding } from "./Onboarding";
import { Bestiaire } from "./Bestiaire";
import { useMultiPlayer, QuickMessages, MessageOverlay } from "./MultiPlayer";
import { SwipeMenu } from "./SwipeMenu";
import { NewGamePlus } from "./NewGamePlus";
import { MysteryCharacter } from "./MysteryCharacter";

// ═══════════════════════════════════════════════════════
// MAP GENERATION
// ═══════════════════════════════════════════════════════
function genMap(seed: number): MapTile[][] {
  const rng = mkRng(seed);
  const map: MapTile[][] = Array.from({length: MAP_H}, () => Array.from({length: MAP_W}, () => ({ biome: "garrigue", type: "ground" as const })));
  const biomeZones = [
    {id:"garrigue",cx:37,cy:37,r:50}, {id:"calanques",cx:112,cy:37,r:50},
    {id:"mines",cx:37,cy:112,r:50}, {id:"mer",cx:112,cy:112,r:50},
    {id:"restanques",cx:75,cy:75,r:25},
  ];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    let minD = 999, best = "garrigue";
    for (const z of biomeZones) {
      const d = Math.sqrt((x-z.cx)**2+(y-z.cy)**2) - z.r*(0.8+rng()*0.4);
      if (d < minD) { minD = d; best = z.id; }
    }
    map[y][x].biome = best;
    const r = rng();
    if (r < 0.08) map[y][x].type = "block";
    else if (r < 0.12) map[y][x].type = "path";
    else if (r < 0.18) {
      const res = BIOME_RES[best];
      if (res) { const rid = res[Math.floor(rng()*res.length)]; map[y][x].type = "resource"; map[y][x].resId = rid; map[y][x].resHp = RES[rid]?.hp ?? 10; }
    }
  }
  // Paths
  const pairs: [Pos,Pos][] = [[{x:37,y:37},{x:75,y:75}],[{x:112,y:37},{x:75,y:75}],[{x:37,y:112},{x:75,y:75}],[{x:112,y:112},{x:75,y:75}],[{x:37,y:37},{x:112,y:37}],[{x:37,y:37},{x:37,y:112}],[{x:112,y:37},{x:112,y:112}]];
  for (const [a, b] of pairs) {
    let cx = a.x, cy = a.y;
    for (let i = 0; i < 300; i++) {
      if (Math.abs(cx-b.x) > Math.abs(cy-b.y)) cx += cx<b.x?1:-1; else cy += cy<b.y?1:-1;
      if (rng() < 0.3) cx += rng()<0.5?1:-1;
      cx = Math.max(1,Math.min(MAP_W-2,Math.round(cx))); cy = Math.max(1,Math.min(MAP_H-2,Math.round(cy)));
      if (map[cy][cx].type !== "portal" && map[cy][cx].type !== "npc") {
        map[cy][cx].type = "path";
        if (rng()<0.4 && cx+1<MAP_W) map[cy][cx+1].type = "path";
        if (rng()<0.4 && cy+1<MAP_H) map[cy+1][cx].type = "path";
      }
    }
  }
  // Portals, NPCs, Fortress, Home
  for (const [biome, portals] of Object.entries(PORTALS)) for (const p of portals) {
    const zone = biomeZones.find(z=>z.id===biome)!;
    let px = zone.cx, py = zone.cy;
    if (p.side==="N") py=zone.cy-30; if (p.side==="S") py=zone.cy+30; if (p.side==="E") px=zone.cx+30; if (p.side==="W") px=zone.cx-30;
    map[Math.max(2,Math.min(MAP_H-3,py))][Math.max(2,Math.min(MAP_W-3,px))] = {biome,type:"portal",portalTo:p.target};
  }
  for (const npc of NPCS) { const z=biomeZones.find(z=>z.id===npc.biome)!; const nx=Math.max(2,Math.min(MAP_W-3,z.cx+Math.floor(rng()*20-10))); const ny=Math.max(2,Math.min(MAP_H-3,z.cy+Math.floor(rng()*20-10))); map[ny][nx]={biome:npc.biome,type:"npc",npcId:npc.id}; }
  for (const [biome,pos] of Object.entries(FORTRESS_POS)) map[Math.max(2,Math.min(MAP_H-3,pos.y))][Math.max(2,Math.min(MAP_W-3,pos.x))]={biome,type:"fortress"};
  map[35][35] = {biome:"garrigue",type:"home"};
  for (let i=0;i<MAP_W;i++){map[0][i].type="block";map[MAP_H-1][i].type="block";}
  for (let i=0;i<MAP_H;i++){map[i][0].type="block";map[i][MAP_W-1].type="block";}
  return map;
}

function spawnMobs(map: MapTile[][], seed: number): Mob[] {
  const rng = mkRng(seed+7777); const mobs: Mob[] = []; let mid = 0;
  for (let y=5;y<MAP_H-5;y+=4) for (let x=5;x<MAP_W-5;x+=4) {
    if (rng()>0.15) continue; const tile=map[y][x];
    if (tile.type!=="ground"&&tile.type!=="path") continue;
    const pool=MONSTERS[tile.biome]; if (!pool?.length) continue;
    const m=pool[Math.floor(rng()*pool.length)];
    mobs.push({id:`m${mid++}`,mId:m.id,x:x*TILE_PX,y:y*TILE_PX,hp:m.hp,maxHp:m.hp,atk:m.atk,lv:m.lv,drops:m.drops,sous:m.sous,emoji:m.emoji,name:m.name,dir:rng()*Math.PI*2,moveT:0});
  }
  return mobs;
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
export default function GamePageWrapper() {
  return <Suspense fallback={<div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",color:"#DAA520",fontSize:18}}>Chargement...</div>}><GameInner /></Suspense>;
}

function GameInner() {
  const params = useSearchParams();
  const router = useRouter();
  const playerName = params.get("player") || "Héros";
  const playerClassId = params.get("class") || "paladin";
  const playerClass = CLASSES[playerClassId] || CLASSES.paladin;

  const [seed] = useState(() => Date.now());
  const mapRef = useRef<MapTile[][]|null>(null);
  const mobsRef = useRef<Mob[]>([]);
  const [px, setPx] = useState(35 * TILE_PX);
  const [py, setPy] = useState(35 * TILE_PX);
  const [gs, setGs] = useState<GameState>(() => defaultGameState(playerClass));
  const [gameTime, setGameTime] = useState(0);
  const [dayPhase, setDayPhase] = useState<"day"|"dusk"|"night"|"dawn">("day");
  const [combat, setCombat] = useState<CombatState|null>(null);
  const [panel, setPanel] = useState<"none"|"bag"|"craft"|"npc"|"shop"|"story"|"map"|"menu"|"bestiaire"|"ngplus"|"mystery">("none");
  const [npcDialog, setNpcDialog] = useState<{name:string;emoji:string;text:string}|null>(null);
  const [storyText, setStoryText] = useState<string[]>([]);
  const [storyIdx, setStoryIdx] = useState(0);
  const [floats, setFloats] = useState<FloatMsg[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [inHome, setInHome] = useState(playerClassId === "artisane");
  const [quickMsgs, setQuickMsgs] = useState<{from:string;text:string;t:number}[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joyRef = useRef({active:false,dx:0,dy:0});
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const lastTRef = useRef(0);
  const moveCdRef = useRef(0);
  const fIdRef = useRef(0);
  const [sessionId] = useState(() => typeof window !== "undefined" ? `s_${Date.now().toString(36)}` : "");
  const { drawOthers, sendMessage, messages: mpMessages } = useMultiPlayer({
    sessionId: sessionId || "",
    playerName: playerName,
    playerClass: playerClassId,
    px, py, canvasRef
  });

  const updateGs = useCallback((u: Partial<GameState>) => setGs(prev => ({...prev,...u})), []);
  const addFloat = useCallback((x: number, y: number, text: string, color: string) => {
    const id = fIdRef.current++;
    setFloats(f => [...f, {id,x,y,text,color,t:Date.now()}]);
    setTimeout(() => setFloats(f => f.filter(m => m.id !== id)), 1000);
  }, []);
  const addToBag = useCallback((item: string, qty = 1) => {
    setGs(prev => {
      const total = Object.values(prev.bag).reduce((s,v)=>s+v,0);
      if (total >= BAG_SIZES[0]) return prev;
      return {...prev, bag:{...prev.bag,[item]:(prev.bag[item]||0)+qty}};
    });
  }, []);
  const gainXp = useCallback((amount: number) => {
    setGs(prev => {
      const next = prev.xp + amount; const need = prev.lv * 20;
      if (next >= need) {
        sounds.lvlUp();
        return {...prev, xp:next-need, lv:prev.lv+1, hp:Math.min(prev.hp+5,prev.maxHp+(prev.lv+1)*5), stats:{...prev.stats,atk:prev.stats.atk+1,def:prev.stats.def+(Math.random()<0.5?1:0)}};
      }
      return {...prev, xp:next};
    });
  }, []);

  // Init
  useEffect(() => {
    if (!mapRef.current) { mapRef.current = genMap(seed); mobsRef.current = spawnMobs(mapRef.current, seed); }
    sounds.init(); setStoryText(STORY.intro); setPanel("story"); setStoryIdx(0);
  }, [seed]);

  // Day/night
  useEffect(() => {
    const iv = setInterval(() => setGameTime(t => {
      const nt=t+1, c=nt%600;
      if (c<300) setDayPhase("day"); else if (c<375) setDayPhase("dusk"); else if (c<525) setDayPhase("night"); else setDayPhase("dawn");
      return nt;
    }), 1000);
    return () => clearInterval(iv);
  }, []);

  // Keyboard
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown",kd); window.addEventListener("keyup",ku);
    return () => { window.removeEventListener("keydown",kd); window.removeEventListener("keyup",ku); };
  }, []);

  const currentBiome = useMemo(() => {
    if (!mapRef.current) return "garrigue";
    const tx=Math.floor(px/TILE_PX), ty=Math.floor(py/TILE_PX);
    if (tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H) return mapRef.current[ty][tx].biome;
    return "garrigue";
  }, [px, py]);

  useEffect(() => {
    if (combat) { sounds.playMusic("combat"); return; }
    if (inHome) { sounds.playMusic("home"); return; }
    const b = BIOMES[currentBiome]; if (b) sounds.playMusic(b.music);
  }, [currentBiome, combat, inHome]);

  // Main loop
  useEffect(() => {
    if (combat || panel !== "none" || inHome) return;
    const map = mapRef.current; if (!map) return;
    let running = true;
    const loop = (time: number) => {
      if (!running) return;
      const dt = lastTRef.current ? (time-lastTRef.current)/1000 : 0.016;
      lastTRef.current = time;
      let dx=0, dy=0;
      const k=keysRef.current;
      if (k.has("arrowleft")||k.has("a")||k.has("q")) dx-=1;
      if (k.has("arrowright")||k.has("d")) dx+=1;
      if (k.has("arrowup")||k.has("z")||k.has("w")) dy-=1;
      if (k.has("arrowdown")||k.has("s")) dy+=1;
      const j=joyRef.current; if (j.active){dx+=j.dx;dy+=j.dy;}
      // Smooth movement with collision check per-tile
      if (dx||dy) {
        const len=Math.sqrt(dx*dx+dy*dy);
        const spd=playerClass.speed*90*dt; // pixels per frame
        const ndx=(dx/len)*spd, ndy=(dy/len)*spd;
        const nx=px+ndx, ny=py+ndy;
        const tx=Math.floor(nx/TILE_PX), ty=Math.floor(ny/TILE_PX);
        if (tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H) {
          const tile=map[ty][tx];
          if (tile.type!=="block"&&tile.type!=="water") {
            setPx(nx); setPy(ny);
            if (frameRef.current%8===0) sounds.step();
            // Auto interactions on step
            if (tile.type==="portal"&&tile.portalTo) {
              const zones=[{id:"garrigue",cx:37,cy:37},{id:"calanques",cx:112,cy:37},{id:"mines",cx:37,cy:112},{id:"mer",cx:112,cy:112},{id:"restanques",cx:75,cy:75}];
              const z=zones.find(z=>z.id===tile.portalTo); if(z){setPx(z.cx*TILE_PX);setPy(z.cy*TILE_PX);sounds.open();}
            }
            if (tile.type==="home"&&frameRef.current%30===0) { setInHome(true); sounds.open(); }
          }
        }
      }
      // Mobs
      for (const mob of mobsRef.current) {
        if (mob.hp<=0) continue;
        mob.moveT+=dt; if(mob.moveT>2){mob.dir=Math.random()*Math.PI*2;mob.moveT=0;}
        const mx=mob.x+Math.cos(mob.dir)*30*dt, my=mob.y+Math.sin(mob.dir)*30*dt;
        const mtx=Math.floor(mx/TILE_PX), mty=Math.floor(my/TILE_PX);
        if (mtx>0&&mtx<MAP_W-1&&mty>0&&mty<MAP_H-1&&map[mty][mtx].type!=="block"){mob.x=mx;mob.y=my;} else mob.dir+=Math.PI;
        const ddx=mob.x-px, ddy=mob.y-py;
        if (ddx*ddx+ddy*ddy<900){startCombat(mob);break;}
      }
      frameRef.current++; draw();
      if (running) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat, panel, px, py, playerClass, inHome]);

  const draw = useCallback(() => {
    const cvs=canvasRef.current; if(!cvs||!mapRef.current) return;
    const ctx=cvs.getContext("2d"); if(!ctx) return;
    const W=cvs.width, H=cvs.height; ctx.clearRect(0,0,W,H);
    const map=mapRef.current, camX=px-W/2, camY=py-H/2;
    const stx=Math.max(0,Math.floor(camX/TILE_PX)-1), sty=Math.max(0,Math.floor(camY/TILE_PX)-1);
    const etx=Math.min(MAP_W,Math.ceil((camX+W)/TILE_PX)+1), ety=Math.min(MAP_H,Math.ceil((camY+H)/TILE_PX)+1);
    for (let ty=sty;ty<ety;ty++) for (let tx=stx;tx<etx;tx++) {
      const tile=map[ty][tx], biome=BIOMES[tile.biome]||BIOMES.garrigue, sx=tx*TILE_PX-camX, sy=ty*TILE_PX-camY;
      switch(tile.type){case"ground":ctx.fillStyle=(tx+ty)%2===0?biome.colors.ground:biome.colors.alt;break;case"path":ctx.fillStyle=biome.colors.path;break;case"block":ctx.fillStyle=biome.colors.block;break;case"water":ctx.fillStyle="#2471A3";break;default:ctx.fillStyle=biome.colors.ground;}
      ctx.fillRect(sx,sy,TILE_PX,TILE_PX);
      if (tile.type==="block"){ctx.font="18px serif";ctx.textAlign="center";ctx.fillText(tile.biome==="mer"||tile.biome==="calanques"?"🪨":"🌳",sx+TILE_PX/2,sy+TILE_PX/2+5);}
      if (tile.type==="water"){ctx.font="14px serif";ctx.textAlign="center";ctx.fillText("〰",sx+TILE_PX/2,sy+TILE_PX/2+4);}
      if (tile.type==="resource"&&tile.resId){ctx.font="20px serif";ctx.textAlign="center";ctx.fillText(RES[tile.resId]?.emoji||"?",sx+TILE_PX/2,sy+TILE_PX/2+6);}
      if (tile.type==="portal"){ctx.font="22px serif";ctx.textAlign="center";ctx.fillText("🌀",sx+TILE_PX/2,sy+TILE_PX/2+7);}
      if (tile.type==="npc"&&tile.npcId){const npc=NPCS.find(n=>n.id===tile.npcId);ctx.font="22px serif";ctx.textAlign="center";ctx.fillText(npc?.emoji||"❓",sx+TILE_PX/2,sy+TILE_PX/2+7);}
      if (tile.type==="fortress"){ctx.font="22px serif";ctx.textAlign="center";ctx.fillText("🏰",sx+TILE_PX/2,sy+TILE_PX/2+7);}
      if (tile.type==="home"){ctx.font="22px serif";ctx.textAlign="center";ctx.fillText("🏠",sx+TILE_PX/2,sy+TILE_PX/2+7);}
    }
    for (const mob of mobsRef.current) {
      if (mob.hp<=0) continue; const mx=mob.x-camX, my=mob.y-camY;
      if (mx<-40||mx>W+40||my<-40||my>H+40) continue;
      ctx.font="24px serif";ctx.textAlign="center";ctx.fillText(mob.emoji,mx,my+8);
      const hr=mob.hp/mob.maxHp; ctx.fillStyle="#333";ctx.fillRect(mx-14,my-18,28,4);
      ctx.fillStyle=hr>0.5?"#4CAF50":hr>0.25?"#FF9800":"#F44336";ctx.fillRect(mx-14,my-18,28*hr,4);
    }
    ctx.font="28px serif";ctx.textAlign="center";ctx.fillText(playerClass.emoji,W/2,H/2+8);
    ctx.font="bold 11px sans-serif";ctx.fillStyle="#FFF";ctx.strokeStyle="#000";ctx.lineWidth=2;
    ctx.strokeText(playerName,W/2,H/2-18);ctx.fillText(playerName,W/2,H/2-18);
    // Draw other multiplayer characters
    drawOthers(ctx, camX, camY);
    if (dayPhase==="night"){ctx.fillStyle="rgba(0,0,30,0.4)";ctx.fillRect(0,0,W,H);}
    else if (dayPhase==="dusk"||dayPhase==="dawn"){ctx.fillStyle="rgba(0,0,30,0.2)";ctx.fillRect(0,0,W,H);}
  }, [px, py, dayPhase, playerClass, playerName, drawOthers]);

  const startCombat = useCallback((mob: Mob) => {
    if (combat) return; sounds.hit();
    setCombat({enemy:mob,grid:mkGrid(),playerHp:gs.hp,enemyHp:mob.hp,turn:0,combo:0,msg:`${mob.emoji} ${mob.name} apparaît !`,phase:"play",selected:null,animating:false});
  }, [combat, gs.hp]);

  const endCombat = useCallback((won: boolean, newHp: number, drops?: string, sousGain?: number) => {
    if (won && drops) { addToBag(drops); if(sousGain) setGs(p=>({...p,sous:p.sous+sousGain})); }
    if (!won) { setGs(p=>({...p,hp:Math.max(1,Math.floor(p.maxHp/2)),sous:Math.max(0,p.sous-20)})); setPx(35*TILE_PX); setPy(35*TILE_PX); }
    else setGs(p=>({...p,hp:newHp}));
    setCombat(null);
  }, [addToBag]);

  // Resize
  useEffect(() => {
    const r=()=>{if(canvasRef.current){canvasRef.current.width=window.innerWidth;canvasRef.current.height=window.innerHeight;}};
    r(); window.addEventListener("resize",r); return ()=>window.removeEventListener("resize",r);
  }, []);

  // Joystick handlers
  const joyStart = useCallback((e: React.TouchEvent) => {
    joyRef.current.active=true; const el=e.currentTarget.getBoundingClientRect();
    const ox=e.touches[0].clientX-el.left-el.width/2, oy=e.touches[0].clientY-el.top-el.height/2;
    const l=Math.sqrt(ox*ox+oy*oy); if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}
  }, []);
  const joyMove = useCallback((e: React.TouchEvent) => {
    if(!joyRef.current.active) return; const el=e.currentTarget.getBoundingClientRect();
    const ox=e.touches[0].clientX-el.left-el.width/2, oy=e.touches[0].clientY-el.top-el.height/2;
    const l=Math.sqrt(ox*ox+oy*oy); if(l>5){joyRef.current.dx=ox/l;joyRef.current.dy=oy/l;}else{joyRef.current.dx=0;joyRef.current.dy=0;}
  }, []);
  const joyEnd = useCallback(() => {joyRef.current.active=false;joyRef.current.dx=0;joyRef.current.dy=0;}, []);

  const biomeName=BIOMES[currentBiome]?.name||"?", biomeEmoji=BIOMES[currentBiome]?.emoji||"?";

  // TAP handler for world interactions (harvest, NPC, fortress, mob)
  const handleWorldTap = useCallback((clientX: number, clientY: number) => {
    if (combat || panel !== "none") return;
    const map = mapRef.current; if (!map) return;
    const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const worldX = (clientX - rect.left) + px - cvs.width/2;
    const worldY = (clientY - rect.top) + py - cvs.height/2;
    const tx = Math.floor(worldX/TILE_PX), ty = Math.floor(worldY/TILE_PX);
    if (tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return;
    const ptx = Math.floor(px/TILE_PX), pty = Math.floor(py/TILE_PX);
    const dist = Math.abs(tx-ptx)+Math.abs(ty-pty);
    if (dist > 3) return;
    const tile = map[ty][tx];
    if (tile.type==="resource"&&tile.resId&&tile.resHp&&tile.resHp>0) {
      tile.resHp -= playerClass.harvestTap;
      addFloat(tx*TILE_PX, ty*TILE_PX-20, `-${playerClass.harvestTap}`, "#FFA726");
      sounds.harvest();
      if (tile.resHp<=0) { addToBag(tile.resId); addFloat(tx*TILE_PX,ty*TILE_PX-40,`+${RES[tile.resId]?.emoji||""}`, "#4CAF50"); tile.type="ground"; tile.resId=undefined; }
    }
    if (tile.type==="npc"&&tile.npcId) {
      const npc=NPCS.find(n=>n.id===tile.npcId); if(npc){sounds.open();setNpcDialog({name:npc.name,emoji:npc.emoji,text:npc.quest});setPanel("npc");}
    }
    if (tile.type==="fortress") {
      const boss=BOSSES[tile.biome]; if(boss) startCombat({id:"boss_"+tile.biome,mId:"boss",x:px,y:py,hp:boss.hp,maxHp:boss.hp,atk:boss.atk,lv:boss.lv,drops:[boss.drop],sous:[boss.sous,boss.sous],emoji:boss.emoji,name:boss.name,dir:0,moveT:0,isBoss:true});
    }
    for (const mob of mobsRef.current) {
      if (mob.hp<=0) continue;
      const mx=Math.floor(mob.x/TILE_PX), my=Math.floor(mob.y/TILE_PX);
      if (mx===tx&&my===ty) { startCombat(mob); break; }
    }
  }, [combat, panel, px, py, playerClass, addFloat, addToBag, startCombat]);

  // HOME MODE
  if (inHome) {
    return <HomeMap gs={gs} onUpdateGs={updateGs} onExit={()=>{setInHome(false);sounds.close();}} playerEmoji={playerClass.emoji} playerName={playerName} canCraft={playerClass.canCraft} craftFail={playerClass.craftFail} />;
  }

  return (
    <div style={{position:"fixed",inset:0,background:"#000",overflow:"hidden",touchAction:"none"}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0}}
        onTouchEnd={(e) => { const t=e.changedTouches[0]; if(t) handleWorldTap(t.clientX,t.clientY); }}
        onClick={(e) => handleWorldTap(e.clientX,e.clientY)} />
      <GameHUD playerClass={playerClass} playerName={playerName} gs={gs} lv={gs.lv} xp={gs.xp} biomeEmoji={biomeEmoji} biomeName={biomeName} dayPhase={dayPhase} timeOfDay={(gameTime%600)/600} />
      {!combat && panel==="none" && (
        <div style={{position:"absolute",bottom:10,right:10,zIndex:10,display:"flex",flexDirection:"column",gap:6}}>
          <button onClick={()=>{sounds.click();setPanel("bag")}} style={hudBtn}>🎒</button>
          <button onClick={()=>{sounds.click();setPanel("craft")}} style={hudBtn}>🔨</button>
          <button onClick={()=>{sounds.click();setPanel("bestiaire")}} style={hudBtn}>📖</button>
          <button onClick={()=>{sounds.click();setPanel("map")}} style={hudBtn}>🗺️</button>
          <button onClick={()=>{sounds.click();setPanel("menu")}} style={hudBtn}>⚙️</button>
        </div>
      )}
      {!combat && panel==="none" && (
        <div onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
          style={{position:"absolute",bottom:20,left:20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.12)",border:"2px solid rgba(255,255,255,.2)",zIndex:10,touchAction:"none"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,.25)"}} />
        </div>
      )}
      {showMinimap && !combat && panel==="none" && <MiniMap map={mapRef.current} px={px} py={py} />}
      {floats.map(f => <div key={f.id} style={{position:"absolute",left:f.x-px+(canvasRef.current?.width||0)/2,top:f.y-py+(canvasRef.current?.height||0)/2-30,color:f.color,fontSize:14,fontWeight:"bold",pointerEvents:"none",animation:"dmgFloat 1s forwards",zIndex:50,textShadow:"0 1px 3px #000"}}>{f.text}</div>)}

      {combat && <CombatScreen combat={combat} setCombat={setCombat} stats={gs.stats} playerClass={playerClass} maxHp={gs.maxHp+gs.lv*5} lv={gs.lv} onEnd={endCombat} addToBag={addToBag} gainXp={gainXp} mobsRef={mobsRef} />}

      {panel==="bag" && <Panel title="🎒 Inventaire" onClose={()=>setPanel("none")}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {Object.entries(gs.bag).filter(([,v])=>v>0).map(([id,qty])=>(<div key={id} style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:8,textAlign:"center",fontSize:12,color:"#FFF"}}><div style={{fontSize:22}}>{RES[id]?.emoji||TOOLS[id]?.emoji||"📦"}</div><div>{RES[id]?.name||TOOLS[id]?.name||id}</div><div style={{color:"#FFD700"}}>×{qty}</div></div>))}
          {Object.keys(gs.bag).filter(k=>gs.bag[k]>0).length===0 && <div style={{gridColumn:"1/-1",textAlign:"center",color:"#888",padding:20}}>Inventaire vide</div>}
        </div>
      </Panel>}
      {panel==="craft" && <Panel title="🔨 Artisanat" onClose={()=>setPanel("none")}>
        {!playerClass.canCraft && playerClassId==="paladin" ? <div style={{color:"#F88",textAlign:"center",padding:20}}>Le Paladin ne peut pas crafter !</div> :
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
          {[...Object.entries(TOOLS).map(([k,v])=>({id:k,name:v.name,emoji:v.emoji,recipe:v.recipe})),...EQUIPMENT.map(e=>({id:e.id,name:e.name,emoji:e.emoji,recipe:e.recipe})),...RECIPES.map(r=>({id:r.id,name:r.name,emoji:r.emoji,recipe:r.recipe}))].map(r=>{
            const canMake=Object.entries(r.recipe).every(([i,q])=>(gs.bag[i]||0)>=q);
            return <button key={r.id} onClick={()=>canMake&&sounds.craft()} style={{padding:10,background:canMake?"rgba(76,175,80,.2)":"rgba(255,255,255,.05)",border:canMake?"1px solid #4CAF50":"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#FFF",cursor:canMake?"pointer":"default",opacity:canMake?1:0.5,textAlign:"left",fontSize:13}}><span style={{fontSize:18,marginRight:6}}>{r.emoji}</span>{r.name}<div style={{fontSize:10,color:"#AAA",marginTop:2}}>{Object.entries(r.recipe).map(([i,q])=>`${RES[i]?.emoji||i}×${q}`).join(" ")}</div></button>;
          })}
        </div>}
      </Panel>}
      {panel==="npc" && npcDialog && <Panel title={`${npcDialog.emoji} ${npcDialog.name}`} onClose={()=>{setPanel("none");setNpcDialog(null);}}><div style={{color:"#E8D5A3",fontSize:14,lineHeight:1.6,padding:10}}>{npcDialog.text}</div></Panel>}
      {panel==="map" && <Panel title="🗺️ Carte" onClose={()=>setPanel("none")}><BigMap map={mapRef.current} px={px} py={py} /></Panel>}
      {panel==="menu" && <Panel title="⚙️ Menu" onClose={()=>setPanel("none")}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>sounds.cycleVol()} style={menuBtn}>{sounds.volIcon()} Volume</button>
          <button onClick={()=>setShowMinimap(m=>!m)} style={menuBtn}>🗺️ Minimap: {showMinimap?"ON":"OFF"}</button>
          <button onClick={()=>{setPanel("mystery");sounds.click()}} style={menuBtn}>🎭 Personnage Mystere</button>
          {gs.bossesDefeated.length>=5 && <button onClick={()=>{setPanel("ngplus");sounds.click()}} style={{...menuBtn,border:"1px solid #DAA520"}}>🌟 New Game+</button>}
          <div style={{fontSize:12,color:"#888",textAlign:"center",marginTop:10}}>{playerClass.emoji} {playerName} | Lv{gs.lv} | {biomeEmoji} {biomeName}<br/>ATK:{gs.stats.atk} DEF:{gs.stats.def} MAG:{gs.stats.mag} VIT:{gs.stats.vit}</div>
          <button onClick={()=>{sounds.close();router.push("/")}} style={{...menuBtn,background:"rgba(139,0,0,.3)",borderColor:"#F44"}}>🚪 Quitter</button>
        </div>
      </Panel>}
      {panel==="story" && storyText.length>0 && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30}} onClick={()=>{if(storyIdx<storyText.length-1) setStoryIdx(i=>i+1); else{setPanel("none");setStoryText([]);}}}>
          <div style={{maxWidth:360,color:"#E8D5A3",fontSize:18,lineHeight:1.8,textAlign:"center",fontStyle:"italic",animation:"fadeIn .5s"}}>{storyText[storyIdx]}</div>
          <div style={{color:"#888",fontSize:12,marginTop:20}}>{storyIdx<storyText.length-1?"Touchez pour continuer...":"Touchez pour commencer"}</div>
        </div>
      )}
      {panel==="bestiaire" && <Bestiaire discovered={gs.bestiaire} onClose={()=>setPanel("none")} />}
      {panel==="ngplus" && <NewGamePlus gs={gs} onStart={()=>{updateGs({newGamePlus:gs.newGamePlus+1,bossesDefeated:[],questsDone:[]});setPanel("none");}} onClose={()=>setPanel("none")} />}
      {panel==="mystery" && <MysteryCharacter onClose={()=>setPanel("none")} bossesDefeated={gs.bossesDefeated} />}
      {!combat && panel==="none" && showOnboarding && gs.onboardingStep < 5 && <Onboarding gs={gs} onClose={()=>setShowOnboarding(false)} />}
      {!combat && panel==="none" && <QuickMessages onSend={(text)=>{sendMessage(text);setQuickMsgs(m=>[...m.slice(-9),{from:playerName,text,t:Date.now()}]);}} />}
      {/* Sort de Rappel — Artisane : retour maison permanent */}
      {!combat && !inHome && playerClassId==="artisane" && <button onClick={()=>{setInHome(true);sounds.teleport();}} style={{position:"absolute",bottom:80,right:10,zIndex:10,padding:"8px 14px",background:"linear-gradient(135deg,#9B59B6,#6A1B9A)",color:"#FFF",border:"2px solid #DAA520",borderRadius:10,fontSize:12,fontWeight:"bold",cursor:"pointer",boxShadow:"0 0 10px rgba(155,89,182,.4)"}}>🏠 Rappel</button>}
      <MessageOverlay messages={[...quickMsgs,...mpMessages]} />
    </div>
  );
}

// ─── MiniMap / BigMap ───
function MiniMap({map,px,py}:{map:MapTile[][]|null;px:number;py:number}) {
  const cvs=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!cvs.current||!map) return; const ctx=cvs.current.getContext("2d"); if(!ctx) return;
    ctx.clearRect(0,0,100,100); const sc=100/MAP_W;
    for(let y=0;y<MAP_H;y+=3) for(let x=0;x<MAP_W;x+=3){const t=map[y][x],b=BIOMES[t.biome];ctx.fillStyle=t.type==="block"?b?.colors.block||"#333":b?.colors.ground||"#666";ctx.fillRect(x*sc,y*sc,3*sc,3*sc);}
    ctx.fillStyle="#FF0";ctx.fillRect((px/TILE_PX)*sc-2,(py/TILE_PX)*sc-2,4,4);
  },[map,px,py]);
  return <canvas ref={cvs} width={100} height={100} style={{position:"absolute",top:38,right:10,zIndex:10,borderRadius:8,border:"1px solid rgba(255,255,255,.2)",opacity:.8}} />;
}
function BigMap({map,px,py}:{map:MapTile[][]|null;px:number;py:number}) {
  const cvs=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(!cvs.current||!map) return; const ctx=cvs.current.getContext("2d"); if(!ctx) return;
    ctx.clearRect(0,0,300,300); const sc=300/MAP_W;
    for(let y=0;y<MAP_H;y+=2) for(let x=0;x<MAP_W;x+=2){const t=map[y][x],b=BIOMES[t.biome];ctx.fillStyle=t.type==="block"?b?.colors.block||"#333":t.type==="path"?b?.colors.path||"#AA8":b?.colors.ground||"#666";ctx.fillRect(x*sc,y*sc,2*sc+1,2*sc+1);}
    ctx.fillStyle="#00FFFF"; for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) if(map[y][x].type==="portal") ctx.fillRect(x*sc-1,y*sc-1,4,4);
    ctx.fillStyle="#FF0";ctx.beginPath();ctx.arc((px/TILE_PX)*sc,(py/TILE_PX)*sc,4,0,Math.PI*2);ctx.fill();
  },[map,px,py]);
  return <canvas ref={cvs} width={300} height={300} style={{width:"100%",borderRadius:8,border:"1px solid rgba(255,255,255,.15)"}} />;
}
