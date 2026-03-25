"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { TILE_PX } from "../components/GameTypes";

interface OtherPlayer { name: string; classEmoji: string; x: number; y: number; lastSeen: number }

interface Props {
  sessionId: string;
  playerName: string;
  playerClass: string;
  px: number; py: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useMultiPlayer({ sessionId, playerName, playerClass, px, py, canvasRef }: Props) {
  const [others, setOthers] = useState<OtherPlayer[]>([]);
  const [messages, setMessages] = useState<{from:string;text:string;t:number}[]>([]);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);

  // Sync position every 2s
  useEffect(() => {
    if (!sessionId) return;
    const sync = async () => {
      // Update own position
      await supabase.from("game_players").upsert({
        session_id: sessionId,
        name: playerName,
        class: playerClass,
        x: Math.round(px),
        y: Math.round(py),
        last_seen: new Date().toISOString(),
      }, { onConflict: "session_id,name" }).select();

      // Fetch others
      const { data } = await supabase
        .from("game_players")
        .select("*")
        .eq("session_id", sessionId)
        .neq("name", playerName);

      if (data) {
        setOthers(data.map((d: Record<string, unknown>) => ({
          name: d.name as string,
          classEmoji: d.class === "paladin" ? "🎸" : d.class === "artisane" ? "🎨" : "🌙",
          x: d.x as number,
          y: d.y as number,
          lastSeen: new Date(d.last_seen as string).getTime(),
        })).filter((o: OtherPlayer) => Date.now() - o.lastSeen < 30000));
      }
    };

    sync();
    intervalRef.current = setInterval(sync, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sessionId, playerName, playerClass, px, py]);

  // Draw others on canvas
  const drawOthers = (ctx: CanvasRenderingContext2D, camX: number, camY: number) => {
    for (const o of others) {
      const ox = o.x - camX, oy = o.y - camY;
      ctx.globalAlpha = 0.7;
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.fillText(o.classEmoji, ox, oy + 8);
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#AAF";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeText(o.name, ox, oy - 16);
      ctx.fillText(o.name, ox, oy - 16);
      ctx.globalAlpha = 1;
    }
  };

  // Send quick message
  const sendMessage = async (text: string) => {
    if (!sessionId) return;
    await supabase.from("game_messages").insert({
      session_id: sessionId,
      from_name: playerName,
      text,
      created_at: new Date().toISOString(),
    });
    setMessages(m => [...m.slice(-9), { from: playerName, text, t: Date.now() }]);
  };

  return { others, drawOthers, messages, sendMessage };
}

// Quick message buttons
const QUICK_MSGS = ["Salut!", "Ici!", "Aide!", "GG!", "Attention!", "On y va?"];

export function QuickMessages({ onSend }: { onSend: (text: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{position:"absolute",bottom:10,left:150,zIndex:10}}>
      <button onClick={() => setShow(!show)} style={{
        width:40,height:40,borderRadius:20,background:"rgba(0,0,0,.6)",
        border:"1px solid rgba(255,255,255,.15)",color:"#FFF",fontSize:16,cursor:"pointer",
      }}>💬</button>
      {show && (
        <div style={{position:"absolute",bottom:46,left:0,display:"flex",flexWrap:"wrap",gap:4,width:200}}>
          {QUICK_MSGS.map(msg => (
            <button key={msg} onClick={() => { onSend(msg); setShow(false); }} style={{
              padding:"4px 8px",background:"rgba(0,0,0,.8)",border:"1px solid rgba(255,255,255,.2)",
              borderRadius:6,color:"#FFF",fontSize:11,cursor:"pointer",
            }}>{msg}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Message display
export function MessageOverlay({ messages }: { messages: {from:string;text:string;t:number}[] }) {
  const visible = messages.filter(m => Date.now() - m.t < 5000);
  if (visible.length === 0) return null;
  return (
    <div style={{position:"absolute",top:40,left:10,zIndex:15,display:"flex",flexDirection:"column",gap:2}}>
      {visible.map((m, i) => (
        <div key={i} style={{background:"rgba(0,0,0,.6)",padding:"3px 8px",borderRadius:6,color:"#FFF",fontSize:11,animation:"fadeIn .3s"}}>
          <span style={{color:"#DAA520"}}>{m.from}:</span> {m.text}
        </div>
      ))}
    </div>
  );
}
