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
        // Fetch match info, scorecard, and commentary in parallel
        const [matchInfo, scorecard] = await Promise.all([
            callCricbuzzAPI(`/mcenter/v1/${matchId}`),
            callCricbuzzAPI(`/mcenter/v1/${matchId}/hscard`).catch(() => null),
        ]);

        const match = matchInfo?.matchInfo;
        const score = scorecard?.scoreCard;

        // Parse toss info
        const tossInfo = match?.tossResults ? {
            winner: match.tossResults.tossWinnerName,
            decision: match.tossResults.decision,
        } : null;

        // Parse playing XI
        const team1Players = match?.team1?.playerDetails?.map((p: any) => ({
            id: p.id,
            name: p.name,
            fullName: p.fullName,
            isCaptain: p.captain || false,
            isKeeper: p.keeper || false,
            imageUrl: getImageUrl(p.faceImageId),
            role: p.role,
        })) || [];

        const team2Players = match?.team2?.playerDetails?.map((p: any) => ({
            id: p.id,
            name: p.name,
            fullName: p.fullName,
            isCaptain: p.captain || false,
            isKeeper: p.keeper || false,
            imageUrl: getImageUrl(p.faceImageId),
            role: p.role,
        })) || [];

        // Parse innings data
        const innings: any[] = [];
        if (score) {
            score.forEach((inning: any, index: number) => {
                const batsmen = inning.batTeamDetails?.batsmenData
                    ? Object.values(inning.batTeamDetails.batsmenData).map((b: any) => ({
                        id: b.batId,
                        name: b.batName,
                        runs: b.runs,
                        balls: b.balls,
                        fours: b.fours,
                        sixes: b.sixes,
                        strikeRate: b.strikeRate,
                        isOut: b.outDesc !== 'not out',
                        outDesc: b.outDesc,
                    }))
                    : [];

                const bowlers = inning.bowlTeamDetails?.bowlersData
                    ? Object.values(inning.bowlTeamDetails.bowlersData).map((b: any) => ({
                        id: b.bowlerId,
                        name: b.bowlName,
                        overs: b.overs,
                        maidens: b.maidens,
                        runs: b.runs,
                        wickets: b.wickets,
                        economy: b.economy,
                    }))
                    : [];

                innings.push({
                    inningsId: inning.inningsId,
                    battingTeam: inning.batTeamDetails?.batTeamName,
                    battingTeamShort: inning.batTeamDetails?.batTeamShortName,
                    bowlingTeam: inning.bowlTeamDetails?.bowlTeamName,
                    score: inning.scoreDetails?.runs,
                    wickets: inning.scoreDetails?.wickets,
                    overs: inning.scoreDetails?.overs,
                    runRate: inning.scoreDetails?.runRate,
                    target: inning.scoreDetails?.target,
                    batsmen: batsmen.sort((a: any, b: any) => b.runs - a.runs),
                    bowlers: bowlers.sort((a: any, b: any) => b.wickets - a.wickets || a.runs - b.runs),
                    isPowerplayComplete: parseFloat(inning.scoreDetails?.overs || '0') >= 6,
                    isComplete: inning.isInningsComplete,
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
        const currentInnings = innings.find(inn => !inn.isComplete) || innings[innings.length - 1];

        return NextResponse.json({
            success: true,
            matchId,
            state: match?.state,
            status: match?.status,
            team1: {
                id: match?.team1?.id,
                name: match?.team1?.name,
                shortName: match?.team1?.shortName,
                imageUrl: getImageUrl(match?.team1?.imageId),
                players: team1Players,
            },
            team2: {
                id: match?.team2?.id,
                name: match?.team2?.name,
                shortName: match?.team2?.shortName,
                imageUrl: getImageUrl(match?.team2?.imageId),
                players: team2Players,
            },
            toss: tossInfo,
            innings,
            currentInnings,
            events,
            venue: match?.venue?.name,
            matchFormat: match?.matchFormat,
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
