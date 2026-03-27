export interface Spell {
  id: string; name: string; color: 'Rouge'|'Bleu'|'Blanc'|'Noir'; element: string;
  tier: 'Commun'|'Rare'|'Legendaire'; uses: number|null; // null=infinite
  power: [number,number,number]; // nv1,nv2,nv3
  effect: string; craft: string; biome: string;
}

export const SORTS: Spell[] = [
  { id:'flamme', name:'Flamme', color:'Rouge', element:'Feu', tier:'Commun', uses:null, power:[12,20,30], effect:'dmg + brulure', craft:'5 Herbe seche + 2 Pierre lave', biome:'Garrigue' },
  { id:'boule_feu', name:'Boule de feu', color:'Rouge', element:'Feu', tier:'Rare', uses:10, power:[25,40,55], effect:'dmg zone', craft:'3 Soufre + 5 Resine + 1 Cristal rouge', biome:'Mines' },
  { id:'meteore', name:'Meteore', color:'Rouge', element:'Feu', tier:'Legendaire', uses:1, power:[80,120,160], effect:'dmg + stun', craft:'1 Fragment etoile + 5 Cristal rouge + 3 Essence boss', biome:'Restanques' },
  { id:'brasier', name:'Brasier', color:'Rouge', element:'Feu', tier:'Commun', uses:null, power:[8,14,20], effect:'brulure', craft:'3 Brindille + 2 Huile', biome:'Garrigue' },
  { id:'vague', name:'Vague', color:'Bleu', element:'Eau', tier:'Commun', uses:null, power:[10,18,26], effect:'ralenti ATB', craft:'4 Algue + 2 Sel marin', biome:'Calanques' },
  { id:'blizzard', name:'Blizzard', color:'Bleu', element:'Eau', tier:'Rare', uses:10, power:[22,35,50], effect:'gel', craft:'3 Cristal bleu + 5 Eau pure + 1 Flocon', biome:'Mer' },
  { id:'tsunami', name:'Tsunami', color:'Bleu', element:'Eau', tier:'Legendaire', uses:1, power:[75,110,150], effect:'gel zone + purge', craft:'1 Larme Kraken + 5 Cristal bleu + 3 Essence boss', biome:'Mer' },
  { id:'soin', name:'Soin', color:'Blanc', element:'Lumiere', tier:'Commun', uses:null, power:[20,35,50], effect:'heal + purge', craft:'3 Herbe med + 2 Eau pure', biome:'Garrigue' },
  { id:'bouclier_divin', name:'Bouclier divin', color:'Blanc', element:'Lumiere', tier:'Rare', uses:10, power:[0,0,0], effect:'-30/50% dmg', craft:'3 Plume blanche + 5 Pierre lune + 1 Cristal blanc', biome:'Calanques' },
  { id:'resurrection', name:'Resurrection', color:'Blanc', element:'Lumiere', tier:'Legendaire', uses:1, power:[0,0,0], effect:'revive 30/50/100%', craft:'1 Plume phenix + 5 Cristal blanc + 3 Essence boss', biome:'Restanques' },
  { id:'lumiere', name:'Lumiere', color:'Blanc', element:'Lumiere', tier:'Commun', uses:null, power:[8,14,20], effect:'eclaire + revele mimics', craft:'2 Cire + 3 Meche + 1 Huile', biome:'Mines' },
  { id:'poison', name:'Poison', color:'Noir', element:'Ombre', tier:'Commun', uses:null, power:[5,8,12], effect:'dmg/tour x3-4t', craft:'4 Champignon noir + 2 Venin', biome:'Mines' },
  { id:'vol_vie', name:'Vol de vie', color:'Noir', element:'Ombre', tier:'Rare', uses:10, power:[15,25,35], effect:'vol 50-75% en PV', craft:'3 Cristal noir + 5 Sang lune + 1 Oeil nuit', biome:'Mines' },
  { id:'neant', name:'Neant', color:'Noir', element:'Ombre', tier:'Legendaire', uses:1, power:[70,100,140], effect:'-50% DEF + annule sorts', craft:'1 Fragment Mistral + 5 Cristal noir + 3 Essence boss', biome:'Restanques' },
]

export const ELEMENT_CYCLE: Record<string,string> = { Feu:'Ombre', Ombre:'Lumiere', Lumiere:'Eau', Eau:'Feu' }
