// ═══════════════════════════════════════════════════════════
// RESTANQUES v5.0 — ALL GAME DATA (CDC Parts 1-5)
// ═══════════════════════════════════════════════════════════

// ─── BIOMES ───
export interface Biome {
  id: string; name: string; emoji: string; music: string;
  colors: { ground: string; alt: string; path: string; block: string };
  alwaysNight?: boolean; nightRatio?: number;
}
export const BIOMES: Record<string, Biome> = {
  garrigue:  { id:"garrigue",  name:"Garrigue",   emoji:"🌿", music:"garrigue",  colors:{ground:"#8FBE4A",alt:"#6D9E2A",path:"#D4B896",block:"#4A7A1A"} },
  calanques: { id:"calanques", name:"Calanques",  emoji:"🏖️", music:"calanques", colors:{ground:"#E8D5A3",alt:"#E2CC9A",path:"#D4B896",block:"#C4A882"} },
  mines:     { id:"mines",     name:"Mines",      emoji:"⛏️", music:"mines",     colors:{ground:"#5C4033",alt:"#4A3728",path:"#6B4226",block:"#3D2B1F"}, alwaysNight:true },
  mer:       { id:"mer",       name:"Mer",        emoji:"🌊", music:"mer",       colors:{ground:"#1B6E8A",alt:"#1B8EAA",path:"#8B7355",block:"#2471A3"} },
  restanques:{ id:"restanques",name:"Restanques", emoji:"🏛️", music:"restanques",colors:{ground:"#C4A874",alt:"#B09860",path:"#D4B896",block:"#8B7355"}, nightRatio:.6 },
};
export const BIOME_ORDER = ["garrigue","calanques","mines","mer","restanques"];

// ─── MONSTERS (CDC Part 2 §7) ───
export interface Monster { id: string; name: string; emoji: string; lv: number; hp: number; atk: number; drops: string[]; sous: [number,number]; }
export const MONSTERS: Record<string, Monster[]> = {
  garrigue: [
    {id:"rat",name:"Rat",emoji:"🐀",lv:1,hp:8,atk:2,drops:["herbe"],sous:[2,4]},
    {id:"lapin",name:"Lapin",emoji:"🐇",lv:2,hp:12,atk:3,drops:["herbe","branche"],sous:[3,6]},
    {id:"abeille",name:"Abeille",emoji:"🐝",lv:3,hp:18,atk:5,drops:["lavande"],sous:[5,8]},
    {id:"renard",name:"Renard",emoji:"🦊",lv:4,hp:24,atk:7,drops:["herbe"],sous:[7,12]},
  ],
  calanques: [
    {id:"crabe",name:"Crabe",emoji:"🦀",lv:5,hp:28,atk:8,drops:["coquillage"],sous:[8,12]},
    {id:"goeland",name:"Goéland",emoji:"🐦",lv:6,hp:32,atk:9,drops:["sel"],sous:[10,15]},
    {id:"meduse",name:"Méduse",emoji:"🪼",lv:7,hp:36,atk:11,drops:["corail"],sous:[12,18]},
    {id:"bernard",name:"Bernard",emoji:"🐚",lv:8,hp:40,atk:12,drops:["coquillage"],sous:[15,20]},
  ],
  mines: [
    {id:"chauve",name:"Chauve-souris",emoji:"🦇",lv:10,hp:45,atk:14,drops:["fer"],sous:[12,18]},
    {id:"scorpion",name:"Scorpion",emoji:"🦂",lv:11,hp:50,atk:16,drops:["ocre"],sous:[14,20]},
    {id:"golem",name:"Golem",emoji:"🪨",lv:12,hp:60,atk:18,drops:["pierre"],sous:[16,22]},
    {id:"araignee",name:"Araignée",emoji:"🕷️",lv:13,hp:65,atk:20,drops:["cristal"],sous:[18,25]},
  ],
  mer: [
    {id:"globe",name:"Poisson-globe",emoji:"🐡",lv:15,hp:70,atk:22,drops:["poisson"],sous:[20,28]},
    {id:"requin",name:"Requin",emoji:"🦈",lv:16,hp:80,atk:25,drops:["corail"],sous:[22,30]},
    {id:"anguille",name:"Anguille",emoji:"⚡",lv:17,hp:85,atk:27,drops:["perle"],sous:[25,35]},
    {id:"poulpe",name:"Poulpe",emoji:"🐙",lv:18,hp:90,atk:28,drops:["corail"],sous:[28,38]},
  ],
  restanques: [
    {id:"spectre",name:"Spectre",emoji:"👻",lv:20,hp:100,atk:30,drops:["cristal"],sous:[30,42]},
    {id:"golem_a",name:"Golem ancien",emoji:"🗿",lv:21,hp:110,atk:32,drops:["fer"],sous:[32,45]},
    {id:"gardien",name:"Gardien",emoji:"⚔️",lv:22,hp:120,atk:35,drops:["ocre"],sous:[35,50]},
    {id:"vent",name:"Esprit du vent",emoji:"🌪️",lv:23,hp:130,atk:38,drops:["cristal"],sous:[38,55]},
  ],
};

// ─── BOSSES (CDC Part 2) ───
export interface Boss { name: string; emoji: string; lv: number; hp: number; atk: number; drop: string; tool: string; sous: number; ability: string; }
export const BOSSES: Record<string, Boss> = {
  garrigue:  {name:"Sanglier Ancien",emoji:"🐗",lv:7,hp:60,atk:15,drop:"defense_sanglier",tool:"baton",sous:50,ability:"Charge !"},
  calanques: {name:"Mouette Impératrice",emoji:"🦅",lv:12,hp:100,atk:22,drop:"plume_doree",tool:"pioche",sous:100,ability:"Cri !"},
  mines:     {name:"Tarasque",emoji:"🐉",lv:17,hp:150,atk:30,drop:"ecaille_tarasque",tool:"filet",sous:200,ability:"Carapace !"},
  mer:       {name:"Kraken",emoji:"🦑",lv:22,hp:220,atk:40,drop:"encre_kraken",tool:"cle_ancienne",sous:300,ability:"Encre !"},
  restanques:{name:"Mistral",emoji:"🌪️",lv:28,hp:350,atk:55,drop:"couronne_mistral",tool:"",sous:500,ability:"Tempête !"},
};

// ─── RESOURCES (CDC Part 2 §7.1-7.5) ───
export const RES: Record<string, { name: string; emoji: string; hp: number }> = {
  branche:{name:"Branche",emoji:"🪵",hp:12}, herbe:{name:"Herbe",emoji:"🌿",hp:5},
  lavande:{name:"Lavande",emoji:"💜",hp:5}, pierre:{name:"Pierre",emoji:"🪨",hp:18},
  coquillage:{name:"Coquillage",emoji:"🐚",hp:8}, sel:{name:"Sel",emoji:"🧂",hp:10},
  poisson:{name:"Poisson",emoji:"🐟",hp:6}, corail:{name:"Corail",emoji:"🪸",hp:12},
  fer:{name:"Fer",emoji:"⛏️",hp:25}, ocre:{name:"Ocre",emoji:"🟠",hp:20},
  cristal:{name:"Cristal",emoji:"💎",hp:30}, perle:{name:"Perle",emoji:"⚪",hp:15},
};
export const BIOME_RES: Record<string, string[]> = {
  garrigue:["branche","herbe","lavande","pierre"], calanques:["coquillage","sel","poisson","corail"],
  mines:["pierre","fer","ocre","cristal"], mer:["corail","perle","poisson","coquillage"],
  restanques:["cristal","fer","ocre","pierre"],
};

// ─── SPELLS 14 × 3 levels (CDC Part 3 §10) ───
export interface Spell {
  id: string; name: string; emoji: string; tier: number;
  levels: { effect: string; recipe: Record<string,number>; power: number }[];
}
export const SPELLS: Spell[] = [
  {id:"brume",name:"Brume",emoji:"🌫️",tier:1,levels:[
    {effect:"Efface 1 couleur",recipe:{lavande:3,herbe:2},power:2},
    {effect:"Efface 1 couleur +3dmg",recipe:{lavande:5,herbe:3},power:5},
    {effect:"Efface 2 couleurs",recipe:{lavande:5,herbe:3,cristal:1},power:8},
  ]},
  {id:"bouclier",name:"Bouclier",emoji:"🛡️",tier:1,levels:[
    {effect:"Skip 1 tour ennemi",recipe:{pierre:3,herbe:2},power:0},
    {effect:"Skip 1 tour +DEF+2",recipe:{pierre:5,fer:2},power:2},
    {effect:"Skip 2 tours",recipe:{pierre:5,fer:3,cristal:1},power:0},
  ]},
  {id:"maree",name:"Marée",emoji:"🌊",tier:2,levels:[
    {effect:"+5 dmg prochain match",recipe:{coquillage:3,sel:2},power:5},
    {effect:"+8 dmg",recipe:{coquillage:5,sel:3,corail:1},power:8},
    {effect:"+12 dmg +3PV",recipe:{perle:2,corail:3},power:12},
  ]},
  {id:"gel",name:"Gel",emoji:"❄️",tier:2,levels:[
    {effect:"Bloque 2 col 2t",recipe:{sel:3,coquillage:2},power:0},
    {effect:"Bloque 3 col",recipe:{sel:5,cristal:1},power:0},
    {effect:"Bloque 3 col + gèle 1t",recipe:{cristal:2,sel:5},power:0},
  ]},
  {id:"festin",name:"Festin",emoji:"🍖",tier:2,levels:[
    {effect:"Soigne 5 PV",recipe:{herbe:3},power:5},
    {effect:"Soigne 8 PV",recipe:{herbe:5,poisson:2},power:8},
    {effect:"Soigne 12 PV",recipe:{herbe:5,poisson:3,corail:1},power:12},
  ]},
  {id:"eclat",name:"Éclat",emoji:"⚡",tier:3,levels:[
    {effect:"ATK+MAG+3 directs",recipe:{cristal:2,sel:2},power:3},
    {effect:"ATK+MAG+6",recipe:{cristal:3,ocre:2},power:6},
    {effect:"ATK+MAG+10 +stun",recipe:{cristal:3,ocre:3},power:10},
  ]},
  {id:"brasier",name:"Brasier",emoji:"🔥",tier:3,levels:[
    {effect:"-2PV/tour 3t",recipe:{branche:3,ocre:2},power:6},
    {effect:"-3PV/tour",recipe:{branche:5,ocre:3,fer:2},power:9},
    {effect:"-4PV/tour +ATK-1",recipe:{ocre:5,cristal:2},power:12},
  ]},
  {id:"confusion",name:"Confusion",emoji:"🔄",tier:3,levels:[
    {effect:"Auto-attaque 1t",recipe:{herbe:3,lavande:2},power:0},
    {effect:"2 tours",recipe:{herbe:5,lavande:3},power:0},
    {effect:"2t + perd 1 ligne",recipe:{herbe:5,lavande:5},power:0},
  ]},
  {id:"seisme",name:"Séisme",emoji:"💥",tier:4,levels:[
    {effect:"Mélange grille",recipe:{pierre:4,fer:3,ocre:2},power:0},
    {effect:"Mélange +5dmg",recipe:{pierre:5,fer:4},power:5},
    {effect:"Mélange +10dmg +3 matchs",recipe:{cristal:3},power:10},
  ]},
  {id:"miroir",name:"Miroir",emoji:"🪞",tier:4,levels:[
    {effect:"Renvoie 50% 2t",recipe:{cristal:2,perle:1},power:0},
    {effect:"75%",recipe:{cristal:3,perle:2},power:0},
    {effect:"100% 2t",recipe:{cristal:3,perle:3},power:0},
  ]},
  {id:"malediction",name:"Malédiction",emoji:"💀",tier:4,levels:[
    {effect:"-1 ATK permanent",recipe:{ocre:2,corail:1},power:1},
    {effect:"-2 ATK",recipe:{ocre:3,corail:2},power:2},
    {effect:"-3 ATK -1 DEF",recipe:{ocre:3,corail:3,perle:1},power:3},
  ]},
  {id:"lumiere",name:"Lumière",emoji:"☀️",tier:5,levels:[
    {effect:"×2 dmg si jour",recipe:{lavande:3,cristal:2},power:0},
    {effect:"×2.5",recipe:{lavande:5,cristal:3},power:0},
    {effect:"×3 +5PV",recipe:{lavande:5,cristal:3,perle:2},power:5},
  ]},
  {id:"ombre_sort",name:"Ombre",emoji:"🌙",tier:5,levels:[
    {effect:"×2 dmg si nuit",recipe:{herbe:3,corail:2},power:0},
    {effect:"×2.5",recipe:{herbe:5,corail:3},power:0},
    {effect:"×3 + invisible 1t",recipe:{herbe:5,corail:3,perle:2},power:0},
  ]},
  {id:"ralentissement",name:"Ralentissement",emoji:"⏳",tier:5,levels:[
    {effect:"1 tour/2 3t",recipe:{sel:3,cristal:1},power:0},
    {effect:"4 tours",recipe:{sel:5,cristal:2},power:0},
    {effect:"5t + -20% dmg",recipe:{cristal:2,perle:2},power:0},
  ]},
];

// ─── EQUIPMENT (CDC Part 4 §11.2) ───
export interface Equip { id:string; name:string; emoji:string; slot:"arme"|"armure"|"amulette"|"bottes"; stats:Record<string,number>; biome:string; recipe:Record<string,number>; }
export const EQUIPMENT: Equip[] = [
  {id:"epee_bois",name:"Épée bois",emoji:"🗡️",slot:"arme",stats:{atk:2},biome:"garrigue",recipe:{branche:5,pierre:2}},
  {id:"tunique",name:"Tunique cuir",emoji:"🧥",slot:"armure",stats:{def:2},biome:"garrigue",recipe:{herbe:5,branche:3}},
  {id:"epee_fer",name:"Épée fer",emoji:"⚔️",slot:"arme",stats:{atk:5},biome:"calanques",recipe:{fer:5,branche:2,pierre:3}},
  {id:"amulette",name:"Amulette",emoji:"📿",slot:"amulette",stats:{mag:3},biome:"calanques",recipe:{lavande:5,coquillage:2,herbe:3}},
  {id:"cotte",name:"Cotte écailles",emoji:"🛡️",slot:"armure",stats:{def:5},biome:"mines",recipe:{fer:8,pierre:5}},
  {id:"sandales",name:"Sandales",emoji:"👡",slot:"bottes",stats:{vit:2},biome:"mines",recipe:{herbe:5}},
  {id:"trident",name:"Trident corail",emoji:"🔱",slot:"arme",stats:{atk:7,mag:3},biome:"mer",recipe:{corail:5,perle:3,fer:3}},
  {id:"collier",name:"Collier perles",emoji:"💎",slot:"amulette",stats:{mag:5,def:2},biome:"mer",recipe:{perle:5,cristal:2}},
  {id:"lame_mistral",name:"Lame Mistral",emoji:"🗡️",slot:"arme",stats:{atk:12},biome:"restanques",recipe:{cristal:5,fer:5,perle:3}},
  {id:"armure_anc",name:"Armure ancienne",emoji:"🛡️",slot:"armure",stats:{def:8},biome:"restanques",recipe:{pierre:10,fer:8,cristal:3}},
];

// ─── KITCHEN RECIPES (CDC Part 4 §11.2) ───
export interface Recipe { id:string; name:string; emoji:string; recipe:Record<string,number>; type:"potion"|"food"; effect:{stat:string;val:number;dur:number}; desc:string; }
export const RECIPES: Recipe[] = [
  {id:"potion",name:"Potion",emoji:"🧪",recipe:{herbe:3},type:"potion",effect:{stat:"hp",val:10,dur:0},desc:"Soigne 10 PV"},
  {id:"potion_p",name:"Potion+",emoji:"🧪",recipe:{herbe:5,corail:1},type:"potion",effect:{stat:"hp",val:20,dur:0},desc:"Soigne 20 PV"},
  {id:"ragout",name:"Ragoût",emoji:"🍖",recipe:{herbe:3,poisson:1},type:"food",effect:{stat:"atk",val:3,dur:300},desc:"ATK+3 5min"},
  {id:"bouillon",name:"Bouillon",emoji:"🛡️",recipe:{herbe:2,corail:1},type:"food",effect:{stat:"def",val:3,dur:300},desc:"DEF+3 5min"},
  {id:"infusion",name:"Infusion",emoji:"✨",recipe:{lavande:3,herbe:1},type:"food",effect:{stat:"mag",val:5,dur:300},desc:"MAG+5 5min"},
];

// ─── GARDEN SEEDS (CDC Part 4 §12) ───
export interface Seed { id:string; name:string; emoji:string; grow:number; yields:string; qty:[number,number]; }
export const SEEDS: Seed[] = [
  {id:"g_herbe",name:"Herbe fraîche",emoji:"🌿",grow:120,yields:"herbe",qty:[2,3]},
  {id:"g_lavande",name:"Lavande pure",emoji:"💜",grow:180,yields:"lavande",qty:[2,3]},
  {id:"g_champi",name:"Champignon",emoji:"🍄",grow:300,yields:"herbe",qty:[1,2]},
  {id:"g_baies",name:"Baies",emoji:"🫐",grow:240,yields:"herbe",qty:[2,3]},
];

// ─── NPCs (CDC Part 5 §18) ───
export interface NPC { id:string; name:string; emoji:string; biome:string; quest:string; reward:string; rewardType:"recipe"|"item"|"sous"; rewardVal:string|number; }
export const NPCS: NPC[] = [
  {id:"marius",name:"Pépé Marius",emoji:"👴",biome:"garrigue",quest:"Trouvez le Nid du Serpent",reward:"Boussole",rewardType:"item",rewardVal:"boussole"},
  {id:"magali",name:"Tante Magali",emoji:"👵",biome:"garrigue",quest:"5 Lavandes + 3 Herbes",reward:"Recette Épée bois",rewardType:"recipe",rewardVal:"epee_bois"},
  {id:"fanfan",name:"Fanfan",emoji:"🏹",biome:"garrigue",quest:"Explorez la Tanière du Loup",reward:"Recette Tunique",rewardType:"recipe",rewardVal:"tunique"},
  {id:"marinette",name:"Marinette",emoji:"🎣",biome:"calanques",quest:"5 Poissons + 5 Coquillages",reward:"Recette Amulette",rewardType:"recipe",rewardVal:"amulette"},
  {id:"roustan",name:"Cap. Roustan",emoji:"⚓",biome:"calanques",quest:"3 demi-boss",reward:"Clé forteresse",rewardType:"item",rewardVal:"cle_nid"},
  {id:"marcel",name:"Marcel",emoji:"⛏️",biome:"mines",quest:"10 Fers + 5 Cristaux",reward:"Recette Cotte",rewardType:"recipe",rewardVal:"cotte"},
  {id:"ondine",name:"Ondine",emoji:"🧜‍♀️",biome:"mer",quest:"3 Perles + 5 Coraux",reward:"Recette Trident",rewardType:"recipe",rewardVal:"trident"},
  {id:"ancien",name:"L'Ancien",emoji:"🧙",biome:"restanques",quest:"Forgez la Clé Ancienne",reward:"Bottes Mistral",rewardType:"item",rewardVal:"bottes_mistral"},
];

// ─── STORY TEXTS (CDC Part 5 §22) ───
export const STORY: Record<string, string[]> = {
  intro: [
    "Dans les collines de Provence, un vent mauvais souffle depuis des lunes...",
    "Le Mistral, esprit ancien, a réveillé les créatures des cinq terres.",
    "Deux héros se lèvent : le Paladin, guerrier des chemins, et l'Artisane, gardienne du foyer.",
    "Ensemble, ils devront traverser garrigue, calanques, mines et mers pour affronter le Mistral.",
  ],
  garrigue_end: ["La garrigue respire à nouveau. Le Sanglier Ancien est vaincu.", "Un passage s'ouvre vers les Calanques..."],
  calanques_end: ["Les falaises blanches sont libérées.", "La route des Mines s'éclaire devant vous."],
  mines_end: ["La Tarasque retourne dans les profondeurs.", "Les eaux de la Mer vous appellent."],
  mer_end: ["Le Kraken relâche son emprise sur les fonds.", "Les Restanques anciennes se dévoilent."],
  ending: [
    "Le Mistral pousse son dernier souffle...",
    "La Provence retrouve sa sérénité.",
    "Les collines chantent à nouveau sous le soleil.",
    "Votre légende vivra dans les pierres des Restanques.",
  ],
};
export const INTRO_IMAGES = ["/story/intro1.png","/story/intro2.png","/story/intro3.png","/story/intro4.png"];

// ─── PORTALS between biomes ───
export const PORTALS: Record<string, {target:string; side:"N"|"S"|"E"|"W"; need:string|null}[]> = {
  garrigue: [{target:"calanques",side:"E",need:"baton"},{target:"mines",side:"S",need:"pioche"}],
  calanques: [{target:"garrigue",side:"W",need:null},{target:"mer",side:"S",need:"filet"}],
  mines: [{target:"garrigue",side:"N",need:null},{target:"mer",side:"E",need:"filet"}],
  mer: [{target:"calanques",side:"N",need:null},{target:"mines",side:"W",need:null}],
  restanques: [],
};

// ─── TOOL RECIPES ───
export const TOOLS: Record<string, {name:string;emoji:string;recipe:Record<string,number>;desc:string}> = {
  torche: {name:"Torche",emoji:"🔦",recipe:{branche:2,herbe:1},desc:"Visibilité 7×7, 3min"},
  piege: {name:"Piège",emoji:"🪤",recipe:{pierre:3},desc:"Stun monstre 5s"},
  rappel: {name:"Pierre de rappel",emoji:"🏠",recipe:{pierre:5,cristal:1},desc:"Téléport maison"},
  baton: {name:"Bâton",emoji:"🥖",recipe:{branche:3},desc:"Accès Calanques"},
  pioche: {name:"Pioche",emoji:"⛏️",recipe:{pierre:2,branche:1},desc:"Accès Mines"},
  filet: {name:"Filet",emoji:"🕸️",recipe:{coquillage:2,herbe:1},desc:"Accès Mer"},
  cle_ancienne: {name:"Clé Ancienne",emoji:"🗝️",recipe:{cristal:2,ocre:1,perle:1},desc:"Accès Restanques"},
};

// ─── SHOP PRICES (CDC Part 4 §15.2) ───
export const SHOP_ITEMS: {id:string;name:string;emoji:string;price:number}[] = [
  {id:"potion",name:"Potion",emoji:"🧪",price:15},
  {id:"torche",name:"Torche",emoji:"🔦",price:10},
  {id:"pain",name:"Pain",emoji:"🍞",price:5},
];

// ─── FORTRESS / BOSS ACCESS ───
export const FORTRESS_POS: Record<string, {x:number;y:number}> = {
  garrigue:{x:130,y:130}, calanques:{x:20,y:130}, mines:{x:130,y:20}, mer:{x:20,y:20}, restanques:{x:75,y:75},
};

// ─── BAG EVOLUTION ───
export const BAG_SIZES = [8, 12, 16, 20, 25];
