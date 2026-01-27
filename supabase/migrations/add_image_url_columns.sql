-- Migration: Add image_url columns to teams and players tables
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Add image_url column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add face_image_url column to players table (if not exists)
ALTER TABLE players ADD COLUMN IF NOT EXISTS face_image_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_image_id ON teams(image_id);
CREATE INDEX IF NOT EXISTS idx_players_face_image_id ON players(face_image_id);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'teams' AND column_name IN ('image_id', 'image_url');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players' AND column_name IN ('face_image_id', 'face_image_url');
