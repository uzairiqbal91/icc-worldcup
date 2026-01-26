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
    nextPollIn?: number;
}

export default function Home() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Connect to SSE endpoint
        const eventSource = new EventSource('/api/live-stream');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const logEntry: LogEntry = {
                    id: `${Date.now()}-${Math.random()}`,
                    ...data
                };
                setLogs(prev => [...prev.slice(-100), logEntry]); // Keep last 100 entries
            } catch (e) {
                console.error('Failed to parse event data:', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('EventSource error:', err);
            setIsConnected(false);
            setError('Connection lost. Reconnecting...');
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getLogColor = (type: string, success?: boolean) => {
        switch (type) {
            case 'connected':
                return 'bg-green-900/30 border-green-500';
            case 'api_call_start':
                return 'bg-blue-900/30 border-blue-500';
            case 'api_call_end':
                return success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500';
            case 'matches_found':
                return 'bg-purple-900/30 border-purple-500';
            case 'score_update':
                return 'bg-yellow-900/30 border-yellow-500';
            case 'poll_complete':
                return 'bg-gray-800/30 border-gray-500';
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

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cricket API Monitor</h1>
                        <p className="text-gray-400 text-sm">Live API calls every 20 seconds</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        <button
                            onClick={clearLogs}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}
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
                            Waiting for API calls...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className={`grid grid-cols-12 gap-2 p-3 border-l-4 border-b border-gray-800 ${getLogColor(log.type, log.success)} transition-all duration-300`}
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
                                        log.type === 'poll_complete' ? 'bg-gray-600' :
                                        log.type === 'connected' ? 'bg-green-600' :
                                        'bg-gray-600'
                                    }`}>
                                        {log.type.replace(/_/g, ' ').toUpperCase()}
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
                                    {log.type === 'connected' && (
                                        <span className="text-green-400">{log.message}</span>
                                    )}
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
                                        <div className="space-y-1">
                                            <div className="text-yellow-400 text-xs">{log.status}</div>
                                            {log.scores.map((s: any, i: number) => (
                                                <div key={i} className="text-xs">
                                                    <span className="font-semibold">{s.team}:</span> {s.score}/{s.wickets} ({s.overs} ov)
                                                    {s.topBatsmen && s.topBatsmen.length > 0 && (
                                                        <span className="text-gray-400 ml-2">
                                                            {s.topBatsmen[0]?.name}: {s.topBatsmen[0]?.runs}({s.topBatsmen[0]?.balls})
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {log.isComplete && <span className="text-green-400 font-bold">MATCH COMPLETE</span>}
                                        </div>
                                    )}
                                    {log.type === 'poll_complete' && (
                                        <span className="text-gray-400">Next poll in {log.nextPollIn}s</span>
                                    )}
                                    {log.type === 'error' && (
                                        <span className="text-red-400">{log.message}</span>
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
                    <span>API Call Start</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>Success</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span>Error</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded"></div>
                    <span>Matches Found</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                    <span>Score Update</span>
                </div>
            </div>
        </div>
    );
}
