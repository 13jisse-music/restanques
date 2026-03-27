export interface PNJ { id:string; name:string; biome:string; role:string; personality:string; quest:string; reward:string }
export const PNJ_LIST: PNJ[] = [
  { id:'marius', name:'Marius', biome:'Garrigue', role:'Quete principale', personality:'Vieux berger bourru', quest:'Trouve le cerf', reward:'Recette Ragout + Cle' },
  { id:'rosalie', name:'Rosalie', biome:'Garrigue', role:'Shop herbes', personality:'Herboriste passionnee', quest:'10 Lavandes', reward:'Graines rares x5' },
  { id:'sumo', name:'Sumo', biome:'Maison', role:'Chat PNJ', personality:'Chat roux rigolo', quest:'Craft special', reward:'3 recettes Sumo' },
  { id:'sage', name:'Grand Sage Olivier', biome:'Tuto', role:'Tutoriel', personality:'Vieil homme pedagogue', quest:'Apprend les bases', reward:'Equipement depart' },
  { id:'leon', name:'Capitaine Leon', biome:'Calanques', role:'Quete principale', personality:'Ancien marin', quest:'Debarrasse le poulpe', reward:'Carte donjon' },
  { id:'elsa', name:'Forgerone Elsa', biome:'Mines', role:'Quete principale', personality:'Forge seule, coeur tendre', quest:'Recupere le marteau', reward:'Recette armes Mines' },
  { id:'blanche', name:'Amiral Blanche', biome:'Mer', role:'Quete principale', personality:'Femme capitaine', quest:'Brise le charme sirene', reward:'Carte donjon' },
  { id:'aurore', name:'Sage Aurore', biome:'Restanques', role:'Quete principale', personality:'Gardienne millenaire', quest:'Prouve ta valeur', reward:'Acces chateau final' },
]