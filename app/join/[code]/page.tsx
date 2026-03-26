'use client'
// TODO: Module M7 - Join multiplayer session
export default function JoinPage({ params }: { params: { code: string } }) {
  return (
    <div style={{ width:'100%', height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1232', color:'#9a8fbf', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:16 }}>Rejoindre la session</div>
      <div style={{ fontSize:24, color:'#e91e8c', fontWeight:600 }}>{params.code}</div>
      <div style={{ fontSize:12 }}>Module M7 — Multijoueur (à implémenter)</div>
    </div>
  )
}
