'use client';

import { useEffect, useRef, useState } from 'react';
import {
    TossTemplate,
    PowerplayTemplate,
    InningsEndTemplate,
    TargetTemplate,
    MatchResultTemplate,
    PlayingXITemplate,
    MilestoneTemplate
} from '../components/templates';

type TemplateType = 'toss' | 'powerplay' | 'innings_end' | 'target' | 'match_result' | 'playing_xi' | 'milestone';

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

export default function TemplatesPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('toss');
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedTeam1, setSelectedTeam1] = useState<number | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const posterRef = useRef<HTMLDivElement>(null);

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

                // Auto-select first two teams
                if (teamsData.teams?.length >= 2) {
                    setSelectedTeam1(teamsData.teams[0].team_id);
                    setSelectedTeam2(teamsData.teams[1].team_id);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const team1 = teams.find(t => t.team_id === selectedTeam1);
    const team2 = teams.find(t => t.team_id === selectedTeam2);
    const team1Players = players.filter(p => p.team_id === selectedTeam1);
    const team2Players = players.filter(p => p.team_id === selectedTeam2);
    const samplePlayer = team1Players[0] || players[0];

    const downloadPoster = async () => {
        if (!posterRef.current) return;
        try {
            const domtoimage = (await import('dom-to-image')).default;

            const container = document.createElement('div');
            Object.assign(container.style, {
                position: 'fixed',
                left: '-9999px',
                top: '0',
                width: '1080px',
                height: '1350px',
                overflow: 'hidden',
                zIndex: '-1'
            });
            document.body.appendChild(container);

            const clone = posterRef.current.cloneNode(true) as HTMLDivElement;
            Object.assign(clone.style, {
                transform: 'none',
                position: 'relative',
                left: '0',
                top: '0',
                width: '1080px',
                height: '1350px'
            });
            container.appendChild(clone);

            const images = Array.from(clone.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await domtoimage.toPng(clone, {
                width: 1080,
                height: 1350
            });

            document.body.removeChild(container);

            const link = document.createElement('a');
            link.download = `${selectedTemplate}-poster.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
        }
    };

    const templates: { key: TemplateType; label: string }[] = [
        { key: 'toss', label: 'Toss Update' },
        { key: 'powerplay', label: 'Powerplay' },
        { key: 'innings_end', label: 'Innings End' },
        { key: 'target', label: 'Target Set' },
        { key: 'match_result', label: 'Match Result' },
        { key: 'playing_xi', label: 'Playing XI' },
        { key: 'milestone', label: 'Player Milestone' }
    ];

    const renderTemplate = () => {
        const team1Logo = team1?.image_url;
        const team2Logo = team2?.image_url;
        // Use player image as background if available
        const playerBg = samplePlayer?.face_image_url;

        switch (selectedTemplate) {
            case 'toss':
                return (
                    <TossTemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        tossWinner={team1?.short_name || 'TEAM 1'}
                        tossDecision="bat"
                    />
                );
            case 'powerplay':
                return (
                    <PowerplayTemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        battingTeam={team1?.short_name || 'TEAM 1'}
                        score={52}
                        wickets={1}
                        overs={6}
                    />
                );
            case 'innings_end':
                return (
                    <InningsEndTemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        battingTeam={team1?.short_name || 'TEAM 1'}
                        score={182}
                        wickets={5}
                        overs={20}
                        inningsNumber={1}
                        topBatsmen={team1Players.slice(0, 2).map(p => ({
                            name: p.name,
                            runs: Math.floor(Math.random() * 60) + 20,
                            balls: Math.floor(Math.random() * 40) + 15
                        }))}
                        topBowlers={team2Players.slice(0, 2).map(p => ({
                            name: p.name,
                            wickets: Math.floor(Math.random() * 3) + 1,
                            runsGiven: Math.floor(Math.random() * 30) + 20
                        }))}
                    />
                );
            case 'target':
                return (
                    <TargetTemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        chasingTeam={team2?.short_name || 'TEAM 2'}
                        target={183}
                    />
                );
            case 'match_result':
                return (
                    <MatchResultTemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        winningTeam={team1?.short_name || 'TEAM 1'}
                        resultText="WON BY 45 RUNS"
                    />
                );
            case 'playing_xi':
                return (
                    <PlayingXITemplate
                        backgroundImage={playerBg}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        teamName={team1?.short_name || 'TEAM 1'}
                        opponent={team2?.short_name || 'TEAM 2'}
                        players={team1Players.slice(0, 11).map((p, i) => ({
                            name: p.name,
                            isCaptain: i === 0,
                            isWicketkeeper: i === 3
                        }))}
                    />
                );
            case 'milestone':
                return (
                    <MilestoneTemplate
                        backgroundImage={playerBg}
                        playerImage={samplePlayer?.face_image_url}
                        team1Logo={team1Logo}
                        team2Logo={team2Logo}
                        playerName={samplePlayer?.name || 'PLAYER NAME'}
                        teamName={team1?.short_name || 'TEAM'}
                        milestone={50}
                        runs={52}
                        balls={35}
                        fours={6}
                        sixes={2}
                        strikeRate="148.57"
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Milestone Template Preview</h1>

            {/* Team Selection */}
            <div className="max-w-4xl mx-auto mb-6 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Team 1</label>
                    <select
                        value={selectedTeam1 || ''}
                        onChange={(e) => setSelectedTeam1(Number(e.target.value) || null)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
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
                    <label className="block text-sm font-medium mb-2">Team 2</label>
                    <select
                        value={selectedTeam2 || ''}
                        onChange={(e) => setSelectedTeam2(Number(e.target.value) || null)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
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

            {/* Template Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {templates.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setSelectedTemplate(t.key)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            selectedTemplate === t.key
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Preview */}
            <div className="flex justify-center">
                <div className="relative" style={{ width: '432px', height: '540px' }}>
                    <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left' }}>
                        <div ref={posterRef}>
                            {renderTemplate()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={downloadPoster}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all text-lg"
                >
                    Download Poster (1080x1350)
                </button>
            </div>

            {/* Info */}
            <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">How it works:</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>1. Select teams from the database</li>
                    <li>2. Player images and team logos are fetched from API</li>
                    <li>3. Choose a template type (Toss, Powerplay, etc.)</li>
                    <li>4. Download the generated image</li>
                    <li>5. When milestones are detected, images are auto-generated</li>
                </ul>
            </div>
        </div>
    );
}
