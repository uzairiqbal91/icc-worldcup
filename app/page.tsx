'use client';

import { useEffect, useState } from 'react';

// Format timestamp to readable date
const formatDate = (timestamp: string | number | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const formatDateShort = (timestamp: string | number | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
    });
};

interface Player {
    id: number;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
    isOut?: boolean;
    imageUrl: string | null;
    overs?: number;
    wickets?: number;
    economy?: string;
}

interface InningsScore {
    team: string;
    score: number;
    wickets: number;
    overs: number;
    runRate: string;
    topBatsmen: Player[];
    topBowlers: Player[];
}

interface Match {
    matchId: number;
    desc: string;
    team1: string;
    team1Logo: string | null;
    team2: string;
    team2Logo: string | null;
    state: string;
    status?: string;
    scores?: InningsScore[];
    startDate?: string;
    endDate?: string;
    venueInfo?: string;
    seriesName?: string;
    matchFormat?: string;
    category?: string;
}

interface Milestone {
    milestone: number;
    matchId: number;
    player: Player;
    team: string;
    timestamp: string;
}

type TabType = 'score' | 'milestones' | 'images';

export default function Home() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [milestonesByMatch, setMilestonesByMatch] = useState<Record<number, Milestone[]>>({});
    const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [isPolling, setIsPolling] = useState(true);
    const [matchComplete, setMatchComplete] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('score');

    const fetchScores = async () => {
        try {
            const response = await fetch('/api/poll-scores');
            const data = await response.json();

            if (data.logs) {
                const matchesFound = data.logs.find((log: any) => log.type === 'matches_found');
                const scoreUpdates = data.logs.filter((log: any) => log.type === 'score_update');
                const newMilestones = data.logs.filter((log: any) => log.type === 'milestone');

                if (matchesFound?.matches) {
                    const updatedMatches = matchesFound.matches.map((match: any) => {
                        const scoreUpdate = scoreUpdates.find((s: any) => s.matchId === match.matchId);
                        return {
                            ...match,
                            status: scoreUpdate?.status,
                            scores: scoreUpdate?.scores
                        };
                    });
                    setMatches(updatedMatches);

                    if (selectedMatch === null && updatedMatches.length > 0) {
                        setSelectedMatch(updatedMatches[0].matchId);
                    }
                }

                if (newMilestones.length > 0) {
                    setMilestonesByMatch(prev => {
                        const updated = { ...prev };
                        newMilestones.forEach((m: Milestone) => {
                            const matchId = m.matchId;
                            if (!updated[matchId]) {
                                updated[matchId] = [];
                            }
                            // Check if milestone already exists for this player
                            const exists = updated[matchId].some(
                                existing => existing.player?.id === m.player?.id && existing.milestone === m.milestone
                            );
                            if (!exists) {
                                updated[matchId] = [m, ...updated[matchId]].slice(0, 10);
                            }
                        });
                        return updated;
                    });
                }

                if (data.allMatchesComplete) {
                    setMatchComplete(true);
                    setIsPolling(false);
                }

                setLastUpdate(new Date().toLocaleTimeString());
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching scores:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isPolling) return;

        fetchScores();
        const interval = setInterval(fetchScores, 15000);
        return () => clearInterval(interval);
    }, [isPolling]);

    const selectedMatchData = matches.find(m => m.matchId === selectedMatch);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 text-xl">Loading Live Matches...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-green-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-green-700 font-bold text-xl">🏏</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Cricket Live</h1>
                                <p className="text-green-200 text-sm">Real-time scores & updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    matchComplete ? 'bg-white' : isPolling ? 'bg-green-300 animate-pulse' : 'bg-red-400'
                                }`}></div>
                                <span className="text-green-100 text-sm">
                                    {matchComplete ? `Match Complete • ${lastUpdate}` : isPolling ? `Live • Updated ${lastUpdate}` : 'Paused'}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    if (matchComplete) {
                                        setMatchComplete(false);
                                    }
                                    setIsPolling(!isPolling);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    matchComplete
                                        ? 'bg-white text-green-700 hover:bg-green-50'
                                        : isPolling
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-white text-green-700 hover:bg-green-50'
                                }`}
                            >
                                {matchComplete ? 'Match Ended' : isPolling ? 'Pause' : 'Resume'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {matches.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow">
                        <div className="text-6xl mb-4">🏏</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Live Matches</h2>
                        <p className="text-gray-500">Check back later for live cricket action!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Match Tabs - Left Sidebar */}
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Live Matches ({matches.length})</h2>
                            <div className="space-y-2">
                                {matches.map((match) => (
                                    <button
                                        key={match.matchId}
                                        onClick={() => setSelectedMatch(match.matchId)}
                                        className={`w-full text-left p-4 rounded-xl transition-all ${
                                            selectedMatch === match.matchId
                                                ? 'bg-green-600 text-white shadow-lg'
                                                : 'bg-white border border-gray-200 hover:border-green-400 hover:shadow'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {match.category && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                        selectedMatch === match.matchId
                                                            ? 'bg-white/20 text-white'
                                                            : match.category === 'International'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {match.category}
                                                    </span>
                                                )}
                                                <span className={`text-xs ${selectedMatch === match.matchId ? 'text-green-100' : 'text-gray-500'}`}>
                                                    {match.desc}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                selectedMatch === match.matchId
                                                    ? 'bg-white text-green-700'
                                                    : matchComplete
                                                        ? 'bg-gray-200 text-gray-600'
                                                        : match.state === 'In Progress' || match.state === 'Live'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {matchComplete ? 'COMPLETED' : match.state === 'In Progress' ? 'LIVE' : match.state}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {match.team1Logo && (
                                                <img src={match.team1Logo} alt="" className="w-6 h-6 rounded"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}/>
                                            )}
                                            <span className="font-medium">{match.team1}</span>
                                            <span className={selectedMatch === match.matchId ? 'text-green-200' : 'text-gray-400'}>vs</span>
                                            <span className="font-medium">{match.team2}</span>
                                            {match.team2Logo && (
                                                <img src={match.team2Logo} alt="" className="w-6 h-6 rounded"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}/>
                                            )}
                                        </div>
                                        {match.startDate && (
                                            <div className={`mt-1 text-xs ${selectedMatch === match.matchId ? 'text-green-200' : 'text-gray-500'}`}>
                                                {formatDateShort(match.startDate)}{match.endDate && match.endDate !== match.startDate ? ` - ${formatDateShort(match.endDate)}` : ''}
                                            </div>
                                        )}
                                        {match.scores && match.scores[0] && (
                                            <div className={`mt-2 text-sm font-mono font-semibold ${
                                                selectedMatch === match.matchId ? 'text-white' : 'text-green-600'
                                            }`}>
                                                {match.scores[0].score}/{match.scores[0].wickets} ({match.scores[0].overs} ov)
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scorecard - Main Content */}
                        <div className="lg:col-span-3">
                            {selectedMatchData ? (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    {/* Match Header */}
                                    <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">
                                                    {selectedMatchData.team1} vs {selectedMatchData.team2}
                                                </h2>
                                                <p className="text-green-200">{selectedMatchData.desc}</p>
                                                <div className="flex items-center gap-3 mt-2 text-sm text-green-100">
                                                    {selectedMatchData.startDate && (
                                                        <span className="flex items-center gap-1">
                                                            📅 {formatDate(selectedMatchData.startDate)}
                                                            {selectedMatchData.endDate && selectedMatchData.endDate !== selectedMatchData.startDate && ` - ${formatDate(selectedMatchData.endDate)}`}
                                                        </span>
                                                    )}
                                                    {selectedMatchData.venueInfo && (
                                                        <span className="flex items-center gap-1">
                                                            📍 {selectedMatchData.venueInfo}
                                                        </span>
                                                    )}
                                                    {selectedMatchData.matchFormat && (
                                                        <span className="px-2 py-0.5 bg-white/20 text-white rounded text-xs">
                                                            {selectedMatchData.matchFormat}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                {selectedMatchData.category && (
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                                                        {selectedMatchData.category}
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    matchComplete
                                                        ? 'bg-gray-200 text-gray-700'
                                                        : (selectedMatchData.state === 'In Progress' || selectedMatchData.state === 'Live')
                                                            ? 'bg-white text-green-700'
                                                            : 'bg-yellow-400 text-yellow-900'
                                                }`}>
                                                    {matchComplete ? 'COMPLETED' : selectedMatchData.state === 'In Progress' ? 'LIVE' : selectedMatchData.state}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedMatchData.status && (
                                            <p className="mt-3 text-yellow-300 font-medium">{selectedMatchData.status}</p>
                                        )}

                                        {/* Tabs */}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => setActiveTab('score')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                                    activeTab === 'score'
                                                        ? 'bg-white text-green-700'
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                }`}
                                            >
                                                Scorecard
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('milestones')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                                    activeTab === 'milestones'
                                                        ? 'bg-white text-green-700'
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                }`}
                                            >
                                                Milestones ({milestonesByMatch[selectedMatchData.matchId]?.length || 0})
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('images')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                                    activeTab === 'images'
                                                        ? 'bg-white text-green-700'
                                                        : 'bg-white/20 text-white hover:bg-white/30'
                                                }`}
                                            >
                                                Images
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    {activeTab === 'score' && (
                                    <>
                                    {/* Innings Scores */}
                                    {selectedMatchData.scores && selectedMatchData.scores.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {selectedMatchData.scores.map((innings, idx) => (
                                                <div key={idx} className="p-6">
                                                    {/* Team Score */}
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800">{innings.team}</h3>
                                                            <p className="text-gray-500 text-sm">Innings {idx + 1}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-4xl font-bold text-green-700">
                                                                {innings.score}<span className="text-gray-400">/{innings.wickets}</span>
                                                            </div>
                                                            <p className="text-gray-500">
                                                                {innings.overs} overs • RR: {innings.runRate}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Batsmen Table */}
                                                    {innings.topBatsmen && innings.topBatsmen.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                                                                Batting
                                                            </h4>
                                                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="text-xs text-gray-500 border-b border-gray-200 bg-gray-100">
                                                                            <th className="text-left py-3 px-4">Batter</th>
                                                                            <th className="text-center py-3 px-2">R</th>
                                                                            <th className="text-center py-3 px-2">B</th>
                                                                            <th className="text-center py-3 px-2">4s</th>
                                                                            <th className="text-center py-3 px-2">6s</th>
                                                                            <th className="text-center py-3 px-2">SR</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {innings.topBatsmen.map((bat, i) => {
                                                                            const isMilestone = bat.runs >= 50;
                                                                            const isCentury = bat.runs >= 100;
                                                                            return (
                                                                                <tr
                                                                                    key={i}
                                                                                    className={`border-b border-gray-100 ${
                                                                                        isCentury
                                                                                            ? 'bg-gradient-to-r from-yellow-100 to-transparent'
                                                                                            : isMilestone
                                                                                                ? 'bg-gradient-to-r from-green-100 to-transparent'
                                                                                                : 'bg-white'
                                                                                    }`}
                                                                                >
                                                                                    <td className="py-3 px-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                            {bat.imageUrl && (
                                                                                                <img
                                                                                                    src={bat.imageUrl}
                                                                                                    alt={bat.name}
                                                                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                                                                />
                                                                                            )}
                                                                                            <div>
                                                                                                <span className={`font-medium ${bat.isOut ? 'text-gray-400' : 'text-gray-800'}`}>
                                                                                                    {bat.name}
                                                                                                    {!bat.isOut && <span className="text-green-600">*</span>}
                                                                                                </span>
                                                                                                {isCentury && (
                                                                                                    <span className="ml-2 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded">
                                                                                                        💯
                                                                                                    </span>
                                                                                                )}
                                                                                                {isMilestone && !isCentury && (
                                                                                                    <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                                                                                                        50+
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className={`text-center py-3 px-2 font-bold ${
                                                                                        isCentury ? 'text-yellow-600' : isMilestone ? 'text-green-600' : 'text-gray-800'
                                                                                    }`}>
                                                                                        {bat.runs}
                                                                                    </td>
                                                                                    <td className="text-center py-3 px-2 text-gray-500">{bat.balls}</td>
                                                                                    <td className="text-center py-3 px-2 text-green-600">{bat.fours}</td>
                                                                                    <td className="text-center py-3 px-2 text-green-700">{bat.sixes}</td>
                                                                                    <td className="text-center py-3 px-2 text-gray-600">{bat.strikeRate}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Bowlers Table */}
                                                    {innings.topBowlers && innings.topBowlers.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                                                                Bowling
                                                            </h4>
                                                            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="text-xs text-gray-500 border-b border-gray-200 bg-gray-100">
                                                                            <th className="text-left py-3 px-4">Bowler</th>
                                                                            <th className="text-center py-3 px-2">O</th>
                                                                            <th className="text-center py-3 px-2">R</th>
                                                                            <th className="text-center py-3 px-2">W</th>
                                                                            <th className="text-center py-3 px-2">Econ</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {innings.topBowlers.map((bowl, i) => (
                                                                            <tr key={i} className="border-b border-gray-100 bg-white">
                                                                                <td className="py-3 px-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                        {bowl.imageUrl && (
                                                                                            <img
                                                                                                src={bowl.imageUrl}
                                                                                                alt={bowl.name}
                                                                                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                                                            />
                                                                                        )}
                                                                                        <span className="text-gray-800 font-medium">{bowl.name}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="text-center py-3 px-2 text-gray-600">{bowl.overs}</td>
                                                                                <td className="text-center py-3 px-2 text-gray-600">{bowl.runs}</td>
                                                                                <td className="text-center py-3 px-2 text-green-600 font-bold">{bowl.wickets}</td>
                                                                                <td className="text-center py-3 px-2 text-gray-500">{bowl.economy}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <div className="text-4xl mb-4">⏳</div>
                                            <p className="text-gray-500">Waiting for scorecard data...</p>
                                        </div>
                                    )}
                                    </>
                                    )}

                                    {/* Milestones Tab */}
                                    {activeTab === 'milestones' && (
                                        <div className="p-6">
                                            {milestonesByMatch[selectedMatchData.matchId]?.length > 0 ? (
                                                <div className="space-y-4">
                                                    {milestonesByMatch[selectedMatchData.matchId].map((m, i) => (
                                                        <div
                                                            key={`${m.player?.id}-${m.milestone}-${i}`}
                                                            className={`flex items-center gap-4 p-4 rounded-xl ${
                                                                m.milestone === 100
                                                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300'
                                                                    : 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300'
                                                            }`}
                                                        >
                                                            {m.player?.imageUrl && (
                                                                <img
                                                                    src={m.player.imageUrl}
                                                                    alt={m.player?.name}
                                                                    className={`w-16 h-16 rounded-full object-cover border-3 ${
                                                                        m.milestone === 100 ? 'border-yellow-500' : 'border-green-500'
                                                                    }`}
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <div className={`font-bold text-xl ${m.milestone === 100 ? 'text-orange-700' : 'text-green-700'}`}>
                                                                    {m.player?.name}
                                                                    <span className={`ml-3 px-3 py-1 rounded text-sm ${
                                                                        m.milestone === 100 ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'
                                                                    }`}>
                                                                        {m.milestone === 100 ? '💯 Century!' : '50+ Runs'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-gray-600 mt-1">
                                                                    {m.player?.runs} runs off {m.player?.balls} balls
                                                                </div>
                                                                <div className="text-sm text-gray-500 mt-1">
                                                                    {m.player?.fours} fours • {m.player?.sixes} sixes • SR: {m.player?.strikeRate}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">{m.team}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <div className="text-4xl mb-4">🎯</div>
                                                    <p className="text-gray-500">No milestones yet in this match</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Images Tab */}
                                    {activeTab === 'images' && (
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {selectedMatchData.scores?.flatMap(innings =>
                                                    [...innings.topBatsmen, ...innings.topBowlers]
                                                ).filter(player => player.imageUrl).map((player, i) => (
                                                    <div key={`player-img-${player.id}-${i}`} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                                                        <img
                                                            src={player.imageUrl!}
                                                            alt={player.name}
                                                            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-green-500"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                        />
                                                        <p className="mt-2 font-medium text-gray-800">{player.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {player.runs !== undefined ? `${player.runs} runs` : `${player.wickets} wickets`}
                                                        </p>
                                                    </div>
                                                ))}
                                                {(!selectedMatchData.scores || selectedMatchData.scores.flatMap(innings =>
                                                    [...innings.topBatsmen, ...innings.topBowlers]
                                                ).filter(player => player.imageUrl).length === 0) && (
                                                    <div className="col-span-full text-center py-12">
                                                        <div className="text-4xl mb-4">📷</div>
                                                        <p className="text-gray-500">No player images available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow p-12 text-center">
                                    <div className="text-4xl mb-4">👈</div>
                                    <p className="text-gray-500">Select a match to view scorecard</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
