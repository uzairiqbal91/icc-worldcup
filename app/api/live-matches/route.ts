import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function callCricbuzzAPI(endpoint: string, revalidateSeconds: number = 20, noCache: boolean = false) {
    try {
        const fetchOptions: RequestInit = {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        };

        // For live scores, disable caching completely to always get fresh data
        if (noCache) {
            fetchOptions.cache = 'no-store';
        } else {
            (fetchOptions as any).next = { revalidate: revalidateSeconds };
        }

        // Add timestamp for cache-busting if noCache is true
        const url = noCache
            ? `https://${RAPIDAPI_HOST}${endpoint}?_t=${Date.now()}`
            : `https://${RAPIDAPI_HOST}${endpoint}`;

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('Cricbuzz API error:', error);
        throw error;
    }
}

function getCricbuzzImageUrl(imageId: number | string | undefined) {
    if (!imageId) return null;
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
}

// Fetch team logos from Supabase
async function getTeamLogos(): Promise<Map<string, string>> {
    const logoMap = new Map<string, string>();

    try {
        const { data: logos, error } = await supabase
            .from('template_images')
            .select('team_id, image_url')
            .eq('image_type', 'logo');

        if (error) {
            console.error('Error fetching logos:', error);
            return logoMap;
        }

        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('team_id, name, short_name, image_url');

        if (teamsError) {
            console.error('Error fetching teams:', teamsError);
        }

        const teamIdToLogo = new Map<number, string>();
        logos?.forEach(logo => {
            if (logo.team_id && logo.image_url) {
                teamIdToLogo.set(logo.team_id, logo.image_url);
            }
        });

        teams?.forEach(team => {
            const logoUrl = teamIdToLogo.get(team.team_id) || team.image_url;
            if (logoUrl) {
                logoMap.set(team.name.toLowerCase(), logoUrl);
                if (team.short_name) {
                    logoMap.set(team.short_name.toLowerCase(), logoUrl);
                }
            }
        });
    } catch (err) {
        console.error('Error in getTeamLogos:', err);
    }

    return logoMap;
}

function parseMatch(matchInfo: any, matchScore: any, seriesName: string, teamLogos: Map<string, string>) {
    if (!matchInfo) return null;

    const state = matchInfo.state;
    let category: 'live' | 'completed' | 'upcoming' = 'upcoming';

    // A match is live if it's in progress OR during any break/interruption
    // This includes innings breaks, lunch, tea, drinks, stumps, etc.
    const liveStates = ['In Progress', 'Innings Break', 'Lunch', 'Tea', 'Dinner', 'Drinks', 'Stumps'];

    if (liveStates.includes(state)) {
        category = 'live';
    } else if (state === 'Complete') {
        category = 'completed';
    } else if (state === 'Preview' || state === 'Scheduled' || state === 'Toss' || state === 'Delayed') {
        category = 'upcoming';
    }

    const team1Name = matchInfo.team1?.teamName?.toLowerCase() || '';
    const team1Short = matchInfo.team1?.teamSName?.toLowerCase() || '';
    const team2Name = matchInfo.team2?.teamName?.toLowerCase() || '';
    const team2Short = matchInfo.team2?.teamSName?.toLowerCase() || '';

    const team1Logo = teamLogos.get(team1Name) || teamLogos.get(team1Short) || getCricbuzzImageUrl(matchInfo.team1?.imageId);
    const team2Logo = teamLogos.get(team2Name) || teamLogos.get(team2Short) || getCricbuzzImageUrl(matchInfo.team2?.imageId);

    return {
        matchId: matchInfo.matchId,
        seriesId: matchInfo.seriesId,
        seriesName: seriesName || 'International',
        matchDesc: matchInfo.matchDesc,
        matchFormat: matchInfo.matchFormat,
        state: matchInfo.state,
        status: matchInfo.status,
        category,
        team1: {
            id: matchInfo.team1?.teamId,
            name: matchInfo.team1?.teamName,
            shortName: matchInfo.team1?.teamSName,
            imageUrl: team1Logo,
        },
        team2: {
            id: matchInfo.team2?.teamId,
            name: matchInfo.team2?.teamName,
            shortName: matchInfo.team2?.teamSName,
            imageUrl: team2Logo,
        },
        venue: matchInfo.venueInfo?.ground,
        city: matchInfo.venueInfo?.city,
        startDate: matchInfo.startDate,
        isLive: liveStates.includes(state),
        isCompleted: state === 'Complete',
        score: matchScore ? {
            team1Score: matchScore.team1Score?.inngs1 ? {
                runs: matchScore.team1Score.inngs1.runs,
                wickets: matchScore.team1Score.inngs1.wickets,
                overs: matchScore.team1Score.inngs1.overs,
            } : null,
            team2Score: matchScore.team2Score?.inngs1 ? {
                runs: matchScore.team2Score.inngs1.runs,
                wickets: matchScore.team2Score.inngs1.wickets,
                overs: matchScore.team2Score.inngs1.overs,
            } : null,
        } : null,
    };
}

function extractMatches(data: any, teamLogos: Map<string, string>): any[] {
    const matches: any[] = [];

    if (data?.typeMatches) {
        data.typeMatches.forEach((type: any) => {
            if (type.matchType?.toLowerCase() === 'international') {
                type.seriesMatches?.forEach((series: any) => {
                    if (series.seriesAdWrapper?.matches) {
                        series.seriesAdWrapper.matches.forEach((match: any) => {
                            const parsed = parseMatch(
                                match.matchInfo,
                                match.matchScore,
                                series.seriesAdWrapper.seriesName,
                                teamLogos
                            );
                            if (parsed) matches.push(parsed);
                        });
                    }
                });
            }
        });
    }

    return matches;
}

const getMatchNumber = (matchDesc: string): number => {
    const match = matchDesc?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'live' for score updates only, 'full' for all data

    try {
        const teamLogos = await getTeamLogos();

        if (mode === 'live') {
            // OPTIMIZED: Only fetch live matches for score updates (every 20 seconds)
            // noCache = true to always get fresh scores, never stale data
            const liveData = await callCricbuzzAPI('/matches/v1/live', 0, true);
            const liveMatches = extractMatches(liveData, teamLogos);

            // Separate live and just-completed matches
            const live = liveMatches.filter(m => m.category === 'live');
            const justCompleted = liveMatches.filter(m => m.category === 'completed');

            live.sort((a, b) => (a.startDate || 0) - (b.startDate || 0));

            return NextResponse.json({
                success: true,
                mode: 'live',
                live,
                // Flag if any match just completed (was in live endpoint but now Complete)
                hasNewlyCompleted: justCompleted.length > 0,
                newlyCompleted: justCompleted,
                counts: {
                    live: live.length,
                    newlyCompleted: justCompleted.length
                }
            });
        }

        // FULL MODE: Fetch all matches (initial load or every 15 minutes)
        // Each API is used for its specific purpose:
        // - live API: only for live matches
        // - recent API: only for completed matches
        // - upcoming API: only for upcoming matches
        const [liveData, recentData, upcomingData] = await Promise.all([
            callCricbuzzAPI('/matches/v1/live', 20),
            callCricbuzzAPI('/matches/v1/recent', 900), // Cache 15 minutes
            callCricbuzzAPI('/matches/v1/upcoming', 900), // Cache 15 minutes
        ]);

        const liveMatches = extractMatches(liveData, teamLogos);
        const recentMatches = extractMatches(recentData, teamLogos);
        const upcomingMatches = extractMatches(upcomingData, teamLogos);

        // Use each API for its specific category - no mixing
        // Live: only from live API (state = 'In Progress')
        const live = liveMatches.filter(m => m.category === 'live');

        // Completed: only from recent API (state = 'Complete')
        const completedFromRecent = recentMatches.filter(m => m.category === 'completed');

        // Upcoming: only from upcoming API (state = 'Preview', 'Scheduled', etc.)
        const upcomingFromUpcoming = upcomingMatches.filter(m => m.category === 'upcoming');

        // Deduplicate within each category
        const dedupeById = (matches: any[]) => {
            const map = new Map<number, any>();
            matches.forEach(m => {
                if (!map.has(m.matchId)) map.set(m.matchId, m);
            });
            return Array.from(map.values());
        };

        const completed = dedupeById(completedFromRecent);
        const upcoming = dedupeById(upcomingFromUpcoming);

        // Sort each category
        live.sort((a, b) => (a.startDate || 0) - (b.startDate || 0));
        completed.sort((a, b) => getMatchNumber(b.matchDesc) - getMatchNumber(a.matchDesc));
        upcoming.sort((a, b) => (a.startDate || 0) - (b.startDate || 0));

        return NextResponse.json({
            success: true,
            mode: 'full',
            live,
            completed,
            upcoming,
            counts: {
                live: live.length,
                completed: completed.length,
                upcoming: upcoming.length,
                total: live.length + completed.length + upcoming.length
            }
        });

    } catch (error: any) {
        console.error('Error fetching matches:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            live: [],
            completed: [],
            upcoming: []
        }, { status: 500 });
    }
}
