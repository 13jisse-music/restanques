"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import { sounds } from "./lib/sounds";
import { CLASSES } from "./data/classes";

function genCode() {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l = Array.from({length:3}, () => L[Math.floor(Math.random()*L.length)]).join("");
  return `${l}-${String(Math.floor(100+Math.random()*900))}`;
}

export default function Home() {
  const router = useRouter();
  const [vis, setVis] = useState(false);
  const [fading, setFading] = useState(false);
  const [screen, setScreen] = useState<"main"|"create"|"join"|"class"|"options">("main");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [code, setCode] = useState("");
  const [sid, setSid] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setTimeout(() => setVis(true), 300);
    const s = () => { sounds.init(); sounds.playMusic("theme"); document.removeEventListener("click", s); };
    document.addEventListener("click", s);
    return () => document.removeEventListener("click", s);
  }, []);

  const fs = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };

  const create = async () => {
    if (!name.trim()) { setErr("Entrez votre nom !"); return; }
    const c = genCode(), seed = Math.floor(Math.random()*999999);
    const { data } = await supabase.from("game_sessions").insert({seed,active:true,code:c}).select().single();
    if (!data) { setErr("Erreur"); return; }
    setSid(data.id); setCode(c); setScreen("class");
  };

  const join = async () => {
    if (!name.trim()||!joinCode.trim()) { setErr("Remplissez tout !"); return; }
    const n = joinCode.toUpperCase().trim();
    const { data } = await supabase.from("game_sessions").select("*").eq("code",n).eq("active",true).single();
    if (!data) { setErr("Code introuvable !"); return; }
    setSid(data.id); setCode(n); setScreen("class");
  };

  const go = (cls: string) => {
    fs(); setFading(true);
    setTimeout(() => router.push(`/game?player=${encodeURIComponent(name.trim())}&class=${cls}&session=${sid}`), 500);
  };

  const P: React.CSSProperties = {
    background:"linear-gradient(#F5ECD7,#E8D5A3)", border:"4px solid #5C4033",
    borderRadius:14, padding:20, maxWidth:340, width:"90%",
    boxShadow:"0 8px 24px rgba(0,0,0,.5)", color:"#3D2B1F",
  };
  const I: React.CSSProperties = {
    width:"100%", padding:"12px 16px", fontSize:16, borderRadius:10,
    border:"2px solid #8B7355", background:"#FFF8E7", color:"#3D2B1F",
    fontFamily:"'Crimson Text',serif", textAlign:"center", marginBottom:10,
  };
  const CLS = [
    {...CLASSES.paladin, c1:"#6B8E23",c2:"#556B2F"},
    {...CLASSES.artisane, c1:"#B5658A",c2:"#8E4466"},
    {...CLASSES.ombre, c1:"#444",c2:"#1a1a2e"},
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"#000",opacity:fading?0:1,transition:"opacity .5s"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"url(/splash.png)",backgroundSize:"100% auto",backgroundPosition:"center 15%",backgroundRepeat:"no-repeat",backgroundColor:"#1A0A00",opacity:vis?1:0,transition:"opacity 1.5s"}} />

      {screen==="main"&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:10,padding:"40px 24px 30px",background:"linear-gradient(transparent,rgba(0,0,0,.8) 30%)",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <button onClick={()=>{sounds.click();setScreen("create")}} style={{width:"85%",maxWidth:320,height:54,borderRadius:14,cursor:"pointer",fontSize:18,fontWeight:"bold",color:"#FFF",letterSpacing:3,border:"2px solid #DAA520",background:"linear-gradient(135deg,#6B8E23,#556B2F)",boxShadow:"0 4px 15px rgba(0,0,0,.4)",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(20px)",transition:"opacity .5s .5s, transform .5s .5s"}}>🎮 CRÉER UNE PARTIE</button>
        <button onClick={()=>{sounds.click();setScreen("join")}} style={{width:"85%",maxWidth:320,height:54,borderRadius:14,cursor:"pointer",fontSize:18,fontWeight:"bold",color:"#FFF",letterSpacing:3,border:"2px solid #DAA520",background:"linear-gradient(135deg,#B5658A,#8E4466)",boxShadow:"0 4px 15px rgba(0,0,0,.4)",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(20px)",transition:"opacity .5s .7s, transform .5s .7s"}}>🤝 REJOINDRE</button>
        <button onClick={()=>setScreen("options")} style={{width:"60%",maxWidth:200,height:40,background:"rgba(0,0,0,.4)",border:"1px solid rgba(218,165,32,.4)",borderRadius:8,color:"rgba(255,248,231,.7)",fontSize:14,cursor:"pointer",opacity:vis?1:0,transition:"opacity .5s .9s"}}>⚙️ Options</button>
      </div>}

      {screen==="create"&&<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={P}>
          <div style={{fontSize:18,fontWeight:"bold",textAlign:"center",marginBottom:14}}>🎮 Créer une partie</div>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,12))} placeholder="Votre nom (1-12 car.)" style={I} />
          {err&&<div style={{color:"#D94F4F",fontSize:12,textAlign:"center",marginBottom:8}}>{err}</div>}
          <button onClick={create} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#6B8E23,#556B2F)",color:"#FFF",border:"2px solid #DAA520",borderRadius:10,fontSize:16,fontWeight:"bold",cursor:"pointer",marginBottom:8}}>Créer →</button>
          <button onClick={()=>{setScreen("main");setErr("")}} style={{width:"100%",padding:10,background:"#8B7355",color:"#E8D5A3",border:"2px solid #5C4033",borderRadius:10,fontSize:13,cursor:"pointer"}}>← Retour</button>
        </div>
      </div>}

      {screen==="join"&&<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={P}>
          <div style={{fontSize:18,fontWeight:"bold",textAlign:"center",marginBottom:14}}>🤝 Rejoindre</div>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,12))} placeholder="Votre nom" style={I} />
          <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,7))} placeholder="Code (LAV-847)" style={{...I,fontSize:22,letterSpacing:4,fontWeight:"bold"}} />
          {err&&<div style={{color:"#D94F4F",fontSize:12,textAlign:"center",marginBottom:8}}>{err}</div>}
          <button onClick={join} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#B5658A,#8E4466)",color:"#FFF",border:"2px solid #DAA520",borderRadius:10,fontSize:16,fontWeight:"bold",cursor:"pointer",marginBottom:8}}>Rejoindre →</button>
          <button onClick={()=>{setScreen("main");setErr("")}} style={{width:"100%",padding:10,background:"#8B7355",color:"#E8D5A3",border:"2px solid #5C4033",borderRadius:10,fontSize:13,cursor:"pointer"}}>← Retour</button>
        </div>
      </div>}

      {screen==="class"&&<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{...P,maxWidth:360}}>
          <div style={{fontSize:16,fontWeight:"bold",textAlign:"center",marginBottom:4}}>Choisissez votre classe</div>
          {code&&<div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:13,color:"#DAA520",letterSpacing:2,marginBottom:6}}>Code : <strong style={{fontSize:18}}>{code}</strong></div>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              <button onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}/join/${code}`);setErr("✅ Lien copié !");setTimeout(()=>setErr(""),2000);}} style={{padding:"6px 12px",background:"#5C4033",color:"#E8D5A3",border:"1px solid #8B7355",borderRadius:8,fontSize:11,cursor:"pointer"}}>📋 Copier lien</button>
              {typeof navigator!=="undefined"&&navigator.share&&<button onClick={()=>navigator.share({title:"Restanques",text:`Rejoins ma partie ! Code: ${code}`,url:`${window.location.origin}/join/${code}`}).catch(()=>{})} style={{padding:"6px 12px",background:"#6B8E23",color:"#FFF",border:"1px solid #DAA520",borderRadius:8,fontSize:11,cursor:"pointer"}}>📤 Partager</button>}
            </div>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {CLS.map(c=>(
              <button key={c.id} onClick={()=>go(c.id)} style={{padding:"12px 16px",borderRadius:12,background:`linear-gradient(135deg,${c.c1},${c.c2})`,color:"#FFF",border:"2px solid #DAA520",cursor:"pointer",fontSize:15,fontWeight:"bold",textAlign:"left"}}>
                <span style={{fontSize:24,marginRight:8}}>{c.emoji}</span><span>{c.name.toUpperCase()}</span>
                <div style={{fontSize:11,fontWeight:"normal",marginTop:4,opacity:.8}}>{c.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>setScreen("main")} style={{width:"100%",padding:10,background:"#8B7355",color:"#E8D5A3",border:"2px solid #5C4033",borderRadius:10,fontSize:13,cursor:"pointer",marginTop:10}}>← Retour</button>
        </div>
      </div>}

      {screen==="options"&&<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={P}>
          <div style={{fontSize:16,fontWeight:"bold",textAlign:"center",marginBottom:14}}>⚙️ Options</div>
          <button onClick={()=>setScreen("main")} style={{width:"100%",padding:10,background:"#8B7355",color:"#E8D5A3",border:"2px solid #5C4033",borderRadius:10,fontSize:13,cursor:"pointer"}}>❌ Fermer</button>
        </div>
      </div>}
    </div>
  );
}
