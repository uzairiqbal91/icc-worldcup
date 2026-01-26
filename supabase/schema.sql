-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    match_id INTEGER UNIQUE NOT NULL, -- Cricbuzz Match ID
    series_id INTEGER,
    series_name TEXT,
    match_desc TEXT,
    match_format TEXT,
    start_time BIGINT, -- Epoch time
    end_time BIGINT,
    status TEXT, -- 'Upcoming', 'Live', 'Complete', 'Abandoned'
    state TEXT,
    venue JSONB,
    team1_id INTEGER,
    team2_id INTEGER,
    winner_team_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    image_id INTEGER, -- For logo fetching (use /api/proxy-image?id={image_id} for full URL)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(team_id),
    role TEXT,
    face_image_id INTEGER, -- For player image ID
    face_image_url TEXT, -- Full image URL
    batting_style TEXT,
    bowling_style TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add face_image_url column if upgrading from old schema
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS face_image_url TEXT;
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create scores table (snapshots of usage)
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(match_id),
    team_id INTEGER REFERENCES teams(team_id),
    innings_id INTEGER, -- 1, 2, 3, 4
    runs INTEGER,
    wickets INTEGER,
    overs NUMERIC(4,1),
    crr NUMERIC(5,2),
    target INTEGER,
    partnership JSONB, -- Current partnership stats
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table (The Core Automation Log)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(match_id),
    event_type TEXT NOT NULL, -- 'TOSS', 'PLAYING_XI', 'POWERPLAY', 'MILESTONE', 'INNINGS_END', 'MATCH_END'
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payload JSONB NOT NULL, -- Stores rich data (images, stats)
    is_processed BOOLEAN DEFAULT FALSE -- Application usage flag
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_events_match_id ON events(match_id);
