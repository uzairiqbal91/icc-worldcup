/**
 * COMPLETE DATA SAVER WITH FULL IMAGE URLs
 *
 * Saves ALL data with FULL image URLs (not just IDs)
 * Image URL format: https://static.cricbuzz.com/a/img/v1/152x152/i1/c{imageId}/i.jpg
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

// FULL Image URL helper - returns complete URL you can open in browser
const getFullImageUrl = (imageId: number | string | undefined | null, size: string = '152x152'): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `https://static.cricbuzz.com/a/img/v1/${size}/i1/c${imageId}/i.jpg`;
};

// Split name helper
const splitName = (fullName: string) => {
    const parts = (fullName || '').trim().split(' ');
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
    };
};

async function saveCompleteData() {
    console.log('='.repeat(70));
    console.log('COMPLETE DATA SAVER WITH FULL IMAGE URLs');
    console.log('='.repeat(70));
    console.log(`Time: ${new Date().toISOString()}\n`);

    const TEST_MATCH_ID = 121406;

    try {
        // Clear existing data
        console.log('[1/6] Clearing existing data...');
        await supabase.from('events').delete().eq('match_id', TEST_MATCH_ID);
        await supabase.from('scores').delete().eq('match_id', TEST_MATCH_ID);
        await supabase.from('players').delete().neq('player_id', 0);
        await supabase.from('teams').delete().neq('team_id', 0);
        console.log('   ✓ Cleared old data\n');

        // Fetch ALL API data
        console.log('[2/6] Fetching ALL API data...');
        const [liveRes, scardRes, infoRes, commRes] = await Promise.all([
            api.get('/matches/v1/live'),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/scard`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}`),
            api.get(`/mcenter/v1/${TEST_MATCH_ID}/comm`),
        ]);

        const liveData = liveRes.data;
        const scorecard = scardRes.data;
        const matchInfo = infoRes.data;
        const commentary = commRes.data;

        console.log('   ✓ All data fetched\n');

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

        const matchHeaders = commentary.matchheaders || {};
        const tossResults = matchHeaders.tossresults || {};
        const momPlayers = matchHeaders.momplayers?.player || [];
        const matchImageId = matchInfo.matchimageid || 0;

        const innings1 = scorecard.scorecard?.[0];
        const innings2 = scorecard.scorecard?.[1];

        // SAVE TEAMS with full logo URLs
        console.log('[3/6] Saving TEAMS with full URLs...');
        const team1Data = {
            team_id: matchInfo.team1?.teamid,
            name: matchInfo.team1?.teamname || 'Team 1',
            short_name: matchInfo.team1?.teamsname || 'T1',
            image_id: team1ImageId
        };
        const team2Data = {
            team_id: matchInfo.team2?.teamid,
            name: matchInfo.team2?.teamname || 'Team 2',
            short_name: matchInfo.team2?.teamsname || 'T2',
            image_id: team2ImageId
        };

        await supabase.from('teams').upsert(team1Data, { onConflict: 'team_id' });
        await supabase.from('teams').upsert(team2Data, { onConflict: 'team_id' });

        console.log(`   ✓ ${team1Data.name}`);
        console.log(`     Logo URL: ${getFullImageUrl(team1ImageId)}`);
        console.log(`   ✓ ${team2Data.name}`);
        console.log(`     Logo URL: ${getFullImageUrl(team2ImageId)}\n`);

        // SAVE PLAYERS with full face image URLs
        console.log('[4/6] Saving PLAYERS with full URLs...');
        const allPlayersFromScorecard = [
            ...(innings1?.batsman || []).map((p: any) => ({ ...p, teamId: team1Data.team_id })),
            ...(innings1?.bowler || []).map((p: any) => ({ ...p, teamId: team2Data.team_id })),
            ...(innings2?.batsman || []).map((p: any) => ({ ...p, teamId: team2Data.team_id })),
            ...(innings2?.bowler || []).map((p: any) => ({ ...p, teamId: team1Data.team_id })),
        ];

        const playerMap = new Map<number, any>();
        for (const p of allPlayersFromScorecard) {
            if (p.id && !playerMap.has(p.id)) {
                playerMap.set(p.id, p);
            }
        }

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

                if (playerCount <= 3) {
                    console.log(`   ✓ ${profile.name}`);
                    console.log(`     Face URL: ${getFullImageUrl(profile.faceImageId)}`);
                }
            } catch (e) {
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
        console.log(`   ... and ${playerCount - 3} more players\n`);

        // SAVE SCORES
        console.log('[5/6] Saving SCORES...');
        for (const innings of [innings1, innings2]) {
            if (!innings) continue;
            await supabase.from('scores').insert({
                match_id: TEST_MATCH_ID,
                team_id: innings.inningsid === 1 ? team1Data.team_id : team2Data.team_id,
                innings_id: innings.inningsid,
                runs: innings.score,
                wickets: innings.wickets,
                overs: innings.overs,
                crr: innings.runrate,
                target: innings.inningsid === 2 ? innings1.score + 1 : null,
                partnership: innings.partnership || null
            });
        }
        console.log('   ✓ Scores saved\n');

        // SAVE ALL EVENTS with full image URLs
        console.log('[6/6] Saving ALL EVENTS with full URLs...\n');

        const events: any[] = [];

        // Find captains
        const team1Captain = innings1?.batsman?.find((p: any) => p.iscaptain);
        const team2Captain = innings2?.batsman?.find((p: any) => p.iscaptain);

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
        console.log('   --- PLAYING_XI ---');

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
                imageUrl: getFullImageUrl(p.iscaptain ? (captainProfile?.faceImageId || faceImageId) : faceImageId),
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
                    logoUrl: getFullImageUrl(team1ImageId),
                    captain: team1Captain ? {
                        name: team1Captain.name,
                        ...splitName(team1Captain.name),
                        imageUrl: getFullImageUrl(team1CaptainProfile?.faceImageId)
                    } : null,
                    players: team1Players
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    shortName: team2Data.short_name,
                    logoUrl: getFullImageUrl(team2ImageId),
                    captain: team2Captain ? {
                        name: team2Captain.name,
                        ...splitName(team2Captain.name),
                        imageUrl: getFullImageUrl(team2CaptainProfile?.faceImageId)
                    } : null,
                    players: team2Players
                }
            }
        });
        console.log(`   ✓ PLAYING_XI saved`);

        // ----- 2. TOSS -----
        console.log('   --- TOSS ---');
        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'TOSS',
            payload: {
                winner: tossResults.tosswinnername || matchInfo.tossstatus?.split(' opt')[0],
                winnerId: tossResults.tosswinnerid,
                decision: tossResults.decision?.toLowerCase() || 'unknown',
                text: matchInfo.tossstatus,
                tossImageUrl: getFullImageUrl(matchImageId, '800x450'),
                matchImageUrl: getFullImageUrl(matchImageId, '800x450'),
                team1: {
                    id: team1Data.team_id,
                    name: team1Data.name,
                    logoUrl: getFullImageUrl(team1ImageId),
                    captain: team1Captain ? {
                        name: team1Captain.name,
                        ...splitName(team1Captain.name),
                        imageUrl: getFullImageUrl(team1CaptainProfile?.faceImageId)
                    } : null
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    logoUrl: getFullImageUrl(team2ImageId),
                    captain: team2Captain ? {
                        name: team2Captain.name,
                        ...splitName(team2Captain.name),
                        imageUrl: getFullImageUrl(team2CaptainProfile?.faceImageId)
                    } : null
                }
            }
        });
        console.log(`   ✓ TOSS saved`);

        // ----- 3. POWERPLAY_END -----
        console.log('   --- POWERPLAY_END ---');
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
                        teamLogoUrl: getFullImageUrl(teamImageId),
                        battingTeamImageUrl: getFullImageUrl(matchImageId, '800x450'),
                        powerplayRuns: pp.run,
                        powerplayWickets: pp.wickets,
                        powerplayOvers: pp.ovrto,
                        runRate: (pp.run / 6).toFixed(2),
                        team1LogoUrl: getFullImageUrl(team1ImageId),
                        team2LogoUrl: getFullImageUrl(team2ImageId)
                    }
                });
                console.log(`   ✓ POWERPLAY_END (Inn ${innings.inningsid}) saved`);
            }
        }

        // ----- 4. MILESTONE -----
        console.log('   --- MILESTONE ---');
        const MILESTONES = [50, 100, 150, 200];
        const allBatsmen = [
            ...(innings1?.batsman || []).map((b: any) => ({
                ...b, innings: 1, teamName: innings1.batteamname, teamId: team1Data.team_id, teamImageId: team1ImageId
            })),
            ...(innings2?.batsman || []).map((b: any) => ({
                ...b, innings: 2, teamName: innings2.batteamname, teamId: team2Data.team_id, teamImageId: team2ImageId
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
                                imageUrl: getFullImageUrl(playerProfile?.faceImageId),
                                runs: runs,
                                balls: batsman.balls,
                                fours: batsman.fours,
                                sixes: batsman.sixes,
                                strikeRate: batsman.strkrate
                            },
                            team: batsman.teamName,
                            teamId: batsman.teamId,
                            teamLogoUrl: getFullImageUrl(batsman.teamImageId)
                        }
                    });
                    console.log(`   ✓ MILESTONE ${milestone} for ${batsman.name} saved`);
                }
            }
        }

        // ----- 5. INNINGS_END -----
        console.log('   --- INNINGS_END ---');
        for (const [idx, innings] of [innings1, innings2].entries()) {
            if (!innings) continue;

            const teamImageId = idx === 0 ? team1ImageId : team2ImageId;
            const teamData = idx === 0 ? team1Data : team2Data;

            const topBatsmen = [...(innings.batsman || [])]
                .sort((a: any, b: any) => parseInt(b.runs) - parseInt(a.runs))
                .slice(0, 2);

            const topBowlers = [...(innings.bowler || [])]
                .sort((a: any, b: any) => parseInt(b.wickets) - parseInt(a.wickets))
                .slice(0, 2);

            const enrichedBatsmen = await Promise.all(topBatsmen.map(async (b: any) => {
                let faceImageId = null;
                try {
                    const res = await api.get(`/stats/v1/player/${b.id}`);
                    faceImageId = res.data.faceImageId;
                } catch (e) { }
                const nameParts = splitName(b.name);
                return {
                    id: b.id, name: b.name, firstName: nameParts.firstName, lastName: nameParts.lastName,
                    imageUrl: getFullImageUrl(faceImageId),
                    runs: parseInt(b.runs), balls: parseInt(b.balls), fours: parseInt(b.fours), sixes: parseInt(b.sixes)
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
                    id: b.id, name: b.name, firstName: nameParts.firstName, lastName: nameParts.lastName,
                    imageUrl: getFullImageUrl(faceImageId),
                    overs: b.overs, runs: parseInt(b.runs), wickets: parseInt(b.wickets), economy: b.economy
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
                    teamLogoUrl: getFullImageUrl(teamImageId),
                    teamImageUrl: getFullImageUrl(matchImageId, '800x450'),
                    totalRuns: innings.score,
                    totalWickets: innings.wickets,
                    totalOvers: innings.overs,
                    runRate: innings.runrate,
                    topBatsmen: enrichedBatsmen,
                    topBowlers: enrichedBowlers
                }
            });
            console.log(`   ✓ INNINGS_END (Inn ${innings.inningsid}) saved`);
        }

        // ----- 6. INNINGS_BREAK -----
        console.log('   --- INNINGS_BREAK ---');
        if (innings1 && innings2) {
            const target = innings1.score + 1;

            events.push({
                match_id: TEST_MATCH_ID,
                event_type: 'INNINGS_BREAK',
                payload: {
                    target: target,
                    firstInningsTeam: innings1.batteamname,
                    firstInningsScore: `${innings1.score}/${innings1.wickets}`,
                    chasingTeam: innings2.batteamname,
                    chasingTeamId: team2Data.team_id,
                    chasingTeamLogoUrl: getFullImageUrl(team2ImageId),
                    captain: team2Captain ? {
                        id: team2Captain.id,
                        name: team2Captain.name,
                        ...splitName(team2Captain.name),
                        imageUrl: getFullImageUrl(team2CaptainProfile?.faceImageId)
                    } : null,
                    captainImageUrl: getFullImageUrl(team2CaptainProfile?.faceImageId),
                    team1LogoUrl: getFullImageUrl(team1ImageId),
                    team2LogoUrl: getFullImageUrl(team2ImageId),
                    matchImageUrl: getFullImageUrl(matchImageId, '800x450')
                }
            });
            console.log(`   ✓ INNINGS_BREAK saved`);
        }

        // ----- 7. MATCH_END -----
        console.log('   --- MATCH_END ---');
        let playerOfMatch: any = null;
        if (momPlayers.length > 0) {
            const mom = momPlayers[0];
            playerOfMatch = {
                id: parseInt(mom.id),
                name: mom.name,
                ...splitName(mom.name),
                team: mom.teamname,
                imageUrl: getFullImageUrl(mom.faceimageid),
                awardImageUrl: getFullImageUrl(mom.faceimageid)
            };
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
                    logoUrl: getFullImageUrl(team1ImageId),
                    score: innings1 ? `${innings1.score}/${innings1.wickets}` : null
                },
                team2: {
                    id: team2Data.team_id,
                    name: team2Data.name,
                    shortName: team2Data.short_name,
                    logoUrl: getFullImageUrl(team2ImageId),
                    score: innings2 ? `${innings2.score}/${innings2.wickets}` : null
                },
                matchImageUrl: getFullImageUrl(matchImageId, '800x450')
            }
        });
        console.log(`   ✓ MATCH_END saved`);

        // ----- 8. SCORE_CHART -----
        console.log('   --- SCORE_CHART ---');
        const overSummaries: any[] = [];
        for (const item of commentary.comwrapper || []) {
            const oversep = item.oversep || item.commentary?.oversep;
            if (oversep) overSummaries.push(oversep);
        }

        events.push({
            match_id: TEST_MATCH_ID,
            event_type: 'SCORE_CHART',
            payload: {
                innings1: {
                    team: innings1?.batteamname,
                    teamLogoUrl: getFullImageUrl(team1ImageId),
                    finalScore: `${innings1?.score}/${innings1?.wickets}`,
                    overs: innings1?.overs,
                    runRate: innings1?.runrate,
                    overByOver: overSummaries.filter((o: any) => o.inningsid === 1).map((o: any) => ({
                        over: o.overnum, runs: o.score, wickets: o.wickets,
                        runRate: (o.score / o.overnum).toFixed(2), summary: o.oversummary
                    }))
                },
                innings2: {
                    team: innings2?.batteamname,
                    teamLogoUrl: getFullImageUrl(team2ImageId),
                    finalScore: `${innings2?.score}/${innings2?.wickets}`,
                    overs: innings2?.overs,
                    target: innings1?.score + 1,
                    overByOver: overSummaries.filter((o: any) => o.inningsid === 2).map((o: any) => ({
                        over: o.overnum, runs: o.score, wickets: o.wickets,
                        runRate: (o.score / o.overnum).toFixed(2), summary: o.oversummary
                    }))
                },
                powerplay: {
                    innings1: innings1?.pp?.powerplay?.[0],
                    innings2: innings2?.pp?.powerplay?.[0]
                }
            }
        });
        console.log(`   ✓ SCORE_CHART saved`);

        // Save match
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

        // Save all events
        console.log('\n[Saving all events to database...]');
        let savedCount = 0;
        for (const event of events) {
            const { error } = await supabase.from('events').insert(event);
            if (!error) savedCount++;
        }

        // SUMMARY
        console.log('\n' + '='.repeat(70));
        console.log('DONE! ALL DATA SAVED WITH FULL IMAGE URLs');
        console.log('='.repeat(70));
        console.log(`\nEvents saved: ${savedCount}/${events.length}`);

        // Show sample URLs
        console.log('\n📸 SAMPLE IMAGE URLs (copy & paste in browser):');
        console.log(`\n   India Logo:`);
        console.log(`   ${getFullImageUrl(team1ImageId)}`);
        console.log(`\n   NZ Logo:`);
        console.log(`   ${getFullImageUrl(team2ImageId)}`);
        console.log(`\n   Match Image:`);
        console.log(`   ${getFullImageUrl(matchImageId, '800x450')}`);
        if (momPlayers.length > 0) {
            console.log(`\n   Player of Match (${momPlayers[0].name}):`);
            console.log(`   ${getFullImageUrl(momPlayers[0].faceimageid)}`);
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

saveCompleteData();
