"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);

  const play = (player: string) => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    setFading(true);
    setTimeout(() => router.push(`/game?player=${player}`), 500);
  };

  const resetGame = async () => {
    setResetting(true);
    const { data: sessions } = await supabase.from("game_sessions").select("id").eq("active", true);
    if (sessions) {
      for (const s of sessions) {
        await supabase.from("players").delete().eq("session_id", s.id);
        await supabase.from("game_sessions").update({ active: false }).eq("id", s.id);
      }
    }
    setResetting(false);
  };

  const btnBase: React.CSSProperties = {
    width: "85%", maxWidth: 320, height: 54,
    borderRadius: 12, cursor: "pointer",
    fontSize: 18, fontWeight: "bold", color: "#FFF",
    fontFamily: "'Courier New',monospace",
    letterSpacing: 2,
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    border: "2px solid #F4D03F",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
    transition: "transform 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      opacity: fading ? 0 : 1, transition: "opacity 0.5s ease",
    }}>
      {/* Splash image — centered, covers full screen */}
      <img
        src="/splash.png" alt="Restanques"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 15%",
          opacity: visible ? 1 : 0, transition: "opacity 1.5s ease",
        }}
      />

      {/* Gradient overlay at bottom for buttons */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "40px 24px 30px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8) 30%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}>
        {/* Jisse */}
        <button
          onClick={() => play("jisse")}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #7A9E3F, #5A7E2F)",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s, box-shadow 0.15s, scale 0.15s",
          }}
          onPointerDown={(e) => { (e.target as HTMLElement).style.transform = "scale(0.97)"; }}
          onPointerUp={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >🎸 Rejoindre : Jisse</button>

        {/* Mélanie */}
        <button
          onClick={() => play("melanie")}
          style={{
            ...btnBase,
            background: "linear-gradient(135deg, #C77DA5, #A05A82)",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s, box-shadow 0.15s, scale 0.15s",
          }}
          onPointerDown={(e) => { (e.target as HTMLElement).style.transform = "scale(0.97)"; }}
          onPointerUp={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >🎨 Rejoindre : Mélanie</button>

        {/* Nouvelle partie */}
        <button
          onClick={resetGame} disabled={resetting}
          style={{
            width: "60%", maxWidth: 200, height: 40,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8, color: "rgba(255,255,255,0.8)",
            fontSize: 13, fontFamily: "'Courier New',monospace",
            cursor: "pointer", backdropFilter: "blur(4px)",
            opacity: visible ? (resetting ? 0.5 : 1) : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease 0.9s, transform 0.5s ease 0.9s",
          }}
        >{resetting ? "⏳ Reset..." : "🔄 Nouvelle partie"}</button>

        {/* Options */}
        <button
          onClick={() => alert("Bientôt disponible !")}
          style={{
            width: "60%", maxWidth: 200, height: 40,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, color: "rgba(255,255,255,0.6)",
            fontSize: 13, fontFamily: "'Courier New',monospace",
            cursor: "pointer", backdropFilter: "blur(4px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease 1.1s, transform 0.5s ease 1.1s",
          }}
        >⚙️ Options</button>
      </div>
    </div>
  );
}
