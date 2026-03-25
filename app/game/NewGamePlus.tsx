"use client";
import { Panel } from "../components/Panel";
import { GameState } from "../components/GameTypes";

interface Props {
  gs: GameState;
  onStart: () => void;
  onClose: () => void;
}

export function NewGamePlus({ gs, onStart, onClose }: Props) {
  const ng = gs.newGamePlus;
  return (
    <Panel title="New Game+" onClose={onClose}>
      <div style={{textAlign:"center",padding:16}}>
        <div style={{fontSize:48,marginBottom:8}}>🌟</div>
        <div style={{color:"#DAA520",fontSize:16,fontWeight:"bold",marginBottom:8}}>
          Nouveau cycle {ng + 1}
        </div>
        <div style={{color:"#E8D5A3",fontSize:13,lineHeight:1.6,marginBottom:16}}>
          Recommencez avec vos stats et equipements !
          <br/>Les monstres seront {Math.round((1 + ng * 0.3) * 100)}% plus forts.
          <br/>Nouveaux drops et defis vous attendent.
        </div>
        <div style={{color:"#888",fontSize:11,marginBottom:14}}>
          Conserve : Niveau, Stats, Equipement, Sorts
          <br/>Reset : Carte, Monstres, Boss, Quetes
        </div>
        <button onClick={onStart} style={{
          padding:"12px 30px",background:"linear-gradient(135deg,#DAA520,#B8860B)",
          color:"#FFF",border:"2px solid #FFD700",borderRadius:12,
          fontSize:16,fontWeight:"bold",cursor:"pointer",
        }}>
          Commencer NG+{ng + 1}
        </button>
      </div>
    </Panel>
  );
}
