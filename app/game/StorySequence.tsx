"use client";
import { useState } from "react";

interface Props {
  texts: string[];
  onDone: () => void;
}

export function StorySequence({ texts, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typing, setTyping] = useState(true);

  // Typewriter effect
  useState(() => {
    let timer: NodeJS.Timeout;
    const type = () => {
      setCharIdx(c => {
        if (c >= texts[idx]?.length) { setTyping(false); return c; }
        timer = setTimeout(type, 30);
        return c + 1;
      });
    };
    timer = setTimeout(type, 30);
    return () => clearTimeout(timer);
  });

  const advance = () => {
    if (typing) { setCharIdx(texts[idx]?.length || 0); setTyping(false); return; }
    if (idx < texts.length - 1) {
      setIdx(i => i + 1);
      setCharIdx(0);
      setTyping(true);
      // Restart typewriter
      let c = 0;
      const type = () => {
        c++;
        setCharIdx(c);
        if (c < (texts[idx+1]?.length || 0)) setTimeout(type, 30);
        else setTyping(false);
      };
      setTimeout(type, 30);
    } else {
      onDone();
    }
  };

  const currentText = texts[idx]?.slice(0, charIdx) || "";

  return (
    <div onClick={advance} style={{
      position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.95)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:30,cursor:"pointer",
    }}>
      <div style={{
        maxWidth:380,color:"#E8D5A3",fontSize:18,lineHeight:1.8,
        textAlign:"center",fontStyle:"italic",fontFamily:"'Crimson Text',serif",
      }}>
        {currentText}
        {typing && <span style={{animation:"pulse 0.5s infinite",color:"#DAA520"}}>|</span>}
      </div>
      <div style={{color:"#666",fontSize:11,marginTop:20}}>
        {idx < texts.length - 1 ? `${idx+1}/${texts.length} — touchez` : "Touchez pour continuer"}
      </div>
    </div>
  );
}
