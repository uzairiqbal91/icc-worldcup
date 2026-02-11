import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

async function callCricbuzzAPI(endpoint: string) {
    try {
        const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
            next: { revalidate: 10 } // Cache for 10 seconds for live data
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('Cricbuzz API error:', error);
        throw error;
    }
}

function getImageUrl(imageId: number | string | undefined) {
    if (!imageId) return null;
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
        return NextResponse.json({ success: false, error: 'matchId required' }, { status: 400 });
    }

    try {
        // Fetch match info and scorecard in parallel
        const [matchInfo, scorecard] = await Promise.all([
            callCricbuzzAPI(`/mcenter/v1/${matchId}`),
            callCricbuzzAPI(`/mcenter/v1/${matchId}/hscard`).catch(() => null),
        ]);

        // Handle both API response formats (nested matchInfo or direct)
        const match = matchInfo?.matchInfo || matchInfo;
        // Handle both scorecard formats (scoreCard or scorecard)
        const score = scorecard?.scoreCard || scorecard?.scorecard;

        // Parse toss info - handle both formats
        const tossInfo = match?.tossResults ? {
            winner: match.tossResults.tossWinnerName,
            decision: match.tossResults.decision,
        } : (match?.tossstatus ? {
            winner: match.tossstatus.split(' opt to ')[0],
            decision: match.tossstatus.includes('bat') ? 'bat' : 'bowl',
        } : null);

        // Parse playing XI - handle both formats
        const team1Players = (match?.team1?.playerDetails || []).map((p: any) => ({
            id: p.id,
            name: p.name || p.nickname,
            fullName: p.fullName || p.name,
            isCaptain: p.captain || p.iscaptain || false,
            isKeeper: p.keeper || p.iskeeper || false,
            imageUrl: getImageUrl(p.faceImageId || p.imageid),
            role: p.role,
        }));

        const team2Players = (match?.team2?.playerDetails || []).map((p: any) => ({
            id: p.id,
            name: p.name || p.nickname,
            fullName: p.fullName || p.name,
            isCaptain: p.captain || p.iscaptain || false,
            isKeeper: p.keeper || p.iskeeper || false,
            imageUrl: getImageUrl(p.faceImageId || p.imageid),
            role: p.role,
        }));

        // Parse innings data - handle both API formats
        const innings: any[] = [];
        if (score && Array.isArray(score)) {
            score.forEach((inning: any, index: number) => {
                // Handle both formats for batsmen data
                let batsmen: any[] = [];
                if (inning.batTeamDetails?.batsmenData) {
                    // Format 1: nested batsmenData object
                    batsmen = Object.values(inning.batTeamDetails.batsmenData).map((b: any) => ({
                        id: b.batId,
                        name: b.batName,
                        runs: b.runs,
                        balls: b.balls,
                    }));
                } else if (inning.batsman && Array.isArray(inning.batsman)) {
                    // Format 2: direct batsman array
                    batsmen = inning.batsman.map((b: any) => ({
                        id: b.id,
                        name: b.name || b.nickname,
                        runs: b.runs,
                        balls: b.balls,
                    }));
                }

                // Handle both formats for bowlers data
                let bowlers: any[] = [];
                if (inning.bowlTeamDetails?.bowlersData) {
                    // Format 1: nested bowlersData object
                    bowlers = Object.values(inning.bowlTeamDetails.bowlersData).map((b: any) => ({
                        id: b.bowlerId,
                        name: b.bowlName,
                        overs: b.overs,
                        runs: b.runs,
                        wickets: b.wickets,
                    }));
                } else if (inning.bowler && Array.isArray(inning.bowler)) {
                    // Format 2: direct bowler array
                    bowlers = inning.bowler.map((b: any) => ({
                        id: b.id,
                        name: b.name || b.nickname,
                        overs: b.overs,
                        runs: b.runs,
                        wickets: b.wickets,
                    }));
                }

                // Calculate total runs and wickets from scoreDetails or batsmen/bowlers
                const totalRuns = inning.scoreDetails?.runs ??
                    inning.batTeamDetails?.score ??
                    batsmen.reduce((sum: number, b: any) => sum + (b.runs || 0), 0);

                // Get wickets from multiple sources
                // First try scoreDetails, then batTeamDetails
                let totalWickets = inning.scoreDetails?.wickets ?? inning.batTeamDetails?.wickets;

                // If still undefined, calculate from bowlers (sum of wickets taken)
                if (totalWickets === undefined || totalWickets === null) {
                    totalWickets = bowlers.reduce((sum: number, b: any) => sum + (parseInt(b.wickets) || 0), 0);
                }

                // If still 0, try counting dismissed batsmen
                if (totalWickets === 0) {
                    const dismissedCount = batsmen.filter((b: any) => b.outDesc && b.outDesc !== 'not out' && b.outDesc !== 'batting').length;
                    if (dismissedCount > 0) totalWickets = dismissedCount;
                }

                const totalOvers = inning.scoreDetails?.overs ??
                    inning.batTeamDetails?.overs ??
                    inning.overs ?? 0;

                // Calculate powerplay data using FOW (Fall of Wickets) for accuracy
                const currentOvers = parseFloat(String(totalOvers) || '0');
                const currentScore = totalRuns;
                const currentWickets = totalWickets;

                let powerplayScore: number | null = null;
                let powerplayWickets: number | null = null;
                let powerplayOvers = 6;

                if (currentOvers <= 6) {
                    // Match is still in powerplay - use current score
                    powerplayScore = currentScore;
                    powerplayWickets = currentWickets;
                    powerplayOvers = currentOvers;
                } else if (currentOvers > 0) {
                    // Powerplay is complete - use FOW data for accurate calculation
                    const fowData = inning.fow?.fow || [];

                    // Count wickets that fell during powerplay (overs <= 6)
                    const ppWicketsFromFow = fowData.filter((w: any) => parseFloat(w.overnbr) <= 6).length;

                    // Find the score at the last wicket before/at 6 overs and first wicket after 6 overs
                    const wicketsInPP = fowData.filter((w: any) => parseFloat(w.overnbr) <= 6);
                    const wicketsAfterPP = fowData.filter((w: any) => parseFloat(w.overnbr) > 6);

                    if (wicketsInPP.length > 0 && wicketsAfterPP.length > 0) {
                        // Interpolate between last PP wicket and first post-PP wicket
                        const lastPPWicket = wicketsInPP[wicketsInPP.length - 1];
                        const firstAfterPP = wicketsAfterPP[0];

                        const lastPPOvers = parseFloat(lastPPWicket.overnbr);
                        const firstAfterOvers = parseFloat(firstAfterPP.overnbr);
                        const lastPPScore = lastPPWicket.runs;
                        const firstAfterScore = firstAfterPP.runs;

                        // Linear interpolation to estimate score at exactly 6 overs
                        const oversRange = firstAfterOvers - lastPPOvers;
                        const scoreRange = firstAfterScore - lastPPScore;
                        const oversTo6 = 6 - lastPPOvers;

                        if (oversRange > 0) {
                            powerplayScore = Math.round(lastPPScore + (scoreRange * (oversTo6 / oversRange)));
                        } else {
                            powerplayScore = lastPPScore;
                        }
                    } else if (wicketsInPP.length > 0) {
                        // No wickets after PP, estimate from last PP wicket
                        const lastPPWicket = wicketsInPP[wicketsInPP.length - 1];
                        const lastPPOvers = parseFloat(lastPPWicket.overnbr);
                        const lastPPScore = lastPPWicket.runs;

                        // Estimate remaining runs using run rate
                        const runRate = currentScore / currentOvers;
                        const remainingOvers = 6 - lastPPOvers;
                        powerplayScore = Math.round(lastPPScore + (runRate * remainingOvers));
                    } else if (wicketsAfterPP.length > 0) {
                        // No wickets during PP, use first wicket after to estimate
                        const firstAfterPP = wicketsAfterPP[0];
                        const firstAfterOvers = parseFloat(firstAfterPP.overnbr);
                        const firstAfterScore = firstAfterPP.runs;

                        // Estimate PP score by scaling back
                        powerplayScore = Math.round(firstAfterScore * (6 / firstAfterOvers));
                    } else {
                        // No FOW data, fallback to run rate estimate
                        const runRate = currentScore / currentOvers;
                        powerplayScore = Math.round(runRate * 6);
                    }

                    powerplayWickets = ppWicketsFromFow;
                    powerplayOvers = 6;
                }

                // Determine batting team name from various possible sources
                const battingTeam = inning.batTeamDetails?.batTeamName ||
                    inning.batteamname ||
                    (index === 0 ? (match?.team1?.teamname || match?.team1?.name) : (match?.team2?.teamname || match?.team2?.name));

                const battingTeamShort = inning.batTeamDetails?.batTeamShortName ||
                    inning.batteamsname ||
                    (index === 0 ? (match?.team1?.teamsname || match?.team1?.shortName) : (match?.team2?.teamsname || match?.team2?.shortName));

                innings.push({
                    inningsId: inning.inningsId || inning.inningsid,
                    battingTeam: battingTeam,
                    battingTeamShort: battingTeamShort,
                    bowlingTeam: inning.bowlTeamDetails?.bowlTeamName || inning.bowlteamname,
                    score: currentScore,
                    wickets: currentWickets,
                    overs: currentOvers,
                    runRate: inning.scoreDetails?.runRate,
                    target: inning.scoreDetails?.target || inning.target,
                    // Powerplay specific data
                    powerplayScore: powerplayScore,
                    powerplayWickets: powerplayWickets,
                    powerplayOvers: powerplayOvers,
                    batsmen: batsmen.sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0)),
                    bowlers: bowlers.sort((a: any, b: any) => (b.wickets || 0) - (a.wickets || 0) || (a.runs || 0) - (b.runs || 0)),
                    isPowerplayComplete: currentOvers >= 6,
                    isComplete: inning.isInningsComplete || inning.isinningscomplete || false,
                });
            });
        }

        // Detect events for template suggestions
        const events: string[] = [];

        if (tossInfo) events.push('toss');
        if (team1Players.length === 11 && team2Players.length === 11) events.push('playing_xi');

        innings.forEach((inn, idx) => {
            if (inn.isPowerplayComplete && !inn.isComplete) {
                events.push(`powerplay_${idx + 1}`);
            }
            if (inn.isComplete) {
                events.push(`innings_end_${idx + 1}`);
            }
            // Check for milestones
            inn.batsmen?.forEach((bat: any) => {
                if (bat.runs >= 100) events.push(`milestone_100_${bat.name}`);
                else if (bat.runs >= 50) events.push(`milestone_50_${bat.name}`);
            });
        });

        // Check for target set
        if (innings.length >= 1 && innings[0].isComplete) {
            events.push('target');
        }

        // Check for match result
        if (match?.state === 'Complete') {
            events.push('match_result');
        }

        // Get current batting/bowling info for live updates
        // Better logic: if there are 2 innings, the current one is the last one (2nd innings is in progress)
        // unless the match is complete. For T20, first innings with 20 overs is complete even if flag is false.
        let currentInnings = innings[innings.length - 1]; // Default to last innings

        if (innings.length >= 2) {
            const firstInnings = innings[0];
            const secondInnings = innings[1];
            const matchFormat = match?.matchFormat || match?.matchformat;
            const maxOvers = matchFormat === 'T20' ? 20 : (matchFormat === 'ODI' ? 50 : 90);

            // If first innings has completed all overs or is marked complete, current is 2nd innings
            if (firstInnings.overs >= maxOvers || firstInnings.isComplete) {
                currentInnings = secondInnings;
            } else if (!secondInnings.isComplete && secondInnings.overs > 0) {
                // If 2nd innings has started (overs > 0), it's the current one
                currentInnings = secondInnings;
            } else {
                currentInnings = firstInnings;
            }
        } else if (innings.length === 1) {
            currentInnings = innings[0];
        }

        return NextResponse.json({
            success: true,
            matchId,
            state: match?.state || 'Unknown',
            status: match?.status || match?.shortstatus,
            team1: {
                id: match?.team1?.id || match?.team1?.teamid,
                name: match?.team1?.name || match?.team1?.teamname,
                shortName: match?.team1?.shortName || match?.team1?.teamsname,
                imageUrl: getImageUrl(match?.team1?.imageId || match?.team1?.imageid),
                players: team1Players,
            },
            team2: {
                id: match?.team2?.id || match?.team2?.teamid,
                name: match?.team2?.name || match?.team2?.teamname,
                shortName: match?.team2?.shortName || match?.team2?.teamsname,
                imageUrl: getImageUrl(match?.team2?.imageId || match?.team2?.imageid),
                players: team2Players,
            },
            toss: tossInfo,
            innings,
            currentInnings,
            events,
            venue: match?.venue?.name || match?.venueinfo?.ground,
            matchFormat: match?.matchFormat || match?.matchformat,
            result: match?.result,
        });

    } catch (error: any) {
        console.error('Error fetching match details:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
