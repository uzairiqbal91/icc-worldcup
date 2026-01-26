import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SCORE_POLL_INTERVAL_MS = 30000; // 30 seconds

interface TrackedMatch {
    matchId: number;
    intervalId: NodeJS.Timeout | null;
    isComplete: boolean;
}

const trackedMatches: Map<number, TrackedMatch> = new Map();

async function main() {
    console.log('🏏 Live Match Tracker Started...\n');

    // Dynamic imports after env is loaded
    const { getLiveMatches, getMatchScorecard, getMatchInfo, getImageUrl } = await import('../lib/rapidapi');
    const { supabase } = await import('../lib/supabase');

    // Helper to convert image ID to full URL
    const toFullImageUrl = (imageId: number | string | undefined) => {
        if (!imageId) return null;
        return getImageUrl(imageId);
    };

    // Fetch and save match data (one-time)
    async function fetchAndSaveMatchData(matchId: number, matchInfo: any) {
        console.log(`\n📥 Fetching complete data for Match ${matchId}...`);

        try {
            // Get scorecard for squad details
            const scorecard = await getMatchScorecard(matchId);
            if (!scorecard) {
                console.log(`❌ Could not fetch scorecard for match ${matchId}`);
                return;
            }

            // Get detailed match info
            const detailedInfo = await getMatchInfo(matchId);

            // Extract team info from detailedInfo (lowercase keys) or matchInfo
            const team1 = detailedInfo?.team1 || matchInfo.team1;
            const team2 = detailedInfo?.team2 || matchInfo.team2;

            // Save/update teams (API uses lowercase keys: teamid, teamname, teamsname, imageid)
            const teamsToSave = [team1, team2].filter(Boolean).map(team => ({
                team_id: team.teamid || team.teamId || team.id,
                name: team.teamname || team.teamName || team.name,
                short_name: team.teamsname || team.teamSName || team.shortName,
                image_id: team.imageid || team.imageId || null
            }));

            for (const team of teamsToSave) {
                if (team.team_id) {
                    const { error } = await supabase
                        .from('teams')
                        .upsert(team, { onConflict: 'team_id' });
                    if (error) console.log(`Team save error:`, error.message);
                }
            }
            console.log(`✅ Teams saved: ${teamsToSave.map(t => t.name).join(' vs ')}`);

            // Save match
            const matchData = {
                match_id: matchId,
                series_id: detailedInfo?.seriesid || matchInfo.seriesId,
                series_name: detailedInfo?.seriesname || matchInfo.seriesName,
                match_desc: detailedInfo?.matchdesc || matchInfo.matchDesc,
                match_format: detailedInfo?.matchformat || matchInfo.matchFormat,
                start_time: parseInt(detailedInfo?.startdate || matchInfo.startDate),
                status: detailedInfo?.status || matchInfo.status,
                state: detailedInfo?.state || matchInfo.state,
                venue: (detailedInfo?.venueinfo || matchInfo.venueInfo) ? {
                    id: (detailedInfo?.venueinfo || matchInfo.venueInfo)?.id,
                    ground: (detailedInfo?.venueinfo || matchInfo.venueInfo)?.ground,
                    city: (detailedInfo?.venueinfo || matchInfo.venueInfo)?.city,
                    timezone: (detailedInfo?.venueinfo || matchInfo.venueInfo)?.timezone
                } : null,
                team1_id: team1?.teamid || team1?.teamId || team1?.id,
                team2_id: team2?.teamid || team2?.teamId || team2?.id
            };

            const { error: matchError } = await supabase
                .from('matches')
                .upsert(matchData, { onConflict: 'match_id' });
            if (matchError) console.log(`Match save error:`, matchError.message);
            else console.log(`✅ Match saved: ${matchData.match_desc}`);

            // Extract players from scorecard (lowercase: scorecard, batsman, bowler arrays)
            // scorecard.scorecard is an array of innings
            // Each innings has batsman[] and bowler[] arrays
            let players1: any[] = [];
            let players2: any[] = [];

            const team1Id = team1?.teamid || team1?.teamId || team1?.id;
            const team2Id = team2?.teamid || team2?.teamId || team2?.id;

            // Get innings data - API uses lowercase 'scorecard' not 'scoreCard'
            const innings = scorecard.scorecard || scorecard.scoreCard || [];

            for (const inning of innings) {
                if (!inning) continue;

                // Get team info from innings (batteamname, batteamsname)
                const batTeamName = inning.batteamname || inning.batTeamName;
                const batTeamSName = inning.batteamsname || inning.batTeamSName;

                // Determine which team is batting based on name matching
                const isBatTeam1 = (batTeamName === team1?.teamname || batTeamName === team1?.teamName ||
                                    batTeamSName === team1?.teamsname || batTeamSName === team1?.teamSName);

                // Extract batsmen (lowercase: batsman array with id, name, iscaptain, iskeeper, imageid)
                const batsmen = inning.batsman || [];
                for (const bat of batsmen) {
                    const playerData = {
                        id: bat.id,
                        name: bat.name || bat.nickname,
                        faceImageId: bat.imageid || bat.imageId,
                        teamId: isBatTeam1 ? team1Id : team2Id,
                        isCaptain: bat.iscaptain || bat.isCaptain || false,
                        isKeeper: bat.iskeeper || bat.isKeeper || false
                    };

                    if (isBatTeam1) {
                        if (!players1.find(p => p.id === playerData.id)) {
                            players1.push(playerData);
                        }
                    } else {
                        if (!players2.find(p => p.id === playerData.id)) {
                            players2.push(playerData);
                        }
                    }
                }

                // Extract bowlers (they belong to the OTHER team)
                const bowlers = inning.bowler || [];
                for (const bowl of bowlers) {
                    const playerData = {
                        id: bowl.id,
                        name: bowl.name || bowl.nickname,
                        faceImageId: bowl.imageid || bowl.imageId,
                        teamId: isBatTeam1 ? team2Id : team1Id, // Bowlers are from opposing team
                        isCaptain: bowl.iscaptain || bowl.isCaptain || false,
                        isKeeper: bowl.iskeeper || bowl.isKeeper || false
                    };

                    if (isBatTeam1) {
                        // Bowler is from team2
                        if (!players2.find(p => p.id === playerData.id)) {
                            players2.push(playerData);
                        }
                    } else {
                        // Bowler is from team1
                        if (!players1.find(p => p.id === playerData.id)) {
                            players1.push(playerData);
                        }
                    }
                }
            }

            const allPlayers = [...players1, ...players2];

            // Save players to database
            const playersToSave = allPlayers.map((p: any) => ({
                player_id: p.id,
                name: p.name,
                team_id: p.teamId,
                role: p.role || null,
                face_image_id: p.faceImageId || null,
                batting_style: p.battingStyle || null,
                bowling_style: p.bowlingStyle || null
            }));

            for (const player of playersToSave) {
                if (player.player_id) {
                    const { error } = await supabase
                        .from('players')
                        .upsert(player, { onConflict: 'player_id' });
                    if (error && !error.message.includes('duplicate')) {
                        console.log(`Player save error for ${player.name}:`, error.message);
                    }
                }
            }
            console.log(`✅ Squad saved: ${playersToSave.length} players`);

            // Save Playing XI event with full image URLs in payload
            const formatSquad = (players: any[], team: any) => ({
                team: {
                    id: team?.teamid || team?.teamId || team?.id,
                    name: team?.teamname || team?.teamName || team?.name,
                    short_name: team?.teamsname || team?.teamSName,
                    logo_url: toFullImageUrl(team?.imageid || team?.imageId)
                },
                players: players.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    image_url: toFullImageUrl(p.faceImageId),
                    is_captain: p.isCaptain || false,
                    is_keeper: p.isKeeper || false
                }))
            });

            const playingXIPayload = {
                team1: formatSquad(players1, team1),
                team2: formatSquad(players2, team2)
            };

            // Check if PLAYING_XI event already exists
            const { data: existingEvent } = await supabase
                .from('events')
                .select('id')
                .eq('match_id', matchId)
                .eq('event_type', 'PLAYING_XI')
                .single();

            if (!existingEvent) {
                await supabase.from('events').insert({
                    match_id: matchId,
                    event_type: 'PLAYING_XI',
                    payload: playingXIPayload
                });
                console.log(`✅ Playing XI event saved`);
            }

            // Save Toss event if available (check detailedInfo for toss status)
            const tossStatus = detailedInfo?.tossstatus;
            if (tossStatus && tossStatus.includes('won the toss')) {
                const { data: existingToss } = await supabase
                    .from('events')
                    .select('id')
                    .eq('match_id', matchId)
                    .eq('event_type', 'TOSS')
                    .single();

                if (!existingToss) {
                    const tossPayload = {
                        text: tossStatus
                    };

                    await supabase.from('events').insert({
                        match_id: matchId,
                        event_type: 'TOSS',
                        payload: tossPayload
                    });
                    console.log(`✅ Toss event saved: ${tossStatus}`);
                }
            }

        } catch (err) {
            console.error(`Error fetching match data:`, err);
        }
    }

    // Poll and save scores
    async function pollAndSaveScores(matchId: number) {
        const tracked = trackedMatches.get(matchId);
        if (!tracked || tracked.isComplete) return;

        try {
            const scorecard = await getMatchScorecard(matchId);
            if (!scorecard) return;

            // API uses lowercase keys
            const status = scorecard.status;
            const isComplete = scorecard.ismatchcomplete || scorecard.isMatchComplete;

            console.log(`\n📊 [${new Date().toLocaleTimeString()}] Match ${matchId} - ${status}`);

            // Extract score data from scorecard array (lowercase)
            const innings = scorecard.scorecard || scorecard.scoreCard || [];

            for (const inning of innings) {
                if (!inning) continue;

                // API uses lowercase: batteamname, score, wickets, overs, runrate
                const teamName = inning.batteamname || inning.batTeamName;
                const teamSName = inning.batteamsname || inning.batTeamSName;
                const score = inning.score;
                const wickets = inning.wickets;
                const overs = inning.overs;
                const runRate = inning.runrate || inning.runRate;

                console.log(`   ${teamSName || teamName}: ${score}/${wickets} (${overs} ov) RR: ${runRate}`);

                // Show top batsmen from this innings
                const batsmen = inning.batsman || [];
                const topBats = [...batsmen]
                    .sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))
                    .slice(0, 2);

                for (const bat of topBats) {
                    const indicator = bat.outDec || bat.outdec ? '' : '*';
                    console.log(`      ${bat.name}${indicator}: ${bat.runs}(${bat.balls})`);
                }

                // Save score snapshot to database
                // We need to determine team_id from team name
                const scoreData = {
                    match_id: matchId,
                    innings_id: inning.inningsid || inning.inningsId,
                    runs: score,
                    wickets: wickets,
                    overs: parseFloat(overs) || 0,
                    crr: parseFloat(runRate) || null,
                    partnership: inning.partnership || null
                };

                const { error } = await supabase.from('scores').insert(scoreData);
                if (error && !error.message.includes('duplicate') && !error.message.includes('null value')) {
                    console.log(`Score save error:`, error.message);
                }
            }

            // Update match status in DB
            await supabase
                .from('matches')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('match_id', matchId);

            // Check if match is complete
            if (isComplete) {
                console.log(`\n🏆 Match ${matchId} Complete!`);
                console.log(`   Result: ${status}`);

                // Save MATCH_END event
                const matchEndPayload = {
                    result: status
                };

                const { data: existingEnd } = await supabase
                    .from('events')
                    .select('id')
                    .eq('match_id', matchId)
                    .eq('event_type', 'MATCH_END')
                    .single();

                if (!existingEnd) {
                    await supabase.from('events').insert({
                        match_id: matchId,
                        event_type: 'MATCH_END',
                        payload: matchEndPayload
                    });
                    console.log(`✅ Match End event saved`);
                }

                // Stop tracking this match
                stopTracking(matchId);
            }

        } catch (err) {
            console.error(`Error polling scores for match ${matchId}:`, err);
        }
    }

    // Start tracking a match
    function startTracking(matchId: number, matchInfo: any) {
        if (trackedMatches.has(matchId)) {
            console.log(`Match ${matchId} is already being tracked`);
            return;
        }

        console.log(`\n🎯 Starting to track Match ${matchId}`);

        const tracked: TrackedMatch = {
            matchId,
            intervalId: null,
            isComplete: false
        };

        trackedMatches.set(matchId, tracked);

        // Fetch match data once
        fetchAndSaveMatchData(matchId, matchInfo).then(() => {
            // Start polling scores every 30 seconds
            console.log(`\n⏱️  Starting score polling every 30 seconds for Match ${matchId}...`);

            // Poll immediately first
            pollAndSaveScores(matchId);

            // Then set interval
            tracked.intervalId = setInterval(() => {
                pollAndSaveScores(matchId);
            }, SCORE_POLL_INTERVAL_MS);
        });
    }

    // Stop tracking a match
    function stopTracking(matchId: number) {
        const tracked = trackedMatches.get(matchId);
        if (tracked) {
            if (tracked.intervalId) {
                clearInterval(tracked.intervalId);
            }
            tracked.isComplete = true;
            console.log(`\n🛑 Stopped tracking Match ${matchId}`);
        }
    }

    // Main: Find and track live matches
    async function findAndTrackLiveMatches() {
        console.log(`\n🔍 Searching for live INTERNATIONAL matches...`);

        const data = await getLiveMatches();
        if (!data || !data.typeMatches) {
            console.log('No live match data available');
            return;
        }

        const liveMatches: any[] = [];

        // Extract only INTERNATIONAL matches from the response
        data.typeMatches.forEach((type: any) => {
            const matchType = type.matchType || '';

            // Only process International matches (skip League, Domestic, U19, Women's League, etc.)
            if (matchType.toLowerCase() !== 'international') {
                return;
            }

            console.log(`   Found match type: ${matchType}`);

            const seriesMatches = type.seriesMatches || [];
            seriesMatches.forEach((series: any) => {
                if (series.seriesAdWrapper) {
                    const matches = series.seriesAdWrapper.matches || [];
                    matches.forEach((m: any) => {
                        if (m.matchInfo) {
                            liveMatches.push(m.matchInfo);
                        }
                    });
                }
            });
        });

        // Filter for "In Progress" matches
        const inProgressMatches = liveMatches.filter(m => m.state === 'In Progress');

        if (inProgressMatches.length === 0) {
            console.log('No live matches currently in progress');
            console.log(`\nFound ${liveMatches.length} total matches:`);
            liveMatches.slice(0, 5).forEach(m => {
                console.log(`   - ${m.matchDesc}: ${m.team1?.teamSName || 'TBD'} vs ${m.team2?.teamSName || 'TBD'} (${m.state})`);
            });
            return;
        }

        console.log(`\n🏏 Found ${inProgressMatches.length} live match(es):`);

        for (const match of inProgressMatches) {
            const matchId = match.matchId;
            const desc = `${match.team1?.teamSName || 'Team1'} vs ${match.team2?.teamSName || 'Team2'}`;
            console.log(`   - Match ${matchId}: ${desc} (${match.matchDesc})`);

            // Start tracking if not already
            if (!trackedMatches.has(matchId)) {
                startTracking(matchId, match);
            }
        }
    }

    // Start the tracker
    await findAndTrackLiveMatches();

    // If no live matches found, check again in 60 seconds
    if (trackedMatches.size === 0) {
        console.log('\n⏳ Will check again for live matches in 60 seconds...');
        const checkInterval = setInterval(async () => {
            await findAndTrackLiveMatches();
            if (trackedMatches.size > 0) {
                clearInterval(checkInterval);
            }
        }, 60000);
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Shutting down tracker...');
        trackedMatches.forEach((tracked, matchId) => {
            stopTracking(matchId);
        });
        process.exit(0);
    });

    // Keep process alive
    console.log('\n✨ Tracker is running. Press Ctrl+C to stop.\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
