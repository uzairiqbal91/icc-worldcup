'use client';

import { useEffect, useState, useRef } from 'react';

interface LogEntry {
    id: string;
    type: string;
    timestamp: string;
    endpoint?: string;
    description?: string;
    success?: boolean;
    duration?: number;
    status?: number;
    message?: string;
    count?: number;
    matches?: any[];
    matchId?: number;
    scores?: any[];
    isComplete?: boolean;
    // Milestone fields
    milestone?: number;
    player?: {
        id: number;
        name: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        strikeRate: string;
        imageUrl: string | null;
    };
    team?: string;
}

export default function Home() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPolling, setIsPolling] = useState(true);
    const [pollCount, setPollCount] = useState(0);
    const [countdown, setCountdown] = useState(20);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Fetch scores
    const fetchScores = async () => {
        try {
            const response = await fetch('/api/poll-scores');
            const data = await response.json();

            if (data.logs && data.logs.length > 0) {
                const newLogs = data.logs.map((log: any, index: number) => ({
                    ...log,
                    id: `${Date.now()}-${index}-${Math.random()}`
                }));
                setLogs(prev => [...prev.slice(-50), ...newLogs]);
                setPollCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error fetching scores:', error);
            setLogs(prev => [...prev, {
                id: `${Date.now()}-error`,
                type: 'error',
                message: 'Failed to fetch scores',
                timestamp: new Date().toISOString()
            }]);
        }
    };

    // Polling effect
    useEffect(() => {
        if (!isPolling) return;

        // Fetch immediately on mount
        fetchScores();

        // Set up interval for polling every 20 seconds
        const pollInterval = setInterval(() => {
            fetchScores();
            setCountdown(20);
        }, 20000);

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 20));
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(countdownInterval);
        };
    }, [isPolling]);

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getLogColor = (type: string, success?: boolean, milestone?: number) => {
        switch (type) {
            case 'api_call_start':
                return 'bg-blue-900/30 border-blue-500';
            case 'api_call_end':
                return success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500';
            case 'matches_found':
                return 'bg-purple-900/30 border-purple-500';
            case 'score_update':
                return 'bg-yellow-900/30 border-yellow-500';
            case 'milestone':
                return milestone === 100 ? 'bg-orange-900/50 border-orange-400' : 'bg-pink-900/50 border-pink-400';
            case 'error':
                return 'bg-red-900/30 border-red-500';
            default:
                return 'bg-gray-800/30 border-gray-500';
        }
    };

    const getStatusBadge = (status?: number) => {
        if (!status) return null;
        const color = status >= 200 && status < 300 ? 'bg-green-600' : 'bg-red-600';
        return <span className={`${color} px-2 py-0.5 rounded text-xs font-mono`}>{status}</span>;
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cricket API Monitor</h1>
                        <p className="text-gray-400 text-sm">Live API calls every 20 seconds (International matches only)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm">
                                {isPolling ? `Next poll in ${countdown}s` : 'Stopped'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400">
                            Polls: {pollCount}
                        </div>
                        <button
                            onClick={() => setIsPolling(!isPolling)}
                            className={`px-3 py-1 rounded text-sm ${isPolling ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isPolling ? 'Stop' : 'Start'}
                        </button>
                        <button
                            onClick={() => setLogs([])}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="max-w-6xl mx-auto bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-800 border-b border-gray-700 text-sm font-semibold text-gray-300">
                    <div className="col-span-1">Time</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Endpoint</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Duration</div>
                    <div className="col-span-4">Details</div>
                </div>

                {/* Log Entries */}
                <div className="max-h-[70vh] overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            Loading API calls...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className={`grid grid-cols-12 gap-2 p-3 border-l-4 border-b border-gray-800 ${getLogColor(log.type, log.success, log.milestone)} transition-all duration-300`}
                            >
                                <div className="col-span-1 text-xs font-mono text-gray-400">
                                    {formatTime(log.timestamp)}
                                </div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        log.type === 'api_call_start' ? 'bg-blue-600' :
                                        log.type === 'api_call_end' ? (log.success ? 'bg-green-600' : 'bg-red-600') :
                                        log.type === 'matches_found' ? 'bg-purple-600' :
                                        log.type === 'score_update' ? 'bg-yellow-600' :
                                        log.type === 'milestone' ? (log.milestone === 100 ? 'bg-orange-500' : 'bg-pink-500') :
                                        'bg-gray-600'
                                    }`}>
                                        {log.type === 'milestone' ? `${log.milestone} RUNS!` : log.type.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="col-span-3 font-mono text-sm text-gray-300 truncate">
                                    {log.endpoint || '-'}
                                </div>
                                <div className="col-span-1">
                                    {getStatusBadge(log.status)}
                                </div>
                                <div className="col-span-1 text-sm text-gray-400">
                                    {log.duration ? `${log.duration}ms` : '-'}
                                </div>
                                <div className="col-span-4 text-sm">
                                    {log.type === 'api_call_start' && (
                                        <span className="text-blue-400">{log.description}</span>
                                    )}
                                    {log.type === 'api_call_end' && (
                                        <span className={log.success ? 'text-green-400' : 'text-red-400'}>
                                            {log.success ? 'Success' : 'Failed'}
                                        </span>
                                    )}
                                    {log.type === 'matches_found' && (
                                        <div>
                                            <span className="text-purple-400">Found {log.count} match(es)</span>
                                            {log.matches && log.matches.length > 0 && (
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {log.matches.map((m: any, i: number) => (
                                                        <div key={i}>{m.team1} vs {m.team2} ({m.desc})</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {log.type === 'score_update' && log.scores && (
                                        <div className="space-y-2">
                                            <div className="text-yellow-400 text-xs font-medium">{log.status}</div>
                                            {log.scores.map((s: any, i: number) => (
                                                <div key={i} className="text-xs border-l-2 border-gray-700 pl-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{s.team}:</span>
                                                        <span className="text-green-400 font-bold">{s.score}/{s.wickets}</span>
                                                        <span className="text-gray-400">({s.overs} ov, RR: {s.runRate})</span>
                                                    </div>
                                                    {s.topBatsmen && s.topBatsmen.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {s.topBatsmen.map((bat: any, bi: number) => (
                                                                <div key={bi} className="flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded">
                                                                    {bat.imageUrl && (
                                                                        <img
                                                                            src={bat.imageUrl}
                                                                            alt={bat.name}
                                                                            className="w-5 h-5 rounded-full object-cover"
                                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                                        />
                                                                    )}
                                                                    <span className={bat.isOut ? 'text-gray-400' : 'text-cyan-400'}>
                                                                        {bat.name}{bat.isOut ? '' : '*'}: {bat.runs}({bat.balls})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {log.isComplete && <span className="text-green-400 font-bold">MATCH COMPLETE</span>}
                                        </div>
                                    )}
                                    {log.type === 'error' && (
                                        <span className="text-red-400">{log.message}</span>
                                    )}
                                    {log.type === 'milestone' && log.player && (
                                        <div className="flex items-center gap-3">
                                            {log.player.imageUrl && (
                                                <img
                                                    src={log.player.imageUrl}
                                                    alt={log.player.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                />
                                            )}
                                            <div>
                                                <div className={`font-bold ${log.milestone === 100 ? 'text-orange-400' : 'text-pink-400'}`}>
                                                    {log.player.name} - {log.milestone}!
                                                </div>
                                                <div className="text-xs text-gray-300">
                                                    {log.player.runs} runs off {log.player.balls} balls
                                                    ({log.player.fours}x4, {log.player.sixes}x6) SR: {log.player.strikeRate}
                                                </div>
                                                <div className="text-xs text-gray-500">{log.team}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Legend */}
            <div className="max-w-6xl mx-auto mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>API Call</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>Success</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded"></div>
                    <span>Matches</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                    <span>Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded"></div>
                    <span>50 Runs</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>100 Runs</span>
                </div>
            </div>
        </div>
    );
}
