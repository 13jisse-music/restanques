"use client";
import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { CombatState, Mob, PUYO_W, PUYO_H, GEM_COLORS } from "../components/GameTypes";
import { RES } from "../data/game-data";
import { sounds } from "../lib/sounds";
import type { PlayerClass } from "../data/classes";

// ═══ PUYO ENGINE — 1 seule grille plein écran, ennemi en header ═══
type Grid = (number|null)[][];
interface Pair { c1:number; c2:number; x:number; y:number; rot:number }
const NC = 5;
function empty(): Grid { return Array.from({length:PUYO_H},()=>Array(PUYO_W).fill(null)); }
function rp(): Pair { return {c1:Math.floor(Math.random()*NC),c2:Math.floor(Math.random()*NC),x:2,y:0,rot:0}; }
function c2p(p:Pair):{x:number;y:number} {
  const o=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}][p.rot%4];
  return {x:p.x+o.x,y:Math.floor(p.y)+o.y};
}
function fits(g:Grid,p:Pair):boolean {
  const y1=Math.floor(p.y),p2=c2p(p);
  return p.x>=0&&p.x<PUYO_W&&y1>=0&&y1<PUYO_H&&p2.x>=0&&p2.x<PUYO_W&&p2.y>=0&&p2.y<PUYO_H&&g[y1][p.x]===null&&(g[p2.y]?.[p2.x]??null)===null;
}
function land(g:Grid,p:Pair):boolean {
  const y1=Math.floor(p.y)+1,p2=c2p({...p,y:p.y+1});
  if(y1>=PUYO_H||p2.y>=PUYO_H) return true;
  if(g[y1][p.x]!==null) return true;
  if(p2.x>=0&&p2.x<PUYO_W&&p2.y>=0&&p2.y<PUYO_H&&g[p2.y][p2.x]!==null) return true;
  return false;
}
function put(g:Grid,p:Pair):Grid {
  const n=g.map(r=>[...r]); const y1=Math.floor(p.y),p2=c2p(p);
  if(y1>=0&&y1<PUYO_H) n[y1][p.x]=p.c1;
  if(p2.y>=0&&p2.y<PUYO_H&&p2.x>=0&&p2.x<PUYO_W) n[p2.y][p2.x]=p.c2;
  return n;
}
function grav(g:Grid):Grid {
  const n:Grid=Array.from({length:PUYO_H},()=>Array(PUYO_W).fill(null));
  for(let x=0;x<PUYO_W;x++){let w=PUYO_H-1;for(let y=PUYO_H-1;y>=0;y--)if(g[y][x]!==null){n[w--][x]=g[y][x];}}
  return n;
}
// Flood-fill 4+ connected
function findM(g:Grid):[number,number][] {
  const v=Array.from({length:PUYO_H},()=>Array(PUYO_W).fill(false)); const all:[number,number][]=[];
  for(let y=0;y<PUYO_H;y++)for(let x=0;x<PUYO_W;x++){
    if(v[y][x]||g[y][x]===null||(g[y][x]as number)<0)continue;
    const c=g[y][x],gr:[number,number][]=[],s:number[][]=[[y,x]];
    while(s.length){const[cy,cx]=s.pop()!;if(cx<0||cx>=PUYO_W||cy<0||cy>=PUYO_H||v[cy][cx]||g[cy][cx]!==c)continue;v[cy][cx]=true;gr.push([cy,cx]);s.push([cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]);}
    if(gr.length>=4) all.push(...gr);
  }
  return all;
}
function rmM(g:Grid,m:[number,number][]):Grid {
  const n=g.map(r=>[...r]);
  const gb=new Set<string>();
  for(const[y,x]of m){n[y][x]=null;for(const[dy,dx]of[[-1,0],[1,0],[0,-1],[0,1]]){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<PUYO_H&&nx>=0&&nx<PUYO_W&&n[ny][nx]===-1)gb.add(`${ny},${nx}`);}}
  for(const k of gb){const[gy,gx]=k.split(",").map(Number);n[gy][gx]=null;}
  return n;
}
function addGb(g:Grid,lines:number):Grid {
  const n=g.map(r=>[...r]);
  for(let i=0;i<lines;i++){n.shift();const row:Grid[0]=Array(PUYO_W).fill(-1);row[Math.floor(Math.random()*PUYO_W)]=null;n.push(row);}
  return n;
}
const BG=["#9B59B6","#2196F3","#4CAF50","#FFC107","#E91E63"];
const LT=["#CE93D8","#64B5F6","#81C784","#FFE082","#F48FB1"];

interface Props {
  combat: CombatState;
  setCombat: (c:CombatState|null)=>void;
  stats: {atk:number;def:number;mag:number;vit:number};
  playerClass: PlayerClass;
  maxHp: number; lv: number;
  onEnd: (won:boolean,newHp:number,drop?:string,sous?:number)=>void;
  addToBag: (item:string,qty?:number)=>void;
  gainXp: (amount:number)=>void;
  mobsRef: MutableRefObject<Mob[]>;
}

export function CombatScreen({ combat, setCombat, stats, playerClass, maxHp, lv, onEnd, addToBag, gainXp, mobsRef }: Props) {
  const [grid, setGrid] = useState<Grid>(empty);
  const [pair, setPair] = useState<Pair>(rp);
  const [next, setNext] = useState<Pair>(rp);
  const [pHp, setPHp] = useState(combat.playerHp);
  const [eHp, setEHp] = useState(combat.enemyHp);
  const [msg, setMsg] = useState("Swipe ←→ | Tap tourner | Swipe ↓ drop");
  const [phase, setPhase] = useState<"play"|"win"|"lose">("play");
  const [comboCount, setComboCount] = useState(0);

  const dropMs = playerClass.id === "artisane" ? 1800 : 1200;
  const lastDrop = useRef(performance.now());
  const raf = useRef(0);
  const gRef = useRef(grid); gRef.current = grid;
  const pRef = useRef(pair); pRef.current = pair;
  const phRef = useRef(phase); phRef.current = phase;
  const eRef = useRef(eHp); eRef.current = eHp;
  const pHpRef = useRef(pHp); pHpRef.current = pHp;
  const turnRef = useRef(0);

  // Resolve chains
  const resolve = useCallback((g:Grid):{grid:Grid;total:number;combos:number} => {
    let grid=grav(g), total=0, combos=0;
    while(true) { const m=findM(grid); if(!m.length) break; total+=m.length; combos++; grid=rmM(grid,m); grid=grav(grid); sounds.gemMatch(combos); }
    return {grid,total,combos};
  }, []);

  // Game loop
  useEffect(() => {
    if (phase!=="play") return;
    const loop = (time:number) => {
      raf.current = requestAnimationFrame(loop);
      if (time-lastDrop.current < dropMs || phRef.current!=="play") return;
      lastDrop.current = time;
      const g=gRef.current, p=pRef.current;
      if (land(g,p)) {
        let ng=put(g,p);
        const {grid:rg,total,combos}=resolve(ng); ng=rg;
        // Player damage to enemy
        if (total>0) {
          const dmg=Math.round((stats.atk+stats.mag)*playerClass.combatMul*total*0.3*(1+combos*0.25));
          const nh=Math.max(0,eRef.current-dmg); setEHp(nh); eRef.current=nh;
          setComboCount(combos);
          setMsg(combos>1?`COMBO x${combos} ! -${dmg}`:`-${dmg} !`);
          if (nh<=0) {
            phRef.current="win"; setPhase("win");
            const drop=combat.enemy.drops[Math.floor(Math.random()*combat.enemy.drops.length)];
            const sGain=combat.enemy.sous[0]+Math.floor(Math.random()*(combat.enemy.sous[1]-combat.enemy.sous[0]));
            gainXp(combat.enemy.lv*5); sounds.victory();
            const mi=mobsRef.current.findIndex(m=>m.id===combat.enemy.id); if(mi>=0)mobsRef.current[mi].hp=0;
            setMsg(`Victoire ! +${RES[drop]?.emoji||drop} +${sGain}☀️`);
            setTimeout(()=>onEnd(true,pHpRef.current,drop,sGain),1500);
            setGrid(ng); return;
          }
        }
        // Enemy attacks every placement
        turnRef.current++;
        if (turnRef.current%2===0) { // Enemy attacks every 2nd turn
          const eDmg=Math.max(1,combat.enemy.atk-stats.def);
          const nh=pHpRef.current-eDmg; setPHp(nh); pHpRef.current=nh;
          if (nh<=0) { phRef.current="lose"; setPhase("lose"); sounds.defeat(); setTimeout(()=>onEnd(false,0),1500); setGrid(ng); return; }
        }
        // Enemy sends garbage every 4th turn
        if (turnRef.current%4===0) { ng=addGb(ng,1); }
        // Topped out?
        if (ng[0].some(c=>c!==null)) { phRef.current="lose"; setPhase("lose"); sounds.defeat(); setTimeout(()=>onEnd(false,0),1500); setGrid(ng); return; }
        setGrid(ng);
        setPair(next); pRef.current=next; setNext(rp());
      } else {
        const np={...p,y:p.y+1}; setPair(np); pRef.current=np;
      }
    };
    raf.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf.current);
  }, [phase,dropMs,stats,playerClass,combat.enemy,resolve,gainXp,mobsRef,onEnd,next]);

  // Touch
  const tRef=useRef({x:0,y:0,t:0});
  const onTS=(e:React.TouchEvent)=>{const t=e.touches[0];tRef.current={x:t.clientX,y:t.clientY,t:Date.now()};};
  const onTE=(e:React.TouchEvent)=>{
    if(phase!=="play")return; const t=e.changedTouches[0];
    const dx=t.clientX-tRef.current.x,dy=t.clientY-tRef.current.y,dt=Date.now()-tRef.current.t;
    if(dt<250&&Math.abs(dx)<25&&Math.abs(dy)<25){
      const np={...pRef.current,rot:(pRef.current.rot+1)%4};
      if(fits(gRef.current,np)){setPair(np);pRef.current=np;}
      else{const k={...np,x:np.x+1};if(fits(gRef.current,k)){setPair(k);pRef.current=k;}else{const k2={...np,x:np.x-1};if(fits(gRef.current,k2)){setPair(k2);pRef.current=k2;}}}
    } else if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)){
      const np={...pRef.current,x:pRef.current.x+(dx>0?1:-1)};
      if(fits(gRef.current,np)){setPair(np);pRef.current=np;}
    } else if(dy>40){
      let p=pRef.current;while(!land(gRef.current,p)&&p.y<PUYO_H)p={...p,y:p.y+1};
      setPair(p);pRef.current=p;lastDrop.current=0;
    }
  };

  // Render
  const W=typeof window!=="undefined"?window.innerWidth:360;
  const CELL=Math.floor(Math.min((W-16)/PUYO_W, 50));
  const eHpPct=combat.enemy.maxHp>0?Math.max(0,eHp/combat.enemy.maxHp)*100:0;
  const pHpPct=maxHp>0?Math.max(0,pHp/maxHp)*100:0;

  const cell=(val:number|null,sz:number,hl?:boolean)=>{
    if(val===null) return <div style={{width:sz,height:sz,borderRadius:sz*.2,background:"rgba(255,255,255,.03)"}} />;
    if(val===-1) return <div style={{width:sz,height:sz,borderRadius:sz*.2,background:"#444",border:"1px solid #333"}} />;
    const bg=BG[val%5],lt=LT[val%5];
    return <div style={{width:sz,height:sz,borderRadius:sz*.25,background:`radial-gradient(circle at 30% 30%,${lt},${bg})`,border:hl?"2px solid #FFD700":"1px solid rgba(0,0,0,.15)",boxShadow:hl?"0 0 8px rgba(255,215,0,.5)":"inset 1px 1px 2px rgba(255,255,255,.3)",position:"relative"}}>
      <div style={{position:"absolute",top:"12%",left:"18%",width:"25%",height:"18%",background:"rgba(255,255,255,.35)",borderRadius:"50%",transform:"rotate(-20deg)"}} />
    </div>;
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 4px",touchAction:"none",overflow:"hidden"}} onTouchStart={onTS} onTouchEnd={onTE}>
      {/* Header compact : joueur ←→ ennemi */}
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:380,alignItems:"center",marginBottom:4}}>
        <div style={{flex:1}}>
          <div style={{color:"#4CAF50",fontSize:12,fontWeight:"bold"}}>❤️{pHp}/{maxHp}</div>
          <div style={{width:"100%",height:6,background:"#222",borderRadius:3}}><div style={{height:"100%",background:"#4CAF50",borderRadius:3,width:`${pHpPct}%`,transition:"width .3s"}} /></div>
        </div>
        <div style={{padding:"0 8px",fontSize:14,color:"#FFD700"}}>⚔️</div>
        <div style={{flex:1,textAlign:"right"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
            <span style={{fontSize:24}}>{combat.enemy.emoji}</span>
            <div>
              <div style={{color:"#F88",fontSize:11,fontWeight:"bold"}}>{combat.enemy.name} Lv{combat.enemy.lv}</div>
              <div style={{width:80,height:5,background:"#222",borderRadius:3}}><div style={{height:"100%",background:"#F44336",borderRadius:3,width:`${eHpPct}%`,transition:"width .3s"}} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <div style={{color:phase==="win"?"#4CAF50":phase==="lose"?"#F44":"#FFD700",fontSize:12,fontWeight:"bold",marginBottom:2,textAlign:"center",minHeight:16}}>{msg}</div>

      {/* GRILLE UNIQUE — plein écran */}
      <div style={{padding:3,background:"rgba(255,255,255,.04)",borderRadius:10,border:"2px solid rgba(255,215,0,.25)"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},${CELL}px)`,gap:2}}>
          {grid.map((row,y)=>row.map((val,x)=>{
            let pc:number|null=null;
            const y1=Math.floor(pair.y);
            if(pair.x===x&&y1===y) pc=pair.c1;
            const p2=c2p(pair);
            if(p2.x===x&&p2.y===y) pc=pair.c2;
            return <div key={`${x}${y}`}>{cell(pc!==null?pc:val,CELL,pc!==null)}</div>;
          }))}
        </div>
      </div>

      {/* Suivant + combo */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
        <span style={{fontSize:10,color:"#666"}}>Suivant:</span>
        <div style={{display:"flex",gap:2}}>{cell(next.c1,18)}{cell(next.c2,18)}</div>
        {comboCount>1&&<span style={{color:"#FFD700",fontWeight:"bold",fontSize:12}}>COMBO x{comboCount}!</span>}
      </div>

      {/* Controles hint */}
      {phase==="play"&&<div style={{fontSize:9,color:"#555",marginTop:2}}>Swipe ←→ | Tap tourner | Swipe ↓ drop</div>}

      {/* Win/Lose */}
      {phase!=="play"&&<div style={{marginTop:12,textAlign:"center"}}>
        <div style={{fontSize:48}}>{phase==="win"?"🏆":"💀"}</div>
        <div style={{fontSize:20,fontWeight:"bold",color:phase==="win"?"#4CAF50":"#F44"}}>{phase==="win"?"Victoire !":"Defaite..."}</div>
      </div>}
    </div>
  );
}
