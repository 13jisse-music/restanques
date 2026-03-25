"use client";
import React from "react";

export const hudBtn: React.CSSProperties = {
  width:44,height:44,borderRadius:12,background:"rgba(0,0,0,.6)",
  border:"1px solid rgba(255,255,255,.15)",color:"#FFF",fontSize:20,
  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
};

export const menuBtn: React.CSSProperties = {
  padding:"12px 16px",background:"rgba(255,255,255,.08)",
  border:"1px solid rgba(255,255,255,.15)",borderRadius:10,
  color:"#FFF",fontSize:14,cursor:"pointer",textAlign:"left",
};

export function Panel({title, onClose, children}: {title:string; onClose:()=>void; children:React.ReactNode}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{background:"linear-gradient(#2A1A0A,#1A0A00)",border:"2px solid #DAA520",borderRadius:14,padding:16,maxWidth:360,width:"92%",maxHeight:"80vh",overflowY:"auto",animation:"panelOpen .3s"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{color:"#DAA520",fontSize:16,fontWeight:"bold"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
