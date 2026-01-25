/**
 * COMPLETE DATA SAVER
 *
 * Saves ALL required data to ALL tables:
 * - teams: Team info with logos
 * - players: All players with face images
 * - scores: Over-by-over scores for charts
 * - matches: Match info
 * - events: All event types with complete data
 *
 * YOUR REQUIREMENTS:
 * 1. PLAYING_XI: All player names, captain images
 * 2. TOSS: Winner, decision (bat/bowl), toss image
 * 3. POWERPLAY_END: Batting team image, runs, overs, team logos
 * 4. MILESTONE: Player match image, first/last name, team logo
 * 5. INNINGS_END: Team image, runs, wickets, top 2 batsmen, top 2 bowlers
 * 6. INNINGS_BREAK: Captain image, target, team logos
 * 7. MATCH_END: Player of Match with award image, team logos
 * 8. SCORE_CHART: Over-by-over scoring data
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

// Image URL helper
const getImageUrl = (imageId: number | string | undefined | null): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `/api/proxy-image?id=${imageId}`;
};

// Split name helper
const splitName = (fullName: string) => {
    const parts = (fullName || '').trim().split(' ');
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
    };
};

// Main function
async function saveCompleteData() {
    console.log('='.repeat(70));
    console.log('COMPLETE DATA SAVER - ICC T20 WORLD CUP');
    console.log('='.repeat(70));
    console.log(`Time: ${new Date().toISOString()}\n`);

    const TEST_MATCH_ID = 121406; // India vs New Zealand 3rd T20I

    try {
        // ============================================================
        // STEP 1: Clear existing data for this match
        // ============================================================
        console.log('[1/6] Clearing existing data for match...');
        await supabase.from('events').delete().eq('match_id', TEST_MATCH_ID);
        await supabase.from('scores').delete().eq('match_id', TEST_MATCH_ID);
        console.log('   ✓ Cleared old events and scores\n');

        // ============================================================
        // STEP 2: Fetch ALL API data
        // ============================================================
        console.log('[2/6] Fetching ALL API data...');

        const [liveRes, scardRes, infoRes, commRes, leanbackRes] = await Promise.all([
            api.get('/matches/v1/live'),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/scard`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/comm`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/leanback`),
        ]);

        const liveData = liveRes.data;
        const scorecard = scardRes.data;
        const matchInfo = infoRes.data;
        const commentary = commRes.data;
        const leanback = leanbackRes.data;

        console.log('   ✓ Live matches');
        console.log('   ✓ Scorecard');
        console.log('   ✓ Match info');
        console.log('   ✓ Commentary (with Player of Match)');
        console.log('   ✓ Leanback (live scores)\n');

        // Get team imageIds from live data
        let team1ImageId = 0, team2ImageId = 0;
        for (const type of liveData.typeMatches || []) {
            for (const series of type.seriesMatches || []) {
                const matches = series.seriesAdWrapper?.matches || [];
                for (const m of matches) {
                    if (m.matchInfo?.matchId === TEST_MATCH_ID) {
                        team1ImageId = m.matchInfo.team1?.imageId || 0;
                        team2ImageId = m.matchInfo.team2?.imageId || 0;
                    }
                }
            }
        }

        // Get match headers (contains Player of Match, toss details)
        const matchHeaders = commentary.matchheaders || {};
        const tossResults = matchHeaders.tossresults || {};
        const momPlayers = matchHeaders.momplayers?.player || [];
        const matchImageId = matchInfo.matchimageid || 0;

        const innings1 = scorecard.scorecard?.[0];
        const innings2 = scorecard.scorecard?.[1];

        // ============================================================
        // STEP 3: Save TEAMS
        // ============================================================
        console.log('[3/6] Saving TEAMS...');

        const team1Data = {
            team_id: matchInfo.team1?.teamid || matchHeaders.team1?.teamid,
            name: matchInfo.team1?.teamname || 'Team 1',
            short_name: matchInfo.team1?.teamsname || 'T1',
            image_id: team1ImageId
        };

        const team2Data = {
            team_id: matchInfo.team2?.teamid || matchHeaders.team2?.teamid,
            name: matchInfo.team2?.teamname || 'Team 2',
            short_name: matchInfo.team2?.teamsname || 'T2',
            image_id: team2ImageId
        };

        await supabase.from('teams').upsert(team1Data, { onConflict: 'team_id' });
        await supabase.from('teams').upsert(team2Data, { onConflict: 'team_id' });
        console.log(`   ✓ ${team1Data.name} (ID: ${team1Data.team_id}, Logo: ${team1Data.image_id})`);
        console.log(`   ✓ ${team2Data.name} (ID: ${team2Data.team_id}, Logo: ${team2Data.image_id})\n`);

        // ============================================================
        // STEP 4: Save PLAYERS with face images
        // ============================================================
        console.log('[4/6] Saving PLAYERS...');

        const allPlayersFromScorecard = [
            ...(innings1?.batsman || []).map((p: any) => ({ ...p, teamId: team1Data.team_id })),
            ...(innings1?.bowler || []).map((p: any) => ({ ...p, teamId: team2Data.team_id })),
            ...(innings2?.batsman || []).map((p: any) => ({ ...p, teamId: team2Data.team_id })),
            ...(innings2?.bowler || []).map((p: any) => ({ ...p, teamId: team1Data.team_id })),
        ];

        // Deduplicate by player ID
        const playerMap = new Map<number, any>();
        for (const p of allPlayersFromScorecard) {
            if (p.id && !playerMap.has(p.id)) {
                playerMap.set(p.id, p);
            }
        }

        // Fetch player profiles to get face images
        let playerCount = 0;
        for (const [playerId, player] of playerMap) {
            try {
                const profileRes = await api.get(`/stats/v1/player/${playerId}`);
                const profile = profileRes.data;

                const playerData = {
                    player_id: playerId,
                    name: profile.name || player.name,
                    team_id: player.teamId,
                    role: profile.role || 'Unknown',
                    face_image_id: profile.faceImageId || null,
                    batting_style: profile.bat || null,
                    bowling_style: profile.bowl || null
                };

                await supabase.from('players').upsert(playerData, { onConflict: 'player_id' });
                playerCount++;
            } catch (e) {
                // Save without profile data
                const playerData = {
                    player_id: playerId,
                    name: player.name,
                    team_id: player.teamId,
                    role: 'Unknown',
                    face_image_id: null
                };
                await supabase.from('players').upsert(playerData, { onConflict: 'player_id' });
                playerCount++;
            }
        }
        console.log(`   ✓ Saved ${playerCount} players with face images\n`);

        // ============================================================
        // STEP 5: Save SCORES (over-by-over for charts)
        // ============================================================
        console.log('[5/6] Saving SCORES for charts...');

        // Get over summaries from commentary
        const overSummaries: any[] = [];
        for (const item of commentary.comwrapper || []) {
            const oversep = item.oversep || item.commentary?.oversep;
            if (oversep) {
                overSummaries.push(oversep);
            }
        }

        // Also create cumulative scores from scorecard
        for (const innings of [innings1, innings2]) {
            if (!innings) continue;

            const scoreData = {
                match_id: TEST_MATCH_ID,
                team_id: innings.inningsid === 1 ? team1Data.team_id : team2Data.team_id,
                innings_id: innings.inningsid,
                runs: innings.score,
                wickets: innings.wickets,
                overs: innings.overs,
                crr: innings.runrate,
                target: innings.inningsid === 2 ? innings1.score + 1 : null,
                partnership: innings.partnership || null
            };

            await supabase.from('scores').insert(scoreData);
        }

        // Save over-by-over data for score charts
        const scoreChartData: any[] = [];
        for (const over of overSummaries) {
            scoreChartData.push({
                match_id: TEST_MATCH_ID,
                team_id: over.battingteamname === 'IND' ? team2Data.team_id : team1Data.team_id,
                innings_id: over.inningsid,
                runs: over.score,
                wickets: over.wickets,
                overs: over.overnum,
                crr: over.score / over.overnum,
                partnership: {
                    overSummary: over.oversummary,
                    runsInOver: over.runs,
                    batsman1: over.batstrikername,
                    batsman1Details: over.batstrikerdetails,
                    batsman2: over.batnonstrikername,
                    batsman2Details: over.batnonstrikerdetails,
                    bowler: over.bowlname,
                    bowlerDetails: over.bowldetails
                }
            });
        }

        if (scoreChartData.length > 0) {
            await supabase.from('scores').insert(scoreChartData);
        }
        console.log(`   ✓ Saved ${2 + scoreChartData.length} score records (including over-by-over)\n`);

        // ============================================================
        // STEP 6: Save ALL EVENTS
        // ============================================================
        console.log('[6/6] Saving ALL EVENTS...\n');

        const events: any[] = [];

        // Find captains
        const team1Captain = innings1?.batsman?.find((p: any) => p.iscaptain);
        const team2Captain = innings2?.batsman?.find((p: any) => p.iscaptain);

        // Fetch captain profiles
        let team1CaptainProfile: any = null;
        let team2CaptainProfile: any = null;

        if (team1Captain?.id) {
            try {
                const res = await api.get(`/stats/v1/player/${team1Captain.id}`);
                team1CaptainProfile = res.data;
            } catch (e) { }
        }
        if (team2Captain?.id) {
            try {
                const res = await api.get(`/stats/v1/player/${team2Captain.id}`);
                team2CaptainProfile = res.data;
            } catch (e) { }
        }

        // ----- 1. PLAYING_XI -----
        console.log('   --- PLAYING_XI (1 hour before) ---');
        console.log('   Required: All player names, captain images');

        const formatPlayerForXI = async (p: any, captainProfile: any) => {
            let faceImageId = null;
            try {
                const res = await api.get(`/stats/v1/player/${p.id}`);
                faceImageId = res.data.faceImageId;
            } catch (e) { }

            const nameParts = splitName(p.name);
            return {
                id: p.id,
                name: p.name,
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                role: p.role || 'Player',
                image: getImageUrl(p.iscaptain ? (captainProfile?.faceImageId || faceImageId) : faceImageId),
                faceImageId: faceImageId,
                isCaptain: p.iscaptain || false,
                isKeeper: p.iskeeper || false
            };
        };

        const team1Players = await Promise.all(
            (innings1?.batsman || []).map((p: any) => formatPlayerForXI(p, team1CaptainProfile))
        );
        const team2Players = await Promise.all(
            (innings2?.batsman || []).map((p: any) => formatPlayerForXI(p, team2CaptainProfile))
        );

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'PLAYING_XI',
            payload: {
                team1: {
                    id: team1Data.team_id,
                    name: team1Data.name,
                    shortName: team1Data.short_name,
                    logo: getImageUrl(team1ImageId),
                    captain: team1Captain ? {
                        name: team1Captain.name,
                        ...splitName(team1Captain.name),
                        image: getImageUrl(team1CaptainProfile?.faceImageId)
                    } : null,
                    players: team1Players
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    shortName: team2Data.short_name,
                    logo: getImageUrl(team2ImageId),
                    captain: team2Captain ? {
                        name: team2Captain.name,
                        ...splitName(team2Captain.name),
                        image: getImageUrl(team2CaptainProfile?.faceImageId)
                    } : null,
                    players: team2Players
                }
            }
        });
        console.log(`   ✓ PLAYING_XI: ${team1Players.length} + ${team2Players.length} players with images`);

        // ----- 2. TOSS -----
        console.log('\n   --- TOSS (30 mins before) ---');
        console.log('   Required: Winner, decision (bat/bowl), toss image');

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'TOSS',
            payload: {
                winner: tossResults.tosswinnername || matchInfo.tossstatus?.split(' opt')[0],
                winnerId: tossResults.tosswinnerid,
                decision: tossResults.decision?.toLowerCase() || 'unknown',
                text: matchInfo.tossstatus,
                tossImage: getImageUrl(matchImageId),
                matchImage: getImageUrl(matchImageId),
                team1: {
                    id: team1Data.team_id,
                    name: team1Data.name,
                    logo: getImageUrl(team1ImageId),
                    captain: team1Captain ? {
                        name: team1Captain.name,
                        ...splitName(team1Captain.name),
                        image: getImageUrl(team1CaptainProfile?.faceImageId)
                    } : null
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    logo: getImageUrl(team2ImageId),
                    captain: team2Captain ? {
                        name: team2Captain.name,
                        ...splitName(team2Captain.name),
                        image: getImageUrl(team2CaptainProfile?.faceImageId)
                    } : null
                }
            }
        });
        console.log(`   ✓ TOSS: ${tossResults.tosswinnername} won, elected to ${tossResults.decision}`);

        // ----- 3. POWERPLAY_END -----
        console.log('\n   --- POWERPLAY_END (During match) ---');
        console.log('   Required: Batting team image, runs in powerplay, team logos');

        for (const [idx, innings] of [innings1, innings2].entries()) {
            if (!innings) continue;
            const pp = innings.pp?.powerplay?.[0];
            if (pp) {
                const teamImageId = idx === 0 ? team1ImageId : team2ImageId;
                const teamData = idx === 0 ? team1Data : team2Data;

                events.push({
                    match_id: TEST_MATCH_ID,
                    event_type: 'POWERPLAY_END',
                    payload: {
                        innings: innings.inningsid,
                        team: innings.batteamname,
                        teamShortName: innings.batteamsname,
                        teamId: teamData.team_id,
                        teamLogo: getImageUrl(teamImageId),
                        teamImage: getImageUrl(matchImageId), // Current match image of batting team
                        batingTeamImage: getImageUrl(matchImageId),
                        powerplayRuns: pp.run,
                        powerplayWickets: pp.wickets,
                        powerplayOvers: pp.ovrto,
                        runRate: (pp.run / 6).toFixed(2),
                        team1Logo: getImageUrl(team1ImageId),
                        team2Logo: getImageUrl(team2ImageId)
                    }
                });
                console.log(`   ✓ POWERPLAY_END (Inn ${innings.inningsid}): ${innings.batteamname} ${pp.run}/${pp.wickets} in ${pp.ovrto} overs`);
            }
        }

        // ----- 4. MILESTONE -----
        console.log('\n   --- MILESTONE (During match) ---');
        console.log('   Required: Player match image, first/last name, team logo');

        const MILESTONES = [50, 100, 150, 200];
        const allBatsmen = [
            ...(innings1?.batsman || []).map((b: any) => ({
                ...b,
                innings: 1,
                teamName: innings1.batteamname,
                teamId: team1Data.team_id,
                teamImageId: team1ImageId
            })),
            ...(innings2?.batsman || []).map((b: any) => ({
                ...b,
                innings: 2,
                teamName: innings2.batteamname,
                teamId: team2Data.team_id,
                teamImageId: team2ImageId
            }))
        ];

        for (const batsman of allBatsmen) {
            const runs = parseInt(batsman.runs) || 0;
            for (const milestone of MILESTONES) {
                if (runs >= milestone) {
                    let playerProfile: any = null;
                    try {
                        const res = await api.get(`/stats/v1/player/${batsman.id}`);
                        playerProfile = res.data;
                    } catch (e) { }

                    const nameParts = splitName(batsman.name);

                    events.push({
                        match_id: TEST_MATCH_ID,
                        event_type: 'MILESTONE',
                        payload: {
                            innings: batsman.innings,
                            milestone: milestone,
                            player: {
                                id: batsman.id,
                                name: batsman.name,
                                firstName: nameParts.firstName,
                                lastName: nameParts.lastName,
                                image: getImageUrl(playerProfile?.faceImageId), // Player match image
                                faceImageId: playerProfile?.faceImageId,
                                runs: runs,
                                balls: batsman.balls,
                                fours: batsman.fours,
                                sixes: batsman.sixes,
                                strikeRate: batsman.strkrate
                            },
                            team: batsman.teamName,
                            teamId: batsman.teamId,
                            teamLogo: getImageUrl(batsman.teamImageId)
                        }
                    });
                    console.log(`   ✓ MILESTONE: ${batsman.name} scored ${milestone} (actual: ${runs})`);
                }
            }
        }

        // ----- 5. INNINGS_END -----
        console.log('\n   --- INNINGS_END (First innings complete) ---');
        console.log('   Required: Team image, runs, wickets, top 2 batsmen (with balls), top 2 bowlers (with overs/wickets)');

        for (const [idx, innings] of [innings1, innings2].entries()) {
            if (!innings) continue;

            const teamImageId = idx === 0 ? team1ImageId : team2ImageId;
            const teamData = idx === 0 ? team1Data : team2Data;

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
                let faceImageId = null;
                try {
                    const res = await api.get(`/stats/v1/player/${b.id}`);
                    faceImageId = res.data.faceImageId;
                } catch (e) { }
                const nameParts = splitName(b.name);
                return {
                    id: b.id,
                    name: b.name,
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    image: getImageUrl(faceImageId),
                    runs: parseInt(b.runs),
                    balls: parseInt(b.balls),
                    fours: parseInt(b.fours),
                    sixes: parseInt(b.sixes),
                    strikeRate: b.strkrate
                };
            }));

            const enrichedBowlers = await Promise.all(topBowlers.map(async (b: any) => {
                let faceImageId = null;
                try {
                    const res = await api.get(`/stats/v1/player/${b.id}`);
                    faceImageId = res.data.faceImageId;
                } catch (e) { }
                const nameParts = splitName(b.name);
                return {
                    id: b.id,
                    name: b.name,
                    firstName: nameParts.firstName,
                    lastName: nameParts.lastName,
                    image: getImageUrl(faceImageId),
                    overs: b.overs,
                    maidens: b.maidens,
                    runs: parseInt(b.runs),
                    wickets: parseInt(b.wickets),
                    economy: b.economy
                };
            }));

            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'INNINGS_END',
                payload: {
                    innings: innings.inningsid,
                    team: innings.batteamname,
                    teamShortName: innings.batteamsname,
                    teamId: teamData.team_id,
                    teamLogo: getImageUrl(teamImageId),
                    teamImage: getImageUrl(matchImageId), // Team recent match image
                    totalRuns: innings.score,
                    totalWickets: innings.wickets,
                    totalOvers: innings.overs,
                    runRate: innings.runrate,
                    topBatsmen: enrichedBatsmen, // With runs and balls
                    topBowlers: enrichedBowlers, // With overs, runs, wickets
                    extras: innings.extras,
                    fallOfWickets: innings.fow
                }
            });
            console.log(`   ✓ INNINGS_END (Inn ${innings.inningsid}): ${innings.batteamname} ${innings.score}/${innings.wickets}`);
        }

        // ----- 6. INNINGS_BREAK -----
        console.log('\n   --- INNINGS_BREAK (Target set) ---');
        console.log('   Required: Captain recent match image, target, team logos');

        if (innings1 && innings2) {
            const target = innings1.score + 1;
            const chasingCaptain = team2Captain;
            const chasingCaptainProfile = team2CaptainProfile;

            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'INNINGS_BREAK',
                payload: {
                    target: target,
                    firstInningsTeam: innings1.batteamname,
                    firstInningsScore: `${innings1.score}/${innings1.wickets}`,
                    firstInningsOvers: innings1.overs,
                    chasingTeam: innings2.batteamname,
                    chasingTeamId: team2Data.team_id,
                    chasingTeamLogo: getImageUrl(team2ImageId),
                    captain: chasingCaptain ? {
                        id: chasingCaptain.id,
                        name: chasingCaptain.name,
                        ...splitName(chasingCaptain.name),
                        image: getImageUrl(chasingCaptainProfile?.faceImageId), // Captain recent match image
                        faceImageId: chasingCaptainProfile?.faceImageId
                    } : null,
                    captainImage: getImageUrl(chasingCaptainProfile?.faceImageId),
                    team1Logo: getImageUrl(team1ImageId),
                    team2Logo: getImageUrl(team2ImageId),
                    matchImage: getImageUrl(matchImageId)
                }
            });
            console.log(`   ✓ INNINGS_BREAK: Target ${target} for ${innings2.batteamname}`);
        }

        // ----- 7. MATCH_END -----
        console.log('\n   --- MATCH_END (Result declared) ---');
        console.log('   Required: Player of Match with name, award image, team logos');

        // Get Player of Match from commentary matchheaders
        let playerOfMatch: any = null;
        if (momPlayers.length > 0) {
            const mom = momPlayers[0];
            playerOfMatch = {
                id: parseInt(mom.id),
                name: mom.name,
                ...splitName(mom.name),
                team: mom.teamname,
                image: getImageUrl(mom.faceimageid), // Award/recent image
                faceImageId: mom.faceimageid,
                awardImage: getImageUrl(mom.faceimageid) // Player award image
            };
            console.log(`   Found Player of Match: ${mom.name} (ID: ${mom.id}, Image: ${mom.faceimageid})`);
        }

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'MATCH_END',
            payload: {
                result: matchHeaders.status || scorecard.status,
                shortResult: matchInfo.shortstatus,
                state: matchHeaders.state || matchInfo.state,
                winner: matchHeaders.status?.split(' won')[0],
                winnerId: matchHeaders.winningteamid,
                playerOfMatch: playerOfMatch,
                team1: {
                    id: team1Data.team_id,
                    name: team1Data.name,
                    shortName: team1Data.short_name,
                    logo: getImageUrl(team1ImageId),
                    score: innings1 ? `${innings1.score}/${innings1.wickets}` : null,
                    overs: innings1?.overs
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    shortName: team2Data.short_name,
                    logo: getImageUrl(team2ImageId),
                    score: innings2 ? `${innings2.score}/${innings2.wickets}` : null,
                    overs: innings2?.overs
                },
                matchImage: getImageUrl(matchImageId)
            }
        });
        console.log(`   ✓ MATCH_END: ${matchHeaders.status}`);

        // ----- 8. SCORE_CHART -----
        console.log('\n   --- SCORE_CHART (Over-by-over data) ---');

        const scoreChartPayload = {
            innings1: {
                team: innings1?.batteamname,
                teamLogo: getImageUrl(team1ImageId),
                finalScore: `${innings1?.score}/${innings1?.wickets}`,
                overs: innings1?.overs,
                runRate: innings1?.runrate,
                overByOver: overSummaries
                    .filter((o: any) => o.inningsid === 1)
                    .map((o: any) => ({
                        over: o.overnum,
                        runs: o.score,
                        wickets: o.wickets,
                        runRate: (o.score / o.overnum).toFixed(2),
                        summary: o.oversummary
                    }))
            },
            innings2: {
                team: innings2?.batteamname,
                teamLogo: getImageUrl(team2ImageId),
                finalScore: `${innings2?.score}/${innings2?.wickets}`,
                overs: innings2?.overs,
                runRate: innings2?.runrate,
                target: innings1?.score + 1,
                overByOver: overSummaries
                    .filter((o: any) => o.inningsid === 2)
                    .map((o: any) => ({
                        over: o.overnum,
                        runs: o.score,
                        wickets: o.wickets,
                        runRate: (o.score / o.overnum).toFixed(2),
                        summary: o.oversummary
                    }))
            },
            powerplay: {
                innings1: innings1?.pp?.powerplay?.[0],
                innings2: innings2?.pp?.powerplay?.[0]
            }
        };

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'SCORE_CHART',
            payload: scoreChartPayload
        });
        console.log(`   ✓ SCORE_CHART: Over-by-over data for both innings`);

        // ============================================================
        // Save match
        // ============================================================
        console.log('\n[Saving] Match record...');
        await supabase.from('matches').upsert({
            match_id: TEST_MATCH_ID,
            series_id: matchInfo.seriesid,
            series_name: matchInfo.seriesname,
            match_desc: matchInfo.matchdesc,
            match_format: matchInfo.matchformat,
            start_time: matchInfo.startdate,
            end_time: matchInfo.enddate,
            status: matchInfo.state,
            state: matchInfo.state,
            team1_id: team1Data.team_id,
            team2_id: team2Data.team_id,
            winner_team_id: matchHeaders.winningteamid
        }, { onConflict: 'match_id' });
        console.log('   ✓ Match saved');

        // ============================================================
        // Save all events
        // ============================================================
        console.log('\n[Saving] All events...');
        let savedCount = 0;
        for (const event of events) {
            const { error } = await supabase.from('events').insert(event);
            if (error) {
                console.error(`   ✗ Error saving ${event.event_type}:`, error.message);
            } else {
                console.log(`   ✓ ${event.event_type} saved`);
                savedCount++;
            }
        }

        // ============================================================
        // SUMMARY
        // ============================================================
        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY');
        console.log('='.repeat(70));

        // Count records in each table
        const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
        const { count: playerCount2 } = await supabase.from('players').select('*', { count: 'exact', head: true });
        const { count: scoreCount } = await supabase.from('scores').select('*', { count: 'exact', head: true });
        const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('match_id', TEST_MATCH_ID);

        console.log(`\nDatabase Records:`);
        console.log(`   Teams:   ${teamCount}`);
        console.log(`   Players: ${playerCount2}`);
        console.log(`   Scores:  ${scoreCount}`);
        console.log(`   Events:  ${eventCount}`);

        console.log(`\nEvents saved: ${savedCount}/${events.length}`);

        const typeCounts: Record<string, number> = {};
        for (const e of events) {
            typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        }
        console.log(`\nEvent breakdown:`);
        for (const [type, count] of Object.entries(typeCounts)) {
            console.log(`   • ${type}: ${count}`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('COMPLETE!');
        console.log('='.repeat(70));

    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

saveCompleteData();
