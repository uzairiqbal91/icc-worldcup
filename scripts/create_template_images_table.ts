import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTemplateImagesTable() {
    console.log('🔧 Creating template_images table...\n');

    try {
        // First, check if table already exists
        const { data: existingTable, error: checkError } = await supabase
            .from('template_images')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('✅ Table already exists!');
            return;
        }

        // Table doesn't exist, create it using raw SQL
        console.log('📦 Table not found, creating...\n');

        // We'll use the REST API to execute SQL
        const sql = `
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
        `;

        // Try using Supabase Management API
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
                },
                body: JSON.stringify({ query: sql })
            }
        );

        if (response.ok) {
            console.log('✅ Table created successfully via API!\n');
        } else {
            // If API doesn't work, save SQL to file for manual execution
            console.log('⚠️  Could not create table automatically.\n');
            console.log('📝 Saving SQL to file for manual execution...\n');

            const sqlFilePath = path.join(process.cwd(), 'create_template_images.sql');
            fs.writeFileSync(sqlFilePath, sql);

            console.log(`✅ SQL saved to: ${sqlFilePath}\n`);
            console.log('Please run this SQL in Supabase Dashboard → SQL Editor\n');
            console.log('OR use this command:');
            console.log(`psql $DATABASE_URL < ${sqlFilePath}\n`);
        }

        // Verify table was created
        const { data: verifyData, error: verifyError } = await supabase
            .from('template_images')
            .select('id')
            .limit(1);

        if (!verifyError) {
            console.log('✅ Table verified successfully!\n');
        } else {
            console.log('⚠️  Table verification failed. Please create it manually.\n');
            console.log('SQL command:\n');
            console.log(sql);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\n📝 Please run this SQL manually in Supabase Dashboard:\n');
        console.log(`
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
        `);
    }
}

createTemplateImagesTable();
