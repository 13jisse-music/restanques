export interface Combo { name:string; players:string; condition:string; effect:string; multiplier:number }
export const COMBOS: Combo[] = [
  { name:'Lame Enchantee', players:'Jisse + Melanie', condition:'Coup puis Sort dans 2 sec', effect:'x1.8', multiplier:1.8 },
  { name:'Double Sort', players:'2 sorts meme couleur', condition:'2 sorts en 2 sec', effect:'x2.2', multiplier:2.2 },
  { name:'Rage du Paladin', players:'Jisse seul', condition:'3 Coups sans sort', effect:'Critique x2.5', multiplier:2.5 },
  { name:'Maitre Artisane', players:'Melanie seule', condition:'3 Sorts', effect:'x3', multiplier:3 },
  { name:'Coup de grace', players:'Tous', condition:'Monstre <10% PV', effect:'Execution', multiplier:999 },
  { name:'Contre-attaque', players:'Tous', condition:'Defense quand ATB >90%', effect:'Bloque+riposte', multiplier:0 },
  { name:'Fusion elementaire', players:'3 joueurs', condition:'3 couleurs en 3 sec', effect:'x4', multiplier:4 },
]
