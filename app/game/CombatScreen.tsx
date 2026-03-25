"use client";
import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { CombatState, Mob, PUYO_W, PUYO_H, GEM_COLORS } from "../components/GameTypes";
import { RES } from "../data/game-data";
import { sounds } from "../lib/sounds";
import type { PlayerClass } from "../data/classes";

// ═══ VRAI PUYO PUYO — Paires tombantes, flood-fill 4+, gravity, garbage, IA ═══

type Grid = (number | null)[][]; // null=vide, 0-5=couleur, -1=garbage
interface Pair { c1: number; c2: number; x: number; y: number; rot: number }

const NUM_C = 5;
function emptyGrid(): Grid { return Array.from({length:PUYO_H}, ()=>Array(PUYO_W).fill(null)); }
function randPair(): Pair { return {c1:Math.floor(Math.random()*NUM_C),c2:Math.floor(Math.random()*NUM_C),x:2,y:0,rot:0}; }

// rot: 0=up, 1=right, 2=down, 3=left (position of c2 relative to c1)
function c2pos(p: Pair): {x:number;y:number} {
  const o = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}][p.rot%4];
  return {x:p.x+o.x, y:Math.floor(p.y)+o.y};
}

function fits(g: Grid, p: Pair): boolean {
  const y1=Math.floor(p.y), p2=c2pos(p);
  if(p.x<0||p.x>=PUYO_W||y1<0||y1>=PUYO_H) return false;
  if(p2.x<0||p2.x>=PUYO_W||p2.y<0||p2.y>=PUYO_H) return false;
  if(g[y1][p.x]!==null) return false;
  if(g[p2.y]?.[p2.x]!==null) return false;
  return true;
}

function landed(g: Grid, p: Pair): boolean {
  const y1=Math.floor(p.y)+1, p2=c2pos({...p,y:p.y+1});
  if(y1>=PUYO_H||p2.y>=PUYO_H) return true;
  if(g[y1][p.x]!==null) return true;
  if(p2.x>=0&&p2.x<PUYO_W&&p2.y>=0&&p2.y<PUYO_H&&g[p2.y][p2.x]!==null) return true;
  return false;
}

function place(g: Grid, p: Pair): Grid {
  const ng=g.map(r=>[...r]); const y1=Math.floor(p.y), p2=c2pos(p);
  if(y1>=0&&y1<PUYO_H) ng[y1][p.x]=p.c1;
  if(p2.y>=0&&p2.y<PUYO_H&&p2.x>=0&&p2.x<PUYO_W) ng[p2.y][p2.x]=p.c2;
  return ng;
}

function gravity(g: Grid): Grid {
  const ng: Grid=Array.from({length:PUYO_H},()=>Array(PUYO_W).fill(null));
  for(let x=0;x<PUYO_W;x++){let wy=PUYO_H-1;for(let y=PUYO_H-1;y>=0;y--)if(g[y][x]!==null){ng[wy--][x]=g[y][x];}}
  return ng;
}

// Flood-fill: 4+ connected same color = match
function findMatches(g: Grid): [number,number][] {
  const vis=Array.from({length:PUYO_H},()=>Array(PUYO_W).fill(false));
  const all: [number,number][] = [];
  for(let y=0;y<PUYO_H;y++) for(let x=0;x<PUYO_W;x++){
    if(vis[y][x]||g[y][x]===null||g[y][x]!==undefined&&g[y][x]!==null&&(g[y][x] as number)<0) continue;
    const col=g[y][x]; const grp: [number,number][]=[]; const stk: [number,number][]=[[y,x]];
    while(stk.length>0){const[cy,cx]=stk.pop()!;if(cx<0||cx>=PUYO_W||cy<0||cy>=PUYO_H||vis[cy][cx]||g[cy][cx]!==col)continue;vis[cy][cx]=true;grp.push([cy,cx]);stk.push([cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]);}
    if(grp.length>=4) all.push(...grp);
  }
  return all;
}

function removeMatches(g: Grid, m: [number,number][]): Grid {
  const ng=g.map(r=>[...r]);
  // Remove matched + adjacent garbage
  const garb=new Set<string>();
  for(const[y,x]of m){ng[y][x]=null;for(const[dy,dx]of[[-1,0],[1,0],[0,-1],[0,1]]){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<PUYO_H&&nx>=0&&nx<PUYO_W&&ng[ny][nx]===-1)garb.add(`${ny},${nx}`);}}
  for(const k of garb){const[gy,gx]=k.split(",").map(Number);ng[gy][gx]=null;}
  return ng;
}

function addGarbage(g: Grid, lines: number): Grid {
  const ng=g.map(r=>[...r]);
  for(let i=0;i<lines;i++){ng.shift();const row:Grid[0]=Array(PUYO_W).fill(-1);row[Math.floor(Math.random()*PUYO_W)]=null;ng.push(row);}
  return ng;
}

function topped(g: Grid): boolean { return g[0].some(c=>c!==null); }

// Simple AI: drop pair at random valid column
function aiDrop(g: Grid): {x:number;rot:number} {
  const opts: {x:number;rot:number;score:number}[]=[];
  for(let rot=0;rot<4;rot++)for(let x=0;x<PUYO_W;x++){
    const p={c1:0,c2:0,x,y:0,rot};if(!fits(g,p))continue;
    let ty=0;while(!landed(g,{...p,y:ty}))ty++;
    const pg=place(g,{...p,y:ty});const gv=gravity(pg);const m=findMatches(gv);
    let sc=m.length*10+ty;opts.push({x,rot,score:sc});
  }
  if(opts.length===0) return {x:2,rot:0};
  opts.sort((a,b)=>b.score-a.score);
  return opts[Math.floor(Math.random()*Math.min(3,opts.length))]; // slight randomness
}

// ═══ COLORS ═══
const BG = ["#9B59B6","#2196F3","#4CAF50","#FFC107","#E91E63"];
const LIGHT = ["#CE93D8","#64B5F6","#81C784","#FFE082","#F48FB1"];

// ═══ COMPONENT ═══
interface Props {
  combat: CombatState;
  setCombat: (c: CombatState|null) => void;
  stats: {atk:number;def:number;mag:number;vit:number};
  playerClass: PlayerClass;
  maxHp: number; lv: number;
  onEnd: (won:boolean, newHp:number, drop?:string, sous?:number)=>void;
  addToBag: (item:string, qty?:number)=>void;
  gainXp: (amount:number)=>void;
  mobsRef: MutableRefObject<Mob[]>;
}

export function CombatScreen({ combat, setCombat, stats, playerClass, maxHp, lv, onEnd, addToBag, gainXp, mobsRef }: Props) {
  const [pGrid, setPGrid] = useState<Grid>(emptyGrid);
  const [eGrid, setEGrid] = useState<Grid>(emptyGrid);
  const [pair, setPair] = useState<Pair>(randPair);
  const [next, setNext] = useState<Pair>(randPair);
  const [pHp, setPHp] = useState(combat.playerHp);
  const [eHp, setEHp] = useState(combat.enemyHp);
  const [msg, setMsg] = useState(`${combat.enemy.emoji} ${combat.enemy.name} !`);
  const [phase, setPhase] = useState<"play"|"win"|"lose">("play");
  const [combo, setCombo] = useState(0);

  const dropMs = playerClass.id === "artisane" ? 1000 : 650;
  const lastDrop = useRef(performance.now());
  const raf = useRef(0);
  const pGridRef = useRef(pGrid); pGridRef.current = pGrid;
  const pairRef = useRef(pair); pairRef.current = pair;
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const eHpRef = useRef(eHp); eHpRef.current = eHp;
  const pHpRef = useRef(pHp); pHpRef.current = pHp;

  // Resolve chains (recursive), returns final grid + total matched cells
  const resolveChains = useCallback((g: Grid, isEnemy: boolean): {grid:Grid;total:number;combos:number} => {
    let grid = gravity(g);
    let total = 0, combos = 0;
    // eslint-disable-next-line no-constant-condition
    while(true) {
      const m = findMatches(grid);
      if(m.length === 0) break;
      total += m.length;
      combos++;
      grid = removeMatches(grid, m);
      grid = gravity(grid);
      sounds.gemMatch(combos);
    }
    return {grid, total, combos};
  }, []);

  // Main game loop
  useEffect(() => {
    if(phase !== "play") return;
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      const now = performance.now();
      if(now - lastDrop.current < dropMs) return;
      lastDrop.current = now;
      if(phaseRef.current !== "play") return;

      const g = pGridRef.current;
      const p = pairRef.current;

      if(landed(g, p)) {
        // Place pair
        let ng = place(g, p);
        const {grid, total, combos} = resolveChains(ng, false);
        ng = grid;

        // Damage to enemy
        if(total > 0) {
          const baseDmg = (stats.atk + stats.mag) * playerClass.combatMul;
          const dmg = Math.round(baseDmg * total * 0.3 * (1 + combos * 0.25));
          const newEHp = Math.max(0, eHpRef.current - dmg);
          setEHp(newEHp); eHpRef.current = newEHp;
          setCombo(combos);
          if(combos > 1) setMsg(`COMBO x${combos} ! -${dmg}`);
          else setMsg(`-${dmg} !`);

          // Send garbage to enemy on combos
          if(combos >= 2) {
            setEGrid(eg => addGarbage(eg, Math.min(3, combos - 1)));
          }

          if(newEHp <= 0) {
            phaseRef.current = "win"; setPhase("win");
            const drop = combat.enemy.drops[Math.floor(Math.random()*combat.enemy.drops.length)];
            const sGain = combat.enemy.sous[0]+Math.floor(Math.random()*(combat.enemy.sous[1]-combat.enemy.sous[0]));
            gainXp(combat.enemy.lv*5); sounds.victory();
            const mi = mobsRef.current.findIndex(m=>m.id===combat.enemy.id);
            if(mi>=0) mobsRef.current[mi].hp=0;
            setMsg(`Victoire ! +${RES[drop]?.emoji||drop} +${sGain}☀️`);
            setTimeout(()=>onEnd(true, pHpRef.current, drop, sGain), 1500);
            setPGrid(ng); return;
          }
        }

        // Enemy attacks after each placement
        const eDmg = Math.max(1, combat.enemy.atk - stats.def);
        const newPHp = pHpRef.current - eDmg;
        setPHp(newPHp); pHpRef.current = newPHp;

        if(newPHp <= 0) {
          phaseRef.current = "lose"; setPhase("lose");
          sounds.defeat(); setMsg("K.O.");
          setTimeout(()=>onEnd(false, 0), 1500);
          setPGrid(ng); return;
        }

        // Check topped out
        if(topped(ng)) {
          phaseRef.current = "lose"; setPhase("lose");
          sounds.defeat(); setMsg("Grille pleine !");
          setTimeout(()=>onEnd(false, 0), 1500);
          setPGrid(ng); return;
        }

        setPGrid(ng);

        // Enemy AI turn
        enemyTurn();

        // Next pair
        setPair(next); pairRef.current = next;
        setNext(randPair());
      } else {
        // Drop pair by 1 row
        const np = {...p, y: p.y + 1};
        setPair(np); pairRef.current = np;
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, dropMs, stats, playerClass, combat.enemy, resolveChains, gainXp, mobsRef, onEnd, next]);

  // Enemy AI
  const enemyTurn = useCallback(() => {
    setEGrid(eg => {
      const ep = randPair();
      const decision = aiDrop(eg);
      const placed = {...ep, x:decision.x, rot:decision.rot};
      let ty = 0;
      while(!landed(eg, {...placed, y:ty}) && ty < PUYO_H) ty++;
      let ng = place(eg, {...placed, y:ty});
      const {grid, total, combos} = resolveChains(ng, true);
      ng = grid;
      // Enemy combos send garbage to player
      if(combos >= 1 && total > 0) {
        setPGrid(pg => addGarbage(pg, Math.min(2, combos)));
      }
      return ng;
    });
  }, [resolveChains]);

  // Touch controls
  const touchRef = useRef({x:0,y:0,t:0});
  const onTS = (e: React.TouchEvent) => { const t=e.touches[0]; touchRef.current={x:t.clientX,y:t.clientY,t:Date.now()}; };
  const onTE = (e: React.TouchEvent) => {
    if(phase!=="play") return;
    const t=e.changedTouches[0]; const dx=t.clientX-touchRef.current.x, dy=t.clientY-touchRef.current.y;
    const dt = Date.now()-touchRef.current.t;
    if(dt<200 && Math.abs(dx)<20 && Math.abs(dy)<20) {
      // TAP = rotate
      const np={...pairRef.current, rot:(pairRef.current.rot+1)%4};
      if(fits(pGridRef.current, np)) { setPair(np); pairRef.current=np; }
      else { const k={...np,x:np.x+1}; if(fits(pGridRef.current,k)){setPair(k);pairRef.current=k;} else { const k2={...np,x:np.x-1}; if(fits(pGridRef.current,k2)){setPair(k2);pairRef.current=k2;}}}
    } else if(Math.abs(dx)>30 && Math.abs(dx)>Math.abs(dy)) {
      // Swipe horizontal
      const np={...pairRef.current, x:pairRef.current.x+(dx>0?1:-1)};
      if(fits(pGridRef.current, np)) { setPair(np); pairRef.current=np; }
    } else if(dy>30) {
      // Swipe down = hard drop
      let p=pairRef.current;
      while(!landed(pGridRef.current, p) && p.y < PUYO_H) p={...p, y:p.y+1};
      setPair(p); pairRef.current=p; lastDrop.current=0;
    }
  };

  // Render grid cells
  const CELL = Math.floor(Math.min((typeof window!=="undefined"?window.innerWidth:360) * 0.55 / PUYO_W, 32));
  const ECELL = Math.floor(CELL * 0.5);
  const eHpPct = combat.enemy.maxHp > 0 ? Math.max(0, eHp/combat.enemy.maxHp)*100 : 0;
  const pHpPct = maxHp > 0 ? Math.max(0, pHp/maxHp)*100 : 0;

  const renderCell = (val: number|null, size: number, highlight?: boolean) => {
    if(val===null) return <div style={{width:size,height:size,borderRadius:size*0.2,background:"rgba(255,255,255,.04)"}} />;
    if(val===-1) return <div style={{width:size,height:size,borderRadius:size*0.2,background:"#555",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5}}>⬛</div>;
    const bg = BG[val%5], lt = LIGHT[val%5];
    return <div style={{width:size,height:size,borderRadius:size*0.25,background:`radial-gradient(circle at 30% 30%,${lt},${bg})`,border:highlight?"2px solid #FFD700":"1px solid rgba(0,0,0,.2)",boxShadow:highlight?"0 0 8px rgba(255,215,0,.5)":"inset 1px 1px 2px rgba(255,255,255,.3)",position:"relative"}}>
      <div style={{position:"absolute",top:"15%",left:"20%",width:"25%",height:"18%",background:"rgba(255,255,255,.35)",borderRadius:"50%",transform:"rotate(-20deg)"}} />
    </div>;
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",padding:8,touchAction:"none"}}
      onTouchStart={onTS} onTouchEnd={onTE}>

      {/* Header: enemy info */}
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:360,marginBottom:4,alignItems:"center"}}>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:11,color:"#4CAF50"}}>❤️{pHp}/{maxHp}</div>
          <div style={{width:80,height:6,background:"#333",borderRadius:3,margin:"2px auto"}}><div style={{height:"100%",background:"#4CAF50",borderRadius:3,width:`${pHpPct}%`,transition:"width .3s"}} /></div>
        </div>
        <div style={{fontSize:16,color:"#FFD700"}}>⚔️</div>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:28}}>{combat.enemy.emoji}</div>
          <div style={{color:"#F88",fontSize:11}}>{combat.enemy.name} Lv{combat.enemy.lv}</div>
          <div style={{width:80,height:6,background:"#333",borderRadius:3,margin:"2px auto"}}><div style={{height:"100%",background:"#F44336",borderRadius:3,width:`${eHpPct}%`,transition:"width .3s"}} /></div>
          <div style={{color:"#F88",fontSize:9}}>HP {Math.max(0,eHp)}/{combat.enemy.maxHp}</div>
        </div>
      </div>

      {/* Message */}
      {msg && <div style={{color:"#FFD700",fontSize:12,marginBottom:4,textAlign:"center",fontWeight:"bold"}}>{msg}</div>}

      {/* Two grids side by side */}
      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
        {/* Player grid */}
        <div style={{padding:3,background:"rgba(255,255,255,.05)",borderRadius:8,border:"2px solid rgba(255,215,0,.3)"}}>
          <div style={{fontSize:8,textAlign:"center",color:"#FFD700",marginBottom:2}}>MA GRILLE</div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},${CELL}px)`,gap:1}}>
            {pGrid.map((row,y)=>row.map((val,x)=>{
              // Check if current pair is here
              let pairColor: number|null = null;
              const y1=Math.floor(pair.y);
              if(pair.x===x && y1===y) pairColor=pair.c1;
              const p2=c2pos(pair);
              if(p2.x===x && p2.y===y) pairColor=pair.c2;
              const display = pairColor !== null ? pairColor : val;
              return <div key={`p${x}${y}`}>{renderCell(display, CELL, pairColor!==null)}</div>;
            }))}
          </div>
        </div>
        {/* Enemy grid (preview) */}
        <div style={{padding:2,background:"rgba(255,255,255,.03)",borderRadius:6,border:"1px solid rgba(255,0,0,.2)",opacity:.75}}>
          <div style={{fontSize:7,textAlign:"center",color:"#F88",marginBottom:1}}>{combat.enemy.emoji} GRILLE</div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${PUYO_W},${ECELL}px)`,gap:1}}>
            {eGrid.map((row,y)=>row.map((val,x)=>
              <div key={`e${x}${y}`}>{renderCell(val, ECELL)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Next pair */}
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4,fontSize:9,color:"#888"}}>
        <span>Suivant:</span>
        <div style={{display:"flex",gap:2}}>
          {renderCell(next.c1, 16)}
          {renderCell(next.c2, 16)}
        </div>
        {combo>1 && <span style={{color:"#FFD700",fontWeight:"bold"}}>COMBO x{combo}</span>}
      </div>

      {/* Controls hint */}
      {phase==="play" && <div style={{fontSize:9,color:"#666",marginTop:4,textAlign:"center"}}>
        Swipe ←→ deplacer | Tap tourner | Swipe ↓ drop
      </div>}

      {/* Win/Lose */}
      {phase!=="play" && <div style={{marginTop:12,textAlign:"center"}}>
        <div style={{fontSize:40}}>{phase==="win"?"🏆":"💀"}</div>
        <div style={{fontSize:18,fontWeight:"bold",color:phase==="win"?"#4CAF50":"#F44336"}}>{phase==="win"?"Victoire !":"Defaite..."}</div>
      </div>}
    </div>
  );
}
