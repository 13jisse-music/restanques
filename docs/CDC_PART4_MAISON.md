# ═══════════════════════════════════════════════════════════════
# RESTANQUES — CDC PARTIE 4/5 : MAISON MÉLANIE + ÉCONOMIE
# ═══════════════════════════════════════════════════════════════


# ╔═════════════════════════════════════════════════════════╗
# ║  11. LA MAISON DE MÉLANIE (carte 100×100)               ║
# ╚═════════════════════════════════════════════════════════╝

## 11.1 Vue d'ensemble
La maison est un MONDE SÉPARÉ de 100×100 tiles.
Mélanie s'y déplace avec le même joystick fluide que Jisse.
Elle est SUR la carte du biome de Jisse (position fixe 75,75 en garrigue).

```
CARTE 100×100 de Mélanie :

  ┌─────────────────────────────┐
  │     ZONE SAFE (nuisibles)   │ ← monstres faibles, ressources
  │                             │
  │   ┌─────────────────┐      │
  │   │    JARDIN 4×4    │      │ ← 16 parcelles
  │   │   graines/plantes│      │
  │   └─────────────────┘      │
  │                             │
  │   ┌─────────────────────┐  │
  │   │      MAISON          │  │
  │   │ ┌────┐┌────┐┌────┐ │  │
  │   │ │SALO││CUIS││ARMU│ │  │ ← 5 pièces
  │   │ │sort││plat││arme│ │  │
  │   │ └────┘└────┘└────┘ │  │
  │   │ ┌────┐  ┌─────┐   │  │
  │   │ │CHAM│  │COMPT│   │  │ ← chambre + comptoir vente
  │   │ │dodo│  │vente│   │  │
  │   │ └────┘  └─────┘   │  │
  │   │       🚪 PORTE     │  │ ← sortir vers le jardin
  │   └─────────────────────┘  │
  │                             │
  │   📦 COFFRE (extérieur)    │ ← coffre commun accessible dehors
  │   🚪 PORTAIL (vers monde)  │ ← sortir dans le monde de Jisse
  │                             │
  └─────────────────────────────┘
```

## 11.2 La maison (intérieur)
La maison fait ~20×15 tiles à l'intérieur.
Mélanie se déplace dedans avec le joystick.
Chaque pièce a une zone cliquable (quand on marche dedans, le panneau s'ouvre).

### SALON DES SORTS (craft spellbook)
```
Mélanie entre dans le salon → panneau de craft sort.
C'est ici qu'elle craft les 14 sorts et les fait évoluer (nv1→nv3).

Interface :
┌──────────────────────────────────┐
│ ✨ SALON DES SORTS               │
│                                  │
│ Sorts disponibles (Garrigue) :  │
│ 🌫️ Brume Nv.1                  │
│   💜×3 + 🌿×2                  │
│   [Forger — Puzzle 4×4]        │
│                                  │
│ 🛡️ Bouclier Nv.1               │
│   🪨×3 + 🌿×2                  │
│   [Forger — Puzzle 4×4]        │
│                                  │
│ Sorts possédés :                │
│ 🌫️ Brume Nv.2 — [Évoluer Nv.3]│
│                                  │
│ Les recettes apparaissent       │
│ quand vous avez les ingrédients │
└──────────────────────────────────┘

Tap "Forger" → ouvre le PUZZLE CRAFT (grille 4×4).
Voir CDC Partie 3 pour les recettes des 14 sorts.
```

### CUISINE (craft plats + potions)
```
┌──────────────────────────────────┐
│ 🍳 CUISINE                      │
│                                  │
│ POTIONS :                       │
│ 🧪 Potion (soigne 10 PV)       │
│   🌿×3 → [Cuisiner]            │
│ 🧪 Potion+ (soigne 20 PV)      │
│   Herbe fraîche×2 + 🍄×1       │
│                                  │
│ PLATS (buffs temporaires) :     │
│ 🍖 Ragoût (ATK+3, 5min)        │
│   Herbe fraîche×2 + 🐟×1       │
│ 🛡️ Bouillon (DEF+3, 5min)      │
│   Herbe fraîche×1 + 🫐×1       │
│ ✨ Infusion (MAG+5, 5min)       │
│   Lavande pure×2 + 🍄×1        │
│ 💪 Festin héros (ALL+3, 10min) │
│   Ragoût + Élixir + Infusion   │
│                                  │
│ Craft : tap [Cuisiner] = puzzle │
│ Cuisine = puzzle SIMPLE 3×3    │
│ (pas besoin d'aligner, juste   │
│  placer tous les ingrédients)  │
│                                  │
│ GRATUIT pour Jisse (potions)    │
│ PAYANT pour plats rares         │
└──────────────────────────────────┘

Les plats sont des items. Le joueur les utilise
AVANT un combat ou sur la carte.
Buff visible dans la top bar : "🍖 ATK+3 (2:34)"
```

### ARMURERIE (craft armes + armures)
```
┌──────────────────────────────────┐
│ ⚔️ ARMURERIE                    │
│                                  │
│ Recettes par biome actuel :     │
│                                  │
│ GARRIGUE :                      │
│ 🗡️ Épée bois (ATK+2)          │
│   🪵×5 + 🪨×2 → [Forger 4×4]  │
│ 🧥 Tunique cuir (DEF+2)        │
│   🌿×5 + 🪵×3 → [Forger 4×4]  │
│                                  │
│ CALANQUES :                     │
│ ⚔️ Épée fer (ATK+5)            │
│   ⛏️×5 + 🪵×2 + 🪨×3         │
│ 📿 Amulette (MAG+3)            │
│   💜×5 + 🐚×2 + 🌿×3         │
│                                  │
│ MINES :                         │
│ 🛡️ Cotte écailles (DEF+5)     │
│   ⛏️×8 + 🪨×5                 │
│ 👡 Sandales vitesse (VIT+2)    │
│   🌿×5 + Peau×2               │
│                                  │
│ MER :                           │
│ 🔱 Trident corail (ATK+7,MAG+3)│
│   🪸×5 + ⚪×3 + ⛏️×3          │
│ 💎 Collier perles (MAG+5,DEF+2)│
│   ⚪×5 + 💎×2                  │
│                                  │
│ RESTANQUES :                    │
│ 🗡️ Lame Mistral (ATK+12)      │
│   💎×5 + ⛏️×5 + ⚪×3          │
│ 🛡️ Armure ancienne (DEF+8)    │
│   🪨×10 + ⛏️×8 + 💎×3        │
│                                  │
│ OUTILS :                        │
│ 🔦 Torche                      │
│   🪵×2 + 🌿×1 → pas de puzzle │
│ 🪤 Piège (stun monstre 5s)     │
│   🪨×3 → pas de puzzle         │
│ 🏠 Pierre de rappel            │
│   🪨×5 + 💎×1 → puzzle 3×3    │
│ 🎒 Sac amélioré                │
│   Peau demi-boss ×1 + 🌿×5    │
│   → augmente sac de 4 slots   │
│                                  │
│ Armes/armures = puzzle 4×4     │
│ Outils simples = pas de puzzle │
│ Outils rares = puzzle 3×3      │
└──────────────────────────────────┘

IMPORTANT : seule l'Artisane forge ICI.
Le Paladin vient ACHETER les produits finis au comptoir.
```

### CHAMBRE (dormir + enlever debuffs)
```
┌──────────────────────────────────┐
│ 🛏️ CHAMBRE                      │
│                                  │
│ [💤 Dormir jusqu'à l'aube]     │
│ → PV restaurés au max          │
│ → Temps avance à l'aube        │
│ → Enlève TOUS les debuffs :    │
│   😵 Fatigue → supprimée       │
│   🤢 Poison → supprimé         │
│   ❄️ Gel → supprimé            │
│   💀 Malédiction → supprimée   │
│                                  │
│ EN MULTI :                      │
│ Les 2 joueurs doivent être dans │
│ la maison pour dormir.          │
│ "💤 Jisse n'est pas rentré !"  │
│ → message rapide auto envoyé   │
│                                  │
│ Animation : fondu noir 1s →    │
│ "Zzz..." → fondu out 1s       │
│ 🎵 musique douce pendant       │
└──────────────────────────────────┘
```

### COMPTOIR DE VENTE (commerce avec Jisse)
```
┌──────────────────────────────────┐
│ 🏪 COMPTOIR                     │
│                                  │
│ ── EN VENTE ──                  │
│ 🧪 Potion ×5      10☀️ chaque  │ ← GRATUIT pour Jisse
│ 🌫️ Brume Nv.2     50☀️        │ ← PAYANT
│ 🗡️ Épée fer       80☀️        │ ← PAYANT
│ 🍖 Ragoût ×3      25☀️ chaque  │ ← PAYANT
│                                  │
│ ── COMMANDES DE JISSE ──        │
│ "🎸 Jisse veut : ⚡ Sort Éclat"│ ← demande en attente
│ [Accepter] [Refuser]            │
│                                  │
│ ── HISTORIQUE ──                │
│ Dernière vente : Épée fer 80☀️ │
│ Total gagné : 340☀️            │
│                                  │
│ Mélanie fixe SES prix.         │
│ Potions = toujours gratuites.   │
│ Sorts/armes/plats = payants.    │
└──────────────────────────────────┘

QUAND JISSE VISITE LA MAISON :
Il entre dans la carte 100×100.
Il marche jusqu'au comptoir.
Il voit les produits en vente + les prix.
Il achète avec ses Sous ☀️.
L'argent va dans la bourse de Mélanie.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  12. JARDIN (extérieur maison, 16 parcelles)            ║
# ╚═════════════════════════════════════════════════════════╝

## 12.1 Parcelles
```
16 parcelles (grille 4×4) dans le jardin extérieur.
Mélanie marche jusqu'à une parcelle vide et TAP pour planter.

┌──────────────────────────────────┐
│ 🌱 JARDIN                       │
│                                  │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│ │🌱  │ │💜  │ │    │ │    │   │
│ │2:34│ │Prêt│ │vide│ │vide│   │
│ │herbe│ │réc!│ │    │ │    │   │
│ └────┘ └────┘ └────┘ └────┘   │
│ (répéter 4 lignes)              │
│                                  │
│ Parcelle vide → Tap → choisir : │
│ [🌱Herbe 2min] [🌱Lavande 3min]│
│ [🌱Champignon 5min] [🌱Baies 4min]│
│                                  │
│ Artisane : pousse 2× plus vite │
│ Ombre : pousse vitesse normale  │
│ Paladin : pousse 2× plus LENT  │
└──────────────────────────────────┘
```

## 12.2 Graines et récoltes
```
🌱 Graine d'herbe → 2 min → Herbe fraîche (meilleure que herbe normale)
🌱 Graine de lavande → 3 min → Lavande pure (ingrédient sorts avancés)
🌱 Graine de champignon → 5 min → Champignon magique (cuisine + sorts tier 3)
🌱 Graine de baies → 4 min → Baies dorées (cuisine + sorts tier 5)

Artisane : temps ÷ 2
Parcelle prête : la plante pulse en vert + notification "🌱 Prête !"
Tap pour récolter → 2-3 unités de l'ingrédient

Les graines s'obtiennent :
- En récoltant des plantes dans le monde (30% drop, 50% Artisane)
- Drop de nuisibles de la zone safe (🐸 Grenouille → graine rare)
- Achat en shop village (cher : 15-25☀️)
```

## 12.3 Zone safe (autour de la maison)
```
Zone ~30×30 autour de la maison (dans la carte 100×100).
Contient :
- Ressources de base du biome actuel (en clusters)
- Nuisibles (🐛🐌🪲🐸) — combat Puyo Puyo FACILE
- Les ressources respawnent toutes les 5 min
- Les nuisibles respawnent toutes les 3 min

C'est le terrain de farming de Mélanie.
Elle ne DOIT PAS avoir besoin de sortir pour le gameplay de base.
Jisse ramène les ressources RARES que sa zone n'a pas.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  13. FUSION D'ITEMS                                     ║
# ╚═════════════════════════════════════════════════════════╝

```
Accessible au salon ou à un établi spécial dans la maison.

2× même item → 1× item de niveau supérieur :

Herbe ×2 → Herbe concentrée (vaut 2× dans les recettes)
Pierre ×2 → Pierre taillée (donne ATK+1 bonus dans craft arme)
Cristal ×2 → Cristal pur (ingrédient sorts nv.3)
Lavande ×2 → Lavande pure (ingrédient sorts avancés)
Sel ×2 → Sel raffiné (double l'effet des sorts de gel)
Graine ×2 → Graine rare (plante pousse 2× plus vite)

Artisane : 0% échec + 20% chance triple résultat
Ombre : 10% chance d'échec
Paladin : NE PEUT PAS fusionner

Interface :
┌──────────────────────────────────┐
│ 🔮 FUSION                       │
│                                  │
│ ┌────┐  +  ┌────┐  →  ┌────┐  │
│ │ ?  │     │ ?  │     │ !  │  │
│ └────┘     └────┘     └────┘  │
│                                  │
│ Tap un item de l'inventaire    │
│ puis tap l'autre slot.          │
│ Si 2 items identiques → fusionne│
└──────────────────────────────────┘
```


# ╔═════════════════════════════════════════════════════════╗
# ║  14. PUZZLE DE CRAFT (grille d'alignement)              ║
# ╚═════════════════════════════════════════════════════════╝

## 14.1 Le mini-jeu
```
Quand on craft un sort/arme/armure, un puzzle s'ouvre :

Artisane : grille 4×4 (16 cases)
Paladin : NE CRAFT PAS (il achète)
Ombre : grille 3×3 (9 cases), 10% échec

INTERACTION (TAP-TAP, pas drag) :
1. TAP un ingrédient en bas → sélectionné (contour doré)
2. TAP une case VIDE de la grille → l'ingrédient s'y place
3. TAP un ingrédient PLACÉ → retourne en bas
4. Objectif : aligner 3+ ingrédients IDENTIQUES
   (ligne, colonne ou diagonale)
5. Cases alignées BRILLENT (box-shadow doré, animation pulse)
6. [✨ Valider] → craft réussi si alignement correct
7. [↩️ Reset] → tout revient en bas
8. [❌ Annuler] → ferme sans crafter ni perdre les items

BONUS ARTISANE :
- Alignement 4+ = DOUBLE résultat
- Diagonale = sort/item de qualité+ (+1 stat)
- Tous ingrédients placés parfaitement = TRIPLE résultat

CUISINE = puzzle SIMPLE :
- Pas besoin d'aligner, juste placer tous les ingrédients
- Réussite automatique si tous placés
- L'Artisane peut placer plus vite (animation accélérée)

OUTILS SIMPLES (torche, piège) = PAS de puzzle, craft instantané
```


# ╔═════════════════════════════════════════════════════════╗
# ║  15. ÉCONOMIE (Sous provençaux ☀️)                      ║
# ╚═════════════════════════════════════════════════════════╝

## 15.1 Sources de revenus

```
POUR JISSE (Paladin) :
- Drop de monstres : nv × 2 ☀️ (±30%)
- Drop de demi-boss : 50-100☀️
- Drop de boss : 100-300☀️
- Coffres de donjon : 20-50☀️
- Quêtes : 20-100☀️

POUR MÉLANIE (Artisane) :
- Vente à Jisse : prix fixés par elle
- Quêtes craft : 30-80☀️
- Nuisibles zone safe : 1-3☀️ chacun
- Quêtes secondaires : 20-50☀️

DÉPART :
- Paladin : 50☀️
- Artisane : 100☀️ (investissement commerce)
- Ombre : 75☀️
```

## 15.2 Prix indicatifs
```
MÉLANIE VEND À JISSE :
(elle fixe ses prix, voici les suggestions)
- Potion : GRATUIT (toujours, c'est le deal du couple)
- Sort nv.1 : 30-50☀️
- Sort nv.2 : 80-120☀️
- Sort nv.3 : 200-300☀️
- Épée bois : 40☀️
- Épée fer : 80☀️
- Trident : 150☀️
- Lame Mistral : 500☀️
- Plat cuisiné : 15-30☀️
- Pierre rappel : 25☀️
- Torche : 5☀️

SHOPS VILLAGE (plus cher) :
- Potion : 15☀️ (chez Mel = gratuit)
- Torche : 10☀️ (chez Mel = 5☀️)
- Pain : 5☀️
- Herbes basiques : 3☀️
- Pierres : 5☀️
- Info PNJ : gratuit

SHOPS ÉVOLUENT PAR BIOME :
Garrigue : potions, torches, pain
Calanques : + premières armes basiques (cher !)
Mines : + armures basiques, sorts nv.1
Mer : + tout tier 3, potions+
Restanques : shop ultime (tout disponible, TRÈS cher)

Le joueur a TOUJOURS intérêt à acheter chez Mélanie.
Les shops sont le fallback quand Mélanie n'est pas connectée.
```

## 15.3 Quand l'autre n'est pas connecté
```
JISSE SEUL :
- La maison a un MARCHAND PNJ automatique (🤖)
- Le marchand vend ce que Mélanie a préparé et mis au comptoir
- Si rien au comptoir → le marchand vend des potions basiques (cher)
- Jisse peut déposer au coffre pour Mélanie (elle verra quand elle se connecte)

MÉLANIE SEULE :
- Joue normalement (jardin, craft, nuisibles)
- Le coffre montre les dépôts de Jisse (s'il s'est connecté avant)
- Elle prépare les items pour Jisse et les met au comptoir
- Quand Jisse se connecte → il trouve tout prêt
```

## 15.4 Mort = perte de Sous
```
Mort → perte de 10% des Sous (arrondi inf, minimum 0)
Respawn maison + PV 50% + fatigue 2min
Les Sous perdus DISPARAISSENT (pas récupérables)
Ça force le joueur à ne pas foncer tête baissée chez le boss
```
