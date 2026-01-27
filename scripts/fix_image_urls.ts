/**
 * FIX IMAGE URLs - Use Public Cricbuzz CDN
 *
 * Updates all image URLs to use the public Cricbuzz CDN
 * which doesn't require API authentication.
 *
 * Public URL format: https://static.cricbuzz.com/a/img/v1/i1/c{imageId}/i.jpg
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public Cricbuzz CDN URL - NO API KEY REQUIRED
const getPublicImageUrl = (imageId: number | string | undefined | null): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `https://static.cricbuzz.com/a/img/v1/i1/c${imageId}/i.jpg`;
};

async function fixImageUrls() {
    console.log('='.repeat(70));
    console.log('FIXING IMAGE URLs - Using Public Cricbuzz CDN');
    console.log('='.repeat(70));
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // Update teams
        console.log('[1/2] Updating TEAM image URLs...\n');

        const { data: teams } = await supabase
            .from('teams')
            .select('team_id, name, short_name, image_id');

        let updatedTeams = 0;
        for (const team of teams || []) {
            if (team.image_id) {
                const imageUrl = getPublicImageUrl(team.image_id);
                const { error } = await supabase
                    .from('teams')
                    .update({ image_url: imageUrl })
                    .eq('team_id', team.team_id);

                if (!error) {
                    console.log(`   ✓ ${team.name} (${team.short_name})`);
                    console.log(`     ${imageUrl}`);
                    updatedTeams++;
                }
            }
        }
        console.log(`\n   Updated ${updatedTeams} team(s)\n`);

        // Update players
        console.log('[2/2] Updating PLAYER face image URLs...\n');

        const { data: players } = await supabase
            .from('players')
            .select('player_id, name, face_image_id');

        let updatedPlayers = 0;
        for (const player of players || []) {
            if (player.face_image_id) {
                const imageUrl = getPublicImageUrl(player.face_image_id);
                const { error } = await supabase
                    .from('players')
                    .update({ face_image_url: imageUrl })
                    .eq('player_id', player.player_id);

                if (!error) {
                    console.log(`   ✓ ${player.name}`);
                    console.log(`     ${imageUrl}`);
                    updatedPlayers++;
                }
            }
        }
        console.log(`\n   Updated ${updatedPlayers} player(s)\n`);

        // Summary
        console.log('='.repeat(70));
        console.log('DONE! All URLs now use public Cricbuzz CDN');
        console.log('='.repeat(70));
        console.log('\nYou can now open these URLs directly in browser!');
        console.log('\nSample URLs to test:');

        const { data: sampleTeam } = await supabase
            .from('teams')
            .select('name, image_url')
            .limit(1)
            .single();

        const { data: samplePlayer } = await supabase
            .from('players')
            .select('name, face_image_url')
            .limit(1)
            .single();

        if (sampleTeam) {
            console.log(`\nTeam (${sampleTeam.name}):`);
            console.log(`  ${sampleTeam.image_url}`);
        }
        if (samplePlayer) {
            console.log(`\nPlayer (${samplePlayer.name}):`);
            console.log(`  ${samplePlayer.face_image_url}`);
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

fixImageUrls();
