/**
 * ADD IMAGE URLs TO DATABASE
 *
 * This script:
 * 1. Adds image_url column to teams table
 * 2. Adds face_image_url column to players table
 * 3. Populates all URLs using the format: c{imageId} with p=de&d=high
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Full image URL helper
const getFullImageUrl = (imageId: number | string | undefined | null): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
};

async function addImageUrls() {
    console.log('='.repeat(70));
    console.log('ADDING IMAGE URLs TO DATABASE');
    console.log('='.repeat(70));
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // Step 1: Check if columns exist by trying to select them
        console.log('[1/4] Checking database columns...\n');

        // Try to read teams with image_url
        const { data: teamsCheck, error: teamsError } = await supabase
            .from('teams')
            .select('team_id, image_url')
            .limit(1);

        const teamsHasColumn = !teamsError || !teamsError.message.includes('image_url');

        // Try to read players with face_image_url
        const { data: playersCheck, error: playersError } = await supabase
            .from('players')
            .select('player_id, face_image_url')
            .limit(1);

        const playersHasColumn = !playersError || !playersError.message.includes('face_image_url');

        if (!teamsHasColumn || !playersHasColumn) {
            console.log('❌ Missing columns in database!\n');
            console.log('Please run this SQL in your Supabase SQL Editor:');
            console.log('https://supabase.com/dashboard -> SQL Editor\n');
            console.log('-'.repeat(50));
            console.log(`
-- Add image_url column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add face_image_url column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS face_image_url TEXT;
            `);
            console.log('-'.repeat(50));
            console.log('\nAfter running the SQL, run this script again.');
            return;
        }

        console.log('   ✓ teams.image_url column exists');
        console.log('   ✓ players.face_image_url column exists\n');

        // Step 2: Update teams with image URLs
        console.log('[2/4] Updating TEAM image URLs...\n');

        const { data: teams, error: fetchTeamsError } = await supabase
            .from('teams')
            .select('team_id, name, short_name, image_id, image_url');

        if (fetchTeamsError) {
            console.log(`   ❌ Error fetching teams: ${fetchTeamsError.message}`);
        } else if (teams && teams.length > 0) {
            let updatedTeams = 0;
            for (const team of teams) {
                if (team.image_id && !team.image_url) {
                    const imageUrl = getFullImageUrl(team.image_id);
                    const { error: updateError } = await supabase
                        .from('teams')
                        .update({ image_url: imageUrl })
                        .eq('team_id', team.team_id);

                    if (!updateError) {
                        console.log(`   ✓ ${team.name} (${team.short_name})`);
                        console.log(`     image_id: ${team.image_id}`);
                        console.log(`     image_url: ${imageUrl}`);
                        updatedTeams++;
                    } else {
                        console.log(`   ❌ ${team.name}: ${updateError.message}`);
                    }
                } else if (team.image_url) {
                    console.log(`   ✓ ${team.name} - already has image_url`);
                } else {
                    console.log(`   ⚠ ${team.name} - no image_id`);
                }
            }
            console.log(`\n   Updated ${updatedTeams} team(s)\n`);
        } else {
            console.log('   No teams found in database\n');
        }

        // Step 3: Update players with face image URLs
        console.log('[3/4] Updating PLAYER face image URLs...\n');

        const { data: players, error: fetchPlayersError } = await supabase
            .from('players')
            .select('player_id, name, face_image_id, face_image_url');

        if (fetchPlayersError) {
            console.log(`   ❌ Error fetching players: ${fetchPlayersError.message}`);
        } else if (players && players.length > 0) {
            let updatedPlayers = 0;
            for (const player of players) {
                if (player.face_image_id && !player.face_image_url) {
                    const imageUrl = getFullImageUrl(player.face_image_id);
                    const { error: updateError } = await supabase
                        .from('players')
                        .update({ face_image_url: imageUrl })
                        .eq('player_id', player.player_id);

                    if (!updateError) {
                        console.log(`   ✓ ${player.name}`);
                        console.log(`     face_image_id: ${player.face_image_id}`);
                        console.log(`     face_image_url: ${imageUrl}`);
                        updatedPlayers++;
                    } else {
                        console.log(`   ❌ ${player.name}: ${updateError.message}`);
                    }
                } else if (player.face_image_url) {
                    console.log(`   ✓ ${player.name} - already has face_image_url`);
                } else {
                    console.log(`   ⚠ ${player.name} - no face_image_id`);
                }
            }
            console.log(`\n   Updated ${updatedPlayers} player(s)\n`);
        } else {
            console.log('   No players found in database\n');
        }

        // Step 4: Show summary
        console.log('[4/4] DATABASE SUMMARY\n');
        console.log('='.repeat(70));

        const { data: finalTeams } = await supabase
            .from('teams')
            .select('team_id, name, short_name, image_id, image_url');

        console.log('\nTEAMS:');
        console.log('-'.repeat(50));
        for (const team of finalTeams || []) {
            console.log(`${team.name} (${team.short_name}):`);
            console.log(`  image_id: ${team.image_id || 'N/A'}`);
            console.log(`  image_url: ${team.image_url || 'N/A'}`);
        }

        const { data: finalPlayers } = await supabase
            .from('players')
            .select('player_id, name, face_image_id, face_image_url')
            .limit(10);

        console.log('\nPLAYERS (first 10):');
        console.log('-'.repeat(50));
        for (const player of finalPlayers || []) {
            console.log(`${player.name}:`);
            console.log(`  face_image_id: ${player.face_image_id || 'N/A'}`);
            console.log(`  face_image_url: ${player.face_image_url || 'N/A'}`);
        }

        // Count totals
        const { count: totalTeams } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });

        const { count: teamsWithUrl } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .not('image_url', 'is', null);

        const { count: totalPlayers } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

        const { count: playersWithUrl } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .not('face_image_url', 'is', null);

        console.log('\n' + '='.repeat(70));
        console.log('TOTALS:');
        console.log(`  Teams: ${teamsWithUrl}/${totalTeams} have image_url`);
        console.log(`  Players: ${playersWithUrl}/${totalPlayers} have face_image_url`);
        console.log('='.repeat(70));

        console.log('\n✅ DONE!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

addImageUrls();
