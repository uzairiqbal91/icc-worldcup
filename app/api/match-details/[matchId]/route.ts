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
            cache: 'no-store', // Always get fresh data
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

export async function GET(
    request: NextRequest,
    { params }: { params: { matchId: string } }
) {
    try {
        const { matchId } = params;

        // Fetch match info and scorecard in parallel
        const [matchInfoData, scorecardData] = await Promise.all([
            callCricbuzzAPI(`/matches/v1/${matchId}`),
            callCricbuzzAPI(`/matches/v1/${matchId}/scorecard`).catch(() => null), // Scorecard may not exist for upcoming matches
        ]);

        // Parse match info
        const matchInfo = parseMatchInfo(matchInfoData);

        // Parse scorecard (if available)
        const scorecard = scorecardData ? parseScorecard(scorecardData) : null;

        // Parse playing XI
        const playingXI = scorecardData ? parsePlayingXI(scorecardData) : null;

        return NextResponse.json({
            success: true,
            matchInfo,
            scorecard,
            playingXI,
        });
    } catch (error: any) {
        console.error('Error fetching match details:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

function parseMatchInfo(data: any) {
    const matchInfo = data.matchInfo || {};
    const venueInfo = data.venueInfo || {};

    return {
        matchId: matchInfo.matchId?.toString() || '',
        team1: {
            name: matchInfo.team1?.name || '',
            shortName: matchInfo.team1?.shortName || '',
        },
        team2: {
            name: matchInfo.team2?.name || '',
            shortName: matchInfo.team2?.shortName || '',
        },
        venue: venueInfo.ground || '',
        city: venueInfo.city || '',
        date: matchInfo.matchStartTimestamp || '',
        status: matchInfo.status || '',
        matchType: matchInfo.matchFormat || '',
        toss: {
            winner: matchInfo.tossResults?.tossWinnerName || null,
            decision: matchInfo.tossResults?.decision || null,
        },
        result: matchInfo.status === 'Complete' ? {
            winner: matchInfo.team1?.name || matchInfo.team2?.name || null,
            winMargin: matchInfo.matchWinnerInfo || null,
        } : null,
    };
}

function parseScorecard(data: any) {
    const scorecard = data.scoreCard || [];

    return scorecard.map((inning: any, index: number) => {
        const battingTeam = inning.batTeamDetails?.batTeamName || '';
        const bowlingTeam = inning.bowlTeamDetails?.bowlTeamName || '';

        // Parse batsmen
        const batsmen = (inning.batTeamDetails?.batsmenData || [])
            .filter((bat: any) => bat.batName && bat.runs !== undefined)
            .map((bat: any) => ({
                name: bat.batName,
                runs: bat.runs || 0,
                balls: bat.balls || 0,
                fours: bat.fours || 0,
                sixes: bat.sixes || 0,
                strikeRate: bat.strikeRate || 0,
                isOut: bat.outDesc !== 'not out',
                dismissal: bat.outDesc || '',
            }))
            .sort((a: any, b: any) => b.runs - a.runs); // Sort by runs

        // Parse bowlers
        const bowlers = (inning.bowlTeamDetails?.bowlersData || [])
            .filter((bowl: any) => bowl.bowlName && bowl.wickets !== undefined)
            .map((bowl: any) => ({
                name: bowl.bowlName,
                overs: bowl.overs || 0,
                maidens: bowl.maidens || 0,
                runs: bowl.runs || 0,
                wickets: bowl.wickets || 0,
                economy: bowl.economy || 0,
            }))
            .sort((a: any, b: any) => b.wickets - a.wickets); // Sort by wickets

        // Get total score
        const scoreDetails = inning.scoreDetails || {};

        return {
            inningsNumber: index + 1,
            battingTeam,
            bowlingTeam,
            score: scoreDetails.runs || 0,
            wickets: scoreDetails.wickets || 0,
            overs: scoreDetails.overs || 0,
            runRate: scoreDetails.runRate || 0,
            batsmen,
            bowlers,
            extras: scoreDetails.extras || 0,
        };
    });
}

function parsePlayingXI(data: any) {
    const scorecard = data.scoreCard || [];

    if (scorecard.length === 0) return null;

    // Get team names from first innings
    const team1Name = scorecard[0]?.batTeamDetails?.batTeamName || '';
    const team2Name = scorecard[0]?.bowlTeamDetails?.bowlTeamName || '';

    // Extract players from both innings
    const team1Players: string[] = [];
    const team2Players: string[] = [];

    scorecard.forEach((inning: any) => {
        const battingTeam = inning.batTeamDetails?.batTeamName || '';
        const batsmen = (inning.batTeamDetails?.batsmenData || [])
            .map((bat: any) => bat.batName)
            .filter(Boolean);

        if (battingTeam === team1Name) {
            team1Players.push(...batsmen);
        } else if (battingTeam === team2Name) {
            team2Players.push(...batsmen);
        }
    });

    // Remove duplicates and limit to 11 players
    const uniqueTeam1 = [...new Set(team1Players)].slice(0, 11);
    const uniqueTeam2 = [...new Set(team2Players)].slice(0, 11);

    return {
        team1: {
            name: team1Name,
            players: uniqueTeam1,
        },
        team2: {
            name: team2Name,
            players: uniqueTeam2,
        },
    };
}
