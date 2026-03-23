# RAPPORT RESTANQUES — État au 23 mars 2026, 22h30

## Le projet en bref
**Restanques** — jeu web coopératif 2 joueurs (Jisse 🎸 + Mélanie 🎨) sur mobile.
Thème provençal : exploration carte 50×50, craft, combat match-3, villages, quêtes.
Les 2 joueurs voient la même carte en temps réel via Supabase Realtime.

**URL live** : https://restanques.vercel.app
**Code** : /c/tmp/restanques (12 commits, ~1260 lignes de code)

---

## Stack technique
- **Next.js 14** (App Router) + TypeScript
- **Supabase** : base de données + Realtime (tables `game_sessions` + `players`)
- **Vercel** : déploiement (projet `restanques`, compte 13jisse-music)
- **Sons** : Web Audio API (zéro fichier audio, tout généré en JS)
- **Sprites** : Kenney CC0 (Tiny Town 192×176 + Tiny Dungeon 192×176 + Micro Roguelike 128×80) — NON UTILISÉS actuellement pour le rendu, gardés en `/public/sprites/` pour usage futur
- **Rendu actuel** : CSS pur (couleurs par biome + emojis) — c'est ce qui marche le mieux sur mobile

## Supabase
- URL : `https://omivxkzvzfobylgjscvx.supabase.co`
- Anon key : `eyJhbGci...2V-aO_8jz0ki8sCf4poA3IYuyokFMwyQn2y8MwWWNMA`
- Service role key : `eyJhbGci...r931uHoftu6ZqWzCrXZcs3EvnCWk7KM7hipOLBdQ8-o`
- DB direct : host `aws-1-eu-central-1.pooler.supabase.com:5432`, user `postgres.omivxkzvzfobylgjscvx`, password `Yourbanlt300!`
- Tables : `game_sessions` (id, seed, collected_nodes JSONB, active) + `players` (id, session_id, name, emoji, x, y, hp, max_hp, lvl, xp, inventory, tools, cards, unlocked_biomes, bosses_defeated)
- RLS ouvert (jeu privé)
- Realtime activé sur les 2 tables

## GitHub
- Compte : `restanques-lejeu-create` (restanques.lejeu@gmail.com / Yourbanlt300!)
- Repo créé mais PAS encore pushé (auth GitHub non configurée — il faut créer un Personal Access Token)
- Le code est uniquement local dans /c/tmp/restanques et déployé sur Vercel

---

## Structure des fichiers (1262 lignes total)
```
app/
  page.tsx (93 lignes)            — Écran titre : poster plein écran, fade-in, boutons dorés, fondu noir → /game
  layout.tsx                      — Meta + viewport mobile + font Courier New
  globals.css                     — Reset CSS + tap highlight
  lib/
    constants.ts (194 lignes)     — TOUTES les données du jeu : 14 ressources, 5 outils, 6 cartes combat, 5 gardiens, 7 quêtes, 4 villages, 5 biomes, types TypeScript
    supabase.ts                   — Client Supabase (3 lignes)
    match3.ts (64 lignes)         — Moteur match-3 : createGrid (6×7), findMatches, swapGems, applyGravity
    world.ts (129 lignes)         — Génération monde déterministe (seeded PRNG 50×50) : biomes, chemins, portes, villages, nodes, boss, camp
    sounds.ts (67 lignes)         — 10 sons Web Audio API (step, collect, gemMatch, craft, hit, victory, locked, levelUp, unlock, enemyAlert)
    sprites.ts (65 lignes)        — Mapping Kenney tiles (NON UTILISÉ actuellement dans le rendu)
  game/
    page.tsx (650 lignes)         — LE JEU COMPLET : état, Supabase sync, mouvement, combat match-3, craft, shop, inventaire, quêtes, rendu carte, ennemis mobiles, UI
public/
  splash.png                     — Poster du jeu (1024×1536, magnifique pixel art provençal)
  sprites/
    town.png                     — Kenney Tiny Town (192×176, 12×11 grid 16×16)
    dungeon.png                  — Kenney Tiny Dungeon (192×176, 12×11 grid 16×16)
    roguelike.png                — Kenney Micro Roguelike (128×80, 16×10 grid 8×8)
```

---

## Ce qui FONCTIONNE ✅

### Gameplay complet
- Carte 50×50 avec 5 biomes (garrigue, calanques, mines, mer, restanques)
- 14 ressources récoltables (branche, herbe, lavande, pierre, coquillage, sel, fer, ocre, cristal, poisson, perle, corail, pain, potion)
- 5 outils craftables (bâton → calanques, pioche → mines, filet → mer, serpe, clé → restanques)
- 6 cartes de combat craftables (brume, bouclier, éclat, festin, marée, séisme)
- 4 villages avec troc
- 7 quêtes avec XP et montée de niveau (+3 PV max par level)
- 5 boss gardiens + boss final Le Mistral (30 PV)
- Camp de base 🔥 qui restaure tous les PV
- Limite sac 20 items (pain/potion ne comptent pas)
- Livre de recettes dans l'atelier (outils + cartes listés lisiblement)
- Inventaire groupé par type avec compteur ×N

### Combat match-3
- Grille 6×7, 6 types de gemmes (CSS gradients avec brillance, pas des emojis basiques)
- Swap → match → gravity → cascade (combos)
- Tours ennemis VISIBLES : après le match du joueur → monstre tremble → bannière rouge "🐗 Sanglier charge !" → délai 800ms → joueur tremble → dégâts affichés → "Ton tour !"
- Cartes de combat actives en bonus passif
- Potion utilisable en combat
- Victoire : loot (ressource + bonus aléatoire du biome) + XP
- Défaite : respawn avec PV réduits

### Ennemis mobiles (NOUVEAU)
- Chaque gardien patrouille autour de son spawn (1 case / 1.5s, rayon 6 cases)
- Mode chasse : si joueur à ≤3 cases (≤5 pour boss), l'ennemi fonce vers le joueur
- ❗ rouge + tremblement + son d'alerte quand un ennemi chasse
- Collision joueur/ennemi = combat automatique
- Déplacement déterministe (seed+tick) pour synchro multijoueur approximative
- Ennemis vaincus disparaissent

### Multijoueur Realtime
- Seed partagé → même carte pour les 2 joueurs
- Positions synchronisées (poll 1s + Supabase Realtime pour collected_nodes)
- L'autre joueur visible sur la carte (cercle rose)
- Sauvegarde automatique de tout l'état (position, inventaire, outils, cartes, zones, boss)

### UI
- Écran titre : poster plein écran avec fade-in, boutons dorés, fondu noir
- Fond de jeu : poster flouté (blur 20px, brightness 0.3)
- Panneaux style parchemin (gradient #F5ECD7 → #E8D5A3, cadre bois #5C4033)
- Boutons dégradés avec ombres
- Top bar sombre avec liseré doré, barre XP gradient
- Cadre carte avec ombre intérieure
- D-pad compact (42×42)
- Responsive : CELL 24px mobile / 32px desktop

### Sons Web Audio
- 10 sons générés en JS pur (zéro fichier) : pas, récolte, match gemme (pitch monte avec combo), craft, dégât, victoire, porte verrouillée, level up, zone débloquée, alerte ennemi
- Bouton 🔊/🔇

---

## Ce qui NE MARCHE PAS / À AMÉLIORER 🔧

### 1. SPRITES PERSONNAGES (priorité haute)
**Problème** : Jisse et Mélanie sont des cercles colorés avec emoji (🎸🎨). Pas de vrais sprites.
**Impact** : le jeu n'a pas l'air "fini" visuellement.
**Solution** :
- Sprites 16×16 ou 32×32 avec 4 directions + animation de marche (4 frames)
- Le pack Anokolisa (itch.io, gratuit) a 3 héros avec marche 4 dirs — parfait
- Fichier à modifier : `app/game/page.tsx` lignes ~600 (le rendu `isP` dans la carte)
- Alternative : découper les sprites ChatGPT existants (dans `C:\Users\ecole\Downloads\restanques\chars-idle.png` etc.) dans Photopea

### 2. SPRITES MONSTRES (priorité haute)
**Problème** : les monstres sont des emojis (🐗🦅🐉🐙🌪️). Ça marche mais manque d'impact.
**Impact** : les ennemis mobiles seraient beaucoup plus immersifs avec de vrais sprites animés.
**Solution** :
- Sprites 16×16 ou 32×32 avec animation idle (2 frames, bounce)
- Anokolisa a 8 ennemis différents
- Le Kenney Micro Roguelike (`roguelike.png`) a aussi des monstres en 8×8 (scalables)
- Fichier : `app/game/page.tsx` rendu des mobileEnemyNode dans la carte + combat

### 3. GEMMES MATCH-3 (priorité moyenne)
**État actuel** : CSS gradients avec brillance — déjà bien mieux que les emojis.
**Manque** :
- Animation de destruction (actuellement elles disparaissent juste)
- Particules lors de la destruction
- Flash de combo visible
- Les gemmes pourraient être encore plus grosses sur mobile

### 4. ARBRES ET DÉCORS (priorité moyenne)
**Problème** : les arbres 🌳, rochers 🪨, fleurs 🌸💜 sont des emojis — ça casse l'immersion.
**Solution** :
- Sprites d'arbres/rochers/fleurs depuis Kenney ou Anokolisa
- Les sols CSS sont bien (couleurs riches par biome), ne pas les changer
- Juste remplacer les emoji de décor par des sprites

### 5. UI COMBAT (priorité moyenne)
**Problème** : le fond du combat est un panneau parchemin simple. Pas d'ambiance.
**Solution** :
- Fond de combat qui change selon le biome (gradient vert garrigue, bleu mer, brun mines)
- Portrait du personnage et du monstre avec sprites (pas emoji)
- Animation d'attaque du monstre (le sprite avance vers le joueur puis recule)

### 6. SONS (priorité basse — déjà fonctionnel)
**Manque** :
- Musique de fond (ambient loop) — pourrait être généré avec Web Audio (drone + arpège lent)
- Son différent par type de gemme
- Son de pas différent par biome (herbe vs pierre vs sable)

### 7. PERFORMANCE (attention)
- La carte 50×50 ne rend que le viewport visible (OK)
- Les ennemis mobiles font un setInterval à 1.5s avec mise à jour de state → pourrait lag si beaucoup d'ennemis. Actuellement ~50 ennemis max → ça tient.
- Le poll de l'autre joueur (1 requête Supabase / seconde) pourrait être remplacé par du Realtime pur

### 8. GITHUB (à faire)
- Le repo `restanques-lejeu-create/restanques-lejeu-create` est créé mais vide
- Il faut créer un Personal Access Token (PAT) sur github.com → Settings → Developer settings → Tokens → Generate
- Puis : `git remote add origin https://TOKEN@github.com/restanques-lejeu-create/restanques-lejeu-create.git && git push -u origin master`

### 9. SPRITES CHATGPT (ressource existante non utilisée)
16 images pixel art dans `C:\Users\ecole\Downloads\restanques\` :
- `chars-idle.png` (1536×1024) : Jisse + Mélanie, 4 directions idle
- `chars-walk1/2/3.png` : 3 frames de marche
- `tiles-garrigue/calanques/mines/mer/restanques.png` : tiles terrain 4×4
- `items.png` : 4×4 items
- `tools.png` : 5 outils
- `monsters.png` : 4 monstres (sanglier, aigle, tarasque, mistral)
- `gems.png` : 6 gemmes
- `ui.png` : barres de vie, cadres, boutons
- `villages.png` : 4 bâtiments
- `camp.png` : camp de base

**Problème** : ce ne sont PAS des spritesheets régulières. Les sprites sont placés avec des espaces irréguliers et des fonds avec dégradé/glow. Pour les utiliser :
1. Ouvrir dans Photopea (photopea.com, gratuit)
2. Découper chaque sprite individuellement (baguette magique + supprimer fond)
3. Redimensionner en taille uniforme (32×32)
4. Exporter en PNG transparent
5. Assembler en spritesheet grille régulière

---

## Architecture code — comment ça marche

### game/page.tsx (le cœur — 650 lignes)
- Composant unique `GameContent` avec ~30 useState hooks
- **Refs anti-stale-closure** : `cardsRef`, `hpRef`, `maxHpRef` — critiques pour le combat match-3 car les setTimeout lisent les cards/hp via closure
- **CELL dynamique** : `const CELL = window.innerWidth < 500 ? 24 : 32`
- **Ennemis mobiles** :
  - State `enemyPositions: Record<number, {x,y}>` — indexé par l'index du node dans `world.nodes`
  - `alertedEnemies: Set<number>` — ennemis en mode chasse
  - setInterval 1.5s : pour chaque ennemi, calcule distance joueur, chasse si ≤3, sinon patrouille aléatoire (seed déterministe `tick*7+idx*13`)
  - `checkEnemyCollision()` : vérifie si ennemi = même case que joueur → déclenche combat
- **Combat match-3** :
  - `selectGem()` utilise `setCombat(prev => ...)` pour éviter stale closures
  - `processMatchesFromState()` est récursif pour les cascades
  - Après toutes les cascades → tour ennemi avec setTimeout 800ms (pour le feedback visuel)
- **Rendu carte** : seules les `vw×vh` tiles du viewport sont rendues. Chaque tile = div avec background CSS + emoji overlay
- **Sync Supabase** : throttled 250ms pour les positions, state complet du joueur pushé à chaque changement

### world.ts
- `genWorld(seed)` : PRNG déterministe `makeRng(seed)`
- Remplit les 5 biomes (centre + rayon), trace les chemins, place les portes, villages, nodes de ressources (40% avec gardien), boss au centre de chaque biome
- Le camp est placé à `CAMP_POS` (12, 8)

### constants.ts
- `TILES` : 19 types de tile (herbe, chemin, arbre, eau, sable, mine, etc.) avec bg color + walkable flag
- `RES` : 14 ressources avec nom, emoji, biome, couleur
- `TOOLS` : 5 outils avec recette + zone débloquée
- `CARD_RECIPES` : 6 cartes de combat avec recette + bonus
- `GUARDS` : 5 gardiens avec nom, emoji, HP, dialogue
- `QUESTS_DEF` : 7 quêtes (récolte, craft, boss)
- `VILLAGES` : 4 villages avec position + items en vente
- `BIOME_ZONES` : 5 biomes avec centre (cx,cy) et rayon
- Types : GameWorld, GameNode, CombatState, CombatCard, Quest, Village
- `BAG_LIMIT = 20`, `CAMP_POS = {x:12, y:8}`
- `countBagItems()`, `isBagFull()` : pain/potion ne comptent pas

### sounds.ts
- Classe `GameSounds` avec `AudioContext`
- `init()` obligatoire au premier user gesture (restriction mobile)
- Chaque son = oscillateur + gain envelope decay
- `gemMatch(combo)` : pitch monte avec les combos

### match3.ts
- `createGrid()` : grille 6 cols × 7 rows, vérifie pas de match initial
- `findMatches()` : horizontal + vertical, 3+ alignées
- `swapGems()` : swap 2 cases
- `applyGravity()` : les gemmes tombent, nouvelles gemmes aléatoires en haut

---

## Pour continuer — guide rapide

### Ajouter des vrais sprites (le chantier principal restant)
1. Télécharger le pack Anokolisa gratuit : https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites
2. Extraire les spritesheets personnages + monstres
3. Les mettre dans `public/sprites/characters/` et `public/sprites/monsters/`
4. Dans `sprites.ts` : ajouter les mappings (comme `kenney()` mais pour les nouveaux sheets)
5. Dans `game/page.tsx` : remplacer les emoji `{pEmoji}` et `{node.guard?.e}` par des divs avec background-image

### Tester le jeu
```bash
cd /c/tmp/restanques
npm run dev   # dev local sur localhost:3000
```

### Déployer
```bash
npx vercel --prod --yes
```

### Variables d'environnement Vercel (déjà configurées)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Reset la partie (si besoin)
Sur l'écran titre, bouton "🔄 Nouvelle partie" — supprime la session active + les joueurs en base.
