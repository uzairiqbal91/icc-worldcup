import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

// Series ID to track - ICC Men's T20 World Cup 2026
const TARGET_SERIES_ID = 11253;

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Series schedule cache
interface ScheduledMatch {
    matchId: number;
    seriesId: number;
    matchDesc: string;
    startDate: number;
    endDate: number;
    team1: { name: string; shortName: string; imageId: number };
    team2: { name: string; shortName: string; imageId: number };
    venue: string;
    state: string;
    status: string;
}
let seriesSchedule: ScheduledMatch[] = [];
let lastScheduleFetch = 0;
const SCHEDULE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MATCH_BUFFER_BEFORE = 60 * 60 * 1000; // 1 hour before match start
const MATCH_BUFFER_AFTER = 30 * 60 * 1000; // 30 minutes after scheduled end

// Store match IDs and player data in memory
let cachedMatchIds: number[] = [];
let lastMatchFetch = 0;
let playerScores: Record<number, number> = {}; // Track player scores for milestone detection
let playerImages: Record<number, string> = {}; // Cache player images
let playerImageFetchQueue: Set<number> = new Set(); // Track which players we're fetching

// Cache for highest scores seen (to prevent score going backwards)
interface InningsCache {
    score: number;
    wickets: number;
    overs: number;
    batsmen: Record<number, { runs: number; balls: number; fours: number; sixes: number }>;
}
let highestScoresCache: Record<string, InningsCache> = {}; // key: matchId-inningsIndex

// Track completed matches to stop polling for them
let completedMatchIds: Set<number> = new Set();

// Track which events have been detected (to avoid duplicates)
interface MatchEventsTracked {
    toss: boolean;
    playingXI: boolean;
    powerplay: boolean[];  // per innings
    inningsEnd: boolean[]; // per innings
    targetSet: boolean;
    matchResult: boolean;
    playerMilestones: Record<number, { fifty: boolean; hundred: boolean }>; // track per player
}
let matchEventsTracked: Record<number, MatchEventsTracked> = {};

// Store all detected milestones per match (to return on every poll)
let storedMilestones: Record<number, any[]> = {};

// Helper to get full image URL from our proxy (for client-side usage)
function getProxyImageUrl(imageId: number | string | undefined | null) {
    if (!imageId || imageId === 0) return null;
    return `/api/proxy-image?id=${imageId}`;
}

// Helper to get full image URL for database storage
// Uses RapidAPI format: p=de (size), d=high (quality), imageId with 'c' prefix
function getFullImageUrl(imageId: number | string | undefined | null): string | null {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
}

async function callCricbuzzAPI(endpoint: string) {
    const startTime = Date.now();
    try {
        const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });
        const data = await response.json();
        const duration = Date.now() - startTime;
        return { success: true, data, duration, status: response.status };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        return { success: false, error: error.message, duration, status: 0 };
    }
}

// Fetch series schedule and cache it
async function fetchSeriesSchedule(): Promise<ScheduledMatch[]> {
    const now = Date.now();

    // Return cached schedule if still valid
    if (seriesSchedule.length > 0 && (now - lastScheduleFetch) < SCHEDULE_CACHE_DURATION) {
        return seriesSchedule;
    }

    const result = await callCricbuzzAPI(`/series/v1/${TARGET_SERIES_ID}`);

    if (result.success && result.data?.matchDetails) {
        const matches: ScheduledMatch[] = [];

        result.data.matchDetails.forEach((dayData: any) => {
            if (dayData.matchDetailsMap?.match) {
                dayData.matchDetailsMap.match.forEach((matchData: any) => {
                    const info = matchData.matchInfo;
                    if (info && info.seriesId === TARGET_SERIES_ID) {
                        matches.push({
                            matchId: info.matchId,
                            seriesId: info.seriesId,
                            matchDesc: info.matchDesc,
                            startDate: parseInt(info.startDate),
                            endDate: parseInt(info.endDate),
                            team1: {
                                name: info.team1?.teamName,
                                shortName: info.team1?.teamSName,
                                imageId: info.team1?.imageId
                            },
                            team2: {
                                name: info.team2?.teamName,
                                shortName: info.team2?.teamSName,
                                imageId: info.team2?.imageId
                            },
                            venue: info.venueInfo?.ground || '',
                            state: info.state,
                            status: info.status || ''
                        });
                    }
                });
            }
        });

        seriesSchedule = matches;
        lastScheduleFetch = now;
        console.log(`Fetched ${matches.length} matches for series ${TARGET_SERIES_ID}`);
    }

    return seriesSchedule;
}

// Get matches that should be polled right now (within time window)
function getActiveMatches(schedule: ScheduledMatch[]): ScheduledMatch[] {
    const now = Date.now();

    return schedule.filter(match => {
        // Skip completed matches
        if (completedMatchIds.has(match.matchId)) {
            return false;
        }

        // Check if match state indicates it's complete
        if (match.state === 'Complete') {
            completedMatchIds.add(match.matchId);
            return false;
        }

        // Check if current time is within the match window
        const matchStart = match.startDate - MATCH_BUFFER_BEFORE;
        const matchEnd = match.endDate + MATCH_BUFFER_AFTER;

        return now >= matchStart && now <= matchEnd;
    });
}

// Fetch player info to get their image and save to database
async function fetchPlayerImage(playerId: number): Promise<string | null> {
    // Check cache first
    if (playerImages[playerId]) {
        return playerImages[playerId];
    }

    // Check if already fetching
    if (playerImageFetchQueue.has(playerId)) {
        return null;
    }

    playerImageFetchQueue.add(playerId);

    try {
        const result = await callCricbuzzAPI(`/stats/v1/player/${playerId}`);
        if (result.success && result.data) {
            const playerData = result.data;
            const faceImageId = playerData.faceImageId;
            // Use full image URL format with p=de, d=high and 'c' prefix for imageId
            const fullImageUrl = getFullImageUrl(faceImageId);

            // Save player to database with full image URL
            const playerRecord = {
                player_id: parseInt(playerData.id),
                name: playerData.name || playerData.nickName,
                role: playerData.role || null,
                face_image_id: faceImageId || null,
                face_image_url: fullImageUrl, // Store full URL with p=de&d=high format
                batting_style: playerData.bat || null,
                bowling_style: playerData.bowl || null
            };

            // Upsert player to database
            const { error } = await supabase
                .from('players')
                .upsert(playerRecord, { onConflict: 'player_id' });

            if (error) {
                console.error(`Error saving player ${playerId}:`, error.message);
            }

            if (fullImageUrl) {
                playerImages[playerId] = fullImageUrl;
                return fullImageUrl;
            } else if (faceImageId) {
                const proxyUrl = getProxyImageUrl(faceImageId);
                if (proxyUrl) {
                    playerImages[playerId] = proxyUrl;
                    return proxyUrl;
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching player ${playerId} image:`, error);
    } finally {
        playerImageFetchQueue.delete(playerId);
    }

    return null;
}

// Batch fetch player images (limit concurrent requests)
async function fetchPlayerImages(playerIds: number[]): Promise<number> {
    // Only fetch images for players we don't have cached
    const missingIds = playerIds.filter(id => !playerImages[id] && !playerImageFetchQueue.has(id));

    // Limit to 3 player image fetches per poll to avoid rate limiting
    const idsToFetch = missingIds.slice(0, 3);

    await Promise.all(idsToFetch.map(id => fetchPlayerImage(id)));

    return idsToFetch.length;
}

// Load cached images from database on startup
async function loadCachedImagesFromDB() {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('player_id, face_image_url')
            .not('face_image_url', 'is', null);

        if (!error && data) {
            data.forEach((player: any) => {
                if (player.face_image_url) {
                    playerImages[player.player_id] = player.face_image_url;
                }
            });
            console.log(`Loaded ${data.length} cached player images from database`);
        }
    } catch (error) {
        console.error('Error loading cached images:', error);
    }
}

// Initialize by loading cached images
let initialized = false;

export async function GET(request: NextRequest) {
    // Load cached images from DB on first request
    if (!initialized) {
        await loadCachedImagesFromDB();
        initialized = true;
    }

    const logs: any[] = [];
    const milestones: any[] = [];
    const now = Date.now();

    // Fetch series schedule
    logs.push({
        type: 'api_call_start',
        endpoint: `/series/v1/${TARGET_SERIES_ID}`,
        description: `Fetching schedule for ICC T20 World Cup 2026 (Series ${TARGET_SERIES_ID})`,
        timestamp: new Date().toISOString()
    });

    const schedule = await fetchSeriesSchedule();

    logs.push({
        type: 'api_call_end',
        endpoint: `/series/v1/${TARGET_SERIES_ID}`,
        success: schedule.length > 0,
        duration: 0,
        status: 200,
        description: `Found ${schedule.length} total matches in series`,
        timestamp: new Date().toISOString()
    });

    // Get matches that should be polled right now
    const activeMatches = getActiveMatches(schedule);

    // Log schedule info
    logs.push({
        type: 'schedule_info',
        totalMatches: schedule.length,
        activeMatches: activeMatches.length,
        completedMatches: completedMatchIds.size,
        upcomingToday: schedule.filter(m => {
            const matchDate = new Date(m.startDate);
            const today = new Date();
            return matchDate.toDateString() === today.toDateString() && m.state !== 'Complete';
        }).length,
        timestamp: new Date().toISOString()
    });

    // If no active matches, return schedule info only
    if (activeMatches.length === 0) {
        // Find next upcoming match
        const upcoming = schedule
            .filter(m => m.startDate > now && !completedMatchIds.has(m.matchId))
            .sort((a, b) => a.startDate - b.startDate)[0];

        logs.push({
            type: 'no_active_matches',
            message: 'No matches currently in progress',
            nextMatch: upcoming ? {
                matchId: upcoming.matchId,
                matchDesc: upcoming.matchDesc,
                team1: upcoming.team1.shortName,
                team2: upcoming.team2.shortName,
                startDate: upcoming.startDate,
                startsIn: Math.round((upcoming.startDate - now) / 60000) + ' minutes'
            } : null,
            timestamp: new Date().toISOString()
        });

        // Also add matches_found with full schedule for display
        logs.push({
            type: 'matches_found',
            count: schedule.length,
            matches: schedule.map(m => ({
                matchId: m.matchId,
                desc: m.matchDesc,
                team1: m.team1.shortName,
                team1Logo: getProxyImageUrl(m.team1.imageId),
                team2: m.team2.shortName,
                team2Logo: getProxyImageUrl(m.team2.imageId),
                state: m.state,
                status: m.status,
                startDate: m.startDate,
                endDate: m.endDate,
                venueInfo: m.venue,
                seriesName: 'ICC Men\'s T20 World Cup 2026',
                matchFormat: 'T20',
                category: 'International'
            })),
            timestamp: new Date().toISOString()
        });

        cachedMatchIds = [];
    } else {
        // Log active matches
        logs.push({
            type: 'matches_found',
            count: activeMatches.length,
            matches: activeMatches.map(m => ({
                matchId: m.matchId,
                desc: m.matchDesc,
                team1: m.team1.shortName,
                team1Logo: getProxyImageUrl(m.team1.imageId),
                team2: m.team2.shortName,
                team2Logo: getProxyImageUrl(m.team2.imageId),
                state: m.state,
                status: m.status,
                startDate: m.startDate,
                endDate: m.endDate,
                venueInfo: m.venue,
                seriesName: 'ICC Men\'s T20 World Cup 2026',
                matchFormat: 'T20',
                category: 'International'
            })),
            timestamp: new Date().toISOString()
        });

        cachedMatchIds = activeMatches.map(m => m.matchId);
    }

    // Collect all player IDs for image fetching
    const allPlayerIds: number[] = [];

    // Fetch scorecard and match info for each match
    for (const matchId of cachedMatchIds) {
        // Initialize event tracking for this match if not exists
        if (!matchEventsTracked[matchId]) {
            matchEventsTracked[matchId] = {
                toss: false,
                playingXI: false,
                powerplay: [false, false],
                inningsEnd: [false, false],
                targetSet: false,
                matchResult: false,
                playerMilestones: {}
            };
        }
        // Initialize stored milestones for this match if not exists
        if (!storedMilestones[matchId]) {
            storedMilestones[matchId] = [];
        }
        const tracked = matchEventsTracked[matchId];

        // Fetch match info for toss and playing XI
        const matchInfoResult = await callCricbuzzAPI(`/mcenter/v1/${matchId}`);

        if (matchInfoResult.success && matchInfoResult.data) {
            const matchInfo = matchInfoResult.data.matchInfo;

            // Check for Toss event
            if (matchInfo?.tossResults && !tracked.toss) {
                tracked.toss = true;
                milestones.push({
                    type: 'toss',
                    matchId,
                    tossWinner: matchInfo.tossResults.tossWinnerName,
                    tossDecision: matchInfo.tossResults.decision,
                    timestamp: new Date().toISOString()
                });
            }

            // Check for Playing XI event
            if (matchInfo?.team1?.playerDetails && matchInfo?.team2?.playerDetails && !tracked.playingXI) {
                const team1Playing = matchInfo.team1.playerDetails.filter((p: any) => p.isPlaying);
                const team2Playing = matchInfo.team2.playerDetails.filter((p: any) => p.isPlaying);

                if (team1Playing.length > 0 || team2Playing.length > 0) {
                    tracked.playingXI = true;
                    milestones.push({
                        type: 'playing_xi',
                        matchId,
                        team1Name: matchInfo.team1.teamSName,
                        team2Name: matchInfo.team2.teamSName,
                        team1Players: team1Playing.map((p: any) => p.fullName || p.name).slice(0, 11),
                        team2Players: team2Playing.map((p: any) => p.fullName || p.name).slice(0, 11),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        logs.push({
            type: 'api_call_start',
            endpoint: `/mcenter/v1/${matchId}/scard`,
            description: `Fetching scorecard for match ${matchId}`,
            timestamp: new Date().toISOString()
        });

        const scardResult = await callCricbuzzAPI(`/mcenter/v1/${matchId}/scard`);

        logs.push({
            type: 'api_call_end',
            endpoint: `/mcenter/v1/${matchId}/scard`,
            success: scardResult.success,
            duration: scardResult.duration,
            status: scardResult.status,
            timestamp: new Date().toISOString()
        });

        if (scardResult.success && scardResult.data) {
            const scorecard = scardResult.data;
            const innings = scorecard.scorecard || [];
            const status = scorecard.status;
            const isComplete = scorecard.ismatchcomplete;

            // Process each innings for scores and milestones
            const scores = innings.map((inning: any, inningsIndex: number) => {
                const batsmen = inning.batsman || [];
                const bowlers = inning.bowler || [];
                const cacheKey = `${matchId}-${inningsIndex}`;

                // Get or initialize cache for this innings
                if (!highestScoresCache[cacheKey]) {
                    highestScoresCache[cacheKey] = {
                        score: 0,
                        wickets: 0,
                        overs: 0,
                        batsmen: {}
                    };
                }
                const cache = highestScoresCache[cacheKey];

                // Update cache with highest values (scores should only go up)
                const currentScore = inning.score || 0;
                const currentWickets = inning.wickets || 0;
                const currentOvers = inning.overs || 0;

                if (currentScore >= cache.score) {
                    cache.score = currentScore;
                    cache.wickets = currentWickets;
                    cache.overs = currentOvers;
                }

                // Collect player IDs
                batsmen.forEach((b: any) => {
                    if (b.id) allPlayerIds.push(b.id);
                    // Cache highest individual scores
                    if (b.id && (!cache.batsmen[b.id] || b.runs >= cache.batsmen[b.id].runs)) {
                        cache.batsmen[b.id] = {
                            runs: b.runs || 0,
                            balls: b.balls || 0,
                            fours: b.fours || 0,
                            sixes: b.sixes || 0
                        };
                    }
                });
                bowlers.forEach((b: any) => {
                    if (b.id) allPlayerIds.push(b.id);
                });

                // Check for milestones (50 and 100) - only trigger once per player
                batsmen.forEach((bat: any) => {
                    const playerId = bat.id;
                    const currentRuns = bat.runs || 0;

                    // Initialize playerMilestones object if not exists (for backwards compatibility)
                    if (!tracked.playerMilestones) {
                        tracked.playerMilestones = {};
                    }
                    // Initialize player milestone tracking if not exists
                    const isNewPlayer = !tracked.playerMilestones[playerId];
                    if (isNewPlayer) {
                        tracked.playerMilestones[playerId] = { fifty: false, hundred: false };
                    }
                    const playerTracked = tracked.playerMilestones[playerId];

                    // Add milestone for players with 100+ runs (century) - only once
                    if (currentRuns >= 100 && !playerTracked.hundred) {
                        playerTracked.hundred = true;
                        const milestoneData = {
                            type: 'milestone',
                            milestone: 100,
                            matchId,
                            player: {
                                id: playerId,
                                name: bat.name,
                                runs: currentRuns,
                                balls: bat.balls,
                                fours: bat.fours,
                                sixes: bat.sixes,
                                strikeRate: bat.strkrate
                            },
                            team: inning.batteamsname || inning.batteamname,
                            timestamp: new Date().toISOString()
                        };
                        milestones.push(milestoneData);
                    }
                    // Add milestone for players with 50-99 runs (half-century) - only once
                    else if (currentRuns >= 50 && !playerTracked.fifty) {
                        playerTracked.fifty = true;
                        const milestoneData = {
                            type: 'milestone',
                            milestone: 50,
                            matchId,
                            player: {
                                id: playerId,
                                name: bat.name,
                                runs: currentRuns,
                                balls: bat.balls,
                                fours: bat.fours,
                                sixes: bat.sixes,
                                strikeRate: bat.strkrate
                            },
                            team: inning.batteamsname || inning.batteamname,
                            timestamp: new Date().toISOString()
                        };
                        milestones.push(milestoneData);
                    }
                });

                // Check for powerplay end (6 overs completed)
                if (currentOvers >= 6 && !tracked.powerplay[inningsIndex]) {
                    tracked.powerplay[inningsIndex] = true;
                    milestones.push({
                        type: 'powerplay',
                        matchId,
                        battingTeam: inning.batteamsname || inning.batteamname,
                        score: currentScore,
                        wickets: currentWickets,
                        overs: 6,
                        timestamp: new Date().toISOString()
                    });
                }

                // Check for innings end (all out or overs complete - 20 overs for T20)
                const isInningsComplete = inning.isinningscomplete || currentWickets >= 10 || currentOvers >= 20;
                if (isInningsComplete && !tracked.inningsEnd[inningsIndex]) {
                    tracked.inningsEnd[inningsIndex] = true;
                    milestones.push({
                        type: 'innings_end',
                        matchId,
                        battingTeam: inning.batteamsname || inning.batteamname,
                        score: currentScore,
                        wickets: currentWickets,
                        overs: currentOvers,
                        timestamp: new Date().toISOString()
                    });

                    // Set target after first innings
                    if (inningsIndex === 0 && !tracked.targetSet) {
                        tracked.targetSet = true;
                        milestones.push({
                            type: 'target_set',
                            matchId,
                            target: currentScore + 1,
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                // Use cached (highest) values to prevent score going backwards
                return {
                    team: inning.batteamsname || inning.batteamname,
                    score: cache.score,
                    wickets: cache.wickets,
                    overs: cache.overs,
                    runRate: inning.runrate,
                    topBatsmen: batsmen
                        .sort((a: any, b: any) => {
                            // Use cached runs for sorting
                            const aRuns = cache.batsmen[a.id]?.runs || a.runs || 0;
                            const bRuns = cache.batsmen[b.id]?.runs || b.runs || 0;
                            return bRuns - aRuns;
                        })
                        .slice(0, 3)
                        .map((b: any) => {
                            // Use cached values if higher
                            const cachedBat = cache.batsmen[b.id];
                            return {
                                id: b.id,
                                name: b.name,
                                runs: cachedBat?.runs ?? b.runs,
                                balls: cachedBat?.balls ?? b.balls,
                                fours: cachedBat?.fours ?? b.fours,
                                sixes: cachedBat?.sixes ?? b.sixes,
                                strikeRate: b.strkrate,
                                isOut: !!b.outdec,
                                imageUrl: playerImages[b.id] || null
                            };
                        }),
                    topBowlers: bowlers
                        .sort((a: any, b: any) => (b.wickets || 0) - (a.wickets || 0))
                        .slice(0, 2)
                        .map((b: any) => ({
                            id: b.id,
                            name: b.name,
                            overs: b.overs,
                            runs: b.runs,
                            wickets: b.wickets,
                            economy: b.economy,
                            imageUrl: playerImages[b.id] || null
                        }))
                };
            });

            logs.push({
                type: 'score_update',
                matchId,
                status,
                isComplete,
                scores,
                timestamp: new Date().toISOString()
            });

            // Track completed matches and add result event
            if (isComplete) {
                completedMatchIds.add(matchId);
                cachedMatchIds = cachedMatchIds.filter(id => id !== matchId);

                // Add match result event (only once)
                if (!tracked.matchResult) {
                    tracked.matchResult = true;
                    milestones.push({
                        type: 'match_result',
                        matchId,
                        result: status,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
    }

    // Fetch player images in background (limited to avoid rate limiting)
    let imagesFetched = 0;
    if (allPlayerIds.length > 0) {
        // Get unique IDs
        const uniqueIds = [...new Set(allPlayerIds)];

        // Log image fetch if we're fetching new ones
        const missingIds = uniqueIds.filter(id => !playerImages[id]);
        if (missingIds.length > 0) {
            logs.push({
                type: 'api_call_start',
                endpoint: `/stats/v1/player/{id}`,
                description: `Fetching images for ${Math.min(3, missingIds.length)} players (saving to DB)`,
                timestamp: new Date().toISOString()
            });

            imagesFetched = await fetchPlayerImages(uniqueIds);

            logs.push({
                type: 'api_call_end',
                endpoint: `/stats/v1/player/{id}`,
                success: true,
                duration: 0,
                status: 200,
                description: `Saved ${imagesFetched} player(s) to database`,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Store new milestones and add to logs
    milestones.forEach(m => {
        // Store the milestone for future polls
        if (storedMilestones[m.matchId]) {
            storedMilestones[m.matchId].push(m);
        }
        logs.push(m);
    });

    // Also add all previously stored milestones to logs (for page refresh scenarios)
    cachedMatchIds.forEach(matchId => {
        if (storedMilestones[matchId]) {
            storedMilestones[matchId].forEach(m => {
                // Only add if not already in logs (avoid duplicates from current poll)
                if (!milestones.includes(m)) {
                    logs.push(m);
                }
            });
        }
    });

    // Combine all stored milestones for response
    const allMilestones = cachedMatchIds.flatMap(matchId => storedMilestones[matchId] || []);

    // Check if all tracked matches are complete
    const allMatchesComplete = cachedMatchIds.length === 0 && completedMatchIds.size > 0;

    return NextResponse.json({
        logs,
        matchCount: cachedMatchIds.length,
        milestones: allMilestones,
        cachedImages: Object.keys(playerImages).length,
        imagesFetchedThisPoll: imagesFetched,
        completedMatchIds: Array.from(completedMatchIds),
        allMatchesComplete
    });
}
