# ═══════════════════════════════════════════════════════════════
# RESTANQUES — CDC PARTIE 1/5 : VISION + ARCHITECTURE
# ═══════════════════════════════════════════════════════════════
# NOUVEAU DÉPART. Supprime tout le code dans app/ 
# Garde UNIQUEMENT : public/splash.png, public/story/, public/music/, .env.local
# Code le jeu from scratch en suivant les 5 parties du CDC.
# ═══════════════════════════════════════════════════════════════


# ╔═════════════════════════════════════════════════════════╗
# ║  1. VISION DU JEU                                      ║
# ╚═════════════════════════════════════════════════════════╝

## 1.1 Concept
RPG coopératif 2 joueurs sur mobile web (PWA).
DEUX GAMEPLAYS DISTINCTS qui se complètent :

🎸 JISSE (Paladin) — JEU D'EXPLORATION + COMBAT
- Explore 5 biomes provençaux (cartes 150×150, joystick fluide pixel par pixel)
- Combat les créatures en PUYO PUYO (pièces tombent, combos = dégâts)
- Combat les boss en MATCH-3 DOUBLE GRILLE (2 grilles simultanées)
- NE craft JAMAIS. Achète chez Mélanie ou en shop de village (plus cher)
- Rapporte les ressources rares (drops de monstres : peaux, dents, graines)
- Rentre à la maison pour dormir, enlever les malus, acheter chez Mélanie

🎨 MÉLANIE (Artisane) — JEU DE GESTION + CRAFT
- Gère sa MAISON (5 pièces : salon, cuisine, armurerie, chambre, jardin)
- Se déplace dans son propre monde 100×100 (maison + jardin + zone safe)
- Craft TOUT : sorts (spellbook), armes, armures, potions, plats cuisinés
- Plante et récolte dans son jardin (graines → plantes → ingrédients)
- Vend ses créations à Jisse (potions gratuites, sorts/armes payants en Sous ☀️)
- Peut sortir dans le monde de Jisse via un portail (mais fragile)
- Combat les nuisibles de sa zone en PUYO PUYO facile
- A un sort de rappel PERMANENT pour rentrer chez elle

🌙 QUENTIN (Ombre) — JEU SOLO AUTONOME
- Peut TOUT faire (explorer + crafter) mais moins bien que les spécialistes
- 10% chance d'échec sur chaque craft
- Parfait pour jouer seul ou en 3ème joueur
- Apparaît comme personnage mystère quand pas joué (aide aléatoire 10%)

## 1.2 Inspirations
Stardew Valley (récolte, jardin, coop) + Diablo 2 (classes, donjons, loot) +
Puyo Puyo (combat créatures) + Tetris Battle Gaiden (combat boss) +
Merge Mansion (gestion craft Mélanie) + Animal Crossing (maison)

## 1.3 Durée : 10-15h pour les 5 biomes (plusieurs soirées)

## 1.4 Monnaie : Sous provençaux ☀️
- Monstres droppent des Sous selon leur niveau
- Jisse achète chez Mélanie (sorts/armes) ou en shop village (plus cher)
- Mélanie gagne des Sous en vendant à Jisse
- Mort = perte de 10% des Sous

## 1.5 Sac à dos ÉVOLUTIF (craft avec peau de demi-boss)
- Départ : 8 slots
- Après demi-boss biome 1 : 12 slots
- Après demi-boss biome 2 : 16 slots
- Après demi-boss biome 3 : 20 slots
- Après demi-boss biome 4 : 25 slots (max)
- Le sac amélioré se CRAFT par Mélanie avec la peau du demi-boss


# ╔═════════════════════════════════════════════════════════╗
# ║  2. ARCHITECTURE TECHNIQUE                              ║
# ╚═════════════════════════════════════════════════════════╝

## 2.1 Stack
Next.js 14 (App Router) + TypeScript + Supabase + Vercel + Web Audio + PWA

## 2.2 Structure de fichiers
```
app/
  page.tsx                          — Écran titre + sessions
  layout.tsx                        — Meta + PWA
  globals.css                       — Animations CSS
  
  game/
    page.tsx                        — Routeur : monde Jisse OU maison Mélanie
    
    # ── Composants monde Jisse ──
    components/world/
      WorldMap.tsx                  — Carte biome 150×150, viewport, entités
      Joystick.tsx                  — Joystick fluide pixel par pixel
      PuyoCombat.tsx                — Combat Puyo Puyo vs créatures
      BossCombat.tsx                — Combat Match-3 double grille vs boss
      DungeonMap.tsx                — Carte donjon 20×20
      FortressEntry.tsx             — Popup entrée forteresse (vérif clé)
      ShopPanel.tsx                 — Boutique de village
      NPCDialog.tsx                 — Dialogue PNJ typewriter
      
    # ── Composants maison Mélanie ──
    components/home/
      HomeMap.tsx                   — Carte maison+jardin 100×100
      GardenPanel.tsx               — Jardin (planter, arroser, récolter)
      KitchenPanel.tsx              — Cuisine (plats, potions)
      ArmoryPanel.tsx               — Armurerie (armes, armures)
      SpellSalon.tsx                — Salon des sorts (spellbook craft)
      BedroomPanel.tsx              — Chambre (dormir, enlever debuffs)
      ShopCounter.tsx               — Comptoir de vente à Jisse
      
    # ── Composants partagés ──
    components/shared/
      TopBar.tsx                    — Stats + horloge + bourse
      DPad.tsx                      — D-pad (pour maison Mélanie)
      Minimap.tsx                   — Minimap 30×30 scrollante
      DirectionIndicators.tsx       — Flèches bord d'écran
      DayNightOverlay.tsx           — Filtre jour/nuit
      StorySequence.tsx             — Séquences narratives
      CharacterSheet.tsx            — Fiche perso (différente par classe)
      InventoryGrid.tsx             — Sac à dos grille
      SpellbookView.tsx             — Grimoire consultable
      QuestJournal.tsx              — Journal de quêtes
      BestiaryPanel.tsx             — Bestiaire
      PvPArena.tsx                  — Combat PvP
      DeathScreen.tsx               — Écran KO
      Notifications.tsx             — Notifications empilables
      SwipeMenus.tsx                — Swipe gauche/droite pour menus
      Onboarding.tsx                — Tutoriel interactif gamifié
      
    # ── Hooks ──
    hooks/
      useGameState.ts               — State centralisé (Zustand ou Context)
      useWorldMovement.ts           — Déplacement fluide pixel par pixel
      useHomeMovement.ts            — Déplacement dans la maison
      usePuyoCombat.ts              — Logique Puyo Puyo
      useBossCombat.ts              — Logique Match-3 double grille
      useMultiplayer.ts             — Sync Supabase + autre joueur
      useDayNight.ts                — Cycle jour/nuit (15 min)
      useEconomy.ts                 — Sous ☀️, achats, ventes
      useSounds.ts                  — Sons + musiques
      useSwipeMenu.ts               — Détection swipe gauche/droite
      
  # ── Données ──
  data/
    biomes.ts                       — 5 biomes complets
    monsters.ts                     — Tous les monstres + demi-boss + boss
    items.ts                        — Ressources + drops + emojis
    recipes.ts                      — Recettes par classe et par biome
    spells.ts                       — 14+ sorts avec évolution nv1→nv3
    equipment.ts                    — Armes, armures, amulettes, bottes
    classes.ts                      — 3 classes complètes
    npcs.ts                         — PNJs + dialogues + quêtes principales + secondaires
    shops.ts                        — Stock des shops par biome (évolue)
    story.ts                        — Textes narratifs
    bags.ts                         — Évolution du sac (8→12→16→20→25)
    garden.ts                       — Graines, temps de pousse, récoltes
    kitchen.ts                      — Recettes de cuisine
    
  # ── Lib ──
  lib/
    supabase.ts                     — Client Supabase
    world-generator.ts              — Génère 1 biome 150×150
    home-generator.ts               — Génère la maison+jardin 100×100
    dungeon-generator.ts            — Génère 1 donjon 20×20 (unique par seed)
    puyo-engine.ts                  — Moteur Puyo Puyo pur
    match3-engine.ts                — Moteur Match-3 pur
    sounds.ts                       — 29+ sons + 14+ musiques
    sprites.ts                      — Mapping visuels (emoji/CSS, prêt pour sprites)
    economy.ts                      — Calculs prix, drops Sous

public/
  splash.png, manifest.json
  story/ (17 images)
  music/ (4+ MP3)
```

## 2.3 Supabase — Schéma
```sql
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE,                     -- "LAV-847"
  seed INT NOT NULL,
  shared_chest JSONB DEFAULT '[]',      -- coffre commun 40 slots
  shop_stock JSONB DEFAULT '{}',        -- stock des shops par biome
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,                  -- 'paladin' | 'artisane' | 'ombre'
  
  -- Position
  x FLOAT DEFAULT 75, y FLOAT DEFAULT 75,  -- FLOAT pour pixel par pixel
  current_biome TEXT DEFAULT 'garrigue',
  in_home BOOLEAN DEFAULT false,        -- Mélanie dans sa maison ?
  in_dungeon TEXT DEFAULT '',            -- '' ou 'dungeon_id'
  
  -- Stats
  hp INT DEFAULT 15, max_hp INT DEFAULT 15,
  lvl INT DEFAULT 1, xp INT DEFAULT 0,
  base_stats JSONB DEFAULT '{"atk":0,"def":0,"mag":0,"vit":0}',
  sous INT DEFAULT 50,                  -- Sous provençaux ☀️ (départ 50)
  
  -- Inventaire
  bag_size INT DEFAULT 8,               -- 8→12→16→20→25
  inventory JSONB DEFAULT '[]',
  
  -- Équipement
  equipment JSONB DEFAULT '{"arme":null,"armure":null,"amulette":null,"bottes":null}',
  owned_equip JSONB DEFAULT '[]',
  
  -- Sorts
  spells_owned JSONB DEFAULT '[]',      -- [{id, level}]
  spells_equipped JSONB DEFAULT '["","",""]',
  
  -- Maison Mélanie
  garden JSONB DEFAULT '[]',            -- [{slot, seed_type, planted_at}]
  shop_inventory JSONB DEFAULT '[]',    -- ce que Mélanie vend
  home_storage JSONB DEFAULT '[]',      -- stockage maison
  
  -- Progression
  tools JSONB DEFAULT '[]',
  quests_main JSONB DEFAULT '[]',       -- quêtes principales
  quests_side JSONB DEFAULT '[]',       -- quêtes secondaires
  bosses_defeated JSONB DEFAULT '[]',
  demibosses_defeated JSONB DEFAULT '[]',
  stories_seen JSONB DEFAULT '[]',
  unlocked_biomes JSONB DEFAULT '["garrigue"]',
  dungeons_cleared JSONB DEFAULT '[]',
  bestiary JSONB DEFAULT '[]',          -- monstres découverts
  
  -- État
  buffs JSONB DEFAULT '[]',
  debuffs JSONB DEFAULT '[]',
  torches INT DEFAULT 0,
  fatigue_until BIGINT DEFAULT 0,
  intro_seen BOOLEAN DEFAULT false,
  ng_plus INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  
  -- Auto-save
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_save TIMESTAMPTZ DEFAULT now()   -- dernier save manuel
);

CREATE TABLE pvp_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id),
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  player1_hp INT DEFAULT 20,
  player2_hp INT DEFAULT 20,
  status TEXT DEFAULT 'waiting',
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS ouvert
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON game_sessions FOR ALL USING (true);
CREATE POLICY "open" ON players FOR ALL USING (true);
CREATE POLICY "open" ON pvp_matches FOR ALL USING (true);
```


# ╔═════════════════════════════════════════════════════════╗
# ║  3. FLOW COMPLET DU JEU                                ║
# ╚═════════════════════════════════════════════════════════╝

```
ÉCRAN TITRE
  🎵 theme.mp3
  splash.png (object-fit:contain, fond #000)
  [🎮 Créer une partie] → code "LAV-847" + nom + classe
  [🤝 Rejoindre] → saisie code + nom + classe
  [⚙️ Options] → Guide du jeu, onboarding, son
  NG+ affiché si > 0
  │
  Choix de classe :
  🎸 Paladin (Jisse) — explore + combat, ne craft pas
  🎨 Artisane (Mélanie) — gère la maison, craft tout
  🌙 Ombre (Quentin) — autonome, fait tout moins bien
  ❌ Deux joueurs ne peuvent PAS choisir la même classe
  │
INTRO NARRATIVE (StorySequence)
  🎵 story.mp3
  z-index 9999, fond NOIR OPAQUE
  4 slides typewriter, tap=skip, "Passer ⏭️"
  │
ONBOARDING GAMIFIÉ (première partie uniquement)
  Pas un tutoriel texte — des MISSIONS guidées :
  "🎯 Mission 1 : Déplacez-vous jusqu'au buisson brillant"
  "🎯 Mission 2 : Tapez 3 fois sur le buisson pour récolter"
  "🎯 Mission 3 : Rentrez à la maison et dormez"
  Chaque mission = un objectif + une récompense (5 Sous ☀️)
  Flèche dorée qui pointe vers l'objectif
  5 missions max, puis "Vous êtes prêt ! Bonne aventure !"
  │
GAMEPLAY — DÉPEND DE LA CLASSE :
  │
  ├─ PALADIN → Monde extérieur (biome 150×150)
  │   🎵 [biome].mp3
  │   Joystick fluide pixel par pixel
  │   Swipe gauche = menu (Perso/Sac/Sorts/Quêtes/Bestiaire)
  │   Swipe droite = carte/minimap plein écran
  │   HUD : vie+nv | horloge | ☀️Sous | minimap | sorts raccourcis
  │   │
  │   ├─ TAP monstre → Combat PUYO PUYO (créatures normales)
  │   ├─ Collision monstre → Combat PUYO PUYO
  │   ├─ Forteresse boss → vérif CLÉ → Combat MATCH-3 DOUBLE GRILLE
  │   ├─ TAP ressource → récolte (mais Paladin = -1/tap, lent)
  │   ├─ TAP PNJ (BLOQUÉ) → dialogue → quête
  │   ├─ Portail 🚪 → vérif outil → transition biome
  │   ├─ Donjon 🕳️ → carte 20×20 sombre
  │   ├─ Village → shop (acheter ressources/potions)
  │   ├─ Arène ⚔️ → PvP (si autre joueur présent)
  │   ├─ Maison Mélanie 🏡 → entre, dépose, achète, dort
  │   └─ Pierre de rappel → téléport à la maison
  │
  └─ ARTISANE → Maison + Jardin (carte 100×100)
      🎵 house.mp3 (spéciale Mélanie)
      Joystick fluide (même contrôle que Jisse)
      Se déplace dans la maison (5 pièces) + jardin extérieur
      │
      ├─ SALON → Craft sorts (spellbook), évoluer les sorts nv1→nv3
      ├─ CUISINE → Craft plats cuisinés, potions, buffs
      ├─ ARMURERIE → Craft armes, armures (pour Jisse)
      ├─ CHAMBRE → Dormir (enlève debuffs, fatigue, avance au jour)
      ├─ JARDIN (extérieur) → Planter, arroser, récolter
      ├─ ZONE SAFE (autour jardin) → Récolte + nuisibles Puyo Puyo facile
      ├─ COFFRE → Voir ce que Jisse a déposé, prendre les ressources
      ├─ COMPTOIR → Mettre en vente pour Jisse, voir commandes
      └─ PORTAIL → Sortir dans le monde de Jisse (sort rappel pour revenir)

QUAND JISSE REVIENT À LA MAISON :
  Il se déplace dans la carte 100×100 de Mélanie (même joystick)
  Il peut : accéder au coffre, acheter au comptoir, dormir en chambre
  Il ne peut PAS : crafter, utiliser le jardin, cuisiner

MORT (Jisse ou Mélanie dehors) :
  Écran rouge 💀 (1.5s) → fondu → respawn à la maison
  PV 50%, fatigue 2min, perte 10% Sous ☀️
  AUTO — pas de bouton, respawn automatique

JEU SOLO (l'autre pas connecté) :
  Paladin seul → la maison a un MARCHAND PNJ automatique
    Le marchand vend ce que l'Artisane a préparé au préalable
    Si rien préparé → le marchand vend des potions basiques (cher)
  Artisane seule → peut jouer normalement (jardin, craft, nuisibles)
    Le coffre montre les dépôts de Jisse (si connecté avant)

PERSONNAGE MYSTÈRE (quand Ombre pas joué) :
  Silhouette 🌙 qui apparaît ~10% du temps
  Donne des indices cryptiques : "Le sanglier craint le feu..."
  Aide ponctuelle en combat (1 coup gratuit parfois)
  Apparaît dans les images narratives en arrière-plan

SAUVEGARDE :
  Auto-save toutes les 30 secondes (Supabase update)
  Save manuel : swipe menu → bouton "💾 Sauvegarder"
  Notification "💾 Sauvegardé !" (1s)
```


# ╔═════════════════════════════════════════════════════════╗
# ║  4. CONTRÔLES                                           ║
# ╚═════════════════════════════════════════════════════════╝

## 4.1 Joystick fluide (Jisse ET Mélanie)
```
Cercle semi-transparent 120×120px en bas gauche.
Stick interne 44×44px suit le doigt.

DÉPLACEMENT PIXEL PAR PIXEL :
- Le personnage a une position (x, y) en FLOAT (pas en cases)
- Le joystick donne un vecteur (dx, dy) normalisé
- Vitesse de base : 2 pixels par frame (60fps → ~120px/s)
- Avec bottes : vitesse × 1.3
- Ombre : vitesse × 1.5

Collision : le personnage a une hitbox de 16×16px centrée.
Les murs, PNJs, obstacles ont des hitbox par tile.
Le personnage ne peut pas traverser les hitbox solides.

Le viewport SUIT le joueur (caméra centrée, smooth scrolling).
```

## 4.2 Swipe menus
```
Swipe GAUCHE (bord gauche de l'écran → centre) :
  → Ouvre le menu complet avec onglets :
  [👤 Perso] [🎒 Sac] [📖 Sorts] [📋 Quêtes] [📚 Bestiaire] [⚙️ Options]

Swipe DROITE (bord droit → centre) :
  → Ouvre la carte/minimap en plein écran
  → Le joueur voit tout le biome (150×150 zoomé out)
  → Tap pour fermer

Swipe DÉTECTION :
  onTouchStart sur les 30px du bord gauche/droit
  onTouchMove : si deltaX > 60px → ouvre le menu
  Animation : slide depuis le bord (200ms ease-out)
```

## 4.3 HUD (ce qu'on voit à l'écran)

### HUD Paladin (monde extérieur) :
```
┌──────────────────────────────────┐
│🕐40px │❤️12/15 Nv.3│☀️145│⚙️│🗺️│ ← top bar semi-transparent
│horloge│  vie    niv │sous │  │map│
│       │             │     │  │   │
│                                  │
│              CARTE               │
│           150×150                │
│         plein écran              │
│                                  │
│                     [🌫️][🛡️][⚡]│ ← sorts équipés (droite)
│  ┌───┐                          │
│  │ ○ │ joystick                 │
│  └───┘                          │
│ ← swipe menu    swipe carte →  │
└──────────────────────────────────┘
```

### HUD Artisane (maison) :
```
┌──────────────────────────────────┐
│🕐40px │❤️15/15 Nv.2│☀️230│📦│⚙️│ ← top bar
│horloge│             │sous │cof│  │
│       │             │     │fre│  │
│                                  │
│         MAISON / JARDIN          │
│           100×100                │
│         plein écran              │
│                                  │
│                   [📊 Stock]    │ ← raccourci stock
│  ┌───┐            [📋 Commandes]│ ← commandes Jisse
│  │ ○ │ joystick                 │
│  └───┘                          │
│ ← swipe menu    swipe carte →  │
│ 🔔 "Jisse a déposé 🪵×5 !"    │ ← notifications
└──────────────────────────────────┘
```


# ╔═════════════════════════════════════════════════════════╗
# ║  5. INTERFACE — FICHE PERSONNAGE                        ║
# ╚═════════════════════════════════════════════════════════╝

## 5.1 Fiche Paladin
```
┌──────────────────────────────────┐
│ 🎸 [Nom] — Paladin    ❌ fermer │
│                                  │
│    ┌──────┐                     │
│    │ 🎸   │  Nv. 5              │
│    │ 64px │  XP ████░ 120/200   │
│    └──────┘  ❤️ ██████░ 12/15   │
│                                  │
│ ── STATS ──                     │
│ ⚔️ ATK ████████░░ 8  (+3 arme) │
│ 🛡️ DEF ████░░░░░░ 4  (+2 armr) │
│ ✨ MAG ██░░░░░░░░ 2             │
│ 💚 VIT █████░░░░░ 5  (+2 bott) │
│                                  │
│ ── ÉQUIPEMENT ──                │
│ ┌─────┐┌─────┐┌─────┐┌─────┐  │
│ │⚔️   ││🧥   ││📿   ││👡   │  │
│ │Épée ││Tuniq││ vide ││Sanda│  │
│ │fer  ││cuir ││      ││les  │  │
│ │ATK+5││DEF+2││      ││VIT+2│  │
│ └─────┘└─────┘└─────┘└─────┘  │
│ Tap = changer/retirer          │
│                                  │
│ ── SORTS ÉQUIPÉS ──            │
│ [🌫️Brume2][🛡️Bouclier][ + ]  │
│ Tap = changer depuis spellbook  │
│                                  │
│ ── INFOS ──                     │
│ ☀️ 145 Sous  🎒 12/16 slots    │
│ 🏆 Boss 1/5  📋 Quêtes 3/8    │
│ 😵 Fatigue 0:45 (si actif)     │
│ 🍖 ATK+3 (2:30 restant)        │
└──────────────────────────────────┘
```

## 5.2 Fiche Artisane (différente)
```
┌──────────────────────────────────┐
│ 🎨 [Nom] — Artisane   ❌ fermer │
│                                  │
│    ┌──────┐                     │
│    │ 🎨   │  Nv. 3              │
│    │ 64px │  XP ████░ 80/150    │
│    └──────┘  ❤️ ██████████ 15/15│
│                                  │
│ ── STATS ──                     │
│ ⚔️ ATK ██░░░░░░░░ 2             │
│ 🛡️ DEF ███░░░░░░░ 3             │
│ ✨ MAG ████████░░ 8  (+5 amul) │
│ 💚 VIT ██░░░░░░░░ 2             │
│                                  │
│ ── BOUTIQUE ──                  │
│ En vente : 🌫️Brume ×2, 🧪Pot ×5│
│ Recettes maîtrisées : 12/24    │
│ Ventes totales : ☀️ 340 Sous   │
│                                  │
│ ── JARDIN ──                    │
│ Parcelles : 8/16 actives        │
│ Prêtes à récolter : 3 🌿       │
│                                  │
│ ── INFOS ──                     │
│ ☀️ 230 Sous  🎒 8/12 slots     │
│ 📋 Quêtes craft 2/6            │
│ Recettes découvertes : 18/36   │
└──────────────────────────────────┘
```

## 5.3 Bestiaire
```
┌──────────────────────────────────┐
│ 📚 BESTIAIRE         ❌ fermer  │
│                                  │
│ 🌿 Garrigue (4/5 découverts)   │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐│
│ │🐀  ││🐇  ││🐝  ││🦊  ││❓  ││
│ │Nv1 ││Nv2 ││Nv3 ││Nv4 ││ ?  ││
│ │✅  ││✅  ││✅  ││✅  ││    ││
│ └────┘└────┘└────┘└────┘└────┘│
│                                  │
│ Tap sur un monstre découvert :  │
│ "🐀 Rat des champs — Nv.1"    │
│ "HP: 8  ATK: 2"                │
│ "Drop: Herbe, Sous ×2-4"       │
│ "Battu 12 fois"                 │
│                                  │
│ 🏖️ Calanques (0/5)             │
│ [❓][❓][❓][❓][❓]            │
│ "Explorez les Calanques !"     │
└──────────────────────────────────┘
```
