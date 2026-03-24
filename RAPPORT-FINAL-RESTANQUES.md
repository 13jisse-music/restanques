# ═══════════════════════════════════════════════════════════
# RAPPORT FINAL — RESTANQUES v3.0
# 24 mars 2026
# ═══════════════════════════════════════════════════════════

## Le Jeu

**Restanques** — jeu web coopératif 2 joueurs sur mobile.
Thème : aventure provençale RPG avec exploration, craft, combat match-3, quêtes.
Jisse (🎸 l'Aventurier) et Mélanie (🎨 l'Artisane) doivent restaurer un duché provençal
détruit par le Mistral en traversant 5 biomes et en battant 5 boss gardiens.

**URL live** : https://restanques.vercel.app
**Code** : /c/tmp/restanques
**Commits** : 34
**Lignes de code** : 2419
**Assets** : 84 Mo (sprites + images story + poster)

---

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Base de données | Supabase (PostgreSQL + Realtime) |
| Déploiement | Vercel |
| Sons | Web Audio API (29 effets + 9 musiques, zéro fichier) |
| Sprites carte | Pixel Crawler Free Pack (personnages/mobs animés) |
| Sprites items/boss | DALL-E 3 (31 images générées, $1.24) |
| Sprites décor | CSS pur (couleurs par biome) + emojis |
| Images narratives | ChatGPT Image (17 illustrations provençales) |
| PWA | manifest.json + fullscreen + orientation portrait |

---

## Supabase

- **URL** : https://omivxkzvzfobylgjscvx.supabase.co
- **Anon key** : eyJhbGci...2V-aO_8jz0ki8sCf4poA3IYuyokFMwyQn2y8MwWWNMA
- **Service role** : eyJhbGci...r931uHoftu6ZqWzCrXZcs3EvnCWk7KM7hipOLBdQ8-o
- **DB direct** : aws-1-eu-central-1.pooler.supabase.com:5432, user postgres.omivxkzvzfobylgjscvx, mdp Yourbanlt300!

### Tables

```sql
game_sessions (
  id UUID PK, seed INT, collected_nodes JSONB, active BOOL, created_at TIMESTAMPTZ
)

players (
  id UUID PK, session_id FK, name TEXT, emoji TEXT,
  x INT, y INT, hp INT, max_hp INT, lvl INT, xp INT,
  inventory JSONB, tools JSONB, cards JSONB,
  unlocked_biomes JSONB, bosses_defeated JSONB,
  chest JSONB,          -- coffre 40 items
  stats JSONB,          -- {atk, def, mag, vit}
  owned_equip JSONB,    -- équipements possédés
  equipped JSONB,       -- {arme, armure, amulette, bottes}
  current_biome TEXT,
  stories_seen JSONB,
  fatigue_until BIGINT,
  intro_seen BOOL,
  ng_plus INT,
  updated_at TIMESTAMPTZ
)
```

---

## Fichiers (2419 lignes)

```
app/
  page.tsx (148)                  — Écran titre : poster plein écran, boutons animés, options, PWA
  layout.tsx                      — Meta + viewport + manifest + PWA tags
  globals.css                     — Reset CSS
  data/
    story.ts (41)                 — Textes narratifs (intro, transitions, ending) + mapping images
  lib/
    constants.ts (235)            — 14 ressources, 5 outils, 6 cartes, 5 gardiens, 7 quêtes,
                                    8 villages, 5 biomes, 9 équipements, types TypeScript
    supabase.ts                   — Client Supabase
    match3.ts (64)                — Moteur match-3 (6×7 grid, findMatches, swapGems, applyGravity)
    world.ts (135)                — Génération monde 200×200 (seeded PRNG déterministe)
    sounds.ts (146)               — 29 sons + 9 musiques + volume 3 niveaux (Web Audio API)
    sprites.ts (137)              — Pixel Crawler (perso/mobs animés) + DALL-E (items/boss) + CSS fallback
  game/
    page.tsx (1079)               — LE JEU COMPLET
    components/
      StorySequence.tsx (75)      — Séquences narratives plein écran avec images
      Joystick.tsx (50)           — D-pad overlay semi-transparent
      DayNightOverlay.tsx (38)    — Cycle jour/nuit (10 min)
      Minimap.tsx (109)           — Canvas 200×200, toggle 90/160px
      GameGuide.tsx (162)         — Guide 6 onglets (gameplay, biomes, craft, sorts, persos, équipement)
public/
  splash.png                      — Poster pixel art provençal (écran titre)
  manifest.json                   — PWA manifest
  story/ (17 images)              — Illustrations narratives (intro, transitions, ending)
  sprites/
    generated/ (34 fichiers)      — DALL-E : gemmes, items, boss, nature
    player/ (6 fichiers)          — Pixel Crawler : walk/idle (down/side/up) × 64×64
    mobs/ (10 fichiers)           — Pixel Crawler : orc/warrior/shaman/rogue/mage/skeleton idle+run
    npcs/ (3 fichiers)            — Pixel Crawler : knight/rogue/wizzard
    env/ (bonfire, rocks, vegetation, floors, water, walls, etc.)
    chatgpt/ (14 fichiers)        — Images ChatGPT originales (référence)
    game/ (dossiers découpés par sharp)
```

---

## Fonctionnalités Complètes ✅

### Exploration
- Carte 200×200 avec 5 biomes (garrigue r=35, calanques r=30, mines r=30, mer r=35, restanques r=20)
- 155 nodes de ressources (40% gardés par un ennemi)
- 8 villages avec NPCs marchands (Pixel Crawler knight/rogue/wizzard animés)
- Portes entre biomes (nécessitent l'outil correspondant)
- D-pad overlay semi-transparent (250ms entre les pas)
- Carte plein écran (position fixed, CELL = W/11)
- Minimap canvas 90/160px toggleable avec joueur clignotant
- Cycle jour/nuit (10 min, nuit = filtre bleu sombre)
- Personnage mystère (silhouette sombre apparaît ~40s, son 82Hz)

### Personnages
- **Sur la carte** : Pixel Crawler Body_A animé (walk 6 frames, idle 4 frames, 4 directions)
- Jisse = sprite normal, Mélanie = hue-rotate(280deg)
- **En combat** : emoji dans cercle coloré (orange Jisse, rose Mélanie)
- Stats RPG : ATK, DEF, MAG, VIT (base + équipement + outils)
- Level up → choix +1 ATK/DEF/MAG

### Combat Match-3
- Grille 6×7, 6 types de gemmes (CSS radial-gradient avec brillance)
- Swap → match → gravity → cascade (récursif)
- Tours ennemis VISIBLES : shake monstre → bannière rouge → délai 800ms → shake joueur
- Dégâts = matchCount + combo×2 + totalATK + totalMAG + bonus sorts/cartes
- Dégâts subis = ceil(enemyHP/5) - totalDEF (min 1)
- **6 sorts actifs** (1× par combat) :
  - 🌫️ Brume : efface toutes les gemmes d'une couleur
  - 🛡️ Bouclier : annule le prochain tour ennemi
  - ✨ Éclat : dégâts directs ATK+MAG+3
  - 🍽️ Festin : soigne 5 PV
  - 🌊 Marée : +5 dégâts au prochain match
  - 💥 Séisme : mélange toute la grille
- 5 portraits de boss DALL-E (sanglier, mouette, tarasque, pieuvre, mistral)
- Potion utilisable en combat

### Ennemis Mobiles
- Chaque gardien patrouille (1 case / 1.5s, rayon 6 du spawn)
- Mode chasse si joueur ≤ 3 cases (≤ 5 boss)
- ❗ rouge + tremblement + son d'alerte en chasse
- Sprite Pixel Crawler idle (32×32) / run (64×64) selon état
- Collision = combat auto
- Zone camp = safe zone (ennemis interdits)
- Mouvement déterministe (seed+tick) pour synchro multijoueur

### Camp de Base (position 50, 46)
- Zone safe 5×5 (ennemis ne peuvent pas entrer)
- 4 onglets : 🛏️ Repos, 📦 Coffre, 🔨 Établi, ⚔️ Équipement
- **Repos** : PV restaurés au max
- **Coffre** : 40 emplacements, tap pour transférer sac↔coffre
- **Établi** : craft outils (5) + cartes combat (6) avec recettes visuelles
- **Équipement** : forge + équipe 9 items dans 4 slots

### Équipement (9 items, 4 slots)
- ⚔️ Armes : Épée bois (ATK+2), Épée fer (ATK+5), Trident corail (ATK+7 MAG+3)
- 🧥 Armures : Tunique cuir (DEF+2), Cotte écailles (DEF+5)
- 📿 Amulettes : Amulette herbes (MAG+2), Collier perles (MAG+5 DEF+2)
- 👡 Bottes : Sandales (VIT+2), Bottes Mistral (VIT+5)
- Stats totales = base + équipement + outils (serpe ATK+2, pioche ATK+1, bâton DEF+1)
- Craft avec ressources, équipe en 1 tap

### Craft
- 5 outils : bâton→calanques, pioche→mines, filet→mer, serpe, clé→restanques
- 6 cartes combat (sorts actifs)
- 9 équipements
- Recettes visuelles dans l'établi et le Guide du jeu

### Inventaire
- Limite 20 items (pain/potion ne comptent pas)
- Items groupés par type ×N
- Tap = jeter ×1
- Sprites DALL-E items.png (4×4, 16 items pixel art)

### Séquences Narratives (17 images)
- **Intro** : 4 slides avec illustrations provençales pixel art
- **Transitions biomes** : séquence narrative après chaque boss vaincu
  - Garrigue → image fin + texte → image intro Calanques
  - Calanques → Mines, Mines → Mer, Mer → Restanques
- **Ending** : 4 slides après victoire sur le Mistral
- **Composant StorySequence** : plein écran fond noir opaque, texte fade in/out, bouton Suivant, bouton Passer

### Sons (29 effets Web Audio)
- Pas : 4 variantes par biome (herbe/pierre/sable/eau)
- Récolte : 4 sons (bois/pierre/herbe/terminé)
- Combat : 5 sons (gemMatch avec pitch combo, hit, spell, victoire, défaite)
- UI : 6 sons (click, open, close, craft, equip, levelUp)
- Narration : 4 sons (npcTalk, questAccept, questComplete, unlock)
- Ambiance : 5 sons (mystery, locked, teleport, ko, collect)
- Volume : 3 niveaux 🔊→🔉→🔇

### Musiques (9 thèmes Web Audio)
- **Garrigue** : drone La+Mi + arpège triangle (chaud, pastoral)
- **Calanques** : drone Do+Sol + arpège sine (aérien, maritime)
- **Mines** : drone Mi + arpège triangle lent (sombre, écho)
- **Mer** : drone Ré+La + arpège sine (mystérieux, profond)
- **Restanques** : drone Sol+Ré sawtooth + arpège rapide (épique)
- **Combat** : bass sawtooth + kick (tendu, rapide)
- **Boss** : drone grave 82Hz + bass très rapide (intense)
- **House** : drone Fa+Do + arpège triangle (cozy)
- **Intro** : drone doux 220+330Hz (mystérieux, calme)
- Change automatiquement par biome + combat/boss/camp

### UI
- Écran titre : poster plein écran, boutons animés slide-up décalé, Options menu
- Fond jeu : carte plein écran (position fixed)
- Top bar : overlay semi-transparent + blur, barre XP gradient
- D-pad : overlay semi-transparent en bas à gauche
- Boutons action : 4 boutons en bas à droite (🏠 📦 👤 📋)
- Menu ⚙️ : Guide du jeu, Son, Menu principal
- **Guide du jeu** : 6 onglets (Jouer, Biomes, Craft, Sorts, Personnages, Équipement)
- Panneaux parchemin (gradient + cadre bois)
- PWA installable (manifest.json, fullscreen, orientation portrait)
- Death screen : fond rouge, 💀, respawn camp, fatigue 2 min

### Multijoueur Realtime
- Seed partagé → même carte pour les 2 joueurs
- Positions synchronisées (poll 1s + Realtime collected_nodes)
- L'autre joueur visible avec son sprite (opacity 0.75)
- Sauvegarde complète auto toutes les 250ms

### Death/KO
- Écran rouge 💀 "Défaite..." pendant 2.5s
- Respawn au camp, PV à 50% du max
- Malus Fatigue 2 min (indicateur 😵 dans top bar)
- Le monstre reste sur la carte

---

## Ce qui n'est PAS implémenté (pistes futures)

| Feature | Difficulté | Impact |
|---------|-----------|--------|
| New Game+ (monstres +50%, garder perso) | Moyen | Rejouabilité |
| Biomes séparés (5 cartes 100×100 avec portails) | Gros | Immersion |
| Donjons (mini-cartes spéciales dans chaque biome) | Gros | Contenu |
| PNJs avec dialogues + quêtes secondaires | Moyen | Narration |
| Récolte par tap (nodes avec HP, animation frappe) | Moyen | Gameplay |
| Classe Ombre (3ème personnage débloqué) | Moyen | Rejouabilité |
| Sprites personnages DALL-E (au lieu de Pixel Crawler) | $1-2 | Visuel |
| UI sprites DALL-E (boutons, panneaux, barres) | $1-2 | Visuel |
| Tiles de sol seamless (tiles tileable) | Moyen | Visuel |
| Animations de destruction gemmes (particules) | Petit | Satisfaction |
| Sons par type de gemme | Petit | Immersion |
| Musique de fond continue (AudioWorklet) | Moyen | Immersion |

---

## Budget

| Poste | Coût |
|-------|------|
| DALL-E 3 (31 images × $0.04) | $1.24 |
| Supabase (free tier) | $0 |
| Vercel (free tier) | $0 |
| Pixel Crawler Free Pack | $0 (CC0) |
| Kenney assets | $0 (CC0) |
| **Total** | **$1.24** |

---

## Commandes

```bash
# Dev local
cd /c/tmp/restanques && npm run dev

# Build
npx next build

# Deploy
npx vercel --prod --yes

# Reset la partie
# Bouton "🔄 Nouvelle partie" sur l'écran titre

# Regénérer les sprites DALL-E
node generate-sprites.js

# Re-nettoyer les sprites
node process-sprites.js
```

---

## GitHub

- Compte : restanques-lejeu-create (restanques.lejeu@gmail.com / Yourbanlt300!)
- Repo créé mais PAS pushé (il faut un Personal Access Token)
- Pour push : github.com → Settings → Developer settings → Tokens → Generate
  puis : git remote add origin https://TOKEN@github.com/restanques-lejeu-create/restanques-lejeu-create.git && git push -u origin master

---

## Crédits

- Sprites animation : Pixel Crawler Free Pack (CC0)
- Sprites items/boss : DALL-E 3 par OpenAI
- Illustrations narratives : ChatGPT Image
- Musique : Web Audio API générative
- Code : Claude Code (Anthropic)
- Design & direction : Jisse & Mélanie
