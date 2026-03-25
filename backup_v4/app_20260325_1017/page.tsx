"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import { sounds } from "./lib/sounds";
import { GameGuide } from "./game/components/GameGuide";

function genCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const n = String(Math.floor(100 + Math.random() * 900));
  return `${l}-${n}`;
}

type Screen = "main" | "create" | "join" | "class" | "waiting" | "options";

export default function Home() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [screen, setScreen] = useState<Screen>("main");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [ngPlusCount, setNgPlusCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("players").select("ng_plus").gt("ng_plus", 0).limit(1).then(({ data }) => {
      if (data && data.length > 0) setNgPlusCount(data[0].ng_plus || 0);
    });
    setTimeout(() => setVisible(true), 300);
    const startTheme = () => { sounds.init(); sounds.playMusic("theme"); document.removeEventListener("click", startTheme); };
    document.addEventListener("click", startTheme);
    return () => document.removeEventListener("click", startTheme);
  }, []);

  const goFullscreen = () => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const createSession = async () => {
    if (!playerName.trim()) { setError("Entrez votre nom !"); return; }
    const code = genCode();
    const seed = Math.floor(Math.random() * 999999);
    const { data, error: err } = await supabase.from("game_sessions").insert({ seed, active: true, code }).select().single();
    if (err || !data) { setError("Erreur de création"); return; }
    setSessionId(data.id);
    setSessionCode(code);
    setScreen("class");
  };

  const joinSession = async () => {
    if (!playerName.trim()) { setError("Entrez votre nom !"); return; }
    if (!joinCode.trim()) { setError("Entrez le code !"); return; }
    const normalized = joinCode.toUpperCase().trim();
    const { data, error: err } = await supabase.from("game_sessions")
      .select("*").eq("code", normalized).eq("active", true).single();
    if (err || !data) { setError("Code introuvable ! Vérifiez le code."); return; }
    setSessionId(data.id);
    setSessionCode(normalized);
    setScreen("class");
  };

  const startGame = (cls: string) => {
    setSelectedClass(cls);
    goFullscreen();
    setFading(true);
    setTimeout(() => {
      router.push(`/game?player=${encodeURIComponent(playerName.trim())}&class=${cls}&session=${sessionId}`);
    }, 500);
  };

  const CLASSES = [
    { id: "aventurier", emoji: "🎸", name: "AVENTURIER", desc: "Combat +20%, explore loin, Rage du guerrier", color: "#6B8E23", color2: "#556B2F" },
    { id: "artisane", emoji: "🎨", name: "ARTISANE", desc: "Récolte ×2, Jardin, Cuisine, Fusion d'items", color: "#B5658A", color2: "#8E4466" },
    { id: "ombre", emoji: "🌙", name: "L'OMBRE", desc: "Vitesse +30%, critiques ×3 — Mode avancé", color: "#444", color2: "#1a1a2e", locked: false },
  ];

  const btnStyle = (bg: string, delay = 0): React.CSSProperties => ({
    width: "85%", maxWidth: 320, height: 54, borderRadius: 14, cursor: "pointer",
    fontSize: 18, fontWeight: "bold", color: "#FFF",
    fontFamily: "'Crimson Text', Georgia, serif", letterSpacing: 3,
    textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
    border: "2px solid #DAA520",
    boxShadow: "0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
    background: bg, textTransform: "uppercase",
    opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
  });

  const smallBtn = (delay = 0): React.CSSProperties => ({
    width: "60%", maxWidth: 200, height: 40,
    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(218,165,32,0.4)",
    borderRadius: 8, color: "rgba(255,248,231,0.7)",
    fontSize: 14, fontFamily: "'Crimson Text', Georgia, serif",
    cursor: "pointer", backdropFilter: "blur(8px)", letterSpacing: 2,
    opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
  });

  const panel: React.CSSProperties = {
    background: "linear-gradient(#F5ECD7, #E8D5A3)", border: "4px solid #5C4033",
    borderRadius: 14, padding: 20, maxWidth: 340, width: "90%",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)", fontFamily: "'Courier New',monospace",
    color: "#3D2B1F",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: 16, borderRadius: 10,
    border: "2px solid #8B7355", background: "#FFF8E7", color: "#3D2B1F",
    fontFamily: "'Crimson Text', serif", textAlign: "center", marginBottom: 10,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", opacity: fading ? 0 : 1, transition: "opacity 0.5s ease" }}>
      {/* Splash image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/splash.png)", backgroundSize: "100% auto",
        backgroundPosition: "center 15%", backgroundRepeat: "no-repeat",
        backgroundColor: "#1A0A00",
        opacity: visible ? 1 : 0, transition: "opacity 1.5s ease",
      }} />

      {/* MAIN SCREEN */}
      {screen === "main" && <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "40px 24px 30px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8) 30%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        <button onClick={() => { sounds.uiClick(); setScreen("create"); }} style={btnStyle("linear-gradient(135deg, #6B8E23, #556B2F)", 0.5)}>
          🎮 Créer une partie
        </button>
        <button onClick={() => { sounds.uiClick(); setScreen("join"); }} style={btnStyle("linear-gradient(135deg, #B5658A, #8E4466)", 0.7)}>
          🤝 Rejoindre une partie
        </button>
        <button onClick={() => setScreen("options")} style={smallBtn(0.9)}>⚙️ Options</button>
        {ngPlusCount > 0 && <div style={{ fontSize: 11, color: "rgba(218,165,32,0.6)", fontFamily: "'Crimson Text', serif", letterSpacing: 2 }}>NG+ ×{ngPlusCount}</div>}
      </div>}

      {/* CREATE SCREEN */}
      {screen === "create" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>🎮 Créer une partie</div>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
            placeholder="Votre nom (1-12 car.)" style={inputStyle} />
          {error && <div style={{ color: "#D94F4F", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div>}
          <button onClick={createSession} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #6B8E23, #556B2F)", color: "#FFF", border: "2px solid #DAA520", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginBottom: 8 }}>
            Créer →
          </button>
          <button onClick={() => { setScreen("main"); setError(""); }} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>← Retour</button>
        </div>
      </div>}

      {/* JOIN SCREEN */}
      {screen === "join" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>🤝 Rejoindre une partie</div>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
            placeholder="Votre nom" style={inputStyle} />
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 7))}
            placeholder="Code (ex: LAV-847)" style={{ ...inputStyle, fontSize: 22, letterSpacing: 4, fontWeight: "bold" }} />
          {error && <div style={{ color: "#D94F4F", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div>}
          <button onClick={joinSession} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #B5658A, #8E4466)", color: "#FFF", border: "2px solid #DAA520", borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer", marginBottom: 8 }}>
            Rejoindre →
          </button>
          <button onClick={() => { setScreen("main"); setError(""); }} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>← Retour</button>
        </div>
      </div>}

      {/* CLASS SELECTION */}
      {screen === "class" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...panel, maxWidth: 360 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>Choisissez votre classe</div>
          {sessionCode && <div style={{ fontSize: 13, textAlign: "center", color: "#DAA520", marginBottom: 12, letterSpacing: 2 }}>Code : <strong style={{ fontSize: 18 }}>{sessionCode}</strong></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CLASSES.map((c) => (
              <button key={c.id} disabled={c.locked}
                onClick={() => !c.locked && startGame(c.id)}
                style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: c.locked ? "#444" : `linear-gradient(135deg, ${c.color}, ${c.color2})`,
                  color: c.locked ? "#888" : "#FFF", border: `2px solid ${c.locked ? "#555" : "#DAA520"}`,
                  cursor: c.locked ? "default" : "pointer",
                  fontSize: 15, fontWeight: "bold", textAlign: "left",
                  opacity: c.locked ? 0.5 : 1,
                }}>
                <span style={{ fontSize: 24, marginRight: 8 }}>{c.emoji}</span>
                <span>{c.name}</span>
                <div style={{ fontSize: 11, fontWeight: "normal", marginTop: 4, opacity: 0.8 }}>{c.locked ? "🔒 Terminez le jeu pour débloquer" : c.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setScreen("main")} style={{ width: "100%", padding: 10, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer", marginTop: 10 }}>← Retour</button>
        </div>
      </div>}

      {/* OPTIONS */}
      {screen === "options" && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={panel}>
          <div style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 14 }}>⚙️ Options</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { setScreen("main"); setShowGuide(true); }} style={{ width: "100%", padding: "12px 16px", background: "linear-gradient(135deg, #6B8E23, #556B2F)", color: "#FFF", border: "2px solid #3D5E1A", borderRadius: 10, fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>📖 Guide du jeu</button>
            <button onClick={() => setScreen("main")} style={{ width: "100%", padding: "10px 16px", background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>❌ Fermer</button>
          </div>
        </div>
      </div>}

      {showGuide && <GameGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
