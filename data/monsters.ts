export interface Monster {
  id: string; name: string; biome: string; type: string;
  lvMin: number; lvMax: number; hp: number; atk: number; def: number;
  element: string; weakness: string; atbSpeed: number; xp: number;
  drops: string; sprite: string;
}

export const MONSTERS: Monster[] = [
  // GARRIGUE
  { id:'rat', name:'Rat des garrigues', biome:'Garrigue', type:'Normal', lvMin:1, lvMax:3, hp:30, atk:6, def:2, element:'', weakness:'Feu', atbSpeed:3, xp:12, drops:'Herbe, Cuir, Graine 10%', sprite:'monster_garrigue_rat.png' },
  { id:'serpent', name:'Serpent de lavande', biome:'Garrigue', type:'Normal', lvMin:2, lvMax:4, hp:40, atk:10, def:3, element:'Ombre', weakness:'Lumiere', atbSpeed:3.5, xp:16, drops:'Venin, Herbe med, Graine 5%', sprite:'monster_garrigue_serpent.png' },
  { id:'loup', name:'Loup solitaire', biome:'Garrigue', type:'Normal', lvMin:3, lvMax:5, hp:60, atk:13, def:5, element:'', weakness:'Feu', atbSpeed:2.5, xp:25, drops:'Cuir, Croc, Graine 8%', sprite:'monster_garrigue_loup.png' },
  { id:'mimic_buisson', name:'Mimic buisson', biome:'Garrigue', type:'Mimic', lvMin:3, lvMax:4, hp:45, atk:14, def:9, element:'', weakness:'Feu', atbSpeed:2, xp:32, drops:'Ressource x3, Graine 15%', sprite:'monster_garrigue_mimic.png' },
  { id:'loup_alpha', name:'Loup alpha', biome:'Garrigue', type:'Mob fort', lvMin:4, lvMax:5, hp:90, atk:16, def:7, element:'', weakness:'Feu', atbSpeed:2, xp:42, drops:'Cuir rare, Croc alpha', sprite:'monster_garrigue_loupalpha.png' },
  { id:'cerf', name:'Grand Cerf', biome:'Garrigue', type:'Demi-boss', lvMin:5, lvMax:5, hp:200, atk:20, def:10, element:'Lumiere', weakness:'Ombre', atbSpeed:3, xp:100, drops:'Peau cerf (sac+), Cle chateau', sprite:'combat_demiboss_cerf.png' },
  { id:'sanglier', name:'Sanglier geant', biome:'Garrigue', type:'Boss', lvMin:5, lvMax:6, hp:500, atk:25, def:12, element:'Feu', weakness:'Eau', atbSpeed:4, xp:300, drops:'Defense sanglier, Essence boss, Portail Calanques', sprite:'combat_boss_sanglier.png' },
  // CALANQUES
  { id:'crabe', name:'Crabe des rochers', biome:'Calanques', type:'Normal', lvMin:5, lvMax:7, hp:60, atk:12, def:9, element:'Eau', weakness:'Feu', atbSpeed:3.5, xp:25, drops:'Coquillage, Corail, Sel', sprite:'monster_calanques_crabe.png' },
  { id:'meduse', name:'Meduse flottante', biome:'Calanques', type:'Normal', lvMin:6, lvMax:8, hp:50, atk:16, def:4, element:'Eau', weakness:'Feu', atbSpeed:2.5, xp:30, drops:'Gelee, Perle 8%, Algue', sprite:'monster_calanques_meduse.png' },
  { id:'goeland', name:'Goeland furieux', biome:'Calanques', type:'Normal', lvMin:7, lvMax:9, hp:72, atk:14, def:5, element:'Lumiere', weakness:'Ombre', atbSpeed:2, xp:35, drops:'Plume blanche, Graine 8%', sprite:'monster_calanques_goeland.png' },
  { id:'poulpe', name:'Poulpe geant', biome:'Calanques', type:'Demi-boss', lvMin:9, lvMax:9, hp:400, atk:28, def:14, element:'Eau', weakness:'Feu', atbSpeed:3, xp:200, drops:'Tentacule (sac+), Cle chateau', sprite:'combat_demiboss_poulpe.png' },
  { id:'mouette', name:'Mouette titanesque', biome:'Calanques', type:'Boss', lvMin:9, lvMax:10, hp:800, atk:32, def:16, element:'Lumiere', weakness:'Ombre', atbSpeed:3.5, xp:500, drops:'Plume divine, Essence boss, Portail Mines', sprite:'combat_boss_mouette.png' },
  // MINES
  { id:'chauvesouris', name:'Chauve-souris', biome:'Mines', type:'Normal', lvMin:10, lvMax:12, hp:82, atk:18, def:9, element:'Ombre', weakness:'Lumiere', atbSpeed:2, xp:42, drops:'Aile, Cristal noir 5%, Fer', sprite:'monster_mines_chauvesouris.png' },
  { id:'golem', name:'Golem de pierre', biome:'Mines', type:'Normal', lvMin:11, lvMax:13, hp:140, atk:22, def:20, element:'', weakness:'Eau', atbSpeed:5, xp:52, drops:'Pierre rare, Fer, Cristal 8%', sprite:'monster_mines_golem.png' },
  { id:'araignee', name:'Araignee des mines', biome:'Mines', type:'Normal', lvMin:12, lvMax:14, hp:95, atk:20, def:11, element:'Ombre', weakness:'Lumiere', atbSpeed:2.5, xp:47, drops:'Fil ombre, Venin, Oeil nuit 5%', sprite:'monster_mines_araignee.png' },
  { id:'dragon', name:'Dragon mineur', biome:'Mines', type:'Demi-boss', lvMin:14, lvMax:14, hp:600, atk:35, def:18, element:'Feu', weakness:'Eau', atbSpeed:3, xp:350, drops:'Ecaille dragon (sac+), Cle chateau', sprite:'combat_demiboss_dragon.png' },
  { id:'tarasque', name:'Tarasque', biome:'Mines', type:'Boss', lvMin:14, lvMax:15, hp:1200, atk:40, def:22, element:'Feu', weakness:'Eau', atbSpeed:3.5, xp:700, drops:'Carapace, Essence boss, Portail Mer', sprite:'combat_boss_tarasque.png' },
  // MER
  { id:'poissonepee', name:'Poisson-epee', biome:'Mer', type:'Normal', lvMin:15, lvMax:17, hp:115, atk:24, def:13, element:'Eau', weakness:'Feu', atbSpeed:2, xp:57, drops:'Ecaille, Poisson, Arete', sprite:'monster_mer_poissonepee.png' },
  { id:'pieuvre', name:'Pieuvre spectrale', biome:'Mer', type:'Normal', lvMin:16, lvMax:18, hp:105, atk:27, def:11, element:'Ombre', weakness:'Lumiere', atbSpeed:2.5, xp:62, drops:'Encre, Tentacule, Perle noire 5%', sprite:'monster_mer_pieuvre.png' },
  { id:'requin', name:'Requin blanc', biome:'Mer', type:'Normal', lvMin:18, lvMax:20, hp:175, atk:33, def:17, element:'Eau', weakness:'Feu', atbSpeed:2, xp:75, drops:'Dent requin, Cuir marin, Ecaille rare', sprite:'monster_mer_requin.png' },
  { id:'sirene', name:'Sirene', biome:'Mer', type:'Demi-boss', lvMin:20, lvMax:20, hp:900, atk:38, def:20, element:'Eau', weakness:'Feu', atbSpeed:3, xp:500, drops:'Chant sirene (sac+), Cle chateau', sprite:'combat_demiboss_sirene.png' },
  { id:'kraken', name:'Kraken', biome:'Mer', type:'Boss', lvMin:21, lvMax:22, hp:1800, atk:48, def:26, element:'Eau', weakness:'Feu', atbSpeed:4, xp:1000, drops:'Larme Kraken, Essence boss, Portail Restanques', sprite:'combat_boss_kraken.png' },
  // RESTANQUES
  { id:'esprit', name:'Esprit du vent', biome:'Restanques', type:'Normal', lvMin:22, lvMax:25, hp:180, atk:35, def:19, element:'Lumiere', weakness:'Ombre', atbSpeed:1.5, xp:87, drops:'Plume Mistral, Cristal vent', sprite:'monster_restanques_esprit.png' },
  { id:'gardien', name:'Gardien de pierre', biome:'Restanques', type:'Normal', lvMin:24, lvMax:27, hp:250, atk:39, def:26, element:'', weakness:'Eau', atbSpeed:4.5, xp:105, drops:'Pierre ancienne, Rune, Acier celeste', sprite:'monster_restanques_gardien.png' },
  { id:'phenix', name:'Phenix cendre', biome:'Restanques', type:'Normal', lvMin:26, lvMax:28, hp:210, atk:44, def:16, element:'Feu', weakness:'Eau', atbSpeed:2, xp:120, drops:'Plume phenix, Fragment etoile 3%', sprite:'monster_restanques_phenix.png' },
  { id:'titan', name:'Titan ancien', biome:'Restanques', type:'Demi-boss', lvMin:28, lvMax:28, hp:1500, atk:50, def:28, element:'', weakness:'Tous', atbSpeed:3.5, xp:800, drops:'Pierre Titan (sac+), Cle chateau final', sprite:'combat_demiboss_titan.png' },
  { id:'mistral', name:'Le Mistral', biome:'Restanques', type:'Boss final', lvMin:30, lvMax:30, hp:3000, atk:60, def:30, element:'Tous', weakness:'Variable', atbSpeed:3, xp:2000, drops:'Coeur Mistral, Couronne Restanques, FIN', sprite:'combat_boss_mistral.png' },
  // MAISON
  { id:'limace', name:'Limace du jardin', biome:'Maison', type:'Nuisible', lvMin:1, lvMax:5, hp:20, atk:4, def:1, element:'', weakness:'Feu', atbSpeed:4, xp:5, drops:'Bave, Graine 15%', sprite:'monster_maison_limace.png' },
  { id:'corbeau', name:'Corbeau chapardeur', biome:'Maison', type:'Nuisible', lvMin:2, lvMax:6, hp:25, atk:6, def:2, element:'Lumiere', weakness:'Ombre', atbSpeed:2, xp:8, drops:'Plume, Graine 20%', sprite:'monster_maison_corbeau.png' },
  { id:'taupe', name:'Taupe geante', biome:'Maison', type:'Nuisible', lvMin:3, lvMax:7, hp:35, atk:8, def:4, element:'', weakness:'Eau', atbSpeed:3.5, xp:11, drops:'Terre rare, Graine 10%', sprite:'monster_maison_taupe.png' },
]
