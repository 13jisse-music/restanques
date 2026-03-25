# ═══════════════════════════════════════════════════════════════
# RESTANQUES — CDC PARTIE 2/5 : CLASSES + BIOMES + MONSTRES
# ═══════════════════════════════════════════════════════════════


# ╔═════════════════════════════════════════════════════════╗
# ║  6. CLASSES DÉTAILLÉES                                  ║
# ╚═════════════════════════════════════════════════════════╝

## 6.1 Paladin 🎸 (Jisse)
```
Stats base : ATK 3, DEF 1, MAG 0, VIT 2
PV départ : 15
Sous départ : 50 ☀️

Level up AUTO : ATK+1 toujours, 50% DEF+1, 25% VIT+1
Notification "⬆️ Niveau X ! ATK+1, DEF+1" (3s)

PEUT :
- Explorer les biomes (joystick fluide)
- Combattre (Puyo Puyo + Match-3 boss)
- Récolter (-1/tap, LENT sans outil)
- Acheter chez Mélanie (au comptoir) ou en shop village
- Dormir à la maison (chambre)
- Déposer au coffre commun
- Utiliser sorts/potions/plats en combat
- Poser des pièges (Pierre×3, craft par Mélanie)
- Utiliser la pierre de rappel (craft par Mélanie)

NE PEUT PAS :
- Crafter QUOI QUE CE SOIT
- Utiliser le jardin
- Cuisiner
- Forger des armes/sorts (c'est Mélanie)

BONUS :
- Combat : dégâts ×1.2
- Éclaireur : voit monstres à 6 cases
- Rage : combo ×3 en combat → ATK ×1.5 pendant 2 tours
- XP combat : +25%
- Peut entrer dans les donjons dangereux seul
```

## 6.2 Artisane 🎨 (Mélanie)
```
Stats base : ATK 1, DEF 1, MAG 2, VIT 1
PV départ : 15
Sous départ : 100 ☀️ (plus car elle doit investir dans son commerce)

Level up AUTO : MAG+1 toujours, 50% DEF+1, 25% VIT+1

PEUT :
- Gérer sa maison (5 pièces)
- Planter/récolter dans le jardin
- Crafter TOUT (sorts, armes, armures, potions, plats)
- Vendre à Jisse (comptoir)
- Fusionner des items (2→1 supérieur, 0% échec, 20% triple)
- Récolter dans sa zone safe (-3/tap avec outil !)
- Combattre les nuisibles (Puyo facile)
- Sortir dans le monde de Jisse (portail)
- Sort de rappel permanent (retour maison instantané)

NE PEUT PAS :
- Rien, elle peut tout faire MAIS est FRAGILE dehors (ATK 1, DEF 1)

BONUS :
- Récolte : -3/tap avec outil, +50% loot, graines 50% drop
- Voit ressources RARES (🍄🫐💠 invisibles pour les autres)
- Jardin pousse 2× plus vite
- Craft puzzle : grille 4×4 (vs 3×3 autres), bonus alignement 4+
- Recettes secrètes découvertes aléatoirement (10% par craft)
```

## 6.3 Ombre 🌙 (Quentin)
```
Stats base : ATK 2, DEF 0, MAG 1, VIT 3
PV départ : 15
Sous départ : 75 ☀️

Level up AUTO : VIT+1 toujours, 50% ATK+1, 25% MAG+1

PEUT :
- TOUT faire (explorer + crafter + jardiner)
- Mais 10% chance d'échec sur CHAQUE craft
- Pas de bonus spéciaux de classe

BONUS :
- Vitesse ×1.5 (le plus rapide)
- Discrétion : monstres détectent à 3 cases (les autres 4-6)
- Critique : 15% chance ×3 dégâts en combat
- Voit dans le noir à 5 cases (les autres 3)
- Quand pas joué : apparaît comme aide mystère (10% en combat)

PARFAIT POUR : jouer seul, jouer en 3ème joueur
Puzzle craft : grille 3×3, 10% échec
```


# ╔═════════════════════════════════════════════════════════╗
# ║  7. LES 5 BIOMES                                       ║
# ╚═════════════════════════════════════════════════════════╝

Chaque biome = carte 150×150 générée aléatoirement (seed).
Nouveau seed = nouvelles cartes à chaque "Nouvelle partie".
Même seed = même carte pour tous les joueurs.

## 7.1 GARRIGUE 🌿 (biome de départ)

```
AMBIANCE : Collines vertes, champs de lavande, forêts de chênes
COULEURS : herbe #8FBE4A, herbe haute #6D9E2A, chemin #D4B896, lavande #B39DDB
🎵 MUSIQUE : garrigue (chaud, guitare, cigales)

RESSOURCES (en clusters) :
- 🪵 Branche (forêts de 6-8, HP 12)
- 🌿 Herbe (champs de 5-7, HP 5)
- 💜 Lavande (champs de 4-6, HP 5)
- 🪨 Pierre (gisements de 3-5, HP 18)

MONSTRES (80-100 par biome) :
- 🐀 Rat (nv.1, HP 8, ATK 2, drop: Herbe, 2-4☀️)
- 🐇 Lapin (nv.2, HP 12, ATK 3, drop: Herbe+Branche, 3-6☀️)
- 🐝 Abeille (nv.3, HP 18, ATK 5, drop: Lavande+Miel, 5-8☀️)
- 🦊 Renard (nv.4, HP 24, ATK 7, drop: Peau renard+Herbe, 7-12☀️)
Nocturne : 🦉 Hibou (nv.4, HP 20, ATK 8, rapide)
Répartition : 25 nv1 près camp, 30 nv2-3 milieu, 25 nv3-4 loin

3 DEMI-BOSS (dans donjons spéciaux, quête PNJ) :
- 🐺 Loup Alpha (nv.5, HP 35, ATK 9, drop: Peau de loup + Clé fragment 1)
  Donjon : "Tanière du Loup" (quête de Fanfan le Chasseur)
- 🦎 Lézard Géant (nv.5, HP 30, ATK 8, drop: Écaille + Clé fragment 2)
  Donjon : "Grotte du Lézard" (quête de Tante Magali)
- 🐍 Serpent Roi (nv.6, HP 40, ATK 10, drop: Croc + Peau demi-boss pour sac)
  Donjon : "Nid du Serpent" (quête de Pépé Marius)
  → 3 fragments de clé = Clé de la Tanière du Sanglier

BOSS : 🐗 Sanglier Ancien
  Nv.7, HP 60, ATK 15
  Dans sa FORTERESSE (donjon spécial avec couloir + gardes)
  🔑 Nécessite : Clé de la Tanière (3 fragments des demi-boss)
  COMBAT : Match-3 DOUBLE GRILLE
  IMPOSSIBLE sans : Épée bois (ATK+2) + Tunique (DEF+2) + 2 sorts + 5 potions
  Drop : Défense de Sanglier (trophée) + Bâton (accès Calanques) + 50☀️
  → Story narrative "Garrigue libérée" → portail Calanques ouvert

PNJs (3) :
- 👴 Pépé Marius : quête "Trouver le Nid du Serpent" → Boussole (minimap)
- 👵 Tante Magali : quête "5 Lavandes + 3 Herbes" → recette Épée bois pour Mélanie
- 🏹 Fanfan : quête "Explorer la Tanière du Loup" → recette Tunique pour Mélanie
Quêtes secondaires :
- "Ramener 10 Herbes au village" → 30☀️
- "Battre 15 monstres" → 20☀️

VILLAGES (2) :
- Village du Chêne : shop (Potions 15☀️, Torches 10☀️, Pain 5☀️)
- Village de la Lavande : shop (Herbes 3☀️, Pierres 5☀️, infos PNJ)

DONJONS NORMAUX (2, en plus des 3 donjons demi-boss) :
- Cartes 20×20, monstres nv.3-4, coffre avec loot
- Seed unique par position d'entrée

MAISON DE MÉLANIE : au centre de la carte (75, 75)
- Accessible par tous les joueurs
- Zone safe 10×10 autour
```

## 7.2 CALANQUES 🏖️

```
AMBIANCE : Falaises blanches, eau turquoise, sable
COULEURS : sable #E8D5A3, eau #4AA3DF, falaise #C4A882
🎵 MUSIQUE : calanques (aérien, vagues, guitare claire)

RESSOURCES :
- 🐚 Coquillage (plages, HP 8)
- 🧂 Sel (cristaux côtiers, HP 10)
- 🐟 Poisson (zones d'eau, HP 6)
- 🪸 Corail (récifs, HP 12)

MONSTRES :
- 🦀 Crabe (nv.5, HP 28, ATK 8, drop: Pince+Coquillage, 8-12☀️)
- 🐦 Goéland (nv.6, HP 32, ATK 9, drop: Plume+Sel, 10-15☀️)
- 🪼 Méduse (nv.7, HP 36, ATK 11, drop: Venin+Perle, 12-18☀️)
- 🐚 Bernard (nv.8, HP 40, ATK 12, drop: Coquille rare, 15-20☀️)
Nocturne : 🦇 Chauve-souris marine (nv.8, HP 35, ATK 13)

3 DEMI-BOSS :
- 🦐 Crevette Géante (nv.9, HP 55, ATK 14)
- 🐊 Crocodile marin (nv.9, HP 60, ATK 15)
- 🦈 Requin-marteau (nv.10, HP 65, ATK 16, drop: Peau demi-boss pour sac)

BOSS : 🦅 Mouette Impératrice
  Nv.12, HP 100, ATK 22
  Drop : Plume dorée + Pioche (accès Mines) + 100☀️

PNJs (2) :
- 🎣 Marinette : quête "5 Poissons + 5 Coquillages" → recette Amulette pour Mélanie
- ⚓ Cap. Roustan : quête demi-boss → fragments clé forteresse

VILLAGES (2) : shops mieux fournis (Potions+, premières armes basiques)
DONJONS NORMAUX : 2, monstres nv.6-8, loot tier 2
```

## 7.3 MINES ⛏️

```
AMBIANCE : Souterrain sombre, cristaux, lave
COULEURS : sol #5C4033, mur #3D2B1F, cristal glow
🎵 MUSIQUE : mines (sombre, écho, gouttes)
TOUJOURS NUIT (torche indispensable !)

RESSOURCES :
- 🪨 Pierre (parois, HP 18)
- ⛏️ Fer (veines, HP 25)
- 🟠 Ocre (poches, HP 20)
- 💎 Cristal (rare, HP 30)

MONSTRES :
- 🦇 Chauve-souris (nv.10, HP 45, ATK 14)
- 🦂 Scorpion (nv.11, HP 50, ATK 16)
- 🪨 Golem (nv.12, HP 60, ATK 18)
- 🕷️ Araignée (nv.13, HP 65, ATK 20)

3 DEMI-BOSS :
- ⚒️ Forgeron fou (nv.14, HP 80, ATK 22)
- 🐉 Salamandre (nv.14, HP 85, ATK 23)
- 🗿 Golem d'or (nv.15, HP 90, ATK 25, drop: Peau pour sac)

BOSS : 🐉 Tarasque
  Nv.17, HP 150, ATK 30
  Drop : Écaille de Tarasque + Filet (accès Mer) + 200☀️

PNJs (1) :
- ⛏️ Marcel : quête demi-boss → fragments clé forteresse

VILLAGES (2) : shops tier 3
DONJONS : 2, monstres nv.12-14
```

## 7.4 MER 🌊

```
AMBIANCE : Sous-marin, coraux, profondeurs
COULEURS : fond #1B6E8A, corail rose, sable marin
🎵 MUSIQUE : mer (mystérieux, profond, bulles)

RESSOURCES :
- 🪸 Corail (récifs, HP 12)
- ⚪ Perle (huîtres, HP 15, RARE)
- 🐟 Poisson (bancs, HP 6)
- 🐚 Coquillage (fond, HP 8)

MONSTRES :
- 🐡 Poisson-globe (nv.15, HP 70, ATK 22)
- 🦈 Requin (nv.16, HP 80, ATK 25)
- ⚡ Anguille élec (nv.17, HP 85, ATK 27)
- 🐙 Poulpe (nv.18, HP 90, ATK 28)
Nocturne : 🦑 Calmar abyssal (nv.18, HP 95, ATK 30)

3 DEMI-BOSS :
- 🐋 Baleine spectrale (nv.19, HP 110, ATK 30)
- 🧜 Sirène sombre (nv.19, HP 105, ATK 32)
- 🐢 Tortue ancienne (nv.20, HP 120, ATK 33, drop: Carapace pour sac)

BOSS : 🦑 Kraken
  Nv.22, HP 220, ATK 40
  Drop : Encre de Kraken + Clé Ancienne partielle + 300☀️

PNJs (1) :
- 🧜‍♀️ Ondine : quête demi-boss → fragments clé

VILLAGES (2) : shops tier 4
DONJONS : 2, monstres nv.16-19
```

## 7.5 RESTANQUES 🏛️

```
AMBIANCE : Ruines anciennes, pierre dorée, mystère
COULEURS : pierre #C4A874, mur #8B7355
🎵 MUSIQUE : restanques (épique, cordes, cuivres)

RESSOURCES :
- 💎 Cristal (partout, HP 30)
- ⛏️ Fer (veines, HP 25)
- 🟠 Ocre (poches, HP 20)
- 🪨 Pierre ancienne (HP 25)
+ Ressources RARES du jardin nécessaires

MONSTRES :
- 👻 Spectre (nv.20, HP 100, ATK 30, TRAVERSE MURS !)
- 🗿 Golem ancien (nv.21, HP 110, ATK 32)
- ⚔️ Gardien (nv.22, HP 120, ATK 35)
- 🌪️ Esprit du vent (nv.23, HP 130, ATK 38)
Nocturne : 👻 Spectre nv.24 (encore plus fort la nuit)

3 DEMI-BOSS :
- 🐲 Dragon de pierre (nv.24, HP 150, ATK 40)
- 👁️ Œil ancien (nv.24, HP 140, ATK 42)
- 💀 Chevalier noir (nv.25, HP 160, ATK 45, drop: Cape pour sac MAX)

BOSS FINAL : 🌪️ MISTRAL
  Nv.28, HP 350, ATK 55
  COMBAT ÉPIQUE : Match-3 double grille, 5-10 minutes
  IMPOSSIBLE sans : arme ultime + armure max + 6 sorts nv.3 + plats cuisine + potions ×10
  En COOP : les 2 joueurs ENSEMBLE, boss HP ×1.5
  Drop : Couronne du Mistral + ENDING → New Game+

PNJs (1) :
- 🧙 L'Ancien : quête finale → Bottes du Mistral

VILLAGES (1) : shop ultime
DONJONS : 2, monstres nv.22-25, loot légendaire
```

## 7.6 Hiérarchie des monstres (récap)
```
BIOME        NORMAUX         DEMI-BOSS (×3)    BOSS
Garrigue     nv.1-4          nv.5-6            nv.7 (HP 60)
Calanques    nv.5-8          nv.9-10           nv.12 (HP 100)
Mines        nv.10-13        nv.14-15          nv.17 (HP 150)
Mer          nv.15-18        nv.19-20          nv.22 (HP 220)
Restanques   nv.20-23        nv.24-25          nv.28 (HP 350)
```

## 7.7 Drops de monstres
```
TOUS les monstres droppent :
- Sous ☀️ : niveau × 2 (random ±30%)
- 1-3 ressources du biome (80%)
- Drops spéciaux par monstre (cf liste ci-dessus)
- 5% chance item rare (ingrédient sort)

DEMI-BOSS droppent EN PLUS :
- Fragment de clé de forteresse (3 fragments = 1 clé)
- Peau de demi-boss (pour améliorer le sac)
- 1 équipement garanti (du biome)
- 50-100☀️

BOSS droppent :
- Trophée unique
- Outil pour le biome suivant
- 50-300☀️
- Séquence narrative
```

## 7.8 Nuit par biome
```
Garrigue : cycle normal (15 min), nuit = 3×3 cases visible
Calanques : cycle normal, monstres marins plus actifs la nuit
Mines : TOUJOURS NUIT (torche obligatoire en permanence)
Mer : cycle normal, créatures abyssales la nuit
Restanques : nuit plus longue (60% du cycle), spectres traversent murs

NIVEAU MINIMUM pour sortir la nuit sans torche :
Garrigue : nv.3 (sinon les hiboux te one-shot)
Calanques : nv.7
Mines : impossible sans torche
Mer : nv.16
Restanques : nv.22

Torche : visibilité 3×3 → 7×7, durée 3 min
Craft par Mélanie : Branche×2 + Herbe×1
Achat en shop : 10☀️ (cher)
```
