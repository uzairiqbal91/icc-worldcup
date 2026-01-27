import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Store match IDs and player data in memory
let cachedMatchIds: number[] = [];
let lastMatchFetch = 0;
let playerScores: Record<number, number> = {}; // Track player scores for milestone detection
let playerImages: Record<number, string> = {}; // Cache player images
let playerImageFetchQueue: Set<number> = new Set(); // Track which players we're fetching

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
                bowling_style: playerData.bowl || null,
                updated_at: new Date().toISOString()
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

    // Only fetch live matches once every 5 minutes or if no cached matches
    const shouldFetchMatches = cachedMatchIds.length === 0 || (now - lastMatchFetch > 300000);

    if (shouldFetchMatches) {
        logs.push({
            type: 'api_call_start',
            endpoint: '/matches/v1/live',
            description: 'Fetching live matches (refreshing cache)',
            timestamp: new Date().toISOString()
        });

        const liveResult = await callCricbuzzAPI('/matches/v1/live');

        logs.push({
            type: 'api_call_end',
            endpoint: '/matches/v1/live',
            success: liveResult.success,
            duration: liveResult.duration,
            status: liveResult.status,
            timestamp: new Date().toISOString()
        });

        if (liveResult.success && liveResult.data?.typeMatches) {
            const internationalMatches: any[] = [];

            liveResult.data.typeMatches.forEach((type: any) => {
                if (type.matchType?.toLowerCase() === 'international') {
                    const seriesMatches = type.seriesMatches || [];
                    seriesMatches.forEach((series: any) => {
                        if (series.seriesAdWrapper) {
                            const matches = series.seriesAdWrapper.matches || [];
                            matches.forEach((m: any) => {
                                if (m.matchInfo && m.matchInfo.state === 'In Progress') {
                                    internationalMatches.push(m.matchInfo);
                                }
                            });
                        }
                    });
                }
            });

            logs.push({
                type: 'matches_found',
                count: internationalMatches.length,
                matches: internationalMatches.map(m => ({
                    matchId: m.matchId,
                    desc: m.matchDesc,
                    team1: m.team1?.teamSName,
                    team1Logo: getProxyImageUrl(m.team1?.imageId),
                    team2: m.team2?.teamSName,
                    team2Logo: getProxyImageUrl(m.team2?.imageId),
                    state: m.state
                })),
                timestamp: new Date().toISOString()
            });

            cachedMatchIds = internationalMatches.map(m => m.matchId);
            lastMatchFetch = now;
        }
    }

    // Collect all player IDs for image fetching
    const allPlayerIds: number[] = [];

    // Fetch scorecard for each match
    for (const matchId of cachedMatchIds) {
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
            const scores = innings.map((inning: any) => {
                const batsmen = inning.batsman || [];
                const bowlers = inning.bowler || [];

                // Collect player IDs
                batsmen.forEach((b: any) => {
                    if (b.id) allPlayerIds.push(b.id);
                });
                bowlers.forEach((b: any) => {
                    if (b.id) allPlayerIds.push(b.id);
                });

                // Check for milestones (50 and 100)
                batsmen.forEach((bat: any) => {
                    const playerId = bat.id;
                    const currentRuns = bat.runs || 0;
                    const previousRuns = playerScores[playerId] || 0;

                    // Check for 50 milestone
                    if (currentRuns >= 50 && previousRuns < 50) {
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
                                strikeRate: bat.strkrate,
                                imageUrl: playerImages[playerId] || null
                            },
                            team: inning.batteamsname || inning.batteamname,
                            timestamp: new Date().toISOString()
                        };
                        milestones.push(milestoneData);

                        // Save milestone event to database
                        supabase.from('events').insert({
                            match_id: matchId,
                            event_type: 'MILESTONE',
                            payload: milestoneData
                        }).then(({ error }) => {
                            if (error) console.error('Error saving milestone:', error.message);
                        });
                    }

                    // Check for 100 milestone
                    if (currentRuns >= 100 && previousRuns < 100) {
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
                                strikeRate: bat.strkrate,
                                imageUrl: playerImages[playerId] || null
                            },
                            team: inning.batteamsname || inning.batteamname,
                            timestamp: new Date().toISOString()
                        };
                        milestones.push(milestoneData);

                        // Save milestone event to database
                        supabase.from('events').insert({
                            match_id: matchId,
                            event_type: 'MILESTONE',
                            payload: milestoneData
                        }).then(({ error }) => {
                            if (error) console.error('Error saving milestone:', error.message);
                        });
                    }

                    // Update stored score
                    playerScores[playerId] = currentRuns;
                });

                return {
                    team: inning.batteamsname || inning.batteamname,
                    score: inning.score,
                    wickets: inning.wickets,
                    overs: inning.overs,
                    runRate: inning.runrate,
                    topBatsmen: batsmen
                        .sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))
                        .slice(0, 3)
                        .map((b: any) => ({
                            id: b.id,
                            name: b.name,
                            runs: b.runs,
                            balls: b.balls,
                            fours: b.fours,
                            sixes: b.sixes,
                            strikeRate: b.strkrate,
                            isOut: !!b.outdec,
                            imageUrl: playerImages[b.id] || null
                        })),
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

            // Remove from cache if match is complete
            if (isComplete) {
                cachedMatchIds = cachedMatchIds.filter(id => id !== matchId);
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

    // Add milestones to logs
    milestones.forEach(m => logs.push(m));

    return NextResponse.json({
        logs,
        matchCount: cachedMatchIds.length,
        milestones,
        cachedImages: Object.keys(playerImages).length,
        imagesFetchedThisPoll: imagesFetched
    });
}
