
import { supabase } from '../lib/supabase';
import { getMatchInfo, getMatchScorecard, getImageUrl } from '../lib/rapidapi';
import { RapidMatchInfo } from './types';

export async function handlePlayingXI(matchId: number) {
    try {
        const data = await getMatchInfo(matchId);
        if (!data) return;

        // API Structure normalization:
        const scard = await getMatchScorecard(matchId);
        if (!scard) return;

        // The scard endpoint returns flat structure: { matchId: ..., team1: ..., scoreCard: ... }
        // BUT some versions/endpoints returns { matchInfo: ..., matchHeader: ... }
        // Let's normalize.
        const team1 = scard.team1 || scard.matchInfo?.team1;
        const team2 = scard.team2 || scard.matchInfo?.team2;
        const players1 = team1?.playerDetails || scard.matchInfo?.team1?.playerDetails;
        const players2 = team2?.playerDetails || scard.matchInfo?.team2?.playerDetails;

        if (!players1) {
            console.log("No player details found in scorecard.");
            return;
        }

        const formatTeam = (players: any[]) => {
            return players.map(p => ({
                id: p.id,
                name: p.name, // or p.Name?
                role: p.role,
                image: getImageUrl(p.faceImageId || p.faceimageid),
                isCaptain: p.isCaptain || p.iscaptain,
                isKeeper: p.isKeeper || p.iskeeper
            }));
        };

        const payload = {
            team1: {
                name: team1.name || team1.teamName || team1.teamname,
                logo: getImageUrl(team1.imageId || team1.imageid),
                players: formatTeam(players1)
            },
            team2: {
                name: team2.name || team2.teamName || team2.teamname,
                logo: getImageUrl(team2.imageId || team2.imageid),
                players: formatTeam(players2)
            }
        };

        // Insert into DB
        const { error } = await supabase.from('events').insert({
            match_id: matchId,
            event_type: 'PLAYING_XI',
            payload
        });

        if (error) console.error("Error saving Playing XI:", error);
        else console.log(`[Event] Playing XI saved for ${matchId}`);

    } catch (err) {
        console.error("Error in handlePlayingXI:", err);
    }
}

export async function handleToss(matchId: number) {
    try {
        const scard = await getMatchScorecard(matchId);
        if (!scard) return;

        const toss = scard.tossResults || scard.matchHeader?.tossResults;
        if (!toss) return;

        // Helper to find captain in squad
        const team1 = scard.team1 || scard.matchInfo?.team1;
        const team2 = scard.team2 || scard.matchInfo?.team2;

        const findCaptain = (team: any) => {
            if (!team || !team.playerDetails) return null;
            const cap = team.playerDetails.find((p: any) => p.isCaptain || p.iscaptain);
            return cap ? { name: cap.name, image: getImageUrl(cap.faceImageId || cap.faceimageid) } : null;
        };

        const payload = {
            winner: toss.tossWinnerName,
            decision: toss.decision,
            text: `${toss.tossWinnerName} won the toss and opted to ${toss.decision}`,
            captains: {
                team1: findCaptain(team1),
                team2: findCaptain(team2)
            }
        };

        const { error } = await supabase.from('events').insert({
            match_id: matchId,
            event_type: 'TOSS',
            payload
        });

        if (!error) console.log(`[Event] Toss saved for ${matchId}`);

    } catch (err) {
        console.error("Error in handleToss:", err);
    }
}

// Track previous scores to detect milestones
const playerScores: Record<number, number> = {};

export async function handleLiveEvents(matchId: number, scorecard: any) {
    if (!scorecard) return;

    // 1. Powerplay (Example: Check if over just crossed 6.0 in T20)
    // Complexity: Need to know if we JUST crossed it. 
    // Simplified: We rely on status text or over count logic, but for robustness
    // we might just check if the event already exists in DB for this match/inning.

    // 2. Milestones (50/100)
    const bats = [
        ...(scorecard.scoreCard?.[0]?.batTeamDetails?.batsmenData || []), // Inning 1
        ...(scorecard.scoreCard?.[1]?.batTeamDetails?.batsmenData || [])  // Inning 2
    ];

    for (const bat of bats) {
        const runs = parseInt(bat.runs);
        const pid = bat.batId;
        const prev = playerScores[pid] || 0;

        if (runs >= 50 && prev < 50) {
            await logMilestone(matchId, bat, 50, scorecard);
        }
        if (runs >= 100 && prev < 100) {
            await logMilestone(matchId, bat, 100, scorecard);
        }

        playerScores[pid] = runs; // Update memory
    }
}

async function logMilestone(matchId: number, player: any, milestone: number, scard: any) {
    const scardTeam1 = scard.team1 || scard.matchInfo?.team1;
    const scardTeam2 = scard.team2 || scard.matchInfo?.team2;
    // Determine which team logo to use. 'player' object has teamId.
    const teamId = player.teamId || player.teamid; // Case sensitivity?
    // scorecard team1.id vs team1.teamId. Step 142 showed team1.teamId.

    // Normalize Team IDs
    const t1Id = scardTeam1.id || scardTeam1.teamId || scardTeam1.teamid;
    const t2Id = scardTeam2.id || scardTeam2.teamId || scardTeam2.teamid;

    const teamLogo = getImageUrl(t1Id == teamId ? (scardTeam1.imageId || scardTeam1.imageid) : (scardTeam2.imageId || scardTeam2.imageid));

    const payload = {
        player: {
            name: player.batName || player.batname,
            image: getImageUrl(player.faceImageId || player.faceimageid),
            runs: player.runs,
            balls: player.balls,
        },
        milestone: milestone,
        teamLogo: teamLogo
    };

    console.log(`[Event] Milestone ${milestone} for ${player.batName}`);
    await supabase.from('events').insert({
        match_id: matchId,
        event_type: 'MILESTONE',
        payload
    });
}

export async function handleInningsEnd(matchId: number, scorecard: any) {
    // Detect if we just finished an inning.
    // Logic: distinct event type 'INNINGS_END' with a unique key for inning number (1 or 2).
    // The scorecard contains innings array.
    const innings = scorecard?.scoreCard || [];
    if (innings.length === 0) return;

    // Check if Inning 1 is complete
    const inning1 = innings[0];
    if (inning1 && inning1.inningsId === 1 && (inning1.wkts === 10 || inning1.overs === 20)) {
        // Simple check: checkDB if 'INNINGS_END_1' exists
        // Construct payload: Top 2 bats, Top 2 bowls.
        const topBats = (inning1.batTeamDetails.batsmenData || [])
            .sort((a: any, b: any) => parseInt(b.runs) - parseInt(a.runs))
            .slice(0, 2)
            .map((p: any) => ({ name: p.batName, runs: p.runs, balls: p.balls, image: getImageUrl(p.faceImageId) }));

        const topBowls = (inning1.bowlTeamDetails.bowlersData || [])
            .sort((a: any, b: any) => parseInt(b.wickets) - parseInt(a.wickets))
            .slice(0, 2)
            .map((p: any) => ({ name: p.name, wickets: p.wickets, overs: p.overs, image: getImageUrl(p.faceImageId) }));

        const payload = {
            inning: 1,
            team: inning1.batTeamDetails.batTeamName,
            score: `${inning1.score}/${inning1.wkts}`,
            topBatsmen: topBats,
            topBowlers: topBowls,
            teamLogo: getImageUrl((innings[0].batTeamDetails.batTeamId == (scorecard.team1?.id || scorecard.team1?.teamId || scorecard.team1?.teamid)) ? (scorecard.team1.imageId || scorecard.team1.imageid) : (scorecard.team2.imageId || scorecard.team2.imageid))
        };

        // We rely on caller to check duplication or DB constraint
        await supabase.from('events').insert({
            match_id: matchId,
            event_type: 'INNINGS_END',
            payload
        });
    }
}

export async function handleMatchEnd(matchId: number, scorecard: any) {
    // Check status
    const state = scorecard.state || scorecard.matchHeader?.state;
    if (state !== "Complete") return;

    const result = scorecard.result || scorecard.matchHeader?.result; // result object? 
    // Step 142 data: "status": "Madhya Pradesh won by 217 runs". "state": "Complete".
    // Does 'result' object exist? Step 142 example JSON doesn't show 'result' object, it shows 'status' string.
    // getMatchScorecard output in Step 177: "status": "Day 4...".
    // We might need to rely on 'status' string if 'result' object is missing.
    // Or 'matchSummary' ?

    const winText = scorecard.status || result?.winningTeam;

    const mom = scorecard.playersOfTheMatch?.[0] || scorecard.matchHeader?.playersOfTheMatch?.[0];

    const team1 = scorecard.team1 || scorecard.matchInfo?.team1;
    const team2 = scorecard.team2 || scorecard.matchInfo?.team2;

    const payload = {
        result: winText,
        winMargin: result?.winMargin, // Might be undefined if result not object
        winType: result?.winType,
        mom: mom ? {
            name: mom.name,
            image: getImageUrl(mom.faceImageId || mom.faceimageid),
            teamName: mom.teamName || mom.teamname
        } : null,
        team1Logo: getImageUrl(team1.imageId || team1.imageid),
        team2Logo: getImageUrl(team2.imageId || team2.imageid)
    };

    console.log(`[Event] Match End for ${matchId}`);
    await supabase.from('events').insert({
        match_id: matchId,
        event_type: 'MATCH_END',
        payload
    });
}

