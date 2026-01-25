/**
 * Test Script: Fetch all event data and save to database
 *
 * This script tests all event types:
 * 1. PLAYING_XI - Team players with captain images, team logos
 * 2. TOSS - Winner, decision, captain images
 * 3. POWERPLAY_END - Runs, wickets in powerplay, team logo
 * 4. MILESTONE - Player 50/100/150, player image, team logo
 * 5. INNINGS_END - Team image, runs, wickets, top batsmen/bowlers
 * 6. INNINGS_BREAK - Target, captain image, team logos
 * 7. MATCH_END - Result, player of match, team logos
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

// Helper to generate image proxy URL
const getImageUrl = (imageId: number | string | undefined) => {
    if (!imageId || imageId === 0) return null;
    return `/api/proxy-image?id=${imageId}`;
};

// Helper to split name into first/last
const splitName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
    };
};

// Helper to parse toss status
const parseTossStatus = (tossStatus: string) => {
    // "India opt to bowl" -> { winner: "India", decision: "bowl" }
    const match = tossStatus?.match(/^(.+?)\s+opt\s+to\s+(\w+)$/i);
    if (match) {
        return { winner: match[1], decision: match[2].toLowerCase() };
    }
    // Fallback: "India won the toss and elected to bowl"
    const match2 = tossStatus?.match(/^(.+?)\s+won.*(?:elected|chose)\s+to\s+(\w+)/i);
    if (match2) {
        return { winner: match2[1], decision: match2[2].toLowerCase() };
    }
    return { winner: tossStatus, decision: 'unknown' };
};

async function main() {
    console.log('='.repeat(70));
    console.log('ICC T20 WORLD CUP - EVENT DATA TEST');
    console.log('='.repeat(70));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    // Use a completed international T20 match for testing
    const TEST_MATCH_ID = 121406; // India vs New Zealand 3rd T20I

    try {
        // ============================================================
        // STEP 1: Fetch all required data from API
        // ============================================================
        console.log('[1/4] Fetching data from API...');

        const [liveRes, scardRes, infoRes, leanbackRes] = await Promise.all([
            api.get('/matches/v1/live'),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/scard`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/leanback`),
        ]);

        const liveData = liveRes.data;
        const scorecard = scardRes.data;
        const matchInfo = infoRes.data;
        const leanback = leanbackRes.data;

        console.log('   ✓ Live matches fetched');
        console.log('   ✓ Scorecard fetched');
        console.log('   ✓ Match info fetched');
        console.log('   ✓ Leanback fetched');

        // Find match in live data to get team imageIds
        let team1ImageId = 0;
        let team2ImageId = 0;
        let matchImageId = matchInfo.matchimageid || 0;

        for (const type of liveData.typeMatches || []) {
            for (const series of type.seriesMatches || []) {
                const matches = series.seriesAdWrapper?.matches || [];
                for (const m of matches) {
                    if (m.matchInfo?.matchId === TEST_MATCH_ID) {
                        team1ImageId = m.matchInfo.team1?.imageId || 0;
                        team2ImageId = m.matchInfo.team2?.imageId || 0;
                        break;
                    }
                }
            }
        }

        // Fetch player profiles for captains (to get faceImageId)
        const innings1 = scorecard.scorecard?.[0];
        const innings2 = scorecard.scorecard?.[1];

        // Find captains from scorecard
        const team1Captain = innings1?.batsman?.find((p: any) => p.iscaptain);
        const team2Captain = innings2?.batsman?.find((p: any) => p.iscaptain);

        let team1CaptainProfile: any = null;
        let team2CaptainProfile: any = null;

        if (team1Captain?.id) {
            try {
                const res = await api.get(`/stats/v1/player/${team1Captain.id}`);
                team1CaptainProfile = res.data;
                console.log(`   ✓ Team 1 captain profile fetched: ${team1CaptainProfile.name}`);
            } catch (e) {
                console.log(`   ⚠ Could not fetch team 1 captain profile`);
            }
        }

        if (team2Captain?.id) {
            try {
                const res = await api.get(`/stats/v1/player/${team2Captain.id}`);
                team2CaptainProfile = res.data;
                console.log(`   ✓ Team 2 captain profile fetched: ${team2CaptainProfile.name}`);
            } catch (e) {
                console.log(`   ⚠ Could not fetch team 2 captain profile`);
            }
        }

        // ============================================================
        // STEP 2: Prepare all event payloads
        // ============================================================
        console.log('\n[2/4] Preparing event payloads...');

        const events: Array<{
            match_id: number;
            event_type: string;
            payload: any;
        }> = [];

        // ----- EVENT 1: PLAYING_XI -----
        console.log('\n   --- PLAYING_XI ---');

        const formatPlayer = (p: any, captainProfile: any) => {
            const nameParts = splitName(p.name);
            const isCaptain = p.iscaptain || false;
            return {
                id: p.id,
                name: p.name,
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                role: p.role || 'Unknown',
                image: isCaptain && captainProfile?.faceImageId
                    ? getImageUrl(captainProfile.faceImageId)
                    : getImageUrl(p.imageid),
                isCaptain: isCaptain,
                isKeeper: p.iskeeper || false,
                runs: p.runs,
                balls: p.balls
            };
        };

        const playingXIPayload = {
            team1: {
                id: matchInfo.team1?.teamid,
                name: innings1?.batteamname || matchInfo.team1?.teamname,
                shortName: innings1?.batteamsname || matchInfo.team1?.teamsname,
                logo: getImageUrl(team1ImageId),
                players: innings1?.batsman?.map((p: any) => formatPlayer(p, team1CaptainProfile)) || [],
                captain: team1Captain ? {
                    name: team1Captain.name,
                    ...splitName(team1Captain.name),
                    image: getImageUrl(team1CaptainProfile?.faceImageId)
                } : null
            },
            team2: {
                id: matchInfo.team2?.teamid,
                name: innings2?.batteamname || matchInfo.team2?.teamname,
                shortName: innings2?.batteamsname || matchInfo.team2?.teamsname,
                logo: getImageUrl(team2ImageId),
                players: innings2?.batsman?.map((p: any) => formatPlayer(p, team2CaptainProfile)) || [],
                captain: team2Captain ? {
                    name: team2Captain.name,
                    ...splitName(team2Captain.name),
                    image: getImageUrl(team2CaptainProfile?.faceImageId)
                } : null
            }
        };

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'PLAYING_XI',
            payload: playingXIPayload
        });
        console.log(`   ✓ PLAYING_XI: ${playingXIPayload.team1.players.length} + ${playingXIPayload.team2.players.length} players`);

        // ----- EVENT 2: TOSS -----
        console.log('\n   --- TOSS ---');

        const tossInfo = parseTossStatus(matchInfo.tossstatus);
        const tossPayload = {
            winner: tossInfo.winner,
            decision: tossInfo.decision,
            text: matchInfo.tossstatus,
            tossImage: getImageUrl(matchImageId),
            team1: {
                name: matchInfo.team1?.teamname,
                logo: getImageUrl(team1ImageId),
                captain: team1Captain ? {
                    name: team1Captain.name,
                    ...splitName(team1Captain.name),
                    image: getImageUrl(team1CaptainProfile?.faceImageId)
                } : null
            },
            team2: {
                name: matchInfo.team2?.teamname,
                logo: getImageUrl(team2ImageId),
                captain: team2Captain ? {
                    name: team2Captain.name,
                    ...splitName(team2Captain.name),
                    image: getImageUrl(team2CaptainProfile?.faceImageId)
                } : null
            }
        };

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'TOSS',
            payload: tossPayload
        });
        console.log(`   ✓ TOSS: ${tossInfo.winner} won, elected to ${tossInfo.decision}`);

        // ----- EVENT 3: POWERPLAY_END -----
        console.log('\n   --- POWERPLAY_END ---');

        // Powerplay for innings 1
        const pp1 = innings1?.pp?.powerplay?.[0];
        if (pp1) {
            const powerplayPayload1 = {
                innings: 1,
                team: innings1.batteamname,
                teamShortName: innings1.batteamsname,
                teamLogo: getImageUrl(team1ImageId),
                teamImage: getImageUrl(matchImageId),
                powerplayRuns: pp1.run,
                powerplayWickets: pp1.wickets,
                powerplayOvers: pp1.ovrto,
                runRate: (pp1.run / 6).toFixed(2)
            };
            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'POWERPLAY_END',
                payload: powerplayPayload1
            });
            console.log(`   ✓ POWERPLAY_END (Inn 1): ${pp1.run}/${pp1.wickets} in 6 overs`);
        }

        // Powerplay for innings 2
        const pp2 = innings2?.pp?.powerplay?.[0];
        if (pp2) {
            const powerplayPayload2 = {
                innings: 2,
                team: innings2.batteamname,
                teamShortName: innings2.batteamsname,
                teamLogo: getImageUrl(team2ImageId),
                teamImage: getImageUrl(matchImageId),
                powerplayRuns: pp2.run,
                powerplayWickets: pp2.wickets,
                powerplayOvers: pp2.ovrto,
                runRate: (pp2.run / 6).toFixed(2)
            };
            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'POWERPLAY_END',
                payload: powerplayPayload2
            });
            console.log(`   ✓ POWERPLAY_END (Inn 2): ${pp2.run}/${pp2.wickets} in 6 overs`);
        }

        // ----- EVENT 4: MILESTONE (50/100/150) -----
        console.log('\n   --- MILESTONE ---');

        const MILESTONES = [50, 100, 150, 200];
        const allBatsmen = [
            ...(innings1?.batsman || []).map((b: any) => ({ ...b, innings: 1, teamName: innings1.batteamname, teamLogo: getImageUrl(team1ImageId) })),
            ...(innings2?.batsman || []).map((b: any) => ({ ...b, innings: 2, teamName: innings2.batteamname, teamLogo: getImageUrl(team2ImageId) }))
        ];

        for (const batsman of allBatsmen) {
            const runs = parseInt(batsman.runs) || 0;
            for (const milestone of MILESTONES) {
                if (runs >= milestone) {
                    // Fetch player profile for image
                    let playerImage = null;
                    try {
                        const playerRes = await api.get(`/stats/v1/player/${batsman.id}`);
                        playerImage = getImageUrl(playerRes.data.faceImageId);
                    } catch (e) {
                        // Use fallback
                    }

                    const nameParts = splitName(batsman.name);
                    const milestonePayload = {
                        innings: batsman.innings,
                        milestone: milestone,
                        player: {
                            id: batsman.id,
                            name: batsman.name,
                            firstName: nameParts.firstName,
                            lastName: nameParts.lastName,
                            image: playerImage,
                            runs: batsman.runs,
                            balls: batsman.balls,
                            fours: batsman.fours,
                            sixes: batsman.sixes,
                            strikeRate: batsman.strkrate
                        },
                        team: batsman.teamName,
                        teamLogo: batsman.teamLogo
                    };

                    events.push({
                        match_id: TEST_MATCH_ID,
                        event_type: 'MILESTONE',
                        payload: milestonePayload
                    });
                    console.log(`   ✓ MILESTONE: ${batsman.name} - ${milestone} runs (actual: ${runs})`);
                }
            }
        }

        // ----- EVENT 5: INNINGS_END -----
        console.log('\n   --- INNINGS_END ---');

        const processInningsEnd = async (innings: any, inningsNum: number, teamImageId: number) => {
            if (!innings) return;

            // Top 2 batsmen by runs
            const topBatsmen = [...(innings.batsman || [])]
                .sort((a: any, b: any) => parseInt(b.runs) - parseInt(a.runs))
                .slice(0, 2);

            // Top 2 bowlers by wickets
            const topBowlers = [...(innings.bowler || [])]
                .sort((a: any, b: any) => parseInt(b.wickets) - parseInt(a.wickets))
                .slice(0, 2);

            // Fetch images for top performers
            const enrichedBatsmen = await Promise.all(topBatsmen.map(async (b: any) => {
                let playerImage = null;
                try {
                    const res = await api.get(`/stats/v1/player/${b.id}`);
                    playerImage = getImageUrl(res.data.faceImageId);
                } catch (e) {}
                const nameParts = splitName(b.name);
                return {
                    id: b.id,
                    name: b.name,
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    image: playerImage,
                    runs: b.runs,
                    balls: b.balls,
                    fours: b.fours,
                    sixes: b.sixes
                };
            }));

            const enrichedBowlers = await Promise.all(topBowlers.map(async (b: any) => {
                let playerImage = null;
                try {
                    const res = await api.get(`/stats/v1/player/${b.id}`);
                    playerImage = getImageUrl(res.data.faceImageId);
                } catch (e) {}
                const nameParts = splitName(b.name);
                return {
                    id: b.id,
                    name: b.name,
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    image: playerImage,
                    overs: b.overs,
                    runs: b.runs,
                    wickets: b.wickets,
                    economy: b.economy
                };
            }));

            const inningsEndPayload = {
                innings: inningsNum,
                team: innings.batteamname,
                teamShortName: innings.batteamsname,
                teamLogo: getImageUrl(teamImageId),
                teamImage: getImageUrl(matchImageId),
                totalRuns: innings.score,
                totalWickets: innings.wickets,
                totalOvers: innings.overs,
                runRate: innings.runrate,
                topBatsmen: enrichedBatsmen,
                topBowlers: enrichedBowlers,
                extras: innings.extras
            };

            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'INNINGS_END',
                payload: inningsEndPayload
            });
            console.log(`   ✓ INNINGS_END (Inn ${inningsNum}): ${innings.batteamname} ${innings.score}/${innings.wickets}`);
        };

        await processInningsEnd(innings1, 1, team1ImageId);
        await processInningsEnd(innings2, 2, team2ImageId);

        // ----- EVENT 6: INNINGS_BREAK (Target Set) -----
        console.log('\n   --- INNINGS_BREAK ---');

        if (innings1 && innings2) {
            const target = innings1.score + 1;

            // Get batting team captain for innings 2
            const battingTeamCaptain = team2Captain;
            const battingTeamCaptainProfile = team2CaptainProfile;

            const inningsBreakPayload = {
                target: target,
                firstInningsScore: `${innings1.score}/${innings1.wickets}`,
                firstInningsTeam: innings1.batteamname,
                chasingTeam: innings2.batteamname,
                chasingTeamLogo: getImageUrl(team2ImageId),
                captain: battingTeamCaptain ? {
                    name: battingTeamCaptain.name,
                    ...splitName(battingTeamCaptain.name),
                    image: getImageUrl(battingTeamCaptainProfile?.faceImageId)
                } : null,
                captainImage: getImageUrl(battingTeamCaptainProfile?.faceImageId),
                team1Logo: getImageUrl(team1ImageId),
                team2Logo: getImageUrl(team2ImageId),
                matchImage: getImageUrl(matchImageId)
            };

            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'INNINGS_BREAK',
                payload: inningsBreakPayload
            });
            console.log(`   ✓ INNINGS_BREAK: Target ${target} for ${innings2.batteamname}`);
        }

        // ----- EVENT 7: MATCH_END -----
        console.log('\n   --- MATCH_END ---');

        // Get Player of the Match from commentary
        let playerOfMatch: any = null;
        try {
            const commRes = await api.get(`/mcenter/v1/${TEST_MATCH_ID}/comm`);
            const commentary = commRes.data.comwrapper || [];

            // Find Player of Match mention in commentary
            for (const item of commentary) {
                const text = item.commentary?.commtxt || '';
                if (text.includes('Player of the Match') || text.includes('Man of the Match')) {
                    // Extract player name from bold format
                    const formats = item.commentary?.commentaryformats || [];
                    for (const fmt of formats) {
                        if (fmt.type === 'bold' && fmt.value) {
                            for (const v of fmt.value) {
                                if (v.value?.includes('Player of the Match')) {
                                    const match = v.value.match(/^(.+?)\s*\|/);
                                    if (match) {
                                        playerOfMatch = { name: match[1].trim() };
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
            }
        } catch (e) {
            console.log('   ⚠ Could not fetch Player of Match from commentary');
        }

        // Fetch Player of Match image
        if (playerOfMatch) {
            // Find player ID from scorecard
            const allPlayers = [...(innings1?.batsman || []), ...(innings2?.batsman || [])];
            const pomPlayer = allPlayers.find((p: any) =>
                p.name.toLowerCase().includes(playerOfMatch.name.toLowerCase().split(' ')[0])
            );

            if (pomPlayer) {
                try {
                    const res = await api.get(`/stats/v1/player/${pomPlayer.id}`);
                    playerOfMatch = {
                        id: pomPlayer.id,
                        name: res.data.name,
                        ...splitName(res.data.name),
                        image: getImageUrl(res.data.faceImageId),
                        team: res.data.intlTeam
                    };
                } catch (e) {}
            }
        }

        const matchEndPayload = {
            result: scorecard.status || matchInfo.status,
            shortResult: matchInfo.shortstatus,
            state: matchInfo.state,
            winner: scorecard.status?.split(' won')[0] || '',
            playerOfMatch: playerOfMatch,
            team1: {
                name: matchInfo.team1?.teamname,
                shortName: matchInfo.team1?.teamsname,
                logo: getImageUrl(team1ImageId),
                score: innings1 ? `${innings1.score}/${innings1.wickets}` : null
            },
            team2: {
                name: matchInfo.team2?.teamname,
                shortName: matchInfo.team2?.teamsname,
                logo: getImageUrl(team2ImageId),
                score: innings2 ? `${innings2.score}/${innings2.wickets}` : null
            },
            matchImage: getImageUrl(matchImageId)
        };

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'MATCH_END',
            payload: matchEndPayload
        });
        console.log(`   ✓ MATCH_END: ${matchEndPayload.result}`);

        // ============================================================
        // STEP 3: Save to Database
        // ============================================================
        console.log('\n[3/4] Saving to database...');

        // First, ensure match exists in matches table
        const { error: matchError } = await supabase
            .from('matches')
            .upsert({
                match_id: TEST_MATCH_ID,
                series_id: matchInfo.seriesid,
                series_name: matchInfo.seriesname,
                match_desc: matchInfo.matchdesc,
                match_format: matchInfo.matchformat,
                start_time: matchInfo.startdate,
                end_time: matchInfo.enddate,
                status: matchInfo.state,
                state: matchInfo.state,
                team1_id: matchInfo.team1?.teamid,
                team2_id: matchInfo.team2?.teamid
            }, { onConflict: 'match_id' });

        if (matchError) {
            console.error('   ✗ Error saving match:', matchError.message);
        } else {
            console.log(`   ✓ Match ${TEST_MATCH_ID} saved/updated`);
        }

        // Save all events
        let savedCount = 0;
        let errorCount = 0;

        for (const event of events) {
            const { error } = await supabase
                .from('events')
                .insert(event);

            if (error) {
                // Check if it's a duplicate
                if (error.code === '23505') {
                    console.log(`   ⚠ ${event.event_type} already exists, skipping`);
                } else {
                    console.error(`   ✗ Error saving ${event.event_type}:`, error.message);
                    errorCount++;
                }
            } else {
                console.log(`   ✓ ${event.event_type} saved`);
                savedCount++;
            }
        }

        // ============================================================
        // STEP 4: Verify saved data
        // ============================================================
        console.log('\n[4/4] Verifying saved data...');

        const { data: savedEvents, error: fetchError } = await supabase
            .from('events')
            .select('*')
            .eq('match_id', TEST_MATCH_ID)
            .order('event_time', { ascending: true });

        if (fetchError) {
            console.error('   ✗ Error fetching events:', fetchError.message);
        } else {
            console.log(`\n   Found ${savedEvents?.length || 0} events in database:\n`);

            const eventCounts: Record<string, number> = {};
            for (const event of savedEvents || []) {
                eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
            }

            for (const [type, count] of Object.entries(eventCounts)) {
                console.log(`   • ${type}: ${count} event(s)`);
            }
        }

        // ============================================================
        // Summary
        // ============================================================
        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total events prepared: ${events.length}`);
        console.log(`Successfully saved: ${savedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`\nEvent breakdown:`);

        const typeCounts: Record<string, number> = {};
        for (const e of events) {
            typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(typeCounts)) {
            console.log(`  • ${type}: ${count}`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('TEST COMPLETE');
        console.log('='.repeat(70));

    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
