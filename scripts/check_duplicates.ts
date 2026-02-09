import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExactDuplicates() {
    const { data: images, error } = await supabase
        .from('template_images')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Checking for EXACT duplicates (same team, type, template, milestone, AND image_url):\n');

    const seen = new Map<string, any>();
    const duplicates: any[] = [];

    images?.forEach(img => {
        const key = `${img.team_id}|${img.image_type}|${img.template_type}|${img.milestone}|${img.image_url}`;

        if (seen.has(key)) {
            duplicates.push({
                original: seen.get(key),
                duplicate: img
            });
        } else {
            seen.set(key, img);
        }
    });

    if (duplicates.length === 0) {
        console.log('✅ No exact duplicates found!');
        console.log('\nNote: If you\'re seeing the same image in multiple places, it might be:');
        console.log('  - Same image saved for different templates (toss vs innings_end)');
        console.log('  - Same image saved for different teams');
        console.log('  - Image data URL changes slightly each time you upload');
    } else {
        console.log(`❌ Found ${duplicates.length} exact duplicates:\n`);
        duplicates.forEach(({ original, duplicate }) => {
            console.log(`Original ID: ${original.id} (${original.created_at})`);
            console.log(`Duplicate ID: ${duplicate.id} (${duplicate.created_at})`);
            console.log(`  Team: ${duplicate.team_id}, Type: ${duplicate.image_type}, Template: ${duplicate.template_type}\n`);
        });
    }

    // Check if same image_url appears with same team/type/template
    console.log('\n\nChecking for same-context duplicates (same team + type + template, regardless of URL):');
    const contextMap = new Map<string, any[]>();

    images?.forEach(img => {
        const contextKey = `${img.team_id}|${img.image_type}|${img.template_type}|${img.milestone}`;
        if (!contextMap.has(contextKey)) {
            contextMap.set(contextKey, []);
        }
        contextMap.get(contextKey)!.push(img);
    });

    let contextDupes = 0;
    contextMap.forEach((imgs, key) => {
        if (imgs.length > 1) {
            contextDupes++;
            const [teamId, imageType, templateType, milestone] = key.split('|');
            console.log(`\n🔴 ${imgs.length} images for Team ${teamId}, Type: ${imageType}, Template: ${templateType || 'null'}:`);
            imgs.forEach(img => {
                const urlPreview = img.image_url.substring(0, 60);
                console.log(`   ID ${img.id}: ${urlPreview}... (${img.created_at})`);
            });
        }
    });

    if (contextDupes === 0) {
        console.log('✅ No same-context duplicates');
    }
}

checkExactDuplicates().catch(console.error);
