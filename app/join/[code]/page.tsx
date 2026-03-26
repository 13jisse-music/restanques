"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { sounds } from "../../lib/sounds";
import { CLASSES } from "../../data/classes";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [sid, setSid] = useState("");
  const [found, setFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sounds.init();
    if (!code) return;
    // Look up session by code
    supabase.from("game_sessions").select("*").eq("code", code.toUpperCase()).eq("active", true).single()
      .then(({ data }) => {
        if (data) { setSid(data.id); setFound(true); }
        else setErr("Partie introuvable ou terminée.");
        setLoading(false);
      });
  }, [code]);

  const go = (cls: string) => {
    if (!name.trim()) { setErr("Entrez votre nom !"); return; }
    router.push(`/game?player=${encodeURIComponent(name.trim())}&class=${cls}&session=${sid}`);
  };

  const P: React.CSSProperties = {
    background: "linear-gradient(#F5ECD7,#E8D5A3)", border: "4px solid #5C4033",
    borderRadius: 14, padding: 20, maxWidth: 340, width: "90%",
    boxShadow: "0 8px 24px rgba(0,0,0,.5)", color: "#3D2B1F",
  };
  const CLS = [
    { ...CLASSES.paladin, c1: "#6B8E23", c2: "#556B2F" },
    { ...CLASSES.artisane, c1: "#B5658A", c2: "#8E4466" },
    { ...CLASSES.ombre, c1: "#444", c2: "#1a1a2e" },
  ];

  if (loading) return <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#DAA520", fontSize: 16 }}>Recherche de la partie...</div>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={P}>
        {found ? (
          <>
            <div style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>🤝 Rejoindre la partie</div>
            <div style={{ fontSize: 13, textAlign: "center", color: "#DAA520", marginBottom: 12 }}>Code : <strong style={{ fontSize: 18 }}>{code?.toUpperCase()}</strong></div>
            <input value={name} onChange={e => setName(e.target.value.slice(0, 12))} placeholder="Votre nom" style={{ width: "100%", padding: "12px 16px", fontSize: 16, borderRadius: 10, border: "2px solid #8B7355", background: "#FFF8E7", color: "#3D2B1F", textAlign: "center", marginBottom: 10 }} />
            {err && <div style={{ color: "#D94F4F", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{err}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CLS.map(c => (
                <button key={c.id} onClick={() => go(c.id)} style={{ padding: "12px 16px", borderRadius: 12, background: `linear-gradient(135deg,${c.c1},${c.c2})`, color: "#FFF", border: "2px solid #DAA520", cursor: "pointer", fontSize: 15, fontWeight: "bold", textAlign: "left" }}>
                  <span style={{ fontSize: 24, marginRight: 8 }}>{c.emoji}</span>{c.name.toUpperCase()}
                  <div style={{ fontSize: 11, fontWeight: "normal", marginTop: 4, opacity: .8 }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>😔</div>
            <div style={{ textAlign: "center", fontSize: 14, marginBottom: 16 }}>{err || "Partie introuvable"}</div>
            <button onClick={() => router.push("/")} style={{ width: "100%", padding: 12, background: "#8B7355", color: "#E8D5A3", border: "2px solid #5C4033", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>← Retour à l&apos;accueil</button>
          </>
        )}
      </div>
    </div>
  );
}
