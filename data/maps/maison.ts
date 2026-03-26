// Maison de Mélanie — carte 100x100 tiles
// Tile IDs: 0=herbe, 1=chemin, 2=mur, 3=sol intérieur, 4=eau, 5=fleurs
// 10=table enchantée (salon), 11=four (cuisine), 12=enclume (armurerie)
// 13=lit (chambre), 14=comptoir, 15=coffre
// 20=bac jardin, 21=arbre, 22=portail, 23=clôture
// 30=toit (visible de l'extérieur)

export const TILE_COLORS: Record<number, string> = {
  0: '#5a8f3c',  // herbe
  1: '#c4a661',  // chemin
  2: '#8B7355',  // mur
  3: '#d4b896',  // sol intérieur
  4: '#4a90c4',  // eau
  5: '#7ec850',  // fleurs/herbe déco
  10: '#7F77DD', // table enchantée (violet sort)
  11: '#ef9f27', // four (orange)
  12: '#888',    // enclume (gris)
  13: '#D4537E', // lit (rose)
  14: '#8B6914', // comptoir (bois doré)
  15: '#5C4033', // coffre (bois sombre)
  20: '#3d6b2e', // bac jardin
  21: '#2d5a1e', // arbre
  22: '#e91e8c', // portail
  23: '#8B7355', // clôture
  30: '#a0522d', // toit
}

export const TILE_WALKABLE: Set<number> = new Set([0, 1, 3, 5])
export const TILE_INTERACTIVE: Record<number, string> = {
  10: 'salon',    // craft sorts
  11: 'cuisine',  // craft potions
  12: 'armurerie',// craft armes
  13: 'chambre',  // dormir
  14: 'comptoir', // commerce
  15: 'coffre',   // stockage
  20: 'jardin',   // planter
  22: 'portail',  // changer biome
}

// Map dimensions
export const MAP_W = 100
export const MAP_H = 100

// House position (top-left corner of house)
const HX = 35 // house X start
const HY = 25 // house Y start
const HW = 30 // house width
const HH = 20 // house height

// Generate the 100x100 map
export function generateMaisonMap(): number[][] {
  const map: number[][] = []

  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = []
    for (let x = 0; x < MAP_W; x++) {
      let tile = 0 // default herbe

      // Clôture border (around house area)
      if ((y === HY - 3 || y === HY + HH + 3) && x >= HX - 3 && x <= HX + HW + 3) tile = 23
      if ((x === HX - 3 || x === HX + HW + 3) && y >= HY - 3 && y <= HY + HH + 3) tile = 23

      // Chemin leading to house
      if (x === HX + Math.floor(HW / 2) && y > HY + HH && y < HY + HH + 8) tile = 1
      if (x === HX + Math.floor(HW / 2) && y < HY && y > HY - 6) tile = 1

      // Trees scattered
      if (tile === 0 && (
        (x === 10 && y === 10) || (x === 85 && y === 15) || (x === 15 && y === 80) ||
        (x === 90 && y === 85) || (x === 50 && y === 90) || (x === 8 && y === 50) ||
        (x === 92 && y === 50) || (x === 20 && y === 5) || (x === 75 && y === 5)
      )) tile = 21

      // Flowers patches
      if (tile === 0 && (
        (x >= 5 && x <= 8 && y >= 60 && y <= 63) ||
        (x >= 80 && x <= 83 && y >= 30 && y <= 33)
      )) tile = 5

      // Water pond
      if (tile === 0 && x >= 75 && x <= 80 && y >= 70 && y <= 75) tile = 4

      // House walls
      const inHouse = x >= HX && x < HX + HW && y >= HY && y < HY + HH
      if (inHouse) {
        // Outer walls
        if (x === HX || x === HX + HW - 1 || y === HY || y === HY + HH - 1) {
          tile = 2 // wall
          // Openings (doors)
          if (y === HY + HH - 1 && x === HX + Math.floor(HW / 2)) tile = 3 // south entrance
          if (y === HY && x === HX + Math.floor(HW / 2)) tile = 3 // north entrance
        }
        // Mid wall (horizontal, splitting top/bottom rooms)
        else if (y === HY + Math.floor(HH / 2)) {
          tile = 2
          // Openings between rooms
          if (x === HX + 5 || x === HX + 15 || x === HX + 25) tile = 3
        }
        // Vertical walls between rooms (top row)
        else if (y < HY + Math.floor(HH / 2) && (x === HX + 10 || x === HX + 20)) {
          tile = 2
          if (y === HY + 5) tile = 3 // opening
        }
        // Vertical wall between rooms (bottom row)
        else if (y > HY + Math.floor(HH / 2) && x === HX + 10) {
          tile = 2
          if (y === HY + Math.floor(HH / 2) + 5) tile = 3
        }
        // Interior floor
        else {
          tile = 3
        }
      }

      // Furniture (inside house)
      // Salon (top-left room) - table enchantée
      if (x === HX + 5 && y === HY + 3) tile = 10
      // Cuisine (top-center room) - four
      if (x === HX + 15 && y === HY + 3) tile = 11
      // Armurerie (top-right room) - enclume
      if (x === HX + 25 && y === HY + 3) tile = 12
      // Chambre (bottom-left room) - lit
      if (x === HX + 5 && y === HY + Math.floor(HH / 2) + 3) tile = 13
      // Comptoir (bottom-right room)
      if (x === HX + 18 && y === HY + Math.floor(HH / 2) + 3) tile = 14
      // Coffre (near comptoir)
      if (x === HX + 22 && y === HY + Math.floor(HH / 2) + 3) tile = 15

      // Jardin — 4 bacs (outside, north of house)
      if (y === HY - 5 && (x === HX + 5 || x === HX + 10 || x === HX + 15 || x === HX + 20)) tile = 20

      // Portail magique (south-east of house)
      if (x === HX + HW + 5 && y === HY + Math.floor(HH / 2)) tile = 22

      row.push(tile)
    }
    map.push(row)
  }

  return map
}

// Spawn point (in front of bed in chambre)
export const SPAWN_X = HX + 5
export const SPAWN_Y = HY + Math.floor(HH / 2) + 4

// Garden plot positions
export const GARDEN_PLOTS = [
  { x: HX + 5, y: HY - 5 },
  { x: HX + 10, y: HY - 5 },
  { x: HX + 15, y: HY - 5 },
  { x: HX + 20, y: HY - 5 },
]

// Portal position
export const PORTAL_POS = { x: HX + HW + 5, y: HY + Math.floor(HH / 2) }
