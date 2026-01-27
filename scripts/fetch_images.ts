/**
 * FETCH AND SAVE PLAYER & TEAM IMAGES
 *
 * Fetches live match data, gets all player and team imageIds,
 * then saves the data to the database.
 *
 * Image URL format: https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c{imageId}/i.jpg?p=de&d=high
 * - 'c' prefix is added to imageId
 * - p=de (default size)
 * - d=high (quality)
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const api = axios.create({
    baseURL: `https://${RAPIDAPI_HOST}`,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
});

// Full image URL helper - format: c{imageId} with p=de&d=high
const getFullImageUrl = (imageId: number | string | undefined | null): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
};

async function fetchAndSaveImages() {
    console.log('='.repeat(70));
    console.log('FETCHING PLAYER & TEAM IMAGES FROM LIVE MATCHES');
    console.log('='.repeat(70));
    console.log(`Time: ${new Date().toISOString()}\n`);

    try {
        // 1. Get live matches
        console.log('[1/4] Fetching live matches...');
        const liveRes = await api.get('/matches/v1/live');
        const liveData = liveRes.data;

        // Find international matches
        const internationalMatches: any[] = [];
        for (const type of liveData.typeMatches || []) {
            if (type.matchType?.toLowerCase() === 'international') {
                for (const series of type.seriesMatches || []) {
                    const matches = series.seriesAdWrapper?.matches || [];
                    for (const m of matches) {
                        if (m.matchInfo) {
                            internationalMatches.push(m.matchInfo);
                        }
                    }
                }
            }
        }

        console.log(`   Found ${internationalMatches.length} international match(es)\n`);

        if (internationalMatches.length === 0) {
            console.log('No international matches found. Exiting.');
            return;
        }

        // Collect all images
        const teamImages: { name: string; imageId: any; imageUrl: string | null }[] = [];
        const playerImages: { name: string; faceImageId: any; imageUrl: string | null }[] = [];

        // Process each match
        for (const matchInfo of internationalMatches) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`MATCH: ${matchInfo.team1?.teamSName || 'Team1'} vs ${matchInfo.team2?.teamSName || 'Team2'}`);
            console.log(`Match ID: ${matchInfo.matchId}`);
            console.log(`State: ${matchInfo.state}`);
            console.log('='.repeat(70));

            // 2. Save team data
            console.log('\n[2/4] Saving TEAM data...');
            const teams = [matchInfo.team1, matchInfo.team2].filter(Boolean);

            for (const team of teams) {
                const teamImageId = team.imageId || team.imageid;
                const imageUrl = getFullImageUrl(teamImageId);

                teamImages.push({
                    name: team.teamSName || team.teamName,
                    imageId: teamImageId,
                    imageUrl
                });

                const teamData = {
                    team_id: team.teamId || team.teamid,
                    name: team.teamName || team.teamname,
                    short_name: team.teamSName || team.teamsname,
                    image_id: teamImageId || null
                };

                const { error } = await supabase
                    .from('teams')
                    .upsert(teamData, { onConflict: 'team_id' });

                if (error) {
                    console.log(`   ❌ Error saving ${team.teamSName}: ${error.message}`);
                } else {
                    console.log(`   ✓ ${team.teamSName || team.teamName}`);
                    console.log(`     Image ID: ${teamImageId || 'N/A'}`);
                    console.log(`     Image URL: ${imageUrl || 'N/A'}`);
                }
            }

            // 3. Get scorecard for player details
            console.log('\n[3/4] Fetching scorecard for player data...');
            const scardRes = await api.get(`/mcenter/v1/${matchInfo.matchId}/scard`);
            const scorecard = scardRes.data;

            if (!scorecard?.scorecard) {
                console.log('   No scorecard data available yet.');
                continue;
            }

            // Collect all player IDs from scorecard
            const playerIds = new Set<number>();
            for (const innings of scorecard.scorecard || []) {
                for (const batsman of innings.batsman || []) {
                    if (batsman.id) playerIds.add(batsman.id);
                }
                for (const bowler of innings.bowler || []) {
                    if (bowler.id) playerIds.add(bowler.id);
                }
            }

            console.log(`   Found ${playerIds.size} players\n`);

            // 4. Fetch and save player data
            console.log('[4/4] Fetching and saving PLAYER data...');
            let savedCount = 0;
            let errorCount = 0;

            for (const playerId of playerIds) {
                try {
                    // Get player profile for faceImageId
                    const playerRes = await api.get(`/stats/v1/player/${playerId}`);
                    const profile = playerRes.data;

                    const faceImageId = profile.faceImageId;
                    const imageUrl = getFullImageUrl(faceImageId);

                    playerImages.push({
                        name: profile.name,
                        faceImageId,
                        imageUrl
                    });

                    // Find which team this player belongs to
                    let teamId = null;
                    for (const innings of scorecard.scorecard || []) {
                        const allPlayers = [...(innings.batsman || []), ...(innings.bowler || [])];
                        const found = allPlayers.find((p: any) => p.id === playerId);
                        if (found) {
                            const isBatsman = (innings.batsman || []).some((p: any) => p.id === playerId);
                            if (isBatsman) {
                                teamId = innings.batteamid || teams[innings.inningsid === 1 ? 0 : 1]?.teamId;
                            } else {
                                teamId = teams[innings.inningsid === 1 ? 1 : 0]?.teamId;
                            }
                            break;
                        }
                    }

                    const playerData = {
                        player_id: playerId,
                        name: profile.name || profile.nickName,
                        team_id: teamId,
                        role: profile.role || null,
                        face_image_id: faceImageId || null,
                        batting_style: profile.bat || null,
                        bowling_style: profile.bowl || null
                    };

                    const { error } = await supabase
                        .from('players')
                        .upsert(playerData, { onConflict: 'player_id' });

                    if (error) {
                        console.log(`   ❌ ${profile.name}: ${error.message}`);
                        errorCount++;
                    } else {
                        console.log(`   ✓ ${profile.name}`);
                        console.log(`     Face Image ID: ${faceImageId || 'N/A'}`);
                        console.log(`     Image URL: ${imageUrl || 'N/A'}`);
                        savedCount++;
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (err: any) {
                    console.log(`   ❌ Player ${playerId}: ${err.message}`);
                    errorCount++;
                }
            }

            console.log(`\n   Summary: ${savedCount} saved, ${errorCount} errors`);
        }

        // Show all collected images
        console.log('\n' + '='.repeat(70));
        console.log('ALL COLLECTED IMAGES');
        console.log('='.repeat(70));

        console.log('\nTEAM IMAGES:');
        console.log('-'.repeat(50));
        for (const team of teamImages) {
            console.log(`${team.name}:`);
            console.log(`  Image ID: ${team.imageId || 'N/A'}`);
            console.log(`  URL: ${team.imageUrl || 'N/A'}`);
        }

        console.log('\nPLAYER IMAGES:');
        console.log('-'.repeat(50));
        for (const player of playerImages) {
            console.log(`${player.name}:`);
            console.log(`  Face Image ID: ${player.faceImageId || 'N/A'}`);
            console.log(`  URL: ${player.imageUrl || 'N/A'}`);
        }

        // Database summary
        console.log('\n' + '='.repeat(70));
        console.log('DATABASE SUMMARY');
        console.log('='.repeat(70));

        const { data: teamsData } = await supabase.from('teams').select('team_id, name, short_name, image_id');
        const { data: playersData } = await supabase.from('players').select('player_id, name, face_image_id');

        console.log(`\nTeams saved: ${teamsData?.length || 0}`);
        for (const team of teamsData || []) {
            const url = getFullImageUrl(team.image_id);
            console.log(`  - ${team.name} (${team.short_name}): ${url || 'No image'}`);
        }

        console.log(`\nPlayers saved: ${playersData?.length || 0}`);
        const playersWithImages = playersData?.filter(p => p.face_image_id) || [];
        console.log(`Players with face_image_id: ${playersWithImages.length}`);

        console.log('\n✅ DONE! API is working correctly.');
        console.log('\nTo view images, use the URL format:');
        console.log('https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c{imageId}/i.jpg?p=de&d=high');

    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

fetchAndSaveImages();
