export interface PlayerClass {
  id: string; name: string; emoji: string; desc: string;
  baseStats: { atk: number; def: number; mag: number; vit: number };
  hp: number; sous: number; combatMul: number; speed: number;
  detect: number; canCraft: boolean; craftFail: number; harvestTap: number;
  lvlUp: { always: string; p50: string; p25: string };
}
export const CLASSES: Record<string, PlayerClass> = {
  paladin: { id:"paladin",name:"Paladin",emoji:"🎸",desc:"Explore + Combat. Ne craft pas.",
    baseStats:{atk:3,def:1,mag:0,vit:2}, hp:15,sous:50, combatMul:1.2,speed:1,detect:6,
    canCraft:false,craftFail:0,harvestTap:1, lvlUp:{always:"atk",p50:"def",p25:"vit"} },
  artisane: { id:"artisane",name:"Artisane",emoji:"🎨",desc:"Maison + Jardin + Craft tout.",
    baseStats:{atk:1,def:1,mag:2,vit:1}, hp:15,sous:100, combatMul:1,speed:1,detect:4,
    canCraft:true,craftFail:0,harvestTap:3, lvlUp:{always:"mag",p50:"def",p25:"vit"} },
  ombre: { id:"ombre",name:"Ombre",emoji:"🌙",desc:"Autonome. 10% echec craft.",
    baseStats:{atk:2,def:0,mag:1,vit:3}, hp:15,sous:75, combatMul:1,speed:1.5,detect:3,
    canCraft:true,craftFail:.1,harvestTap:2, lvlUp:{always:"vit",p50:"atk",p25:"mag"} },
};
