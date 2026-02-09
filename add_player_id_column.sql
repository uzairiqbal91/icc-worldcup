-- Add player_id column to template_images table
ALTER TABLE template_images 
ADD COLUMN IF NOT EXISTS player_id INTEGER REFERENCES players(player_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_template_images_player_id ON template_images(player_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'template_images'
ORDER BY ordinal_position;
