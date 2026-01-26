import { NextRequest } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

// API call function
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

// Get image URL helper
function getImageUrl(imageId: number | string | undefined) {
    if (!imageId) return null;
    return `/api/proxy-image?id=${imageId}`;
}

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let isRunning = true;
            let matchIds: number[] = [];
            let isFirstPoll = true;

            // Send initial connection message
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            sendEvent({
                type: 'connected',
                message: 'API Monitor connected',
                timestamp: new Date().toISOString()
            });

            const poll = async () => {
                if (!isRunning) return;

                try {
                    // Only call Live Matches API on FIRST poll to get match IDs
                    if (isFirstPoll) {
                        sendEvent({
                            type: 'api_call_start',
                            endpoint: '/matches/v1/live',
                            description: 'Fetching live matches (one-time)',
                            timestamp: new Date().toISOString()
                        });

                        const liveResult = await callCricbuzzAPI('/matches/v1/live');

                        sendEvent({
                            type: 'api_call_end',
                            endpoint: '/matches/v1/live',
                            success: liveResult.success,
                            duration: liveResult.duration,
                            status: liveResult.status,
                            timestamp: new Date().toISOString()
                        });

                        if (liveResult.success && liveResult.data?.typeMatches) {
                            // Extract international matches
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

                            sendEvent({
                                type: 'matches_found',
                                count: internationalMatches.length,
                                matches: internationalMatches.map(m => ({
                                    matchId: m.matchId,
                                    desc: m.matchDesc,
                                    team1: m.team1?.teamSName,
                                    team2: m.team2?.teamSName,
                                    state: m.state
                                })),
                                timestamp: new Date().toISOString()
                            });

                            matchIds = internationalMatches.map(m => m.matchId);
                        }

                        isFirstPoll = false;
                    }

                    // Call Scorecard API for each match (every poll)
                    for (const matchId of matchIds) {
                            sendEvent({
                                type: 'api_call_start',
                                endpoint: `/mcenter/v1/${matchId}/scard`,
                                description: `Fetching scorecard for match ${matchId}`,
                                timestamp: new Date().toISOString()
                            });

                            const scardResult = await callCricbuzzAPI(`/mcenter/v1/${matchId}/scard`);

                            sendEvent({
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

                                const scores = innings.map((inning: any) => ({
                                    team: inning.batteamsname || inning.batteamname,
                                    score: inning.score,
                                    wickets: inning.wickets,
                                    overs: inning.overs,
                                    runRate: inning.runrate,
                                    topBatsmen: (inning.batsman || [])
                                        .sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))
                                        .slice(0, 2)
                                        .map((b: any) => ({
                                            name: b.name,
                                            runs: b.runs,
                                            balls: b.balls,
                                            isOut: !!b.outdec
                                        }))
                                }));

                                sendEvent({
                                    type: 'score_update',
                                    matchId,
                                    status,
                                    isComplete,
                                    scores,
                                    timestamp: new Date().toISOString()
                                });
                            }
                    }

                    // Send poll complete event (only scorecard API called after first poll)
                    sendEvent({
                        type: 'poll_complete',
                        nextPollIn: 20,
                        timestamp: new Date().toISOString()
                    });

                } catch (error: any) {
                    sendEvent({
                        type: 'error',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    });
                }

                // Schedule next poll in 20 seconds
                if (isRunning) {
                    setTimeout(poll, 20000);
                }
            };

            // Start polling immediately
            poll();

            // Handle client disconnect
            request.signal.addEventListener('abort', () => {
                isRunning = false;
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
