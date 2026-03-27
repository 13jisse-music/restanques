export interface Biome { id:string; name:string; size:string; theme:string; boss:string; music:string; color:string; lvRange:[number,number] }
export const BIOMES: Biome[] = [
  { id:'maison', name:'Maison de Melanie', size:'100x100', theme:'Provence, bastide', boss:'', music:'music_maison.mp3', color:'#D4537E', lvRange:[1,5] },
  { id:'garrigue', name:'Garrigue', size:'150x150', theme:'Collines, lavande', boss:'Sanglier geant', music:'music_garrigue.mp3', color:'#7ec850', lvRange:[1,6] },
  { id:'calanques', name:'Calanques', size:'150x150', theme:'Falaises blanches', boss:'Mouette titanesque', music:'music_calanques.mp3', color:'#85B7EB', lvRange:[7,10] },
  { id:'mines', name:'Mines', size:'150x150', theme:'Souterrain, cristaux', boss:'Tarasque', music:'music_mines.mp3', color:'#ef9f27', lvRange:[12,15] },
  { id:'mer', name:'Mer', size:'150x150', theme:'Ocean, abysses', boss:'Kraken', music:'music_mer.mp3', color:'#534AB7', lvRange:[18,22] },
  { id:'restanques', name:'Restanques', size:'150x150', theme:'Terrasses, vent', boss:'Le Mistral', music:'music_restanques.mp3', color:'#e91e8c', lvRange:[25,30] },
]