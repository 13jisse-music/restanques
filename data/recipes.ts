export interface Recipe {
  id: string; name: string; atelier: 'salon'|'cuisine'|'armurerie';
  effect: string; ingredients: string[]; tier: string; biome: string;
  emoji: string; targetLevel: number; targetCount: number;
}

export const RECIPES_CUISINE: Recipe[] = [
  { id:'potion_soin', name:'Potion de soin', atelier:'cuisine', effect:'+30 PV', ingredients:['herbe_med','herbe_med','herbe_med','eau_pure'], tier:'Base', biome:'Tous', emoji:'🧪', targetLevel:2, targetCount:2 },
  { id:'potion_soin_plus', name:'Potion de soin+', atelier:'cuisine', effect:'+60 PV', ingredients:['herbe_med','herbe_med','herbe_med','eau_pure','eau_pure','miel'], tier:'Avance', biome:'Calanques', emoji:'🧪', targetLevel:2, targetCount:3 },
  { id:'potion_force', name:'Potion de force', atelier:'cuisine', effect:'+20% ATK 3t', ingredients:['racine_rouge','racine_rouge','champignon','champignon'], tier:'Base', biome:'Garrigue', emoji:'💪', targetLevel:2, targetCount:2 },
  { id:'potion_defense', name:'Potion de defense', atelier:'cuisine', effect:'+20% DEF 3t', ingredients:['coquillage','coquillage','argile','argile','argile'], tier:'Base', biome:'Calanques', emoji:'🛡', targetLevel:2, targetCount:2 },
  { id:'potion_vitesse', name:'Potion de vitesse', atelier:'cuisine', effect:'ATB +30% 2t', ingredients:['baie','baie','baie','plume'], tier:'Base', biome:'Garrigue', emoji:'⚡', targetLevel:2, targetCount:2 },
  { id:'antidote', name:'Antidote', atelier:'cuisine', effect:'Purge poison', ingredients:['herbe_blanche','herbe_blanche','eau_pure'], tier:'Base', biome:'Tous', emoji:'💊', targetLevel:2, targetCount:1 },
  { id:'elixir_feu', name:'Elixir de feu', atelier:'cuisine', effect:'+30% dmg Feu 3t', ingredients:['piment','piment','piment','soufre','soufre','huile'], tier:'Avance', biome:'Mines', emoji:'🔥', targetLevel:2, targetCount:3 },
  { id:'elixir_glace', name:'Elixir de glace', atelier:'cuisine', effect:'+30% dmg Eau 3t', ingredients:['menthe','menthe','menthe','sel','sel','cristal_bleu'], tier:'Avance', biome:'Mer', emoji:'❄', targetLevel:2, targetCount:3 },
  { id:'ragout', name:'Ragout provencal', atelier:'cuisine', effect:'+15 PV + anti-fatigue', ingredients:['tomate','tomate','ail','herbe','herbe','huile'], tier:'Base', biome:'Garrigue', emoji:'🍲', targetLevel:2, targetCount:3 },
  { id:'bouillabaisse', name:'Bouillabaisse', atelier:'cuisine', effect:'+40 PV + DEF +10%', ingredients:['poisson','poisson','poisson','safran','tomate','tomate','ail'], tier:'Avance', biome:'Mer', emoji:'🍜', targetLevel:3, targetCount:3 },
  { id:'pierre_rappel', name:'Pierre de rappel', atelier:'cuisine', effect:'Teleport maison', ingredients:['pierre_lune','pierre_lune','pierre_lune','cristal','cristal','cristal','rune'], tier:'Rare', biome:'Mines', emoji:'💎', targetLevel:3, targetCount:2 },
  { id:'torche', name:'Torche', atelier:'cuisine', effect:'Camper la nuit', ingredients:['brindille','brindille','brindille','resine','resine','tissu'], tier:'Base', biome:'Garrigue', emoji:'🔦', targetLevel:2, targetCount:3 },
  { id:'biscuit_marin', name:'Biscuit de marin', atelier:'cuisine', effect:'+20 PV + anti-nausee', ingredients:['farine','farine','farine','sel','eau_pure'], tier:'Base', biome:'Mer', emoji:'🍪', targetLevel:2, targetCount:2 },
  { id:'tarte_baies', name:'Tarte aux baies', atelier:'cuisine', effect:'+25 PV + XP +10%', ingredients:['baie','baie','baie','baie','farine','farine','miel'], tier:'Avance', biome:'Garrigue', emoji:'🥧', targetLevel:2, targetCount:3 },
  { id:'potion_sumo', name:'Potion Sumo speciale', atelier:'cuisine', effect:'+50 PV + luck +20%', ingredients:['herbe_rare','poisson_dore','miel','mystere'], tier:'Sumo', biome:'Maison', emoji:'🐱', targetLevel:3, targetCount:2 },
  { id:'elixir_mistral', name:'Elixir du Mistral', atelier:'cuisine', effect:'Immunite vent 10t', ingredients:['plume_mistral','plume_mistral','plume_mistral','essence_pure','essence_pure'], tier:'Sumo', biome:'Restanques', emoji:'🌪', targetLevel:3, targetCount:2 },
  { id:'potion_chance', name:'Potion de chance', atelier:'cuisine', effect:'Luck +30% 5t', ingredients:['trefle','trefle','poudre_etoile','poudre_etoile','larme'], tier:'Rare', biome:'Restanques', emoji:'🍀', targetLevel:3, targetCount:2 },
  { id:'soupe_champignons', name:'Soupe champignons', atelier:'cuisine', effect:'+15 PV + vision nocturne', ingredients:['champignon','champignon','champignon','champignon','ail','eau_pure','eau_pure'], tier:'Base', biome:'Mines', emoji:'🍄', targetLevel:2, targetCount:3 },
  { id:'infusion_lavande', name:'Infusion lavande', atelier:'cuisine', effect:'Anti-fatigue 80%', ingredients:['lavande','lavande','lavande','lavande','lavande','eau_pure','eau_pure','miel'], tier:'Avance', biome:'Garrigue', emoji:'💜', targetLevel:2, targetCount:3 },
  { id:'nectar_dieux', name:'Nectar des dieux', atelier:'cuisine', effect:'Full PV + purge + ATK +10%', ingredients:['ambroisie','miel_rare','miel_rare','miel_rare','essence_boss','essence_boss'], tier:'Sumo', biome:'Restanques', emoji:'✨', targetLevel:3, targetCount:3 },
]

export const RECIPES_ARMES: Recipe[] = [
  { id:'epee_lavande', name:'Epee de lavande', atelier:'armurerie', effect:'+8 ATK', ingredients:['bois','bois','bois','fer','fer','lavande','lavande'], tier:'Base', biome:'Garrigue', emoji:'⚔', targetLevel:2, targetCount:3 },
  { id:'epee_corail', name:'Epee de corail', atelier:'armurerie', effect:'+14 ATK', ingredients:['corail','corail','corail','fer','fer','fer','perle','perle'], tier:'Avance', biome:'Calanques', emoji:'⚔', targetLevel:2, targetCount:3 },
  { id:'lame_profondeurs', name:'Lame des profondeurs', atelier:'armurerie', effect:'+22 ATK', ingredients:['acier_marin','acier_marin','acier_marin','ecaille','ecaille','dent_requin'], tier:'Rare', biome:'Mer', emoji:'⚔', targetLevel:3, targetCount:3 },
  { id:'epee_mistral', name:'Epee du Mistral', atelier:'armurerie', effect:'+30 ATK', ingredients:['acier_celeste','acier_celeste','cristal_vent','cristal_vent','essence_mistral'], tier:'Legendaire', biome:'Restanques', emoji:'⚔', targetLevel:3, targetCount:2 },
  { id:'bouclier_bois', name:'Bouclier de bois', atelier:'armurerie', effect:'DEF +5', ingredients:['bois','bois','bois','bois','cuir','cuir'], tier:'Base', biome:'Garrigue', emoji:'🛡', targetLevel:2, targetCount:3 },
  { id:'armure_mailles', name:'Armure de mailles', atelier:'armurerie', effect:'DEF +12', ingredients:['fer','fer','fer','fer','cuir','cuir','cuir','fil','fil'], tier:'Avance', biome:'Mines', emoji:'🛡', targetLevel:2, targetCount:3 },
  { id:'plastron_abysses', name:'Plastron des abysses', atelier:'armurerie', effect:'DEF +20', ingredients:['ecaille','ecaille','ecaille','acier_marin','acier_marin','perle_noire','perle_noire'], tier:'Rare', biome:'Mer', emoji:'🛡', targetLevel:3, targetCount:3 },
  { id:'casque_cuir', name:'Casque de cuir', atelier:'armurerie', effect:'DEF +3', ingredients:['cuir','cuir','cuir','cuir','fer','fer'], tier:'Base', biome:'Garrigue', emoji:'⛑', targetLevel:2, targetCount:3 },
  { id:'heaume_fer', name:'Heaume de fer', atelier:'armurerie', effect:'DEF +8', ingredients:['fer','fer','fer','fer','cuir','cuir','cuir','plume'], tier:'Avance', biome:'Mines', emoji:'⛑', targetLevel:2, targetCount:3 },
  { id:'gants_travail', name:'Gants de travail', atelier:'armurerie', effect:'ATK +2, recolte +10%', ingredients:['cuir','cuir','cuir','tissu','tissu'], tier:'Base', biome:'Garrigue', emoji:'🧤', targetLevel:2, targetCount:2 },
  { id:'gantelets_fer', name:'Gantelets de fer', atelier:'armurerie', effect:'ATK +6, critique +5%', ingredients:['fer','fer','fer','cuir','cuir','cuir','pierre'], tier:'Avance', biome:'Mines', emoji:'🧤', targetLevel:2, targetCount:3 },
  { id:'bottes_marche', name:'Bottes de marche', atelier:'armurerie', effect:'Vitesse +10%', ingredients:['cuir','cuir','cuir','cuir','semelle','semelle','huile'], tier:'Base', biome:'Garrigue', emoji:'👢', targetLevel:2, targetCount:3 },
  { id:'bottes_corail', name:'Bottes de corail', atelier:'armurerie', effect:'Vitesse +15%, nage', ingredients:['corail','corail','cuir_marin','cuir_marin','cuir_marin','algue','algue'], tier:'Avance', biome:'Calanques', emoji:'👢', targetLevel:2, targetCount:3 },
  { id:'bottes_vent', name:'Bottes du vent', atelier:'armurerie', effect:'Vitesse +25%, esquive +10%', ingredients:['plume_mistral','plume_mistral','plume_mistral','cuir_fin','cristal_vent'], tier:'Rare', biome:'Restanques', emoji:'👢', targetLevel:3, targetCount:2 },
  { id:'dague_ombre', name:'Dague d ombre', atelier:'armurerie', effect:'+10 ATK, poison 5%', ingredients:['fer_noir','fer_noir','fer_noir','venin','venin','cristal_noir'], tier:'Avance', biome:'Mines', emoji:'🗡', targetLevel:2, targetCount:3 },
  { id:'baton_artisane', name:'Baton d artisane', atelier:'armurerie', effect:'+6 ATK, sorts +15%', ingredients:['bois_ancien','bois_ancien','cristal','cristal','cristal','rune','rune'], tier:'Avance', biome:'Calanques', emoji:'🪄', targetLevel:2, targetCount:3 },
]

export const RECIPES_SORTS: Recipe[] = [
  { id:'flamme', name:'Sort Flamme', atelier:'salon', effect:'12 dmg Feu', ingredients:['herbe_seche','herbe_seche','herbe_seche','herbe_seche','herbe_seche','pierre_lave','pierre_lave'], tier:'Commun', biome:'Garrigue', emoji:'🔥', targetLevel:2, targetCount:3 },
  { id:'soin', name:'Sort Soin', atelier:'salon', effect:'+20 PV', ingredients:['herbe_med','herbe_med','herbe_med','eau_pure','eau_pure'], tier:'Commun', biome:'Garrigue', emoji:'✨', targetLevel:2, targetCount:2 },
  { id:'vague', name:'Sort Vague', atelier:'salon', effect:'10 dmg Eau + ralenti', ingredients:['algue','algue','algue','algue','sel','sel'], tier:'Commun', biome:'Calanques', emoji:'🌊', targetLevel:2, targetCount:3 },
  { id:'poison', name:'Sort Poison', atelier:'salon', effect:'5 dmg/tour x3', ingredients:['champignon_noir','champignon_noir','champignon_noir','champignon_noir','venin','venin'], tier:'Commun', biome:'Mines', emoji:'☠', targetLevel:2, targetCount:3 },
  { id:'lumiere', name:'Sort Lumiere', atelier:'salon', effect:'8 dmg + eclaire', ingredients:['cire','cire','meche','meche','meche','huile'], tier:'Commun', biome:'Mines', emoji:'💡', targetLevel:2, targetCount:3 },
  { id:'brasier', name:'Sort Brasier', atelier:'salon', effect:'8 dmg + brulure', ingredients:['brindille','brindille','brindille','huile','huile'], tier:'Commun', biome:'Garrigue', emoji:'🔥', targetLevel:2, targetCount:2 },
  { id:'boule_feu', name:'Sort Boule de feu', atelier:'salon', effect:'25 dmg zone', ingredients:['soufre','soufre','soufre','resine','resine','cristal_rouge'], tier:'Rare', biome:'Mines', emoji:'☄', targetLevel:3, targetCount:3 },
  { id:'blizzard', name:'Sort Blizzard', atelier:'salon', effect:'22 dmg + gel', ingredients:['cristal_bleu','cristal_bleu','cristal_bleu','eau_pure','eau_pure','flocon'], tier:'Rare', biome:'Mer', emoji:'❄', targetLevel:3, targetCount:3 },
  { id:'bouclier_divin', name:'Sort Bouclier divin', atelier:'salon', effect:'-30% dmg 2t', ingredients:['plume_blanche','plume_blanche','plume_blanche','pierre_lune','cristal_blanc'], tier:'Rare', biome:'Calanques', emoji:'🛡', targetLevel:3, targetCount:2 },
  { id:'vol_vie', name:'Sort Vol de vie', atelier:'salon', effect:'15 dmg + vol 50%', ingredients:['cristal_noir','cristal_noir','cristal_noir','sang_lune','oeil_nuit'], tier:'Rare', biome:'Mines', emoji:'🩸', targetLevel:3, targetCount:2 },
]

export const ALL_RECIPES = [...RECIPES_CUISINE, ...RECIPES_ARMES, ...RECIPES_SORTS]
