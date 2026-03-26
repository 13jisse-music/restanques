-- RESTANQUES v6 — Schema Supabase
-- 14 tables + RLS + Realtime

-- JOUEURS
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('paladin', 'artisane', 'ombre')),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_next INTEGER DEFAULT 50,
  hp INTEGER DEFAULT 100,
  hp_max INTEGER DEFAULT 100,
  atk INTEGER DEFAULT 10,
  def INTEGER DEFAULT 5,
  luck INTEGER DEFAULT 5,
  sous INTEGER DEFAULT 100,
  fatigue REAL DEFAULT 0,
  current_biome TEXT DEFAULT 'maison',
  position_x REAL DEFAULT 50,
  position_y REAL DEFAULT 50,
  is_alive BOOLEAN DEFAULT TRUE,
  save_slot INTEGER DEFAULT 1,
  skin TEXT DEFAULT 'provence',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTAIRE
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  slot INTEGER,
  location TEXT DEFAULT 'bag' CHECK (location IN ('bag', 'storage', 'equipped')),
  UNIQUE(player_id, item_id, location)
);

-- SORTS EQUIPES
CREATE TABLE equipped_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  spell_id TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  uses_remaining INTEGER,
  UNIQUE(player_id, slot)
);

-- EQUIPEMENT
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('arme', 'armure', 'casque', 'gants', 'amulette', 'bottes')),
  item_id TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  UNIQUE(player_id, slot)
);

-- JARDIN
CREATE TABLE garden_plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  plot_number INTEGER NOT NULL CHECK (plot_number BETWEEN 1 AND 4),
  seed_id TEXT,
  planted_at TIMESTAMPTZ,
  growth_time_seconds INTEGER,
  is_ready BOOLEAN DEFAULT FALSE,
  UNIQUE(player_id, plot_number)
);

-- SESSIONS MULTIJOUEUR
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID REFERENCES players(id),
  current_biome TEXT DEFAULT 'maison',
  day_night_cycle REAL DEFAULT 0,
  weather TEXT DEFAULT 'clear',
  season TEXT DEFAULT 'printemps',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSION MEMBERS
CREATE TABLE session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_connected BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- QUETES
CREATE TABLE quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  progress JSONB DEFAULT '{}',
  UNIQUE(player_id, quest_id)
);

-- BESTIAIRE
CREATE TABLE bestiary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  monster_id TEXT NOT NULL,
  times_killed INTEGER DEFAULT 0,
  UNIQUE(player_id, monster_id)
);

-- RECETTES DEBLOQUEES
CREATE TABLE unlocked_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  times_crafted INTEGER DEFAULT 0,
  UNIQUE(player_id, recipe_id)
);

-- SAUVEGARDES
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  save_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, slot)
);

-- STORIES VUES
CREATE TABLE story_seen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, story_id)
);

-- BIOMES DEBLOQUES
CREATE TABLE unlocked_biomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  biome_id TEXT NOT NULL,
  boss_defeated BOOLEAN DEFAULT FALSE,
  UNIQUE(player_id, biome_id)
);

-- ASSETS CUSTOM (admin uploads)
CREATE TABLE custom_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  file_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_type, asset_key)
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_members;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipped_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bestiary ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_biomes ENABLE ROW LEVEL SECURITY;
