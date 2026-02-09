
CREATE TABLE IF NOT EXISTS template_images (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    image_url TEXT NOT NULL,
    image_type TEXT NOT NULL,
    milestone TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_images_team_id ON template_images(team_id);
CREATE INDEX IF NOT EXISTS idx_template_images_type ON template_images(image_type);
CREATE INDEX IF NOT EXISTS idx_template_images_milestone ON template_images(milestone);
        