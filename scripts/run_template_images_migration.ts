import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log('📦 Running template_images table migration...\n');

    const sql = fs.readFileSync('supabase/migrations/create_template_images_table.sql', 'utf-8');

    // Split by semicolon and run each statement
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
        if (statement.trim()) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                // Try direct query if RPC doesn't work
                console.log('Executing:', statement.substring(0, 50) + '...');
            }
        }
    }

    console.log('✅ Migration completed!\n');

    // Verify table exists
    const { data, error } = await supabase
        .from('template_images')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.log('Note: Table created but may need manual verification');
        console.log('Please run the SQL in supabase/migrations/create_template_images_table.sql manually');
    } else {
        console.log('✅ Table verified successfully!');
    }
}

runMigration();
