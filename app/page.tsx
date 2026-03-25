"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import { sounds } from "./lib/sounds";
import { CLASSES } from "./data/classes";

function genCode(): string {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l = Array.from({ length: 3 }, () => L[Math.floor(Math.random() * L.length)]).join("");
  return `${l}-${String(Math.floor(100 + Math.random() * 900))}`;
}

type Screen = "main" | "create" | "join" | "class" | "options";

export default function Home() {
  const router = useRouter();
  const [vis, setVis] = useState(false);
  const [fading, setFading] = useState(false);
  const [screen, setScreen] = useState<Screen>("main");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [ngPlus, setNgPlus] = useState(0);

  useEffect(() => {
    setTimeout(() => setVis(true), 300);
    const start = () => { sounds.init(); sounds.playMusic("theme"); document.removeEventListener("click", start); };
    document.addEventListener("click", start);
    return () => document.removeEventListener("click", start);
  }, []);

  const goFS = () => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const create = async () => {
    if (!name.trim()) { setError("Entrez votre nom !"); return; }
    const c = genCode();
    const seed = Math.floor(Math.random() * 999999);
    const { data, error: err } = await supabase.from("game_sessions").insert({ seed, active: true, code: c }).select().single();
    if (err || !data) { setError("Erreur de création"); return; }
    setSessionId(data.id); setCode(c); setScreen("class");
  };

  const join = async () => {
    if (!name.trim()) { setError("Entrez votre nom !"); return; }
    if (!joinCode.trim()) { setError("Entrez le code !"); return; }
    const norm = joinCode.toUpperCase().trim();
    const { data, error: err } = await supabase.from("game_sessions").select("*").eq("code", norm).eq("active", true).single();
    if (err || !data) { setError("Code introuvable !"); return; }
    setSessionId(data.id); setCode(norm); setScreen("class");
  };

  const start = (cls: string) => {
    goFS(); setFading(true);
    setTimeout(() => {
      router.push(`/game?player=${encodeURIComponent(name.trim())}&class=${cls}&session=${sessionId}`);
    }, 500);
  };

  const CLS = [
    { ...CLASSES.paladin, color: "#6B8E23", color2: "#556B2F" },
    { ...CLASSES.artisane, color: "#B5658A", color2: "#8E4466" },
    { ...CLASSES.ombre, color: "#444", color2: "#1a1a2e" },
  ];

  const panel: React.CSSProperties = {
    background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
    borderRadius: 14, padding: 20, maxWidth: 340, width: "90%",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)", color: "#3D2B1F",
  };
  const input: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: 16, borderRadius: 10,
    border: "2px solid #8B7355", background: "#FFF8E7", color: "#3D2B1F",
    fontFamily: "'Crimson Text', serif", textAlign: "center", marginBottom: 10,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", opacity: fading ? 0 : 1, transition: "opacity 0.5s" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/splash.png)", backgroundSize: "100% auto",
        backgroundPosition: "center 15%", backgroundRepeat: "no-repeat",
        backgroundColor: "#1A0A00",
        opacity: vis ? 1 : 0, transition: "opacity 1.5s",
      }} />

      {screen === "main" && <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "40px 24px 30px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8) 30%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <button onClick={() => { sounds.uiClick(); setScreen("create"); }} style={{
          width: "85%", maxWidth: 320, height: 54, borderRadius: 14, cursor: "pointer",
          fontSize: 18, fontWeight: "bold", color: "#FFF", letterSpacing: 3,
          border: "2px solid #DAA520", background: "linear-gradient(135deg, #6B8E23, #556B2F)",
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s 0.5s, transform 0.5s 0.5s",
        }}>🎮 CRÉER UNE PARTIE</button>
        <button onClick={() => { sounds.uiClick(); setScreen("join"); }} style={{
          width: "85%", maxWidth: 320, height: 54, borderRadius: 14, cursor: "pointer",
          fontSize: 18, fontWeight: "bold", color: "#FFF", letterSpacing: 3,
          border: "2px solid #DAA520", background: "linear-gradient(135deg, #B5658A, #8E4466)",
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s 0.7s, transform 0.5s 0.7s",
        }}>🤝 REJOINDRE</button>
        <button onClick={() => setScreen("options")} style={{
          width: "60%", maxWidth: 200, height: 40, background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(218,165,32,0.4)", borderRadius: 8,
          color: "rgba(255,248,231,0.7)", fontSize: 14, cursor: "pointer",
          opacity: vis ? 1 : 0, transition: "opacity 0.5s 0.9s",
        }}>⚙️ Options</button>
        {ngPlus > 0 && <div style={{ fontSize: 11, color: "rgba(218,165,32,0.6)", letterSpacing: 2 }}>NG+ ×{ngPlus}</div>}
      </div>}

      {screen === "create" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>🎮 Créer une partie</div>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 12))} placeholder="Votre nom (1-12 car.)" style={input} />
          {error && <div style={{ color: "#D94F4F", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div>}
          <button onClick={create} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6B8E23, #556B2F)", color: "#FFF", border: "2px solid #DAA520", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginBottom: 8 }}>Créer →</button>
          <button onClick={() => { setScreen("main"); setError(""); }} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>← Retour</button>
        </div>
      </div>}

      {screen === "join" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>🤝 Rejoindre</div>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 12))} placeholder="Votre nom" style={input} />
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 7))} placeholder="Code (LAV-847)" style={{ ...input, fontSize: 22, letterSpacing: 4, fontWeight: "bold" }} />
          {error && <div style={{ color: "#D94F4F", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div>}
          <button onClick={join} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #B5658A, #8E4466)", color: "#FFF", border: "2px solid #DAA520", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginBottom: 8 }}>Rejoindre →</button>
          <button onClick={() => { setScreen("main"); setError(""); }} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>← Retour</button>
        </div>
      </div>}

      {screen === "class" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...panel, maxWidth: 360 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>Choisissez votre classe</div>
          {code && <div style={{ fontSize: 13, textAlign: "center", color: "#DAA520", marginBottom: 12, letterSpacing: 2 }}>Code : <strong style={{ fontSize: 18 }}>{code}</strong></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CLS.map(c => (
              <button key={c.id} onClick={() => start(c.id)} style={{
                padding: "12px 16px", borderRadius: 12,
                background: `linear-gradient(135deg, ${c.color}, ${c.color2})`,
                color: "#FFF", border: "2px solid #DAA520", cursor: "pointer",
                fontSize: 15, fontWeight: "bold", textAlign: "left",
              }}>
                <span style={{ fontSize: 24, marginRight: 8 }}>{c.emoji}</span>
                <span>{c.name.toUpperCase()}</span>
                <div style={{ fontSize: 11, fontWeight: "normal", marginTop: 4, opacity: 0.8 }}>{c.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setScreen("main")} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer", marginTop: 10 }}>← Retour</button>
        </div>
      </div>}

      {screen === "options" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>⚙️ Options</div>
          <button onClick={() => setScreen("main")} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>❌ Fermer</button>
        </div>
      </div>}
    </div>
  );
}
