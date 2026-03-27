export interface Quest { id:string; biome:string; type:string; npc:string; desc:string; reward:string }
export const QUESTS: Quest[] = [
  { id:'garrigue_main', biome:'Garrigue', type:'principale', npc:'Marius', desc:'Trouve le cerf dans son donjon', reward:'Recette Ragout + Cle donjon' },
  { id:'garrigue_couple', biome:'Garrigue', type:'couple', npc:'Gaston et Fanny', desc:'Ramene Gaston du loup alpha', reward:'Infusion + 200 Sous' },
  { id:'calanques_main', biome:'Calanques', type:'principale', npc:'Capitaine Leon', desc:'Debarrasse le poulpe de la grotte', reward:'Carte donjon + Corde' },
  { id:'mines_main', biome:'Mines', type:'principale', npc:'Forgerone Elsa', desc:'Recupere le marteau du dragon', reward:'Recette armes + Cle donjon' },
  { id:'mer_main', biome:'Mer', type:'principale', npc:'Amiral Blanche', desc:'Brise le charme de la sirene', reward:'Carte donjon + Boussole' },
  { id:'restanques_main', biome:'Restanques', type:'principale', npc:'Sage Aurore', desc:'Prouve ta valeur au Mistral', reward:'Acces chateau + Resurrection' },
]