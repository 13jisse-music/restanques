"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const play = (player: string) => {
    // Fullscreen
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    try { (screen.orientation as unknown as { lock: (s: string) => Promise<void> })?.lock?.("portrait").catch(() => {}); } catch {}
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

  return (
    <div style={{
      width: "100%", minHeight: "100vh", position: "relative", overflowX: "hidden", overflowY: "auto",
      background: "#1A1410",
      opacity: fading ? 0 : 1, transition: "opacity 0.5s ease",
    }}>
      {/* Poster background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/splash.png)",
        backgroundSize: "cover", backgroundPosition: "center top",
        opacity: visible ? 1 : 0, transition: "opacity 1.5s ease",
      }} />

      {/* Dark gradient overlay at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
        background: "linear-gradient(transparent, rgba(26,20,16,0.85) 50%, rgba(26,20,16,0.95))",
      }} />

      {/* Buttons — fixed at bottom, always visible */}
      <div style={{
        position: "fixed", bottom: 10, left: 20, right: 20, zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 1s ease 0.5s",
        paddingBottom: "env(safe-area-inset-bottom, 10px)",
      }}>
        <button onClick={() => play("jisse")} style={{
          width: "100%", maxWidth: 300, padding: "14px 20px", fontSize: 16, fontWeight: "bold",
          fontFamily: "'Courier New',monospace",
          background: "linear-gradient(145deg, rgba(122,158,63,0.9), rgba(74,110,31,0.9))",
          color: "#FFF8E7", border: "2px solid #F4D03F",
          borderRadius: 12, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          letterSpacing: 1,
        }}>🎸 Rejoindre : Jisse</button>

        <button onClick={() => play("melanie")} style={{
          width: "100%", maxWidth: 300, padding: "14px 20px", fontSize: 16, fontWeight: "bold",
          fontFamily: "'Courier New',monospace",
          background: "linear-gradient(145deg, rgba(232,142,173,0.9), rgba(180,90,120,0.9))",
          color: "#FFF8E7", border: "2px solid #F4D03F",
          borderRadius: 12, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          letterSpacing: 1,
        }}>🎨 Rejoindre : Mélanie</button>

        <button onClick={resetGame} disabled={resetting} style={{
          background: "none", color: "#D4C5A9", border: "none", cursor: "pointer",
          fontSize: 12, fontFamily: "'Courier New',monospace", opacity: resetting ? 0.5 : 0.7,
          textDecoration: "underline",
        }}>{resetting ? "⏳ Reset..." : "🔄 Nouvelle partie"}</button>
      </div>
    </div>
  );
}
