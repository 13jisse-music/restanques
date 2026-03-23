# RAPPORT RESTANQUES — État du projet & améliorations nécessaires

## Résumé du projet
**Restanques** est un jeu web coopératif à 2 joueurs (Jisse 🎸 + Mélanie 🎨) sur mobile.
Thème : aventure provençale, exploration carte 50×50, craft, combat match-3, villages, quêtes.

## Stack technique
- **Framework** : Next.js 14 (App Router) + TypeScript
- **Base de données** : Supabase (Realtime pour multijoueur)
- **Déploiement** : Vercel → https://restanques.vercel.app
- **Style** : inline CSS (pas de framework CSS utilisé pour le jeu)
- **Tiles** : Kenney "Tiny Town" + "Tiny Dungeon" (16×16, CC0, gratuit)
- **Personnages/monstres/gemmes** : emojis (pas encore de vrais sprites)

## Structure des fichiers
```
app/
  page.tsx                    — Menu principal (choix Jisse/Mélanie + Nouvelle partie)
  layout.tsx                  — Layout (meta, viewport, font Courier New)
  globals.css                 — Reset + tap highlight
  lib/
    constants.ts              — Toutes les données du jeu (ressources, outils, recettes, gardiens, quêtes, villages, biomes, tiles)
    supabase.ts               — Client Supabase
    match3.ts                 — Moteur match-3 (createGrid, findMatches, swapGems, applyGravity)
    world.ts                  — Génération de monde déterministe (seeded PRNG, 50×50)
    sprites.ts                — Mapping Kenney tiles → positions dans les spritesheets
  game/
    page.tsx                  — LE JEU COMPLET (tout dans un seul fichier ~600 lignes)
public/
  sprites/
    town.png                  — Kenney Tiny Town tilemap (192×176, 12×11 grid, 16×16 tiles)
    dungeon.png               — Kenney Tiny Dungeon tilemap (192×176, 12×11 grid, 16×16 tiles)
supabase-schema.sql           — Schema SQL (game_sessions + players)
```

## Base de données Supabase
- **URL** : https://omivxkzvzfobylgjscvx.supabase.co
- **Tables** : `game_sessions` (seed, collected_nodes, active) + `players` (position, hp, inventaire, outils, cartes, zones débloquées, boss vaincus)
- **Realtime** activé sur les deux tables
- **RLS** ouvert (jeu privé)
- **Connexion directe** : host `aws-1-eu-central-1.pooler.supabase.com:5432`, user `postgres.omivxkzvzfobylgjscvx`, password `Yourbanlt300!`

## Ce qui fonctionne ✅
1. **Carte 50×50** avec 5 biomes (garrigue, calanques, mines, mer, restanques) + tiles Kenney
2. **Multijoueur Realtime** : les 2 joueurs voient la même carte (seed partagé), positions synchronisées
3. **Récolte** de 14 ressources avec limite sac 20 items
4. **Craft** de 5 outils (bâton, pioche, filet, serpe, clé) + 6 cartes de combat
5. **Combat match-3** avec tours ennemis visibles (shake animation, bannière rouge, délai 800ms)
6. **5 boss** gardiens + boss final Le Mistral
7. **4 villages** avec troc
8. **7 quêtes** avec XP et montée de niveau
9. **Camp de base** 🔥 qui restaure les PV
10. **D-pad tactile** avec appui long + tap sur cases adjacentes
11. **Minimap**
12. **Sauvegarde automatique** dans Supabase

## Problèmes actuels & améliorations nécessaires 🔧

### 1. SPRITES PERSONNAGES (priorité haute)
**Problème** : Jisse et Mélanie sont affichés en emoji (🎸🎨) — pas de vrais sprites de personnage.
**Solution** : Il faut des sprites 16×16 ou 32×32 de personnages avec :
- 4 directions (haut, bas, gauche, droite)
- 2-4 frames d'animation de marche par direction
- Fond transparent PNG
- Style pixel art cohérent avec les tiles Kenney
**Où** : Les sprites Kenney Tiny Dungeon (dungeon.png) ont des personnages en row 7-8 (cols 0-11) mais ce sont des aventuriers génériques, pas personnalisés. On pourrait les utiliser en attendant mieux.
**Fichier à modifier** : `app/game/page.tsx` — le rendu de `isP` et `isOther` dans la carte

### 2. GEMMES DE COMBAT (priorité haute)
**Problème** : Les gemmes du match-3 sont des emojis basiques (💜🟢🔴🔵🟡🟠) — trop petites et pas assez visuelles sur mobile.
**Référence souhaitée** : Style "merge/match" type Merge Mansion — gros items colorés, ombres, relief, satisfaisants à toucher.
**Solution** :
- Soit trouver des sprites de gemmes/cristaux pixel art (32×32 ou 48×48)
- Soit dessiner des gemmes en CSS pur (gradient radial + ombre + brillance)
- Les gemmes doivent être GROSSES (au moins 48×48px affichées)
- Animation de destruction plus satisfaisante (explosion particules, pas juste disparition)
**Fichier** : `app/game/page.tsx` — section "Gem grid" dans le rendu combat

### 3. HABILLAGE UI / SKIN (priorité moyenne)
**Problème** : L'interface est fonctionnelle mais visuellement austère. Pas de cadre, pas de fond décoratif, pas de thème visuel cohérent.
**Améliorations** :
- **Cadre de jeu** : bordure décorative autour de la carte (style parchemin ou bois)
- **Fond de combat** : image de fond selon le biome pendant les combats match-3
- **Barres de vie** : utiliser des sprites de barre de vie (le pack Kenney en a peut-être)
- **Boutons** : style plus riche (ombre portée, dégradé, coins arrondis)
- **Panneau d'inventaire** : cadre en bois/pierre avec compartiments
- **Notifications** : bulles plus stylées avec icône
- **Écran titre** : illustration ou animation au lieu du simple texte

### 4. SPRITES MONSTRES (priorité moyenne)
**Problème** : Les monstres sont des emojis (🐗🦅🐉🐙🌪️). Ça fonctionne mais manque d'impact.
**Solution** : Sprites pixel art de monstres 32×32 ou 48×48 animés (idle bounce)
- Sanglier, Mouette/Aigle, Tarasque/Dragon, Pieuvre, Mistral (vent)
- Le pack Kenney Tiny Dungeon a quelques monstres en row 7-8 de dungeon.png

### 5. ANIMATIONS (priorité moyenne)
**Manque** :
- Animation de marche du personnage (actuellement juste un scale)
- Animation de récolte (particules, +1 qui monte)
- Animation de level up (flash doré)
- Transition entre les zones (fade ou slide)
- Particules lors de la destruction de gemmes en combat

### 6. SONS (priorité basse)
**Manque** : Aucun son. Ajouter :
- Son de pas (marche)
- Son de récolte (plop)
- Son de craft (ding)
- Musique de combat (loop)
- Son de match-3 (cascades de plus en plus aiguës)
- Son de victoire / défaite

### 7. SPRITES CHATGPT EXISTANTS (non utilisés)
Les 16 images générées par ChatGPT sont dans `C:\Users\ecole\Downloads\restanques\`. Elles contiennent :
- Jisse et Mélanie en pixel art (4 directions × 4 frames de marche) — **BONS** mais pas en grille régulière
- Tiles de terrain par biome (garrigue, calanques, mines, mer, restanques) — **BONS** visuellement mais avec fonds dégradés
- Items, outils, monstres, gemmes, UI, villages, camp — **BONS** visuellement

**Le problème** : ces images ne sont PAS des spritesheets régulières. Les sprites sont placés avec des espaces irréguliers et des fonds avec dégradé/glow. Pour les utiliser il faudrait :
1. Les ouvrir dans Photopea (photopea.com, gratuit)
2. Découper chaque sprite individuellement
3. Supprimer le fond (baguette magique → supprimer)
4. Redimensionner en taille uniforme (32×32 ou 48×48)
5. Exporter en PNG transparent
6. Assembler en spritesheet grille régulière

Fichiers ChatGPT :
- `chars-idle.png` (1536×1024) : Jisse haut × 4 dirs, Mélanie bas × 4 dirs
- `chars-walk1/2/3.png` : 3 frames de marche
- `tiles-garrigue/calanques/mines/mer/restanques.png` : tiles terrain 4×4
- `items.png` (1024×1024) : 4×4 items
- `tools.png` (3072×1024) : 5 outils en ligne
- `monsters.png` (1536×1024) : 4 monstres
- `gems.png` (1536×1024) : 6 gemmes
- `ui.png` : barres de vie, cadres, boutons
- `villages.png` : 4 bâtiments
- `camp.png` : camp de base 1024×1024

## Architecture code — points clés pour continuer

### game/page.tsx (le fichier principal)
- **~600 lignes**, tout dans un seul composant `GameContent`
- État géré par ~25 `useState` hooks
- Refs pour éviter les stale closures en combat (`cardsRef`, `hpRef`, `maxHpRef`)
- Combat match-3 : `selectGem()` → `processMatchesFromState()` (récursif pour cascades) → tour ennemi avec setTimeout 800ms
- Mouvement : `tryMove()` avec holdMove/stopMove pour le D-pad
- Sync Supabase : throttled à 200ms pour les positions, 300ms pour les nodes collectés
- Le rendu de la carte ne rend que le viewport visible (vw×vh tiles)

### world.ts
- `genWorld(seed)` génère la carte entière de manière déterministe
- PRNG maison `makeRng(seed)` pour que les 2 joueurs aient la même carte
- Place les biomes, chemins, portes, villages, nodes de ressources, boss

### match3.ts
- `createGrid()` : grille 6×7, pas de match initial
- `findMatches()` : horizontal + vertical, 3+ alignées
- `swapGems()` + `applyGravity()` : swap et gravité

### constants.ts
- Toutes les données du jeu : 14 ressources, 5 outils, 6 cartes, 5 gardiens, 7 quêtes, 4 villages, 5 biomes
- Types TypeScript : GameWorld, GameNode, CombatState, Quest, etc.
- `CELL = 36` (taille d'une tile en pixels)
- `BAG_LIMIT = 20`, `CAMP_POS = {x:12, y:8}`

## Pour intégrer de vrais sprites (guide technique)

### Méthode spritesheet Kenney (ce qui fonctionne)
```typescript
// sprites.ts — le système actuel
// kenney(sheet, col, row, displaySize) retourne les styles CSS
// pour afficher le sprite à la position (col, row) dans la grille 12×11

// Utilisation dans le JSX :
const ts = TILE_SPRITES[tileCode];  // { sheet: "town", col: 0, row: 0 }
const tileStyle = ts ? kenney(ts.sheet, ts.col, ts.row, CELL) : {};
// → met backgroundImage, backgroundPosition, backgroundSize sur le div
```

### Pour ajouter un nouveau spritesheet
1. Placer le PNG dans `public/sprites/`
2. Il DOIT être une grille régulière (tous les sprites même taille, pas d'espace)
3. Fond transparent
4. Ajouter le mapping dans `sprites.ts` avec les colonnes/lignes
5. Utiliser `kenney(sheetName, col, row, displaySize)` pour le rendu

### Pour remplacer les emojis personnage
Dans `game/page.tsx`, chercher `{isP ?` et remplacer le `<span>{pEmoji}</span>` par un div avec le style Kenney du personnage.

## Vercel
- **Projet** : restanques (lié au compte 13jisse-music)
- **URL** : https://restanques.vercel.app
- **Env vars** : NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (déjà configurées)
- **Deploy** : `npx vercel --prod --yes` depuis `/c/tmp/restanques`

## GitHub
- Compte créé : `restanques-lejeu-create` (restanques.lejeu@gmail.com / Yourbanlt300!)
- Repo : `restanques-lejeu-create/restanques-lejeu-create`
- PAS encore pushé (authentification GitHub à configurer)
- Pour push : créer un Personal Access Token sur github.com → Settings → Developer settings → Tokens
