'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';

interface Team {
    id: number;
    name: string;
    shortName: string;
    imageUrl: string | null;
}

interface Score {
    runs?: number;
    wickets?: number;
    overs?: number;
}

interface Match {
    matchId: number;
    seriesId: number;
    seriesName: string;
    matchDesc: string;
    matchFormat: string;
    state: string;
    status: string;
    category: 'live' | 'completed' | 'upcoming';
    team1: Team;
    team2: Team;
    venue: string;
    city: string;
    startDate: number;
    isLive: boolean;
    isCompleted: boolean;
    score: {
        team1Score: Score | null;
        team2Score: Score | null;
    } | null;
}

interface LiveMatchesProps {
    onSelectMatch: (match: Match) => void;
}

export default function LiveMatches({ onSelectMatch }: LiveMatchesProps) {
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed'>('live');
    const [isFetchingLive, setIsFetchingLive] = useState(false);

    const livePollingRef = useRef<NodeJS.Timeout | null>(null);
    const fullRefreshRef = useRef<NodeJS.Timeout | null>(null);
    const lastFullFetchRef = useRef<number>(0);
    const isVisibleRef = useRef<boolean>(true);

    // Cache to track highest scores seen - prevents backwards movement
    const highestScoresRef = useRef<Map<number, { t1: number, t2: number }>>(new Map());

    // Fetch all matches (full mode) - called on init and every 5 minutes
    const fetchFullData = async () => {
        try {
            console.log('[API] Fetching FULL data (live + recent + upcoming)');
            const res = await fetch('/api/live-matches?mode=full');
            const data = await res.json();

            if (data.success) {
                // Update cache with scores from full data
                data.live?.forEach((match: Match) => {
                    const t1 = match.score?.team1Score?.runs ?? 0;
                    const t2 = match.score?.team2Score?.runs ?? 0;
                    const cached = highestScoresRef.current.get(match.matchId) || { t1: 0, t2: 0 };
                    highestScoresRef.current.set(match.matchId, {
                        t1: Math.max(cached.t1, t1),
                        t2: Math.max(cached.t2, t2)
                    });
                });

                // Save to localStorage
                const cacheObj = Object.fromEntries(highestScoresRef.current);
                localStorage.setItem('cricket_score_cache', JSON.stringify(cacheObj));

                // Apply smart filtering to live matches (same as fetchLiveScores)
                setLiveMatches(prev => {
                    if (prev.length === 0) return data.live || [];

                    const currentMap = new Map(prev.map((m: Match) => [m.matchId, m]));
                    const newLive = data.live || [];

                    return newLive.map((newMatch: Match) => {
                        const currentMatch = currentMap.get(newMatch.matchId);
                        if (!currentMatch) return newMatch;

                        const newT1 = newMatch.score?.team1Score?.runs ?? 0;
                        const newT2 = newMatch.score?.team2Score?.runs ?? 0;
                        const currentT1 = currentMatch.score?.team1Score?.runs ?? 0;
                        const currentT2 = currentMatch.score?.team2Score?.runs ?? 0;

                        // Only update if scores increased
                        if (newT1 >= currentT1 && newT2 >= currentT2) {
                            return newMatch;
                        }

                        // Keep current if new scores are lower
                        console.log(`[Full Refresh] Keeping higher scores for match ${newMatch.matchId}`);
                        return currentMatch;
                    });
                });

                setCompletedMatches(data.completed || []);
                setUpcomingMatches(data.upcoming || []);
                setError(null);
                lastFullFetchRef.current = Date.now();
                return data.live?.length > 0;
            } else {
                setError(data.error || 'Failed to fetch matches');
                return false;
            }
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Helper to get total runs from a match
    const getTotalRuns = (match: Match): number => {
        const t1 = match.score?.team1Score?.runs || 0;
        const t2 = match.score?.team2Score?.runs || 0;
        return t1 + t2;
    };

    // Best Practice: Use useMemo to track highest scores seen
    const reconciledLiveMatches = useMemo(() => {
        return liveMatches.map(match => {
            const matchId = match.matchId;
            const newT1 = match.score?.team1Score?.runs ?? 0;
            const newT2 = match.score?.team2Score?.runs ?? 0;

            // Get cached highest scores
            const cached = highestScoresRef.current.get(matchId) || { t1: 0, t2: 0 };
            const highestT1 = Math.max(cached.t1, newT1);
            const highestT2 = Math.max(cached.t2, newT2);

            // Update cache with highest scores
            highestScoresRef.current.set(matchId, { t1: highestT1, t2: highestT2 });

            // Return match as-is (filtering happens in fetchLiveScores)
            return match;
        });
    }, [liveMatches]);

    // Fetch only live scores (live mode) - called every 20 seconds
    const fetchLiveScores = async () => {
        try {
            setIsFetchingLive(true);
            console.log('[API] Fetching LIVE scores only');
            const res = await fetch('/api/live-matches?mode=live&t=' + Date.now()); // Cache bust
            const data = await res.json();

            if (data.success) {
                // Smart update: only update if scores are moving forward, never backwards
                const newLive = data.live || [];
                console.log('[API] Received live matches:', newLive.length);

                setLiveMatches(prev => {
                    if (prev.length === 0) return newLive;

                    const currentMap = new Map(prev.map(m => [m.matchId, m]));
                    let hasChanges = false;

                    const updatedMatches = newLive.map((newMatch: Match) => {
                        const currentMatch = currentMap.get(newMatch.matchId);
                        if (!currentMatch) {
                            hasChanges = true;
                            return newMatch;
                        }

                        // Always update if state changed
                        if (newMatch.state !== currentMatch.state) {
                            console.log(`[API] State changed: ${currentMatch.state} -> ${newMatch.state}`);
                            hasChanges = true;
                            return newMatch;
                        }

                        // Get scores from API
                        const newT1Runs = newMatch.score?.team1Score?.runs ?? 0;
                        const newT2Runs = newMatch.score?.team2Score?.runs ?? 0;

                        // Get highest scores we've ever seen for this match
                        const cached = highestScoresRef.current.get(newMatch.matchId) || { t1: 0, t2: 0 };
                        const highestT1 = Math.max(cached.t1, newT1Runs);
                        const highestT2 = Math.max(cached.t2, newT2Runs);

                        // Update cache with new highest scores
                        highestScoresRef.current.set(newMatch.matchId, { t1: highestT1, t2: highestT2 });

                        // Check if scores actually increased from what we're currently showing
                        const currentT1Runs = currentMatch.score?.team1Score?.runs ?? 0;
                        const currentT2Runs = currentMatch.score?.team2Score?.runs ?? 0;

                        // If new highest is greater than current, update
                        if (highestT1 > currentT1Runs || highestT2 > currentT2Runs) {
                            hasChanges = true;
                            console.log(`[API] Score increased - T1: ${currentT1Runs}->${highestT1}, T2: ${currentT2Runs}->${highestT2}`);

                            // Always return new match to trigger re-render
                            return newMatch;
                        }

                        // If API sent lower scores, ignore completely
                        if (newT1Runs < currentT1Runs || newT2Runs < currentT2Runs) {
                            console.log(`[API] Ignoring stale data - API sent T1:${newT1Runs} T2:${newT2Runs}, keeping T1:${currentT1Runs} T2:${currentT2Runs}`);
                        }

                        // No change, keep current
                        return currentMatch;
                    });

                    // Only update state if there were actual changes
                    if (!hasChanges) {
                        console.log('[API] No changes detected, skipping state update');
                        return prev;
                    }

                    return updatedMatches;
                });

                // Save updated cache to localStorage
                const cacheObj = Object.fromEntries(highestScoresRef.current);
                localStorage.setItem('cricket_score_cache', JSON.stringify(cacheObj));

                // If a match just completed, trigger full refresh
                if (data.hasNewlyCompleted) {
                    console.log('[API] Match completed detected, triggering full refresh');
                    await fetchFullData();
                }

                return newLive.length > 0;
            }
            return false;
        } catch (err: any) {
            console.error('Error fetching live scores:', err);
            return false;
        } finally {
            setIsFetchingLive(false);
        }
    };

    // Handle page visibility change - stop polling when tab is hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                console.log('[Visibility] Tab hidden - stopping all polling');
                isVisibleRef.current = false;
                stopLivePolling();
                stopFullRefreshInterval();
            } else if (document.visibilityState === 'visible') {
                console.log('[Visibility] Tab visible - resuming polling');
                isVisibleRef.current = true;
                // Resume polling if there are live matches
                if (liveMatches.length > 0) {
                    fetchLiveScores(); // Immediate fetch on return
                    startLivePolling();
                }
                startFullRefreshInterval();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [liveMatches.length]);

    // Initial fetch and setup polling
    useEffect(() => {
        // Restore score cache from localStorage
        try {
            const cached = localStorage.getItem('cricket_score_cache');
            if (cached) {
                const cacheObj = JSON.parse(cached);
                highestScoresRef.current = new Map(Object.entries(cacheObj).map(([k, v]: any) => [parseInt(k), v]));
                console.log('[Cache] Restored score cache from localStorage');
            }
        } catch (e) {
            console.error('[Cache] Failed to restore cache:', e);
        }

        const init = async () => {
            const hasLive = await fetchFullData();

            // Start live polling if there are live matches and tab is visible
            if (hasLive && isVisibleRef.current) {
                startLivePolling();
            }

            // Start full refresh interval if tab is visible
            if (isVisibleRef.current) {
                startFullRefreshInterval();
            }
        };

        init();

        return () => {
            stopLivePolling();
            stopFullRefreshInterval();
        };
    }, []);

    // Start/stop live polling based on live matches
    useEffect(() => {
        if (liveMatches.length > 0) {
            startLivePolling();
        } else {
            stopLivePolling();
        }
    }, [liveMatches.length]);

    const startLivePolling = () => {
        if (livePollingRef.current) return;
        if (!isVisibleRef.current) return; // Don't start if tab not visible

        livePollingRef.current = setInterval(async () => {
            // Skip if tab is not visible
            if (!isVisibleRef.current) {
                stopLivePolling();
                return;
            }
            const hasLive = await fetchLiveScores();
            if (!hasLive) {
                stopLivePolling();
            }
        }, 20000); // 20 seconds
    };

    const stopLivePolling = () => {
        if (livePollingRef.current) {
            clearInterval(livePollingRef.current);
            livePollingRef.current = null;
        }
    };

    const startFullRefreshInterval = () => {
        if (fullRefreshRef.current) return;
        if (!isVisibleRef.current) return; // Don't start if tab not visible

        fullRefreshRef.current = setInterval(() => {
            // Skip if tab is not visible
            if (!isVisibleRef.current) {
                stopFullRefreshInterval();
                return;
            }
            fetchFullData();
        }, 900000); // 15 minutes
    };

    // Manual refresh handler
    const handleManualRefresh = async () => {
        setLoading(true);
        await fetchFullData();
    };

    const stopFullRefreshInterval = () => {
        if (fullRefreshRef.current) {
            clearInterval(fullRefreshRef.current);
            fullRefreshRef.current = null;
        }
    };

    // Auto-switch to tab with matches on initial load
    useEffect(() => {
        if (!loading) {
            if (liveMatches.length > 0) {
                setActiveTab('live');
            } else if (upcomingMatches.length > 0) {
                setActiveTab('upcoming');
            } else if (completedMatches.length > 0) {
                setActiveTab('completed');
            }
        }
    }, [loading]);

    const formatScore = (score: Score | null) => {
        if (!score) return '-';

        const runs = score.runs ?? 0;
        const wickets = score.wickets ?? 0; // Default to 0 if undefined
        let overs = score.overs ?? 0;

        // Convert overs: if it's X.6, make it (X+1).0 since each over has 6 balls
        const oversPart = Math.floor(overs);
        const ballsPart = Math.round((overs - oversPart) * 10);

        if (ballsPart >= 6) {
            overs = oversPart + 1;
        }

        return `${runs}/${wickets} (${overs})`;
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(parseInt(String(timestamp)));
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMatchesByTab = () => {
        switch (activeTab) {
            case 'live': return reconciledLiveMatches;
            case 'completed': return completedMatches;
            case 'upcoming': return upcomingMatches;
            default: return [];
        }
    };

    const renderMatchCard = (match: Match) => (
        <div
            key={match.matchId}
            onClick={() => onSelectMatch(match)}
            className="bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all group"
        >
            {/* Match Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {match.isLive && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                            LIVE
                        </span>
                    )}
                    {match.isCompleted && (
                        <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">
                            COMPLETED
                        </span>
                    )}
                    {!match.isLive && !match.isCompleted && (
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                            UPCOMING
                        </span>
                    )}
                    <span className="text-gray-400 text-sm">{match.seriesName}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 text-sm">{match.matchDesc}</span>
                </div>
                <span className="text-gray-500 text-sm">{match.matchFormat}</span>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between">
                {/* Team 1 */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                        {match.team1.imageUrl ? (
                            <img
                                src={match.team1.imageUrl}
                                alt={match.team1.name}
                                className="w-12 h-12 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <span className="text-2xl font-bold text-gray-500">
                                {match.team1.shortName?.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg">{match.team1.name}</p>
                        {match.score?.team1Score && match.score.team1Score.runs !== undefined && (
                            <p className="text-green-400 font-mono text-xl">
                                {formatScore(match.score.team1Score)}
                            </p>
                        )}
                    </div>
                </div>

                {/* VS with Status */}
                <div className="px-8 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">VS</span>
                    </div>
                    {/* Status in Center */}
                    <div className="text-sm text-center whitespace-nowrap">
                        {match.isLive ? (
                            <span className="text-yellow-400 font-semibold">{match.status || match.state || 'Live'}</span>
                        ) : match.isCompleted ? (
                            <span className="text-green-400 font-semibold">{match.status || 'Match Completed'}</span>
                        ) : (
                            <span className="text-gray-500">{formatDate(match.startDate)}</span>
                        )}
                    </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-4 flex-1 justify-end text-right">
                    <div>
                        <p className="text-white font-bold text-lg">{match.team2.name}</p>
                        {match.score?.team2Score && match.score.team2Score.runs !== undefined && (
                            <p className="text-green-400 font-mono text-xl">
                                {formatScore(match.score.team2Score)}
                            </p>
                        )}
                    </div>
                    <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                        {match.team2.imageUrl ? (
                            <img
                                src={match.team2.imageUrl}
                                alt={match.team2.name}
                                className="w-12 h-12 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <span className="text-2xl font-bold text-gray-500">
                                {match.team2.shortName?.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Venue Info at Bottom */}
            <div className="mt-4 text-center">
                <div className="text-gray-400 text-sm">
                    {match.venue || 'Venue TBD'}{match.city ? `, ${match.city}` : ''}
                </div>
            </div>

            {/* Hover Action */}
            <div className="mt-4 pt-4 border-t border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center gap-2 text-green-400">
                    <span>Click to create social templates</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading matches...</p>
                </div>
            </div>
        );
    }

    const currentMatches = getMatchesByTab();
    const totalMatches = liveMatches.length + completedMatches.length + upcomingMatches.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/assets/templates/myco-white.png" alt="MYCO" className="h-10" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">ICC Championship 2025</h1>
                            <p className="text-gray-400 text-sm">Live Matches & Social Templates</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleManualRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-medium transition text-sm"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${liveMatches.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className={`text-sm font-medium ${liveMatches.length > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                {liveMatches.length > 0 ? `LIVE (${liveMatches.length})` : 'NO LIVE'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="max-w-6xl mx-auto mb-6">
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
                        {error}
                        <button
                            onClick={fetchFullData}
                            className="ml-4 text-red-300 underline hover:text-white"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'live'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${liveMatches.length > 0 ? (activeTab === 'live' ? 'bg-white' : 'bg-red-500') + ' animate-pulse' : 'bg-gray-500'}`}></span>
                        Live ({liveMatches.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'upcoming'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        Upcoming ({upcomingMatches.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        Completed ({completedMatches.length})
                    </button>
                </div>
            </div>

            {/* No Matches */}
            {!error && totalMatches === 0 && (
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                        <div className="text-6xl mb-4">🏏</div>
                        <h2 className="text-xl font-bold text-white mb-2">No Matches Found</h2>
                        <p className="text-gray-400">Check back later for upcoming ICC matches</p>
                    </div>
                </div>
            )}

            {/* No Matches in Current Tab */}
            {!error && totalMatches > 0 && currentMatches.length === 0 && (
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                        <div className="text-6xl mb-4">
                            {activeTab === 'live' ? '🔴' : activeTab === 'upcoming' ? '📅' : '✅'}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            No {activeTab === 'live' ? 'Live' : activeTab === 'upcoming' ? 'Upcoming' : 'Completed'} Matches
                        </h2>
                        <p className="text-gray-400">
                            {activeTab === 'live' && 'No matches are currently in progress'}
                            {activeTab === 'upcoming' && 'No upcoming matches scheduled'}
                            {activeTab === 'completed' && 'No recently completed matches'}
                        </p>
                    </div>
                </div>
            )}

            {/* Matches Grid */}
            <div className="max-w-6xl mx-auto grid gap-4">
                {currentMatches.map(renderMatchCard)}
            </div>

            {/* Status Indicator */}
            <div className="max-w-6xl mx-auto mt-6 text-center text-gray-500 text-sm h-6">
                {isFetchingLive && (
                    <span className="flex items-center justify-center gap-2 text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Updating live scores...
                    </span>
                )}
            </div>
        </div>
    );
}
