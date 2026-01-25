import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const client = axios.create({
    baseURL: `https://${RAPIDAPI_HOST}`,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY!,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
});

// Helper to save responses
function saveResponse(filename: string, data: any) {
    const outputDir = path.resolve(__dirname, '../api_responses');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(data, null, 2)
    );
    console.log(`Saved: ${filename}`);
}

async function exploreAPI() {
    console.log('='.repeat(60));
    console.log('CRICBUZZ API EXPLORER');
    console.log('='.repeat(60));
    console.log(`API Key exists: ${!!RAPIDAPI_KEY}`);
    console.log(`Host: ${RAPIDAPI_HOST}`);
    console.log('');

    try {
        // 1. LIVE MATCHES
        console.log('\n[1] Fetching Live Matches...');
        const liveRes = await client.get('/matches/v1/live');
        saveResponse('01_live_matches.json', liveRes.data);

        // Extract matches for testing
        const allMatches: any[] = [];
        let liveMatchId: number | null = null;
        let recentMatchId: number | null = null;
        let upcomingMatchId: number | null = null;
        let t20MatchId: number | null = null;

        if (liveRes.data.typeMatches) {
            for (const type of liveRes.data.typeMatches) {
                const matchType = type.matchType;
                if (type.seriesMatches) {
                    for (const series of type.seriesMatches) {
                        if (series.seriesAdWrapper?.matches) {
                            for (const match of series.seriesAdWrapper.matches) {
                                const info = match.matchInfo;
                                if (info) {
                                    allMatches.push({ ...info, matchType });

                                    // Categorize
                                    if (info.state === 'In Progress') {
                                        liveMatchId = info.matchId;
                                        if (matchType === 'T20') t20MatchId = info.matchId;
                                    } else if (info.state === 'Complete') {
                                        recentMatchId = info.matchId;
                                    } else if (info.state === 'Upcoming' || info.state === 'Preview') {
                                        upcomingMatchId = info.matchId;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`\nFound ${allMatches.length} matches:`);
        allMatches.forEach(m => {
            const teams = `${m.team1?.teamSName || 'TBA'} vs ${m.team2?.teamSName || 'TBA'}`;
            console.log(`  [${m.state}] ${teams} (ID: ${m.matchId}) - ${m.matchType}`);
        });

        // Pick best match for testing
        const testMatchId = liveMatchId || recentMatchId || upcomingMatchId || allMatches[0]?.matchId;

        if (!testMatchId) {
            console.log('\nNo matches found to test with!');
            return;
        }

        console.log(`\n>>> Using Match ID ${testMatchId} for detailed testing <<<\n`);

        // 2. MATCH SCORECARD
        console.log('[2] Fetching Match Scorecard...');
        try {
            const scardRes = await client.get(`/mcenter/v1/${testMatchId}/scard`);
            saveResponse('02_scorecard.json', scardRes.data);

            // Analyze scorecard structure
            console.log('   Scorecard keys:', Object.keys(scardRes.data));
            if (scardRes.data.scoreCard) {
                console.log('   Innings count:', scardRes.data.scoreCard.length);
                scardRes.data.scoreCard.forEach((inn: any, i: number) => {
                    console.log(`   Innings ${i + 1}: ${inn.batTeamDetails?.batTeamName} - ${inn.score}/${inn.wicketsNbr} (${inn.overs} ov)`);
                });
            }
            if (scardRes.data.tossResults) {
                console.log(`   Toss: ${scardRes.data.tossResults.tossWinnerName} won, elected to ${scardRes.data.tossResults.decision}`);
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 3. MATCH INFO
        console.log('\n[3] Fetching Match Info...');
        try {
            const infoRes = await client.get(`/mcenter/v1/${testMatchId}`);
            saveResponse('03_match_info.json', infoRes.data);
            console.log('   Match Info keys:', Object.keys(infoRes.data));
            if (infoRes.data.matchInfo) {
                console.log('   matchInfo keys:', Object.keys(infoRes.data.matchInfo));
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 4. MATCH COMMENTARY
        console.log('\n[4] Fetching Match Commentary...');
        try {
            const commRes = await client.get(`/mcenter/v1/${testMatchId}/comm`);
            saveResponse('04_commentary.json', commRes.data);
            console.log('   Commentary keys:', Object.keys(commRes.data));
            if (commRes.data.commentaryList) {
                console.log('   Commentary entries:', commRes.data.commentaryList.length);
                // Show sample commentary
                const sample = commRes.data.commentaryList[0];
                if (sample) {
                    console.log('   Sample entry keys:', Object.keys(sample));
                }
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 5. MATCH OVERS
        console.log('\n[5] Fetching Match Overs...');
        try {
            const oversRes = await client.get(`/mcenter/v1/${testMatchId}/overs`);
            saveResponse('05_overs.json', oversRes.data);
            console.log('   Overs data keys:', Object.keys(oversRes.data));
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 6. MATCH HIGHLIGHTS
        console.log('\n[6] Fetching Match Highlights...');
        try {
            const hlRes = await client.get(`/mcenter/v1/${testMatchId}/hlghts`);
            saveResponse('06_highlights.json', hlRes.data);
            console.log('   Highlights keys:', Object.keys(hlRes.data));
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 7. RECENT MATCHES (for finding more test data)
        console.log('\n[7] Fetching Recent Matches...');
        try {
            const recentRes = await client.get('/matches/v1/recent');
            saveResponse('07_recent_matches.json', recentRes.data);
            console.log('   Recent matches response keys:', Object.keys(recentRes.data));
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 8. UPCOMING MATCHES
        console.log('\n[8] Fetching Upcoming Matches...');
        try {
            const upcomingRes = await client.get('/matches/v1/upcoming');
            saveResponse('08_upcoming_matches.json', upcomingRes.data);
            console.log('   Upcoming matches response keys:', Object.keys(upcomingRes.data));
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 9. SERIES LIST
        console.log('\n[9] Fetching Series List...');
        try {
            const seriesRes = await client.get('/series/v1/international');
            saveResponse('09_series_list.json', seriesRes.data);
            console.log('   Series list keys:', Object.keys(seriesRes.data));

            // Find ICC T20 World Cup or similar
            if (seriesRes.data.seriesMapProto) {
                for (const proto of seriesRes.data.seriesMapProto) {
                    if (proto.series) {
                        for (const s of proto.series) {
                            if (s.seriesName?.toLowerCase().includes('t20') ||
                                s.seriesName?.toLowerCase().includes('world cup') ||
                                s.seriesName?.toLowerCase().includes('icc')) {
                                console.log(`   Found Series: ${s.seriesName} (ID: ${s.seriesId})`);
                            }
                        }
                    }
                }
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 10. Get a completed match for full data exploration
        if (recentMatchId && recentMatchId !== testMatchId) {
            console.log(`\n[10] Fetching Completed Match (${recentMatchId}) for full data...`);
            try {
                const compScard = await client.get(`/mcenter/v1/${recentMatchId}/scard`);
                saveResponse('10_completed_scorecard.json', compScard.data);
                console.log('   Completed match scorecard saved');

                // Check for Player of Match
                if (compScard.data.matchHeader?.playersOfTheMatch) {
                    console.log('   Player of Match:', compScard.data.matchHeader.playersOfTheMatch);
                }
            } catch (e: any) {
                console.log(`   Error: ${e.message}`);
            }
        }

        // 11. Player Stats endpoint
        console.log('\n[11] Testing Player Stats endpoint...');
        try {
            // Find a player ID from scorecard
            const scardRes = await client.get(`/mcenter/v1/${testMatchId}/scard`);
            const playerId = scardRes.data.scoreCard?.[0]?.batTeamDetails?.batsmenData?.[0]?.batId;

            if (playerId) {
                console.log(`   Found player ID: ${playerId}`);
                const playerRes = await client.get(`/stats/v1/player/${playerId}`);
                saveResponse('11_player_stats.json', playerRes.data);
                console.log('   Player stats keys:', Object.keys(playerRes.data));
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        // 12. Images endpoint test
        console.log('\n[12] Testing Image endpoints...');
        try {
            // Test image fetch
            const scardRes = await client.get(`/mcenter/v1/${testMatchId}/scard`);
            const imageId = scardRes.data.team1?.imageId || scardRes.data.matchInfo?.team1?.imageId;

            if (imageId) {
                console.log(`   Team Image ID: ${imageId}`);
                const imgRes = await client.get(`/img/v1/i1/c${imageId}/i.jpg`, {
                    responseType: 'arraybuffer'
                });
                console.log(`   Image fetch successful: ${imgRes.status}, Size: ${imgRes.data.length} bytes`);
            }
        } catch (e: any) {
            console.log(`   Error: ${e.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('API EXPLORATION COMPLETE');
        console.log('Check ./api_responses/ folder for full JSON responses');
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error('Fatal error:', error.response?.data || error.message);
    }
}

exploreAPI();
