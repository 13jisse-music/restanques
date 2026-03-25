"use client";
import { Panel } from "../components/Panel";
import { MONSTERS, BOSSES, DEMI_BOSSES } from "../data/game-data";

interface Props { discovered: string[]; onClose: () => void }

export function Bestiaire({ discovered, onClose }: Props) {
  const allMonsters = [
    ...Object.values(MONSTERS).flat().map(m => ({id:m.id,name:m.name,emoji:m.emoji,lv:m.lv,hp:m.hp,atk:m.atk,type:"monstre" as const})),
    ...DEMI_BOSSES.map(d => ({id:d.id,name:d.name,emoji:d.emoji,lv:d.lv,hp:d.hp,atk:d.atk,type:"demi-boss" as const})),
    ...Object.values(BOSSES).map(b => ({id:b.name,name:b.name,emoji:b.emoji,lv:b.lv,hp:b.hp,atk:b.atk,type:"boss" as const})),
  ];

  return (
    <Panel title="Bestiaire" onClose={onClose}>
      <div style={{fontSize:11,color:"#888",marginBottom:8}}>{discovered.length}/{allMonsters.length} decouvertes</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,maxHeight:350,overflowY:"auto"}}>
        {allMonsters.map(m => {
          const found = discovered.includes(m.id);
          return (
            <div key={m.id} style={{
              background:found?"rgba(255,255,255,.08)":"rgba(0,0,0,.3)",
              border:`1px solid ${m.type==="boss"?"#F44":m.type==="demi-boss"?"#FF9800":"rgba(255,255,255,.1)"}`,
              borderRadius:8,padding:6,textAlign:"center",
            }}>
              <div style={{fontSize:24}}>{found ? m.emoji : "❓"}</div>
              <div style={{fontSize:10,color:found?"#FFF":"#444"}}>{found ? m.name : "???"}</div>
              {found && <div style={{fontSize:9,color:"#888"}}>Lv{m.lv} HP{m.hp}</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
