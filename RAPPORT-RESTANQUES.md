# RAPPORT RESTANQUES — État au 24 mars 2026

## Le projet
**Restanques** — jeu web coopératif 2 joueurs (Jisse 🎸 + Mélanie 🎨) sur mobile.
Thème provençal : exploration carte 200×200, craft, combat match-3, villages, quêtes.
Multijoueur temps réel via Supabase Realtime.

**URL live** : https://restanques.vercel.app
**Code** : /c/tmp/restanques (18 commits, ~1550 lignes de code)
**Vercel** : projet `restanques`, compte 13jisse-music

---

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Supabase** : BDD + Realtime
  - URL : `https://omivxkzvzfobylgjscvx.supabase.co`
  - Anon key : `eyJhbGci...2V-aO_8jz0ki8sCf4poA3IYuyokFMwyQn2y8MwWWNMA`
  - Service role : `eyJhbGci...r931uHoftu6ZqWzCrXZcs3EvnCWk7KM7hipOLBdQ8-o`
  - DB direct : `aws-1-eu-central-1.pooler.supabase.com:5432`, user `postgres.omivxkzvzfobylgjscvx`, mdp `Yourbanlt300!`
- **Sons** : Web Audio API (zéro fichier audio)
- **Sprites** : ChatGPT pixel art (découpés par sharp en grilles 64×64) + Pixel Crawler Free Pack (mobs animés)
- **Rendu terrain** : CSS pur (couleurs par biome) — les sprites de sol ne marchent PAS (pas seamless)

---

## Fichiers (1548 lignes total)
```
app/
  page.tsx (93)               — Écran titre : poster plein écran, fade-in, boutons dorés
  layout.tsx                  — Meta + viewport + fullscreen PWA tags
  globals.css                 — Reset CSS
  lib/
    constants.ts (206)        — Données du jeu : 14 ressources, 5 outils, 6 cartes, 5 gardiens, 7 quêtes, 8 villages, 5 biomes, types TS, stats RPG
    supabase.ts               — Client Supabase
    match3.ts (64)            — Moteur match-3 : createGrid (6×7), findMatches, swapGems, applyGravity
    world.ts (135)            — Génération monde 200×200 déterministe (seeded PRNG)
    sounds.ts (98)            — 10 sons + musique explore/combat (Web Audio)
    sprites.ts (132)          — Système sprites : playerSprite, mobSprite, monsterSprite, gemSprite, itemSprite, natureSprite, bonfireSprite, npcSprite, buildingSprite
  game/
    page.tsx (820)            — LE JEU COMPLET
public/
  splash.png                  — Poster pixel art provençal (1024×1536)
  sprites/
    game/                     — ChatGPT sprites découpés par sharp (grilles régulières 64×64)
      jisse.png (256×192)     — Jisse 4×3 (4 frames × 3 directions)
      melanie.png (256×192)   — Mélanie 4×3
      monsters.png (320×64)   — 5 monstres en ligne (fond nettoyé)
      gems.png (384×64)       — 6 gemmes en ligne (fond nettoyé)
      items.png (256×256)     — 16 items 4×4
      tools.png (320×64)      — 5 outils en ligne
      nature.png (256×64)     — 4 éléments (chêne, sapin, rocher, buisson)
      buildings.png (288×192) — 6 bâtiments 3×2
      tiles.png (384×320)     — 30 tiles sol 6×5 (NON UTILISÉ — pas seamless)
      icons.png (448×64)      — 7 icônes menu
    mobs/                     — Pixel Crawler mob sprites (idle 32×32, run 64×64)
      orc-idle.png, orc-run.png, warrior-*, shaman-*, rogue-*, mage-*, skeleton-*
    player/                   — Pixel Crawler player sprites (walk/idle 64×64)
      walk-down.png, walk-side.png, walk-up.png, idle-down.png, idle-side.png, idle-up.png
    env/                      — Pixel Crawler environment
      bonfire.png (feu animé 64×384, 6 frames vertical)
    npcs/                     — Pixel Crawler NPCs (knight, rogue, wizzard — idle 128×32, 4 frames)
    chatgpt/                  — Images ChatGPT originales (non découpées, pour référence)
  process-sprites.js          — Script sharp qui découpe les images ChatGPT en grilles régulières
```

---

## Tables Supabase
```sql
game_sessions (id UUID PK, seed INT, collected_nodes JSONB, active BOOL, created_at TIMESTAMPTZ)
players (id UUID PK, session_id FK, name TEXT, emoji TEXT,
  x INT, y INT, hp INT, max_hp INT, lvl INT, xp INT,
  inventory JSONB, tools JSONB, cards JSONB,
  unlocked_biomes JSONB, bosses_defeated JSONB,
  chest JSONB DEFAULT '[]',              -- coffre 40 items
  stats JSONB DEFAULT '{"atk":1,"def":0,"mag":0,"vit":1}',  -- stats RPG
  updated_at TIMESTAMPTZ)
```
- RLS ouvert (jeu privé entre 2 joueurs)
- Realtime activé sur les 2 tables

---

## Ce qui FONCTIONNE ✅

### Carte & exploration
- Carte 200×200 avec 5 biomes (garrigue r=35, calanques r=30, mines r=30, mer r=35, restanques r=20)
- 155 nodes de ressources (45 garrigue, 35 calanques, 30 mines, 30 mer, 15 restanques)
- 40% des nodes gardés par un ennemi (combat obligatoire)
- 8 villages avec NPCs marchands (sprites Knight/Rogue/Wizzard animés)
- Portes entre biomes (nécessitent l'outil correspondant)
- Chemins tracés entre tous les biomes
- Rendu : CSS couleurs par biome + sprites en overlay (perso, mobs, items, arbres, rochers, bâtiments)
- Viewport responsive : CELL 24px mobile / 32px desktop
- Minimap

### Personnages (sprites ChatGPT)
- Jisse : jisse.png 4×3 grille (4 frames walk × 3 directions : down, side, up)
- Mélanie : melanie.png même format
- Animation marche : cycle 4 frames à 200ms, direction change avec le D-pad
- Side flippé horizontalement pour gauche (scaleX(-1))

### Ennemis mobiles
- Chaque gardien patrouille autour de son spawn (1 case / 1.5s, rayon 6)
- Mode chasse si joueur ≤ 3 cases (≤ 5 pour boss)
- ❗ rouge + tremblement + son d'alerte en mode chasse
- Collision joueur/ennemi = combat automatique
- Zone camp (5×5) = safe zone, ennemis interdits
- Sprites : Pixel Crawler mobs (idle 32×32 / run 64×64 selon état)
- Déplacement déterministe (seed+tick) pour synchro multijoueur

### Combat match-3
- Grille 6×7, 6 types de gemmes (sprites ChatGPT gems.png)
- Swap → match → gravity → cascade (récursif)
- Tours ennemis VISIBLES : shake monstre → bannière rouge → délai 800ms → shake joueur → dégâts
- Dégâts joueur = matchCount + combo×2 + ATK + MAG + bonus cartes
- Dégâts ennemi = ceil(enemyMaxHP/5) - shields - DEF (min 1)
- Portraits : sprite ChatGPT joueur + sprite ChatGPT monstre
- Potion utilisable en combat
- Musique combat (Web Audio bass+kick)

### Camp de base (position 50, 46)
- Zone safe 5×5
- Bouton 🏠 Camp → panneau 3 onglets :
  - 🛏️ Repos : PV restaurés
  - 📦 Coffre : 40 emplacements, tap pour transférer (sauvegardé Supabase colonne `chest`)
  - 🔨 Établi : recettes visuelles avec bouton "Forger" si ingrédients OK
- Feu de camp : bonfire Pixel Crawler animé (6 frames)

### Stats RPG
- 4 stats : ATK (1), DEF (0), MAG (0), VIT (1)
- Level up → popup choix : +1 ATK / +1 DEF / +1 MAG
- Fiche personnage 👤 : portrait sprite, stats, outils, cartes, boss vaincus
- Sauvegardé Supabase colonne `stats`

### Craft
- 5 outils : bâton (→calanques), pioche (→mines), filet (→mer), serpe, clé ancienne (→restanques)
- 6 cartes combat : brume, bouclier, éclat, festin, marée, séisme
- Craft dans l'établi du camp (recettes visuelles) OU dans le menu Craft mobile

### Inventaire
- Limite 20 items (pain/potion ne comptent pas)
- Items groupés par type avec compteur ×N
- Tap = jeter ×1
- Sprites ChatGPT items.png pour l'affichage

### Sons + Musique (Web Audio API)
- 10 effets : step, collect, gemMatch(combo), craft, hit, victory, locked, levelUp, unlock, enemyAlert
- Musique explore : drone La+Mi + arpège triangle La mineur
- Musique combat : bass sawtooth Mi mineur + kick
- Bouton 🔊/🔇

### Multijoueur Realtime
- Seed partagé → même carte
- Positions synchronisées (poll 1s + Realtime pour collected_nodes)
- L'autre joueur visible avec son sprite
- Sauvegarde complète auto (position, inv, tools, cards, zones, boss, chest, stats)

### UI
- Écran titre : poster plein écran, fade-in, boutons dorés, fondu noir
- Fond jeu : poster flouté (blur 20px, brightness 0.3)
- Panneaux parchemin (gradient + cadre bois)
- Top bar sombre + liseré doré + barre XP gradient
- D-pad compact + boutons Camp/Sac/Perso/Quêtes
- Tutoriel 7 étapes + bouton ❓
- Fullscreen au premier tap + PWA meta tags

---

## Ce qui NE MARCHE PAS / À AMÉLIORER 🔧

### 1. TILES DE SOL (priorité haute)
**Problème** : les sprites de sol ChatGPT (tiles.png) ne sont PAS seamless — bandes blanches entre les tiles.
**État actuel** : CSS couleurs pures (ça marche bien mais c'est basique).
**Solution** : soit régénérer les tiles avec un prompt spécifiant "seamless tileable", soit utiliser un vrai tileset seamless (ex: Kenney mais avec bon mapping), soit améliorer les CSS avec des textures (repeating-linear-gradient, noise patterns).

### 2. SPRITES NATURE DÉCALÉS (priorité moyenne)
**Problème** : les arbres/rochers/buissons du nature.png peuvent être légèrement décalés car les sprites originaux n'étaient pas parfaitement centrés dans la grille 4×1.
**Solution** : redécouper avec des bounding boxes plus précises, ou ajuster les offsets dans sprites.ts.

### 3. GEMMES PETITES (priorité moyenne)
**Problème** : après nettoyage du fond gris, les gemmes ont perdu leur glow et paraissent petites dans le cadre 64×64.
**Solution** : soit garder les gemmes CSS (radial-gradient) qui étaient plus grosses et plus visuelles, soit régénérer les gemmes sans fond.

### 4. SORTS ACTIFS EN COMBAT (non implémenté)
**Prévu dans le prompt** : les cartes de combat comme sorts utilisables (1x par combat) :
- Brume : efface toutes les gemmes d'une couleur
- Bouclier : annule le prochain tour ennemi
- Éclat : dégâts directs ATK+MAG
- Festin : soigne 5 PV
- Marée : +5 dégâts au prochain match
- Séisme : mélange la grille
**État** : les cartes donnent un bonus passif de dégâts, mais ne sont PAS des sorts actifs avec boutons.

### 5. ANIMATION DE DESTRUCTION DES GEMMES (non implémenté)
**Prévu** : scale(1.3) → rotation → opacity 0 → particules.
**État** : les gemmes disparaissent simplement.

### 6. ÉQUIPEMENT (non implémenté)
**Prévu** : les outils donnent des bonus de stats quand possédés (serpe ATK+2, pioche ATK+1, bâton DEF+1).
**État** : les outils débloquent les zones mais ne donnent pas de bonus de combat.

### 7. UI SPRITES (non intégré)
Les sprites ChatGPT d'UI existent (boutons, barres de vie, panneaux, D-pad, badges, bannières) mais ne sont PAS intégrés dans le jeu.
Fichiers disponibles :
- 23_45_30.png : boutons colorés + slots inventaire + grand cadre parchemin
- 23_45_51.png : barres de vie/XP/mana + icônes (coeur, étoile, bouclier, épée, botte, potion)
- 23_49_19.png : D-pad en pierre + 4 boutons ronds (épée, sac, parchemin, maison)
- 23_49_23.png : bannière scroll + bulle dialogue + 4 badges (!, i, ✓, ⚠)
- 23_47_20.png : 7 icônes menu (sac, combat, craft, quêtes, maison, carte, aide) — fond nettoyé

### 8. GITHUB (pas pushé)
- Compte : `restanques-lejeu-create` (restanques.lejeu@gmail.com / Yourbanlt300!)
- Repo créé mais vide — il faut un Personal Access Token pour push

### 9. PERFORMANCE CARTE 200×200
- La génération est OK (PRNG déterministe)
- Le rendu ne montre que le viewport → OK
- Les ennemis mobiles (155 nodes × tick 1.5s) = potentiel lag si beaucoup actifs simultanément

---

## Architecture code — points clés

### game/page.tsx (820 lignes)
- ~35 useState hooks
- Refs anti-stale-closure : `cardsRef`, `hpRef`, `maxHpRef` (critiques pour combat)
- CELL dynamique : `window.innerWidth < 500 ? 24 : 32`
- `spriteFrame` : incrémenté toutes les 200ms (setInterval) pour animer tous les sprites
- Ennemis mobiles : `enemyPositions` state + setInterval 1.5s + `checkEnemyCollision`
- Combat : `selectGem` → `processMatchesFromState` (récursif cascades) → tour ennemi setTimeout 800ms
- Camp : `campPanel` state ("rest"/"chest"/"craft") avec 3 onglets
- Stats : `stats` state {atk,def,mag,vit} + `levelUpChoice` popup
- Tutoriel : `tutoStep` state (-1 à 6) + localStorage
- Musique : `sounds.playExploreMusic()` au init, switch `playCombatMusic()` en combat

### sprites.ts (132 lignes)
- `fromSheet(src, cols, col, row, cellSize, displaySize, flipX)` : helper générique
- `playerSprite(name, dir, frame, size)` : jisse.png/melanie.png 4×3×64
- `mobSprite(biome, chasing, frame, size)` : Pixel Crawler idle/run
- `monsterSprite(biome, size)` : ChatGPT monsters.png 5×1×64
- `gemSprite(idx, size)` : ChatGPT gems.png 6×1×64
- `itemSprite(id, size)` : ChatGPT items.png 4×4×64
- `natureSprite(variant, size)` : ChatGPT nature.png 4×1×64
- `bonfireSprite(frame, size)` : Pixel Crawler vertical 64×384
- `npcSprite(villageIdx, frame, size)` : Pixel Crawler knight/rogue/wizzard
- `tileSpriteStyle()` : retourne TOUJOURS null (désactivé, CSS pur)

### world.ts (135 lignes)
- `genWorld(seed)` : PRNG `makeRng(seed)`, carte 200×200
- Place biomes (centre + rayon), chemins, portes, 8 villages, 155 nodes, 5 boss, camp
- Camp à (50, 46)

### sounds.ts (98 lignes)
- 10 effets + `playExploreMusic()` + `playCombatMusic()` + `stopMusic()`
- Explore : drone La+Mi (oscillators persistants) + arpège (setInterval 800ms)
- Combat : bass sawtooth + kick (setInterval 300ms)

---

## Pour continuer

### Déployer
```bash
cd /c/tmp/restanques && npx vercel --prod --yes
```

### Reset une partie
Bouton "🔄 Nouvelle partie" sur l'écran titre.

### Ajouter une feature
1. Modifier les fichiers dans `app/`
2. `npx next build` pour vérifier
3. `git add -A && git commit -m "message" && npx vercel --prod --yes`

### Regénérer les sprites ChatGPT
```bash
node process-sprites.js
```
Les images sources sont dans `public/sprites/chatgpt/`, les résultats dans `public/sprites/game/`.

### Variables d'env Vercel (déjà configurées)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
