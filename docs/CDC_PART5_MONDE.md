# ═══════════════════════════════════════════════════════════════
# RESTANQUES — CDC PARTIE 5/5 : MONDE + DONJONS + MULTI + UI
# ═══════════════════════════════════════════════════════════════


# ╔═════════════════════════════════════════════════════════╗
# ║  16. MONDE EXTÉRIEUR (carte 150×150 par biome)          ║
# ╚═════════════════════════════════════════════════════════╝

## 16.1 Génération aléatoire (seed)
```
Chaque biome = carte 150×150 générée avec un seed.
Même seed = même carte pour tous les joueurs de la session.
Nouveau seed à chaque "Créer une partie".

Génération :
1. Placer les éléments fixes :
   - Maison Mélanie (75,75) + zone safe 10×10
   - Forteresse du boss (coin éloigné, ex: 130,130)
   - 2 villages (positions semi-aléatoires, min 30 cases entre eux)
   - 3 donjons demi-boss (positions semi-aléatoires, min 20 cases entre eux)
   - 2 donjons normaux
   - Portails aux bords (🚪)
   - Arène PvP (⚔️, au centre-nord)

2. Placer les clusters de ressources :
   - 5 forêts (6-8 arbres chacune, rayon 5)
   - 4 gisements (4-6 rochers/minerais, rayon 4)
   - 4 champs (5-7 herbes/fleurs, rayon 5)
   - 3 zones spéciales (corail, coquillages — biomes aquatiques)

3. Placer les monstres (80-100) :
   - Rayon 0-20 de la maison : 0 monstres (zone safe)
   - Rayon 20-50 : 25 monstres nv.1-2 (faciles)
   - Rayon 50-90 : 35 monstres nv.2-3
   - Rayon 90-120 : 25 monstres nv.3-4
   - Rayon 120-150 (près forteresse) : 15 monstres nv.4-5

4. Placer les PNJs (3 par biome) :
   - Près des villages
   - Avec 💬 visible au-dessus si quête dispo

5. Placer les panneaux indices (📜) :
   - 3-4 panneaux avec texte d'aide
```

## 16.2 Déplacement fluide
```
Joystick 120×120px semi-transparent, bas gauche.
Stick interne 44×44px suit le doigt.

Position joueur = (x: float, y: float) en PIXELS.
1 tile = 32px.
Vitesse base = 2 pixels/frame (60fps).
Avec bottes = ×1.3. Ombre = ×1.5.

Collision : hitbox joueur 16×16px centrée.
Les murs, PNJs, obstacles, eau profonde = solide.
Les PNJs BLOQUENT le passage + ouvrent le dialogue.
Les monstres BLOQUENT aussi (→ déclenchent le combat).

Viewport : caméra centrée sur le joueur, smooth follow.
```

## 16.3 Monstres sur la carte
```
Chaque monstre :
- Emoji CELL×CELL (ex: 36×36px)
- Badge niveau en haut droite (8px, fond rouge, texte blanc)
- PATROUILLE : bouge de 1 tile toutes les 2s, rayon 4 cases aléatoire
- CHASSE : si joueur à distance 4-6 (selon classe), le monstre se dirige vers lui
  Paladin vu à 6 cases (il les voit aussi à 6)
  Artisane vue à 4 cases
  Ombre vu à 3 cases (discret)
- Collision = combat
- RESPAWN : 3 min après mort, nouveau monstre à la position originale
```


# ╔═════════════════════════════════════════════════════════╗
# ║  17. DONJONS                                            ║
# ╚═════════════════════════════════════════════════════════╝

## 17.1 Donjons normaux (2 par biome)
```
Entrée 🕳️ sur la carte. Tap → popup "Entrer ?"
Carte 20×20 sombre. Seed unique = biome_seed + posX*1000 + posY.

Contenu :
- Labyrinthe généré (random walk + seed)
- 4-6 monstres (niveau biome + 3, PATROUILLENT, CHASSENT)
- 1 coffre 📦 (le plus loin de l'entrée)
- Loot coffre : 1 équipement OU item rare + 20-50☀️

🎵 dungeon.mp3
D-pad/Joystick fonctionne IDENTIQUEMENT.
Viewport centré sur le joueur.
Bouton "🚪 Sortir" visible.
HUD : "Donjon (garrigue) • ❤️12/15 • Monstres: 3/6"
```

## 17.2 Donjons demi-boss (3 par biome, quête PNJ)
```
Accessibles via quête PNJ uniquement.
Plus grands : 30×30. Plus difficiles.

Contenu :
- Couloir + salles
- 6-8 monstres (niveau biome + 4)
- 1 DEMI-BOSS à la fin
- Coffre après le demi-boss

Le demi-boss :
- Mini-story avant le combat (1 slide : image + texte typewriter)
  🎵 musique spéciale demi-boss (variation de boss.mp3)
- Combat Puyo Puyo DIFFICILE (IA plus agressive, plus de garbage)
- Drop : Fragment de clé + Peau de demi-boss (pour le sac) + équipement
- 3 fragments de clé des 3 demi-boss = Clé de la Forteresse du boss

Quand les 3 demi-boss sont vaincus :
→ Notification "🗝️ La Clé de la Forteresse est complète !"
→ Indicateur direction vers la forteresse du boss
```

## 17.3 Forteresse du boss (1 par biome)
```
🏰 Position éloignée de la maison.
Visuellement distincte : tiles sombres, emoji 🏰 2×CELL, contour rouge.

Quand le joueur arrive SANS clé :
"🔒 La Forteresse est verrouillée."
"Battez les 3 gardiens pour obtenir la clé."
Son doorLocked.

Quand le joueur a la clé :
"⚔️ Forteresse du Sanglier Ancien (Nv.7)"
"Êtes-vous prêt ?"
[⚔️ Entrer] [🚶 Pas encore]

INTÉRIEUR : couloir 15×30 avec 4-6 gardes (nv. élevé).
Au bout : le BOSS.
Combat Match-3 DOUBLE GRILLE (cf. CDC Partie 3).

Après victoire :
→ Story narrative (2 slides + texte) 🎵 story.mp3
→ Drop : trophée + outil biome suivant + Sous
→ Notification "🚪 Le portail vers [biome suivant] est ouvert !"
→ Portail brille sur la carte
```

## 17.4 Combat en donjon à deux
```
Si les 2 joueurs sont dans le même donjon :
- Ils se voient et se déplacent indépendamment
- Si les 2 rencontrent le MÊME monstre → combat COOP Puyo
  (même système que boss coop mais en Puyo)
- Si 1 seul rencontre un monstre → combat solo
- Pour le demi-boss : les 2 peuvent l'affronter ensemble si présents
```


# ╔═════════════════════════════════════════════════════════╗
# ║  18. PNJs ET QUÊTES                                     ║
# ╚═════════════════════════════════════════════════════════╝

## 18.1 PNJs
```
RÈGLE : les PNJs sont INTRAVERSABLES. Collision = dialogue.
💬 bulle au-dessus si quête dispo (pulsant).

GARRIGUE (3 PNJs) :
👴 Pépé Marius (village du Chêne)
  Quête principale : "Trouvez le Nid du Serpent au nord-est"
  Récompense : 🧭 Boussole (minimap active)
  Secondaire : "Rapportez 10 Herbes" → 30☀️

👵 Tante Magali (village de la Lavande)
  Quête principale : "Apportez 5 Lavandes + 3 Herbes"
  Récompense : RECETTE Épée bois (Mélanie peut la forger)
  Secondaire : "Récoltez 5 Pierres" → 20☀️

🏹 Fanfan le Chasseur (près forêt)
  Quête principale : "Explorez la Tanière du Loup et battez-le"
  Récompense : RECETTE Tunique cuir + fragment clé accès au donjon
  Secondaire : "Battez 15 monstres" → 25☀️ + Potion×2

CALANQUES (2 PNJs) :
🎣 Marinette
  Principale : "5 Poissons + 5 Coquillages" → RECETTE Amulette
  Secondaire : "Pêchez 3 Poissons rares" → 40☀️

⚓ Cap. Roustan
  Principale : "Explorez les 3 donjons demi-boss" → fragments clé
  Secondaire : "Battre la Méduse de nuit" → 50☀️

MINES (1 PNJ) :
⛏️ Marcel
  Principale : "10 Fers + 5 Cristaux" → fragments clé + RECETTE Cotte
  Secondaire : "Trouver le filon d'or" → 60☀️

MER (1 PNJ) :
🧜‍♀️ Ondine
  Principale : "3 Perles + 5 Coraux" → fragments clé + RECETTE Trident
  Secondaire : "Vaincre 3 requins" → 80☀️

RESTANQUES (1 PNJ) :
🧙 L'Ancien
  Principale : "Forgez la Clé Ancienne" → 👡 Bottes du Mistral
  Secondaire : "Vaincre le Chevalier noir" → RECETTE Lame Mistral
```

## 18.2 Quêtes de Mélanie (spécifiques)
```
L'Artisane a ses PROPRES quêtes (pas les mêmes que Jisse) :

GARRIGUE :
🌱 "Plantez 3 graines dans le jardin" → 20☀️ + Graine rare
🔮 "Craftez votre premier sort" → 30☀️
🍳 "Cuisinez un Ragoût" → 25☀️

CALANQUES :
🌿 "Récoltez 10 ressources dans la zone safe" → 30☀️
✨ "Évolez un sort au niveau 2" → 50☀️

MINES :
🔮 "Craftez 5 sorts différents" → 60☀️

MER :
💎 "Fusionnez 3 items" → 70☀️

RESTANQUES :
🏆 "Craftez la Lame du Mistral pour Jisse" → 100☀️
```

## 18.3 Journal de quêtes
```
┌──────────────────────────────────┐
│ 📋 JOURNAL                ❌    │
│                                  │
│ ── 🎯 QUÊTES PRINCIPALES ──    │
│ ✅ Trouver le Nid du Serpent    │
│ 🔲 Battre le Loup Alpha (1/3)  │
│ 🔲 Battre le Sanglier          │
│                                  │
│ ── 📌 QUÊTES SECONDAIRES ──    │
│ 🔲 Rapporter 10 Herbes (7/10)  │
│ ✅ Battre 15 monstres          │
│                                  │
│ ── 🎨 QUÊTES ARTISANE ──       │ ← seulement si Artisane
│ ✅ Planter 3 graines            │
│ 🔲 Crafter premier sort        │
└──────────────────────────────────┘
```


# ╔═════════════════════════════════════════════════════════╗
# ║  19. MULTIJOUEUR                                        ║
# ╚═════════════════════════════════════════════════════════╝

## 19.1 Sessions
```
Code 6 chars : "LAV-847" (3 lettres + 3 chiffres)
Créer = nouveau seed + code + nom + classe
Rejoindre = entre code + nom + classe
Max 3 joueurs (Paladin + Artisane + Ombre)
2 joueurs ne peuvent PAS choisir la même classe
```

## 19.2 Synchronisation
```
Supabase polling 2s :
- Position de l'autre joueur
- HP, niveau, inventaire
- Buffs/debuffs actifs
- Biome actuel
- in_home (pour savoir s'il est dans la maison)

Supabase Realtime :
- shared_chest (coffre commun)
- shop_inventory (comptoir Mélanie)
- Messages rapides
- PvP matches
- Ressources récoltées (nœuds collectés partagés)
```

## 19.3 L'autre joueur visible
```
Sur la carte (si même biome + pas in_home) :
- Emoji classe dans cercle gradient
- Nom en 7px en dessous
- Opacity 0.75
- Trait pointillé si distance < 20 tiles

Si autre biome :
- Indicateur bord d'écran : "👤 Mel (🏖️ Calanques)"

Si in_home :
- "👤 Mel (🏡 Maison)"
```

## 19.4 Messages rapides
```
4 boutons (accès via long press sur l'écran) :
[❤️ Aide!] [👋 Ici!] [⚔️ Boss!] [🏡 Camp!]
→ Bulle texte au-dessus du personnage de l'envoyeur
→ Notification chez le receveur : "🎸 Jisse : ⚔️ Boss!"
→ Son notification
```

## 19.5 Déconnexion
```
beforeunload → player.active = false
L'autre voit : "👋 Jisse s'est déconnecté"
L'autre CONTINUE en solo
Quand le joueur revient → reprend sa position

Menu ⚙️ → "🚪 Quitter la partie"
Confirmation → retour écran titre
Progression sauvegardée
```

## 19.6 PvP Arène
```
1 arène ⚔️ par biome.
Les 2 joueurs doivent être dans l'arène.
Combat Puyo Puyo l'un contre l'autre.
Sorts utilisables.
Premier à 0 PV perd. Timeout 3 min.
Gagnant +50 XP, perdant +20 XP.
Pas de mort permanente, pas de perte de Sous.
Fun et entraînement.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  20. CYCLE JOUR/NUIT                                    ║
# ╚═════════════════════════════════════════════════════════╝

```
1 cycle = 15 minutes réelles (un peu plus long pour explorer).
0.0-0.15 Aube 🌅 | 0.15-0.45 Jour ☀️ | 0.45-0.55 Crépuscule 🌇 | 0.55-0.90 Nuit 🌙

Visibilité :
- Jour : tout visible
- Crépuscule : 8 tiles radius
- Nuit : 3×3 tiles (noir au-delà, opacity 0)
- Torche active : 7×7 tiles + halo orange
- Mines : TOUJOURS nuit

Monstres nuit :
- ATK ×1.5, vitesse ×1.5, chasse ×2
- Nv.1-2 dorment, nv.3+ actifs
- Monstres nocturnes spéciaux apparaissent

SORTIR LA NUIT — niveau minimum :
Garrigue: nv.3 | Calanques: nv.7 | Mines: torche TOUJOURS | Mer: nv.16 | Restanques: nv.22
En dessous → message "⚠️ Trop dangereux la nuit sans torche !"

Horloge RPG : 40×40px, haut gauche top bar.
Disque moitié jour/nuit avec aiguille. Texte 9px.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  21. SONS ET MUSIQUES                                   ║
# ╚═════════════════════════════════════════════════════════╝

## 14+ musiques (MP3 si dispo, sinon Web Audio)
```
theme      — Écran titre (drone La+Mi, arpège solennel)
story      — Séquences narratives (drone Fa+Do, arpège lent)
ending     — Victoire finale Mistral (drone Do+Sol, ascendant)
gameover   — KO (2.5s, drone grave descendant)
garrigue   — Exploration garrigue (chaud, pastoral, cigales)
calanques  — Exploration calanques (aérien, maritime, guitare)
mines      — Exploration mines (sombre, écho, gouttes)
mer        — Exploration mer (profond, mystérieux, bulles)
restanques — Exploration restanques (épique, cuivres, cordes)
combat     — Combat Puyo normal (bass + kick, tendu)
boss       — Combat boss Match-3 (très rapide, drone grave, épique)
dungeon    — Dans les donjons (sombre, tension)
house      — Maison Mélanie (cozy, triangle doux, guitare)
demiboss   — Combat demi-boss (variation combat, plus intense)
```

## 29+ sons Web Audio
```
Pas (4) : stepGrass, stepStone, stepSand, stepWater
Récolte (4) : harvestWood, harvestStone, harvestHerb, harvestDone
Combat (6) : gemMatch(pitch combo), combatHit, combatSpell, combatVictory, combatDefeat, comboAlert
UI (7) : uiClick, uiOpen, uiClose, uiCraft, uiEquip, uiLevelUp, uiBuy
Narration (4) : npcTalk, questAccept, questComplete, zoneUnlock
Ambiance (6) : mysteryAppear, doorLocked, teleport, ko, nightFall, collect
Maison (3) : gardenPlant, gardenHarvest, cookDone

storyActive flag : AUCUN son gameplay pendant les séquences narratives.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  22. NARRATION + PERSONNAGE MYSTÈRE                     ║
# ╚═════════════════════════════════════════════════════════╝

## Story séquences
```
StorySequence.tsx :
- z-index 9999, fond NOIR OPAQUE
- Image : object-fit: contain, background-color: #000
- Texte : centré, typewriter 30ms/lettre, tap=skip, fond rgba(0,0,0,0.7)
- Bouton "Passer ⏭️" en haut droite
- 🎵 story.mp3 (sauf ending → ending.mp3)

MOMENTS :
- Intro (4 slides après écran titre)
- Demi-boss vaincu (1 slide + texte, musique demiboss_victory)
- Boss vaincu = fin de biome (2 slides + texte)
- Transition vers nouveau biome (1 slide : "Les Calanques s'ouvrent...")
- Ending (4 slides après Mistral)
```

## Personnage mystère (Ombre non joué)
```
Quand la classe Ombre n'est pas jouée par un joueur :
- Silhouette 🌙 (brightness 0.15, opacity 0.5)
- Apparaît ~10% du temps sur la carte, position aléatoire visible
- Reste 5 secondes puis disparaît
- Son mystery (82Hz grave)
- Si le joueur s'approche : "L'ombre murmure : 'Le sanglier craint le feu...'"
  → Indice contextuel sur le prochain boss/demi-boss
- Aide en combat : 10% de chance qu'une gemme soit auto-matchée gratuitement
  → Texte "🌙 L'Ombre vous aide..."
- Apparaît dans les images narratives (en arrière-plan, silhouette)

Style Fallout (Cavalier Mystérieux) : aide ponctuelle inattendue.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  23. ONBOARDING GAMIFIÉ                                 ║
# ╚═════════════════════════════════════════════════════════╝

```
Première partie uniquement (après l'intro narrative).
5 missions guidées — PAS un tutoriel texte, un JEU :

MISSION 1 : "🎯 Déplacez-vous !"
  Flèche dorée vers un buisson brillant à 10 cases.
  Complété quand le joueur y arrive. Récompense : 5☀️
  "Super ! Vous maîtrisez le déplacement."

MISSION 2 : "🎯 Récoltez !"
  "Tapez sur le buisson brillant pour récolter."
  Complété quand le joueur récolte sa première ressource. +5☀️
  "Bien joué ! Les ressources servent à crafter."

MISSION 3 : "🎯 Votre premier combat !"
  Un monstre nv.1 spécial (HP très bas) apparaît à côté.
  Combat Puyo Puyo avec bulles d'aide :
  "Déplacez les pièces avec swipe ← →"
  "Alignez 4 gemmes identiques pour attaquer !"
  Complété quand le monstre est vaincu. +10☀️

MISSION 4 : "🎯 Rentrez à la maison !"
  Flèche vers la maison de Mélanie. +5☀️
  Si ARTISANE : "Explorez votre maison ! Entrez dans le salon."
  Si PALADIN : "Déposez vos ressources au coffre."

MISSION 5 : "🎯 Votre première nuit !"
  Le cycle avance jusqu'à la nuit.
  "Il fait nuit ! Rentrez vite ou allumez une torche."
  Si ARTISANE : "Dormez dans la chambre pour passer au jour."
  Complété quand le joueur dort ou survit la nuit. +10☀️
  
"🎉 Onboarding terminé ! L'aventure commence."
Les missions donnent 35☀️ total — assez pour acheter des potions.

Accessible plus tard dans ⚙️ Options → "📖 Revoir le tutoriel"
```


# ╔═════════════════════════════════════════════════════════╗
# ║  24. NEW GAME+                                          ║
# ╚═════════════════════════════════════════════════════════╝

```
Après avoir battu le Mistral :
- Séquence ending (4 slides) 🎵 ending.mp3
- Écran victoire :
  "🏆 Le Mistral est vaincu !"
  Temps de jeu : 12h 34min
  Monstres vaincus : 347
  Quêtes complétées : 18/24
  Boss vaincus : 5/5
  Niveau : 25
  Sous gagnés : 2,450☀️

- [🔄 New Game+]
  Nouveau seed (nouvelles cartes)
  GARDE : niveau, stats, équipement, sorts, classe, sac
  RESET : position (maison), quêtes, donjons, bosses, demi-bosses
  GARDE AUSSI : jardin de Mélanie (parcelles débloquées)
  Monstres BUFF : NG+1 HP×1.5 ATK×1.3, NG+2 ×2/×1.6, NG+3+ ×2.5/×2
  Sorts avancés : de NOUVELLES recettes de sorts nv.3+ disponibles en NG+
  
- [🏠 Retour au menu]
  Retour écran titre, pas de NG+

"NG+ ×{n}" affiché en doré sur l'écran titre.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  25. UI GLOBALE + SPRITES                               ║
# ╚═════════════════════════════════════════════════════════╝

## Sprites
```
TOUT en emoji + CSS pour commencer (prêt pour remplacement futur).
Les personnages et monstres sont des emojis DANS des cercles colorés.
PAS des petits emojis bruts — des vrais éléments de jeu :

JOUEURS : cercle 36×36px avec gradient + border dorée + emoji 20px centré
MONSTRES : cercle 36×36px + badge niveau (8px, coin haut droit)
BOSS : cercle 64×64px + badge + contour rouge pulsant
PNJs : cercle 36×36px + border bleue + 💬 si quête
RESSOURCES : emoji 28px + barre HP 20×3px en dessous

SPRITE_MAP dans sprites.ts :
Chaque entité a : { emoji, c1 (gradient start), c2 (gradient end), size }
Quand on aura de vrais sprites → on change juste le rendu, pas la logique.
```

## Panneaux et menus
```
Style global provençal :
- Fond : linear-gradient(#F5ECD7, #E8D5A3)
- Border : 4px solid #5C4033
- Border-radius : 16px
- Font : 'Crimson Text', Georgia, serif
- Couleur texte : #3D2B1F

Émojis : 28px (icônes principales)
Texte : 11-12px (descriptions)
Barres de stats : 60px × 8px, colorées selon le type
Boutons : 44px height minimum, border-radius 8px, gros et cliquables

Animation ouverture :
@keyframes panelOpen { 0% { scale:0.8; opacity:0 } 100% { scale:1; opacity:1 } }
```


# ╔═════════════════════════════════════════════════════════╗
# ║  26. GUIDE DU JEU (dans ⚙️ Options)                    ║
# ╚═════════════════════════════════════════════════════════╝

```
Onglets :
[🎮 Contrôles] [🎸 Classes] [⚔️ Combat] [🏡 Maison] [🌍 Monde] [📖 Sorts]

🎮 Contrôles :
- Joystick : déplacement fluide
- Tap : récolte / dialogue PNJ / interaction
- Swipe gauche : menu (Perso/Sac/Sorts/Quêtes/Bestiaire)
- Swipe droite : carte/minimap plein écran

🎸 Classes :
- Paladin : explore, combat, achète. Ne craft pas.
- Artisane : maison, jardin, craft tout. Fragile dehors.
- Ombre : autonome, tout faire, moins bien.

⚔️ Combat :
- Créatures : Puyo Puyo (gemmes tombent, 4+ connectées = match)
- Boss : Match-3 double grille (2 grilles simultanées)
- Sorts : 3 équipés, 1 utilisation/combat
- Bonus jour/nuit sur les sorts

🏡 Maison :
- Salon : craft sorts
- Cuisine : plats + potions
- Armurerie : armes + armures
- Chambre : dormir + enlever debuffs
- Jardin : planter + récolter
- Coffre : échange avec l'autre joueur
- Comptoir : vendre à l'autre joueur

🌍 Monde :
- 5 biomes, 3 demi-boss + 1 boss par biome
- Donjons : loot rare, monstres durs
- Cycle jour/nuit, torches
- Villages : shops

📖 Sorts :
- 14 sorts, niveaux 1→3
- Bonus jour/nuit
- Craftés par l'Artisane au Salon
```


# ╔═════════════════════════════════════════════════════════╗
# ║  27. CHECK PRE-DEPLOY                                   ║
# ╚═════════════════════════════════════════════════════════╝

```bash
echo "═══ CHECK COMPLET ═══"

# Assets
for f in theme.mp3 story.mp3 ending.mp3 gameover.mp3; do
  [ -f "public/music/$f" ] && echo "✅ $f" || echo "⚠️ $f (Web Audio fallback)"
done
echo "Story: $(ls public/story/*.png 2>/dev/null | wc -l) images (attendu: 17)"
[ -f "public/splash.png" ] && echo "✅ splash" || echo "❌ splash"

# Code
echo "Fichiers: $(find app/ -name '*.tsx' -o -name '*.ts' | wc -l)"
echo "Lignes: $(find app/ -name '*.tsx' -o -name '*.ts' | xargs wc -l | tail -1)"

# Boss
echo "Boss flags:"
grep -rn "isBoss\|boss.*true" app/data/ | head -10

# Story triggers
echo "Story triggers:"
grep -rn "triggerStory\|setStory" app/game/ | grep -v "//" | head -10

# Deploy
npx vercel --prod --yes
```
