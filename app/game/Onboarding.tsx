"use client";
import { GameState } from "../components/GameTypes";

const MISSIONS = [
  { id: 0, text: "Recoltez 3 Herbes", check: (gs: GameState) => (gs.bag["herbe"]||0) >= 3, reward: "5 sous" },
  { id: 1, text: "Tuez votre premier monstre", check: (gs: GameState) => gs.xp > 0, reward: "Potion" },
  { id: 2, text: "Craftez un outil", check: (gs: GameState) => Object.keys(gs.bag).some(k => ["torche","piege","rappel","baton","pioche","filet"].includes(k)), reward: "10 sous" },
  { id: 3, text: "Visitez la Maison", check: (_gs: GameState) => true, reward: "Graines" },
  { id: 4, text: "Trouvez un Portail", check: (gs: GameState) => gs.lv >= 2, reward: "Pierre de rappel" },
];

interface Props { gs: GameState; onClose: () => void }

export function Onboarding({ gs, onClose }: Props) {
  const step = gs.onboardingStep;
  const current = MISSIONS[step];
  if (!current || step >= MISSIONS.length) return null;

  const completed = current.check(gs);

  return (
    <div style={{position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",zIndex:20,
      background:"linear-gradient(135deg,rgba(42,26,10,.95),rgba(26,10,0,.95))",
      border:"1px solid #DAA520",borderRadius:10,padding:"8px 16px",maxWidth:300,
      animation:"slideDown .3s",pointerEvents:"auto",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{color:"#DAA520",fontSize:12,fontWeight:"bold"}}>Mission {step+1}/5</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14}}>x</button>
      </div>
      <div style={{color:"#E8D5A3",fontSize:13,marginTop:4}}>{current.text}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <span style={{fontSize:10,color:"#888"}}>Recompense: {current.reward}</span>
        <span style={{fontSize:12,color:completed?"#4CAF50":"#888"}}>{completed?"Fait !":"..."}</span>
      </div>
    </div>
  );
}
