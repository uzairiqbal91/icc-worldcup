'use client';

import { useEffect, useState } from 'react';

interface Team {
    team_id: number;
    name: string;
    short_name: string;
    image_id: number;
    image_url: string;
}

interface Player {
    player_id: number;
    name: string;
    face_image_id: number;
    face_image_url: string;
    role: string;
    team_id: number;
}

interface MatchPreviewData {
    team1: Team | null;
    team2: Team | null;
    captain1: Player | null;
    captain2: Player | null;
}

export default function MatchPreviewPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedTeam1, setSelectedTeam1] = useState<number | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<MatchPreviewData>({
        team1: null,
        team2: null,
        captain1: null,
        captain2: null
    });
    const [loading, setLoading] = useState(true);

    // Fetch teams and players from database
    useEffect(() => {
        async function fetchData() {
            try {
                const [teamsRes, playersRes] = await Promise.all([
                    fetch('/api/teams'),
                    fetch('/api/players')
                ]);
                const teamsData = await teamsRes.json();
                const playersData = await playersRes.json();
                setTeams(teamsData.teams || []);
                setPlayers(playersData.players || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Update preview when teams are selected
    useEffect(() => {
        const team1 = teams.find(t => t.team_id === selectedTeam1) || null;
        const team2 = teams.find(t => t.team_id === selectedTeam2) || null;

        // Find captains (players with 'captain' in role or first player of team)
        const captain1 = players.find(p => p.team_id === selectedTeam1) || null;
        const captain2 = players.find(p => p.team_id === selectedTeam2) || null;

        setPreviewData({ team1, team2, captain1, captain2 });
    }, [selectedTeam1, selectedTeam2, teams, players]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-center mb-2">ICC Championship Match Preview</h1>
                <p className="text-gray-400 text-center">Generate match preview images</p>
            </div>

            {/* Team Selection */}
            <div className="max-w-6xl mx-auto mb-8 grid grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-medium mb-2">Select Team 1</label>
                    <select
                        value={selectedTeam1 || ''}
                        onChange={(e) => setSelectedTeam1(Number(e.target.value) || null)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                        <option value="">-- Select Team --</option>
                        {teams.map(team => (
                            <option key={team.team_id} value={team.team_id}>
                                {team.name} ({team.short_name})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Select Team 2</label>
                    <select
                        value={selectedTeam2 || ''}
                        onChange={(e) => setSelectedTeam2(Number(e.target.value) || null)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                    >
                        <option value="">-- Select Team --</option>
                        {teams.filter(t => t.team_id !== selectedTeam1).map(team => (
                            <option key={team.team_id} value={team.team_id}>
                                {team.name} ({team.short_name})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Match Preview Card */}
            <div className="max-w-4xl mx-auto">
                <div
                    id="match-preview-card"
                    className="relative w-full aspect-video rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                    }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
                        }}></div>
                    </div>

                    {/* ICC Championship Header */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-2 rounded-full">
                            <span className="text-black font-bold text-sm tracking-wider">ICC CHAMPIONSHIP</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-12">
                        {/* Team 1 */}
                        <div className="flex flex-col items-center space-y-4">
                            {/* Team Logo */}
                            <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/20">
                                {previewData.team1?.image_url ? (
                                    <img
                                        src={previewData.team1.image_url}
                                        alt={previewData.team1.name}
                                        className="w-24 h-24 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
                                        }}
                                    />
                                ) : (
                                    <div className="text-4xl font-bold text-white/50">?</div>
                                )}
                            </div>
                            {/* Team Name */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white">
                                    {previewData.team1?.short_name || 'TEAM 1'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {previewData.team1?.name || 'Select a team'}
                                </p>
                            </div>
                            {/* Captain */}
                            {previewData.captain1 && (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500">
                                        <img
                                            src={previewData.captain1.face_image_url}
                                            alt={previewData.captain1.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1">{previewData.captain1.name}</span>
                                </div>
                            )}
                        </div>

                        {/* VS Center */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500 rounded-full blur-xl opacity-50"></div>
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-red-600 to-blue-600 flex items-center justify-center">
                                    <span className="text-4xl font-black text-white">VS</span>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-gray-400 text-sm">T20 WORLD CUP 2025</p>
                            </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex flex-col items-center space-y-4">
                            {/* Team Logo */}
                            <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/20">
                                {previewData.team2?.image_url ? (
                                    <img
                                        src={previewData.team2.image_url}
                                        alt={previewData.team2.name}
                                        className="w-24 h-24 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
                                        }}
                                    />
                                ) : (
                                    <div className="text-4xl font-bold text-white/50">?</div>
                                )}
                            </div>
                            {/* Team Name */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white">
                                    {previewData.team2?.short_name || 'TEAM 2'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {previewData.team2?.name || 'Select a team'}
                                </p>
                            </div>
                            {/* Captain */}
                            {previewData.captain2 && (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500">
                                        <img
                                            src={previewData.captain2.face_image_url}
                                            alt={previewData.captain2.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1">{previewData.captain2.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-3 px-6">
                        <div className="flex justify-between items-center text-sm text-gray-300">
                            <span>Live on Star Sports</span>
                            <span>Match starts at 7:30 PM IST</span>
                        </div>
                    </div>
                </div>

                {/* Download Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            // TODO: Implement image download using html2canvas
                            alert('Download feature coming soon! For now, take a screenshot.');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all"
                    >
                        Download Image
                    </button>
                </div>
            </div>

            {/* Available Teams List */}
            <div className="max-w-6xl mx-auto mt-12">
                <h2 className="text-xl font-bold mb-4">Available Teams</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {teams.map(team => (
                        <div key={team.team_id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                            {team.image_url ? (
                                <img
                                    src={team.image_url}
                                    alt={team.name}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold">{team.short_name?.charAt(0)}</span>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold">{team.short_name}</p>
                                <p className="text-xs text-gray-400">{team.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
