-- ═══════════════════════════════════════════════════════════
-- RESTANQUES — Schema Supabase
-- Exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════

-- Session de jeu partagée
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seed INTEGER NOT NULL,
  collected_nodes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- Joueurs connectés
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('Jisse', 'Mélanie')),
  emoji TEXT NOT NULL,
  x INTEGER DEFAULT 12,
  y INTEGER DEFAULT 8,
  hp INTEGER DEFAULT 20,
  max_hp INTEGER DEFAULT 20,
  lvl INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  inventory JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  cards JSONB DEFAULT '[]'::jsonb,
  unlocked_biomes JSONB DEFAULT '["garrigue"]'::jsonb,
  bosses_defeated JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, name)
);

-- RLS ouvert (jeu privé entre 2 joueurs)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);

-- Active Realtime sur les deux tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
