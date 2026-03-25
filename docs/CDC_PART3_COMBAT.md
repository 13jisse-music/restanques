# ═══════════════════════════════════════════════════════════════
# RESTANQUES — CDC PARTIE 3/5 : COMBAT + SORTS + SPELLBOOK
# ═══════════════════════════════════════════════════════════════


# ╔═════════════════════════════════════════════════════════╗
# ║  8. COMBAT PUYO PUYO (vs créatures normales + demi-boss)║
# ╚═════════════════════════════════════════════════════════╝

## 8.1 Déclenchement
Collision joueur/monstre OU tap sur monstre adjacent.
Transition : flash blanc 100ms → fondu noir 300ms → écran combat.

## 8.2 Layout Puyo Puyo (2 écrans)
```
┌──────────────────────────────────┐
│ 🎸 Jisse      ⚔️     🐀 Rat    │
│ ██████░ 12/15       ████░ 5/8   │
│ ☀️ Jour — sorts lumière +50%    │
│                                  │
│ ┌──────────┐    ┌──────────┐   │
│ │ MA GRILLE│    │SA GRILLE │   │
│ │  6 col   │    │ 6 col    │   │
│ │  12 lig  │    │ (preview)│   │
│ │          │    │ petite   │   │
│ │ pièces   │    │          │   │
│ │ tombent  │    │          │   │
│ └──────────┘    └──────────┘   │
│                                  │
│ [🌫️][🛡️][⚡]  [🧪Pot]  [🏃]  │
│  sorts          potion    fuir  │
└──────────────────────────────────┘
```

Ma grille = 70% largeur. Grille adverse = 30% (preview).

## 8.3 Mécanique Puyo Puyo

```
PIÈCES QUI TOMBENT :
- Des paires de gemmes colorées (2 gemmes collées) tombent depuis le haut
- 6 couleurs : 💜 lavande, 🟢 olive, 🔴 rubis, 🔵 saphir, 🟡 soleil, 🟠 ocre
- PARFOIS (10%) une ressource spéciale tombe (emoji du biome)
  → si récupérée dans un combo = bonus dégâts + la ressource est gardée !

CONTRÔLES :
- Swipe gauche/droite : déplace la paire horizontalement
- Swipe bas : accélère la chute
- Tap : tourne la paire (rotation 90°)
- Les pièces se posent quand elles touchent le fond ou une autre pièce

MATCHES :
- 4+ gemmes de même couleur CONNECTÉES (adjacentes, pas en ligne) = match
- Les gemmes matchées DISPARAISSENT
- Les gemmes au-dessus TOMBENT (gravity)
- Si les nouvelles positions créent un nouveau match = COMBO

DÉGÂTS :
- Match simple (4 gemmes) = totalATK dégâts au monstre
- Match 5 gemmes = totalATK + 3
- Match 6+ gemmes = totalATK + 8
- Combo ×2 = dégâts × 1.5
- Combo ×3 = dégâts × 2.0
- Combo ×4+ = dégâts × 3.0 (!!)
- Rage Paladin (après combo ×3) : ATK × 1.5 pendant 2 tours

RESSOURCE SPÉCIALE (10% des pièces) :
- Au lieu d'une gemme, c'est un emoji de ressource du biome (🪵🌿💜🪨)
- Si cette pièce est incluse dans un match = bonus dégâts +5
- La ressource est ajoutée à l'inventaire après le combat

GAME OVER (pour le joueur) :
- Si les pièces atteignent le haut de ta grille = TU PERDS
- Le monstre aussi perd si SES pièces atteignent le haut

LE MONSTRE JOUE :
- Le monstre a SA propre grille (visible en petit à droite)
- Le monstre place des pièces automatiquement (IA simple)
- Ses combos t'envoient des GARBAGE (lignes grises en bas de ta grille)
  Chaque combo monstre = 1-3 lignes de garbage
- Les garbage ont 1 trou aléatoire (pour pouvoir les casser)

POUR LES NUISIBLES DE MÉLANIE (zone safe) :
- Même mécanique mais :
- Les pièces tombent plus lentement (1.5× plus lent)
- Le monstre fait moins de combos (IA plus simple)
- Les garbage sont plus petits (1 ligne max)
```

## 8.4 Puyo — Combat de l'Artisane (zone safe)
```
Nuisibles de la zone safe de Mélanie :
- 🐛 Chenille (nv.1, HP 4, ATK 1, drop: Graine)
- 🐌 Escargot (nv.1, HP 5, ATK 1, drop: Herbe)
- 🪲 Scarabée (nv.2, HP 6, ATK 2, drop: Branche)
- 🐸 Grenouille (nv.2, HP 7, ATK 2, drop: Graine rare)

Pièces tombent 50% plus lentement que pour Jisse.
Monstres font moins de garbage.
Parfait pour farmer des graines et des ressources basiques.
```


# ╔═════════════════════════════════════════════════════════╗
# ║  9. COMBAT MATCH-3 DOUBLE GRILLE (vs BOSS)             ║
# ╚═════════════════════════════════════════════════════════╝

## 9.1 Déclenchement
Entrée dans la forteresse du boss (après vérification de la clé).
Transition épique : flash blanc → shake écran → fondu → combat.
🎵 boss.mp3

## 9.2 Layout Boss (2 grilles Match-3)
```
┌──────────────────────────────────┐
│ 🎸 Jisse Nv.5    🐗 Sanglier   │
│ ████████░ 12/15   ██████ 45/60  │
│ ☀️ Jour                        │
│                                  │
│ ┌────────────┐ ┌────────────┐  │
│ │ MA GRILLE  │ │ SA GRILLE  │  │
│ │   6×7      │ │   6×7      │  │
│ │ match-3    │ │ match-3    │  │
│ │ (je swap)  │ │ (il swap)  │  │
│ └────────────┘ └────────────┘  │
│                                  │
│ [🌫️][🛡️][⚡]  [🧪Pot]  [🏃] │
└──────────────────────────────────┘
```

## 9.3 Mécanique Boss Match-3

```
2 GRILLES SIMULTANÉES :
- Ta grille (6×7) : tu swapes les gemmes
- Sa grille (6×7) : le boss swap automatiquement (IA)
- Les deux jouent EN MÊME TEMPS (pas tour par tour !)
- Chaque match dans TA grille = dégâts au boss
- Chaque match dans SA grille = dégâts à toi

DÉGÂTS :
Match 3 = totalATK
Match 4 = totalATK + 3
Match 5+ = totalATK + 8
Combo ×2 = × 1.5, ×3 = × 2.0

L'IA DU BOSS :
- Swap toutes les 2 secondes (le joueur peut swaper à tout moment)
- Le boss a des CAPACITÉS SPÉCIALES toutes les 15s :
  Sanglier : "Charge !" → dégâts ATK × 2 au prochain match
  Mouette : "Cri !" → inverse 2 colonnes de ta grille
  Tarasque : "Carapace !" → réduit tes dégâts de 50% pendant 10s
  Kraken : "Encre !" → cache 3 colonnes de ta grille pendant 5s
  Mistral : "Tempête !" → mélange TOUTE ta grille + dégâts directs

BOSS COOP (2 joueurs) :
- Boss HP × 1.5
- Les 2 joueurs ont CHACUN leur grille (3 grilles en tout !)
- Tour par tour alternés (Joueur 1 → Boss → Joueur 2 → Boss)
- L'Artisane peut utiliser Festin pour soigner le Paladin
- Le boss attaque celui qui fait le plus de dégâts (aggro)
```

## 9.4 Gemmes (CSS, identiques pour Puyo et Match-3)
```css
6 couleurs avec gradient + brillance :
💜 Lavande : radial-gradient(circle at 30% 30%, #C4A0FF, #6B4EAE)
🟢 Olive :   radial-gradient(circle at 30% 30%, #A0D860, #4A6E1F)
🔴 Rubis :   radial-gradient(circle at 30% 30%, #FF7070, #A92F2F)
🔵 Saphir :  radial-gradient(circle at 30% 30%, #70B0FF, #2A60A9)
🟡 Soleil :  radial-gradient(circle at 30% 30%, #FFE070, #C4A01F)
🟠 Ocre :    radial-gradient(circle at 30% 30%, #FFB050, #B64E02)

Taille : 36×36px (Puyo), 44×44px (Match-3 boss)
+ pseudo-element ::before ovale blanc (brillance)
+ box-shadow pour le relief
```

## 9.5 Animations combat
```css
@keyframes gemMatch { 0% { scale:1; opacity:1 } 50% { scale:1.3; rotate:10deg } 100% { scale:0; opacity:0 } }
@keyframes gemFall { 0% { translateY: var(--from) } 80% { translateY:0 } 90% { translateY:-3px } 100% { translateY:0 } }
@keyframes screenShake { 10% { translate:-4px,2px } 20% { translate:4px,-2px } ... }
@keyframes damageFloat { 0% { translateY:0; opacity:1 } 100% { translateY:-40px; opacity:0 } }
@keyframes comboText { 0% { scale:0 } 50% { scale:1.3 } 100% { scale:1; opacity:0 } }

Combo visible : "COMBO ×2 !" en gros jaune 32px au centre (800ms)
Dégâts infligés : texte jaune "+8 💥" flotte au-dessus du monstre
Dégâts reçus : texte rouge "-5 ❤️" flotte + shake écran + flash rouge
```

## 9.6 Victoire / Défaite
```
VICTOIRE (Puyo ou Boss) :
- Monstre explose (scale→0, 500ms)
- "+{xp} XP" flotte, "☀️+{sous}" flotte
- "Butin : 🌿×2, 🪵×1" notification 3s
- AUTO-CLOSE en 2s — PAS de bouton
- Ajout au bestiaire si nouveau monstre
- Retour carte

DÉFAITE :
- Écran rouge 💀 (1.5s)
- AUTO-RESPAWN maison — PAS de bouton "Retenter"
- PV 50%, fatigue 2min, perte 10% Sous ☀️
- Si en donjon → sortie auto du donjon PUIS respawn maison

PvP ARÈNE :
- Même Puyo Puyo mais vs l'autre joueur
- Pas de mort permanente, gagnant +50XP, perdant +20XP
```


# ╔═════════════════════════════════════════════════════════╗
# ║  10. SPELLBOOK + 14 SORTS ÉVOLUTIFS                     ║
# ╚═════════════════════════════════════════════════════════╝

## 10.1 Sorts — 14 sorts avec 3 niveaux chacun

Craftés par l'Artisane au SALON (puzzle craft grille 4×4).
3 slots équipables par joueur. 1 utilisation par sort par combat.

```
TIER 1 — GARRIGUE (recettes : ressources de base)
🌫️ Brume
  Nv1: Efface 1 couleur. Craft: Lavande×3 + Herbe×2
  Nv2: Efface 1 couleur + 3 dégâts. Craft: Lavande×5 + Herbe×3 + Miel×1
  Nv3: Efface 2 couleurs. Craft: Lavande pure×3 + Herbe conc.×2 + Miel×2

🛡️ Bouclier
  Nv1: Skip 1 tour ennemi. Craft: Pierre×3 + Herbe×2
  Nv2: Skip 1 tour + DEF+2 permanent ce combat. Craft: Pierre×5 + Fer×2
  Nv3: Skip 2 tours. Craft: Pierre taillée×3 + Fer×3 + Cristal×1

TIER 2 — CALANQUES
🌊 Marée
  Nv1: +5 dégâts prochain match. Craft: Coquillage×3 + Sel×2
  Nv2: +8 dégâts. Craft: Coquillage×5 + Sel×3 + Corail×1
  Nv3: +12 dégâts + soigne 3 PV. Craft: Perle×2 + Corail×3

❄️ Gel
  Nv1: Bloque 2 colonnes 2 tours (double si matchées). Craft: Sel×3 + Coquillage×2
  Nv2: Bloque 3 colonnes. Craft: Sel×5 + Cristal×1
  Nv3: Bloque 3 colonnes + gèle l'ennemi 1 tour. Craft: Cristal pur×2 + Sel×5

🍖 Festin
  Nv1: Soigne 5 PV. Craft: Herbe fraîche×2 + Pain×1
  Nv2: Soigne 8 PV. Craft: Herbe fraîche×3 + Poisson×2
  Nv3: Soigne 12 PV + enlève debuff. Craft: Champignon×2 + Baies×3

TIER 3 — MINES
⚡ Éclat
  Nv1: Dégâts directs ATK+MAG+3. Craft: Cristal×2 + Sel×2
  Nv2: ATK+MAG+6. Craft: Cristal×3 + Ocre×2
  Nv3: ATK+MAG+10 + stun 1 tour. Craft: Cristal pur×2 + Ocre×3

🔥 Brasier
  Nv1: -2 PV/tour pendant 3 tours (DOT). Craft: Branche×3 + Ocre×2
  Nv2: -3 PV/tour. Craft: Branche×5 + Ocre×3 + Fer×2
  Nv3: -4 PV/tour + ATK ennemi -1. Craft: Ocre×5 + Cristal×2

🔄 Confusion
  Nv1: Ennemi s'auto-attaque 1 tour. Craft: Champignon×2 + Lavande pure×1
  Nv2: 2 tours. Craft: Champignon×3 + Lavande pure×2
  Nv3: 2 tours + ennemi perd 1 ligne de sa grille. Craft: Champignon magique×2

TIER 4 — MER
💥 Séisme
  Nv1: Mélange toute la grille. Craft: Pierre×4 + Fer×3 + Ocre×2
  Nv2: Mélange + 5 dégâts. Craft: Pierre taillée×3 + Fer×4
  Nv3: Mélange + 10 dégâts + crée 3 matchs garantis. Craft: Cristal pur×3

🪞 Miroir
  Nv1: Renvoie 50% dégâts 2 tours. Craft: Cristal×2 + Perle×1
  Nv2: 75% dégâts. Craft: Cristal×3 + Perle×2
  Nv3: 100% dégâts 2 tours. Craft: Cristal pur×2 + Perle×3

💀 Malédiction
  Nv1: Ennemi -1 ATK permanent. Craft: Ocre×2 + Corail×1
  Nv2: -2 ATK. Craft: Ocre×3 + Corail×2 + Venin×1
  Nv3: -3 ATK + -1 DEF. Craft: Venin×2 + Corail×3 + Perle×1

TIER 5 — RESTANQUES
☀️ Lumière
  Nv1: Dégâts ×2 si JOUR. Craft: Lavande pure×3 + Cristal×2
  Nv2: ×2.5. Craft: Lavande pure×5 + Cristal pur×2
  Nv3: ×3 + soigne 5 PV. Craft: Lavande pure×5 + Cristal pur×3 + Perle×2

🌙 Ombre sort
  Nv1: Dégâts ×2 si NUIT. Craft: Champignon×3 + Corail×2
  Nv2: ×2.5. Craft: Champignon magique×2 + Corail×3
  Nv3: ×3 + invisible 1 tour. Craft: Champignon magique×3 + Perle noire×2

⏳ Ralentissement
  Nv1: Ennemi joue 1 tour/2 pendant 3 tours. Craft: Sel×3 + Cristal×1
  Nv2: 4 tours. Craft: Sel×5 + Cristal×2
  Nv3: 5 tours + ennemi -20% dégâts. Craft: Cristal pur×2 + Perle×2
```

## 10.2 Bonus jour/nuit sur les sorts
```
JOUR (☀️) :
  ☀️ Lumière : effet principal
  🔥 Brasier : +1 DOT/tour
  ⚡ Éclat : +2 dégâts
  🛡️ Bouclier : dure 1 tour de plus

NUIT (🌙) :
  🌙 Ombre sort : effet principal
  💀 Malédiction : double l'effet (-2/-4/-6 ATK)
  🔄 Confusion : +1 tour
  🌫️ Brume : efface 1 couleur de plus

CRÉPUSCULE / AUBE :
  TOUS les sorts : +50% efficacité
```

## 10.3 Spellbook (consultable)
```
┌──────────────────────────────────┐
│ 📖 GRIMOIRE          ❌ fermer  │
│                                  │
│ ── SORTS POSSÉDÉS ──            │
│ 🌫️ Brume Nv.2 ████████░ 2/3   │ ← barre de progression vers nv3
│   [Équiper slot 1/2/3]         │
│ 🛡️ Bouclier Nv.1 ████░░░ 1/3  │
│   [Équiper slot 1/2/3]         │
│                                  │
│ ── À DÉCOUVRIR ──               │
│ ❄️ ??? — Sel×3 + Coquillage×2  │ ← recette visible
│ ⚡ ??? — Cristal×2 + Sel×2     │ ← grisé
│ 🔥 ??? — Branche×3 + Ocre×2   │
│ ...                             │
│                                  │
│ "Craftez au Salon pour          │
│  découvrir de nouveaux sorts !" │
└──────────────────────────────────┘

Pour ÉVOLUER un sort (nv1→nv2→nv3) :
- L'Artisane refait le puzzle craft avec les ingrédients du nv suivant
- Le sort évolue + animation sparkle "⬆️ Brume Nv.2 !"
```
