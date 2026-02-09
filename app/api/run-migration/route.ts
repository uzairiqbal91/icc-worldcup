import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Run database migrations
export async function POST() {
    try {
        // Add template_type column to template_images table
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE template_images ADD COLUMN IF NOT EXISTS template_type TEXT;
                CREATE INDEX IF NOT EXISTS idx_template_images_template_type ON template_images(template_type);
            `
        });

        // If rpc doesn't work, try direct query approach
        if (alterError) {
            // Try using raw SQL through a different approach
            const { error } = await supabase
                .from('template_images')
                .select('template_type')
                .limit(1);

            if (error && error.message.includes('template_type')) {
                return NextResponse.json({
                    success: false,
                    message: 'Column does not exist. Please run the following SQL in Supabase Dashboard SQL Editor:',
                    sql: `
ALTER TABLE template_images ADD COLUMN IF NOT EXISTS template_type TEXT;
CREATE INDEX IF NOT EXISTS idx_template_images_template_type ON template_images(template_type);
                    `.trim()
                }, { status: 400 });
            }

            // Column exists
            return NextResponse.json({
                success: true,
                message: 'Column template_type already exists!'
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully!'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Please run this SQL manually in Supabase Dashboard:',
            sql: `
ALTER TABLE template_images ADD COLUMN IF NOT EXISTS template_type TEXT;
CREATE INDEX IF NOT EXISTS idx_template_images_template_type ON template_images(template_type);
            `.trim()
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'POST to this endpoint to run migrations, or run the following SQL in Supabase Dashboard:',
        sql: `
ALTER TABLE template_images ADD COLUMN IF NOT EXISTS template_type TEXT;
CREATE INDEX IF NOT EXISTS idx_template_images_template_type ON template_images(template_type);
        `.trim()
    });
}
