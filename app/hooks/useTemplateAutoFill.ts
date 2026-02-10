import { useState, useCallback } from 'react';

interface MatchInfo {
    matchId: string;
    team1: { name: string; shortName: string };
    team2: { name: string; shortName: string };
    venue: string;
    city: string;
    date: string;
    status: string;
    matchType: string;
    toss: { winner: string | null; decision: string | null };
    result: { winner: string | null; winMargin: string | null } | null;
}

interface PlayerStats {
    name: string;
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    overs?: number;
    maidens?: number;
    wickets?: number;
    economy?: number;
    isOut?: boolean;
    dismissal?: string;
}

interface InningsData {
    inningsNumber: number;
    battingTeam: string;
    bowlingTeam: string;
    score: number;
    wickets: number;
    overs: number;
    runRate: number;
    batsmen: PlayerStats[];
    bowlers: PlayerStats[];
    extras: number;
}

interface PlayingXI {
    team1: { name: string; players: string[] };
    team2: { name: string; players: string[] };
}

interface MatchDetails {
    matchInfo: MatchInfo;
    scorecard: InningsData[] | null;
    playingXI: PlayingXI | null;
}

interface SavedImage {
    url: string;
    type: string;
}

export function useTemplateAutoFill() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMatchDetails = useCallback(async (matchId: string): Promise<MatchDetails | null> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/match-details/${matchId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch match details');
            }

            return {
                matchInfo: data.matchInfo,
                scorecard: data.scorecard,
                playingXI: data.playingXI,
            };
        } catch (err: any) {
            console.error('Error fetching match details:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSavedImage = useCallback(async (
        type: 'team' | 'player',
        name: string
    ): Promise<string | null> => {
        try {
            const params = new URLSearchParams({
                type,
                name,
            });

            const response = await fetch(`/api/template-images/fetch?${params}`);
            const data = await response.json();

            if (data.success && data.image) {
                return data.image.url;
            }

            return null;
        } catch (err) {
            console.error('Error fetching saved image:', err);
            return null;
        }
    }, []);

    const fetchTemplateBackgroundImage = useCallback(async (
        templateType: string
    ): Promise<string | null> => {
        try {
            const params = new URLSearchParams({
                template_type: templateType,
                image_type: 'template',
            });

            const response = await fetch(`/api/template-images?${params}`);
            const data = await response.json();

            // If multiple images exist, pick the first one (most recent)
            if (data.images && data.images.length > 0) {
                return data.images[0].image_url;
            }

            return null;
        } catch (err) {
            console.error('Error fetching template background image:', err);
            return null;
        }
    }, []);

    const fetchTeamSpecificTemplateImage = useCallback(async (
        teamName: string,
        templateType: string
    ): Promise<string | null> => {
        try {
            // First, get the team ID from the teams table
            const teamResponse = await fetch(`/api/template-images/fetch?type=team&name=${encodeURIComponent(teamName)}`);
            const teamData = await teamResponse.json();

            if (!teamData.success || !teamData.image) {
                console.log(`Team "${teamName}" not found in database`);
                return null;
            }

            // Extract team_id from the response
            const teamId = teamData.image.team_id;

            if (!teamId) {
                return null;
            }

            // Now fetch template image for this specific team
            const params = new URLSearchParams({
                team_id: teamId.toString(),
                template_type: templateType,
                image_type: 'template',
            });

            const response = await fetch(`/api/template-images?${params}`);
            const data = await response.json();

            // If multiple images exist for this team, pick the first one (most recent)
            if (data.images && data.images.length > 0) {
                return data.images[0].image_url;
            }

            return null;
        } catch (err) {
            console.error('Error fetching team-specific template image:', err);
            return null;
        }
    }, []);

    const autoFillTossTemplate = useCallback(async (matchDetails: MatchDetails) => {
        const { matchInfo } = matchDetails;

        // Determine which team won the toss
        const tossWinnerTeamName = matchInfo.toss.winner;

        // Fetch team logos and toss-winner-specific template image from database in parallel
        const [team1Logo, team2Logo, tossTemplateImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            // Fetch toss image for the team that won the toss
            tossWinnerTeamName
                ? fetchTeamSpecificTemplateImage(tossWinnerTeamName, 'toss')
                : null,
        ]);

        return {
            team1Name: matchInfo.team1.name,
            team2Name: matchInfo.team2.name,
            team1Logo,
            team2Logo,
            venue: matchInfo.venue,
            tossWinner: tossWinnerTeamName,
            tossDecision: matchInfo.toss.decision,
            tossImage: tossTemplateImage, // Team-specific toss image
            selectedTeam: tossWinnerTeamName, // Auto-select the toss winner in dropdown
        };
    }, [fetchSavedImage]);

    const autoFillPlayingXITemplate = useCallback(async (matchDetails: MatchDetails) => {
        const { matchInfo, playingXI } = matchDetails;

        if (!playingXI) {
            return {
                team1Name: matchInfo.team1.name,
                team2Name: matchInfo.team2.name,
                team1Players: [],
                team2Players: [],
            };
        }

        // Fetch team logos and template background
        const [team1Logo, team2Logo, playingXIImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            fetchTemplateBackgroundImage('playingxi'),
        ]);

        return {
            team1Name: playingXI.team1.name,
            team2Name: playingXI.team2.name,
            team1Logo,
            team2Logo,
            team1Players: playingXI.team1.players,
            team2Players: playingXI.team2.players,
            playingXIImage,
        };
    }, [fetchSavedImage, fetchTemplateBackgroundImage]);

    const autoFillInningsEndTemplate = useCallback(async (
        matchDetails: MatchDetails,
        inningsNumber: number
    ) => {
        const { matchInfo, scorecard } = matchDetails;

        if (!scorecard || scorecard.length < inningsNumber) {
            return null;
        }

        const innings = scorecard[inningsNumber - 1];

        // Fetch team logos and template background
        const [team1Logo, team2Logo, inningsEndImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            fetchTemplateBackgroundImage('inningsend'),
        ]);

        return {
            team1Logo,
            team2Logo,
            battingTeam: innings.battingTeam,
            score: innings.score,
            wickets: innings.wickets,
            overs: innings.overs,
            inningsNumber,
            inningsEndImage,
            topBatsmen: innings.batsmen.slice(0, 2).map(bat => ({
                name: bat.name,
                runs: bat.runs,
                balls: bat.balls,
            })),
            topBowlers: innings.bowlers.slice(0, 2).map(bowl => ({
                name: bowl.name,
                wickets: bowl.wickets,
                runsGiven: bowl.runs,
            })),
        };
    }, [fetchSavedImage, fetchTemplateBackgroundImage]);

    const autoFillTargetTemplate = useCallback(async (matchDetails: MatchDetails) => {
        const { matchInfo, scorecard } = matchDetails;

        if (!scorecard || scorecard.length === 0) {
            return null;
        }

        const firstInnings = scorecard[0];
        const target = firstInnings.score + 1;

        // Fetch team logos and template background
        const [team1Logo, team2Logo, targetImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            fetchTemplateBackgroundImage('target'),
        ]);

        return {
            team1Logo,
            team2Logo,
            chasingTeam: firstInnings.bowlingTeam,
            target,
            overs: firstInnings.overs,
            targetImage,
        };
    }, [fetchSavedImage, fetchTemplateBackgroundImage]);

    const autoFillMatchResultTemplate = useCallback(async (matchDetails: MatchDetails) => {
        const { matchInfo, scorecard } = matchDetails;

        if (!matchInfo.result || !scorecard) {
            return null;
        }

        // Fetch team logos and template background
        const [team1Logo, team2Logo, resultImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            fetchTemplateBackgroundImage('matchresult'),
        ]);

        return {
            team1Logo,
            team2Logo,
            team1Name: matchInfo.team1.name,
            team2Name: matchInfo.team2.name,
            team1Score: scorecard.find(i => i.battingTeam === matchInfo.team1.name)?.score || 0,
            team1Wickets: scorecard.find(i => i.battingTeam === matchInfo.team1.name)?.wickets || 0,
            team2Score: scorecard.find(i => i.battingTeam === matchInfo.team2.name)?.score || 0,
            team2Wickets: scorecard.find(i => i.battingTeam === matchInfo.team2.name)?.wickets || 0,
            winner: matchInfo.result.winner,
            winMargin: matchInfo.result.winMargin,
            resultImage,
        };
    }, [fetchSavedImage, fetchTemplateBackgroundImage]);

    const autoFillPowerplayTemplate = useCallback(async (
        matchDetails: MatchDetails,
        inningsNumber: number
    ) => {
        const { matchInfo, scorecard } = matchDetails;

        if (!scorecard || scorecard.length < inningsNumber) {
            return null;
        }

        const innings = scorecard[inningsNumber - 1];

        // Calculate powerplay stats (first 6 overs)
        // Note: This is an approximation as we don't have ball-by-ball data
        const powerplayOvers = 6;
        const estimatedPowerplayScore = Math.round((innings.score / innings.overs) * powerplayOvers);

        // Fetch team logos and template background
        const [team1Logo, team2Logo, powerplayImage] = await Promise.all([
            fetchSavedImage('team', matchInfo.team1.name),
            fetchSavedImage('team', matchInfo.team2.name),
            fetchTemplateBackgroundImage('powerplay'),
        ]);

        return {
            team1Logo,
            team2Logo,
            battingTeam: innings.battingTeam,
            powerplayScore: estimatedPowerplayScore,
            powerplayWickets: 0, // We don't have this data
            runRate: (estimatedPowerplayScore / powerplayOvers).toFixed(2),
            powerplayImage,
        };
    }, [fetchSavedImage, fetchTemplateBackgroundImage]);

    return {
        loading,
        error,
        fetchMatchDetails,
        fetchSavedImage,
        autoFillTossTemplate,
        autoFillPlayingXITemplate,
        autoFillInningsEndTemplate,
        autoFillTargetTemplate,
        autoFillMatchResultTemplate,
        autoFillPowerplayTemplate,
    };
}
