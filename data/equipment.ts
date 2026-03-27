export interface EquipSlot { slot:string; paladin:string; artisane:string; ombre:string }
export const EQUIPMENT: EquipSlot[] = [
  { slot:'Arme', paladin:'Epees (ATK haute)', artisane:'Batons (sorts +%)', ombre:'Dagues (critique +%)' },
  { slot:'Armure', paladin:'Plaques (DEF haute)', artisane:'Robes (resist magie)', ombre:'Cuir (esquive +%)' },
  { slot:'Casque', paladin:'Heaumes', artisane:'Diademes', ombre:'Capuches' },
  { slot:'Gants', paladin:'Gantelets', artisane:'Gants craft', ombre:'Gants voleur' },
  { slot:'Bottes', paladin:'Bottes lourdes', artisane:'Sandales', ombre:'Bottes furtives' },
  { slot:'Amulette', paladin:'Pendentif force', artisane:'Pendentif sagesse', ombre:'Pendentif chance' },
]