-- Add template_type column to template_images table
-- This allows filtering images by specific template (toss, powerplay, milestone, etc.)
ALTER TABLE template_images ADD COLUMN IF NOT EXISTS template_type TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_images_template_type ON template_images(template_type);

-- Update existing records to have a default template_type based on milestone
-- Images with milestone values are milestone templates
UPDATE template_images SET template_type = 'milestone' WHERE milestone IS NOT NULL AND template_type IS NULL;
