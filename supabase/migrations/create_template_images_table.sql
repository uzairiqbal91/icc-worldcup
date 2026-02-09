-- Create template_images table to store uploaded images with team and milestone associations
CREATE TABLE IF NOT EXISTS template_images (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    image_url TEXT NOT NULL, -- Base64 data URL or external URL
    image_type TEXT NOT NULL, -- 'template' or 'logo'
    milestone TEXT, -- Optional: '50', '100', '150', '200', etc. for milestone templates
    description TEXT, -- Optional description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_images_team_id ON template_images(team_id);
CREATE INDEX IF NOT EXISTS idx_template_images_type ON template_images(image_type);
CREATE INDEX IF NOT EXISTS idx_template_images_milestone ON template_images(milestone);
