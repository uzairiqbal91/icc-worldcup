'use client';

import { useEffect, useRef, useState } from 'react';
import {
    TossTemplate,
    PowerplayTemplate,
    InningsEndTemplate,
    TargetTemplate,
    MatchResultTemplate,
    PlayingXITemplate,
    MilestoneTemplate,
    FallOfWicketTemplate
} from '../components/templates';

type TemplateType = 'toss' | 'powerplay' | 'innings_end' | 'target' | 'match_result' | 'playing_xi' | 'milestone' | 'fall_of_wicket';

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

// Form field state for each template
interface TossForm { tossWinner: string; tossDecision: string; }
interface PowerplayForm { battingTeam: string; score: number; wickets: number; overs: number; }
interface InningsEndForm {
    battingTeam: string; score: number; wickets: number; overs: number; inningsNumber: number;
    batsman1Name: string; batsman1Runs: number; batsman1Balls: number;
    batsman2Name: string; batsman2Runs: number; batsman2Balls: number;
    bowler1Name: string; bowler1Wickets: number; bowler1Runs: number;
    bowler2Name: string; bowler2Wickets: number; bowler2Runs: number;
}
interface TargetForm { chasingTeam: string; target: number; }
interface MatchResultForm { winningTeam: string; resultText: string; }
interface PlayingXIForm { teamName: string; opponent: string; players: string; }
interface MilestoneForm { playerFirstName: string; playerLastName: string; milestone: number; }
interface FallOfWicketForm { battingTeam: string; score: number; wickets: number; overs: number; }

const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1';

export default function TemplatesPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('toss');
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedTeam1, setSelectedTeam1] = useState<number | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const posterRef = useRef<HTMLDivElement>(null);

    // Form states for each template — pre-filled with sample data
    const [tossForm, setTossForm] = useState<TossForm>({ tossWinner: 'INDIA', tossDecision: 'bat' });
    const [powerplayForm, setPowerplayForm] = useState<PowerplayForm>({ battingTeam: 'INDIA', score: 58, wickets: 1, overs: 6 });
    const [inningsEndForm, setInningsEndForm] = useState<InningsEndForm>({
        battingTeam: 'INDIA', score: 213, wickets: 4, overs: 20, inningsNumber: 1,
        batsman1Name: 'Suryakumar Yadav', batsman1Runs: 82, batsman1Balls: 53,
        batsman2Name: 'Rohit Sharma', batsman2Runs: 64, batsman2Balls: 41,
        bowler1Name: 'Trent Boult', bowler1Wickets: 2, bowler1Runs: 38,
        bowler2Name: 'Tim Southee', bowler2Wickets: 1, bowler2Runs: 42,
    });
    const [targetForm, setTargetForm] = useState<TargetForm>({ chasingTeam: 'NEW ZEALAND', target: 214 });
    const [matchResultForm, setMatchResultForm] = useState<MatchResultForm>({ winningTeam: 'INDIA', resultText: 'won by 65 runs' });
    const [playingXIForm, setPlayingXIForm] = useState<PlayingXIForm>({
        teamName: 'INDIA', opponent: 'NEW ZEALAND',
        players: 'Rohit Sharma (C)\nVirat Kohli\nSuryakumar Yadav\nShreyas Iyer\nRishabh Pant (WK)\nHardik Pandya\nRavindra Jadeja\nAxar Patel\nKuldeep Yadav\nJasprit Bumrah\nMohammed Siraj'
    });
    const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>({ playerFirstName: 'Suryakumar', playerLastName: 'Yadav', milestone: 100 });
    const [fallOfWicketForm, setFallOfWicketForm] = useState<FallOfWicketForm>({ battingTeam: 'NEW ZEALAND', score: 42, wickets: 3, overs: 7.2 });

    // Custom image URLs — pre-filled with local assets
    const [team1LogoUrl, setTeam1LogoUrl] = useState('/assets/india-logo.png');
    const [team2LogoUrl, setTeam2LogoUrl] = useState('/assets/nz-logo.png');
    const [playerImageUrl, setPlayerImageUrl] = useState('/assets/india-captain-transparent.png');

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

    // When team dropdown changes, update logo only if user hasn't set a custom URL
    // API URLs often don't load directly in <img> (CORS / auth), so prefer local assets
    useEffect(() => {
        const t1 = teams.find(t => t.team_id === selectedTeam1);
        const t2 = teams.find(t => t.team_id === selectedTeam2);
        // Only update if the field is currently empty
        if (!team1LogoUrl && t1?.image_url) setTeam1LogoUrl(t1.image_url);
        if (!team2LogoUrl && t2?.image_url) setTeam2LogoUrl(t2.image_url);
    }, [teams, selectedTeam1, selectedTeam2, team1LogoUrl, team2LogoUrl]);

    const team1 = teams.find(t => t.team_id === selectedTeam1);
    const team2 = teams.find(t => t.team_id === selectedTeam2);

    const resolvedTeam1Logo = team1LogoUrl || team1?.image_url;
    const resolvedTeam2Logo = team2LogoUrl || team2?.image_url;

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
        { key: 'powerplay', label: 'Powerplay End' },
        { key: 'innings_end', label: '1st Innings End' },
        { key: 'target', label: 'Target' },
        { key: 'match_result', label: 'Match End' },
        { key: 'playing_xi', label: 'Playing XI' },
        { key: 'milestone', label: '50/100 Milestone' },
        { key: 'fall_of_wicket', label: 'Fall of Wicket' }
    ];

    // Parse playing XI text into player objects
    const parsePlayingXI = (text: string) => {
        return text.split('\n').filter(line => line.trim()).map(line => {
            const isCaptain = line.includes('(C)') && !line.includes('(WK)');
            const isWicketkeeper = line.includes('(WK)') && !line.includes('(C)');
            const isBoth = line.includes('(C') && line.includes('WK)');
            const name = line.replace(/\s*\(C\s*&?\s*WK\)\s*/g, '').replace(/\s*\(C\)\s*/g, '').replace(/\s*\(WK\)\s*/g, '').trim();
            return { name, isCaptain: isCaptain || isBoth, isWicketkeeper: isWicketkeeper || isBoth };
        });
    };

    const renderTemplate = () => {
        switch (selectedTemplate) {
            case 'toss':
                return (
                    <TossTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        tossWinner={tossForm.tossWinner}
                        tossDecision={tossForm.tossDecision}
                    />
                );
            case 'powerplay':
                return (
                    <PowerplayTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        battingTeam={powerplayForm.battingTeam}
                        score={powerplayForm.score}
                        wickets={powerplayForm.wickets}
                        overs={powerplayForm.overs}
                    />
                );
            case 'innings_end':
                return (
                    <InningsEndTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        battingTeam={inningsEndForm.battingTeam}
                        score={inningsEndForm.score}
                        wickets={inningsEndForm.wickets}
                        overs={inningsEndForm.overs}
                        inningsNumber={inningsEndForm.inningsNumber}
                        topBatsmen={[
                            { name: inningsEndForm.batsman1Name, runs: inningsEndForm.batsman1Runs, balls: inningsEndForm.batsman1Balls },
                            { name: inningsEndForm.batsman2Name, runs: inningsEndForm.batsman2Runs, balls: inningsEndForm.batsman2Balls },
                        ]}
                        topBowlers={[
                            { name: inningsEndForm.bowler1Name, wickets: inningsEndForm.bowler1Wickets, runsGiven: inningsEndForm.bowler1Runs },
                            { name: inningsEndForm.bowler2Name, wickets: inningsEndForm.bowler2Wickets, runsGiven: inningsEndForm.bowler2Runs },
                        ]}
                    />
                );
            case 'target':
                return (
                    <TargetTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        chasingTeam={targetForm.chasingTeam}
                        target={targetForm.target}
                    />
                );
            case 'match_result':
                return (
                    <MatchResultTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        winningTeam={matchResultForm.winningTeam}
                        resultText={matchResultForm.resultText}
                    />
                );
            case 'playing_xi':
                return (
                    <PlayingXITemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        teamName={playingXIForm.teamName}
                        opponent={playingXIForm.opponent}
                        players={parsePlayingXI(playingXIForm.players)}
                    />
                );
            case 'milestone':
                return (
                    <MilestoneTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        playerFirstName={milestoneForm.playerFirstName}
                        playerLastName={milestoneForm.playerLastName}
                        milestone={milestoneForm.milestone}
                    />
                );
            case 'fall_of_wicket':
                return (
                    <FallOfWicketTemplate
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        playerImage={playerImageUrl}
                        battingTeam={fallOfWicketForm.battingTeam}
                        score={fallOfWicketForm.score}
                        wickets={fallOfWicketForm.wickets}
                        overs={fallOfWicketForm.overs}
                    />
                );
            default:
                return null;
        }
    };

    const renderFormFields = () => {
        switch (selectedTemplate) {
            case 'toss':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Toss Winner</label>
                            <input className={inputClass} value={tossForm.tossWinner} onChange={e => setTossForm(f => ({ ...f, tossWinner: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Decision</label>
                            <div className="flex gap-2">
                                {['bat', 'bowl'].map(d => (
                                    <button key={d} onClick={() => setTossForm(f => ({ ...f, tossDecision: d }))}
                                        className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${tossForm.tossDecision === d ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                );
            case 'powerplay':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Batting Team</label>
                            <input className={inputClass} value={powerplayForm.battingTeam} onChange={e => setPowerplayForm(f => ({ ...f, battingTeam: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className={labelClass}>Score</label>
                                <input type="number" className={inputClass} value={powerplayForm.score} onChange={e => setPowerplayForm(f => ({ ...f, score: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Wickets</label>
                                <input type="number" min={0} max={10} className={inputClass} value={powerplayForm.wickets} onChange={e => setPowerplayForm(f => ({ ...f, wickets: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Overs</label>
                                <input type="number" step={0.1} className={inputClass} value={powerplayForm.overs} onChange={e => setPowerplayForm(f => ({ ...f, overs: Number(e.target.value) }))} />
                            </div>
                        </div>
                    </>
                );
            case 'innings_end':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Batting Team</label>
                            <input className={inputClass} value={inningsEndForm.battingTeam} onChange={e => setInningsEndForm(f => ({ ...f, battingTeam: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Innings #</label>
                                <div className="flex gap-2">
                                    {[1, 2].map(n => (
                                        <button key={n} onClick={() => setInningsEndForm(f => ({ ...f, inningsNumber: n }))}
                                            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${inningsEndForm.inningsNumber === n ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                            {n === 1 ? '1st' : '2nd'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Score</label>
                                <input type="number" className={inputClass} value={inningsEndForm.score} onChange={e => setInningsEndForm(f => ({ ...f, score: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Wickets</label>
                                <input type="number" min={0} max={10} className={inputClass} value={inningsEndForm.wickets} onChange={e => setInningsEndForm(f => ({ ...f, wickets: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Overs</label>
                                <input type="number" step={0.1} className={inputClass} value={inningsEndForm.overs} onChange={e => setInningsEndForm(f => ({ ...f, overs: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="border-t border-gray-600 pt-2 mt-1">
                            <p className="text-xs text-gray-500 mb-2">Top Batsmen</p>
                            {[1, 2].map(i => {
                                const key = i as 1 | 2;
                                return (
                                    <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                                        <div>
                                            <label className={labelClass}>Name</label>
                                            <input className={inputClass} value={inningsEndForm[`batsman${key}Name`]} onChange={e => setInningsEndForm(f => ({ ...f, [`batsman${key}Name`]: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Runs</label>
                                            <input type="number" className={inputClass} value={inningsEndForm[`batsman${key}Runs`]} onChange={e => setInningsEndForm(f => ({ ...f, [`batsman${key}Runs`]: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Balls</label>
                                            <input type="number" className={inputClass} value={inningsEndForm[`batsman${key}Balls`]} onChange={e => setInningsEndForm(f => ({ ...f, [`batsman${key}Balls`]: Number(e.target.value) }))} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-600 pt-2 mt-1">
                            <p className="text-xs text-gray-500 mb-2">Top Bowlers</p>
                            {[1, 2].map(i => {
                                const key = i as 1 | 2;
                                return (
                                    <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                                        <div>
                                            <label className={labelClass}>Name</label>
                                            <input className={inputClass} value={inningsEndForm[`bowler${key}Name`]} onChange={e => setInningsEndForm(f => ({ ...f, [`bowler${key}Name`]: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Wkts</label>
                                            <input type="number" className={inputClass} value={inningsEndForm[`bowler${key}Wickets`]} onChange={e => setInningsEndForm(f => ({ ...f, [`bowler${key}Wickets`]: Number(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Runs</label>
                                            <input type="number" className={inputClass} value={inningsEndForm[`bowler${key}Runs`]} onChange={e => setInningsEndForm(f => ({ ...f, [`bowler${key}Runs`]: Number(e.target.value) }))} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                );
            case 'target':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Chasing Team</label>
                            <input className={inputClass} value={targetForm.chasingTeam} onChange={e => setTargetForm(f => ({ ...f, chasingTeam: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Target</label>
                            <input type="number" className={inputClass} value={targetForm.target} onChange={e => setTargetForm(f => ({ ...f, target: Number(e.target.value) }))} />
                        </div>
                    </>
                );
            case 'match_result':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Winning Team</label>
                            <input className={inputClass} value={matchResultForm.winningTeam} onChange={e => setMatchResultForm(f => ({ ...f, winningTeam: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Result Text</label>
                            <input className={inputClass} value={matchResultForm.resultText} onChange={e => setMatchResultForm(f => ({ ...f, resultText: e.target.value }))} placeholder="e.g. won by 106 runs" />
                        </div>
                    </>
                );
            case 'playing_xi':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Team Name</label>
                                <input className={inputClass} value={playingXIForm.teamName} onChange={e => setPlayingXIForm(f => ({ ...f, teamName: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Opponent</label>
                                <input className={inputClass} value={playingXIForm.opponent} onChange={e => setPlayingXIForm(f => ({ ...f, opponent: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Players (one per line, add (C) or (WK) for roles)</label>
                            <textarea className={inputClass + ' h-48 resize-none font-mono'} value={playingXIForm.players}
                                onChange={e => setPlayingXIForm(f => ({ ...f, players: e.target.value }))}
                                placeholder={'Rohit Sharma (C)\nVirat Kohli\nSuryakumar Yadav\nRishabh Pant (WK)'} />
                        </div>
                    </>
                );
            case 'milestone':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>First Name</label>
                                <input className={inputClass} value={milestoneForm.playerFirstName} onChange={e => setMilestoneForm(f => ({ ...f, playerFirstName: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Last Name</label>
                                <input className={inputClass} value={milestoneForm.playerLastName} onChange={e => setMilestoneForm(f => ({ ...f, playerLastName: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Milestone</label>
                            <div className="flex gap-2">
                                {[50, 100].map(m => (
                                    <button key={m} onClick={() => setMilestoneForm(f => ({ ...f, milestone: m }))}
                                        className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${milestoneForm.milestone === m ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                );
            case 'fall_of_wicket':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Batting Team</label>
                            <input className={inputClass} value={fallOfWicketForm.battingTeam} onChange={e => setFallOfWicketForm(f => ({ ...f, battingTeam: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className={labelClass}>Score</label>
                                <input type="number" className={inputClass} value={fallOfWicketForm.score} onChange={e => setFallOfWicketForm(f => ({ ...f, score: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Wickets</label>
                                <input type="number" min={0} max={10} className={inputClass} value={fallOfWicketForm.wickets} onChange={e => setFallOfWicketForm(f => ({ ...f, wickets: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelClass}>Overs</label>
                                <input type="number" step={0.1} className={inputClass} value={fallOfWicketForm.overs} onChange={e => setFallOfWicketForm(f => ({ ...f, overs: Number(e.target.value) }))} />
                            </div>
                        </div>
                    </>
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
            <h1 className="text-3xl font-bold text-center mb-6">ICC Cricket Social Media Templates</h1>

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

            {/* Main Content: Form + Preview side by side */}
            <div className="max-w-6xl mx-auto flex gap-6 items-start">
                {/* Form Panel */}
                <div className="w-80 flex-shrink-0 bg-gray-800 rounded-lg p-4 space-y-3">
                    <h3 className="font-bold text-sm text-green-400 uppercase tracking-wide mb-3">Dynamic Data</h3>

                    {/* Custom Logo URLs with preview */}
                    <div className="border-b border-gray-600 pb-3 mb-3">
                        <p className="text-xs text-gray-500 mb-2">Team Logo Images</p>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>Team 1 Logo URL</label>
                                <input className={inputClass} value={team1LogoUrl} onChange={e => setTeam1LogoUrl(e.target.value)} placeholder="/assets/india-logo.png" />
                                {team1LogoUrl && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                            <img src={team1LogoUrl} alt="Team 1" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                        <span className="text-xs text-gray-500 truncate flex-1">{team1LogoUrl.split('/').pop()}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Team 2 Logo URL</label>
                                <input className={inputClass} value={team2LogoUrl} onChange={e => setTeam2LogoUrl(e.target.value)} placeholder="/assets/nz-logo.png" />
                                {team2LogoUrl && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                            <img src={team2LogoUrl} alt="Team 2" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                        <span className="text-xs text-gray-500 truncate flex-1">{team2LogoUrl.split('/').pop()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {['toss', 'playing_xi', 'milestone'].includes(selectedTemplate) && (
                            <p className="text-xs text-yellow-500 mt-2">This template does not show team logos in the design.</p>
                        )}
                    </div>

                    {/* Player / Main Image */}
                    <div className="border-b border-gray-600 pb-3 mb-3">
                        <p className="text-xs text-gray-500 mb-2">Player / Main Image</p>
                        <div>
                            <label className={labelClass}>Player Image URL</label>
                            <input className={inputClass} value={playerImageUrl} onChange={e => setPlayerImageUrl(e.target.value)} placeholder="/assets/india-captain-transparent.png" />
                            {playerImageUrl && (
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="w-16 h-20 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                        <img src={playerImageUrl} alt="Player" className="w-full h-full object-contain object-bottom" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </div>
                                    <span className="text-xs text-gray-500 truncate flex-1">{playerImageUrl.split('/').pop()}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Available: india-captain-transparent.png, nz-captain-transparent.png, team1-captain.png, team2-captain.png</p>
                    </div>

                    {/* Template-specific fields */}
                    {renderFormFields()}
                </div>

                {/* Preview + Download */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="relative" style={{ width: '432px', height: '540px' }}>
                        <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left' }}>
                            <div ref={posterRef}>
                                {renderTemplate()}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={downloadPoster}
                        className="mt-6 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all text-lg"
                    >
                        Download Poster (1080x1350)
                    </button>
                </div>
            </div>
        </div>
    );
}
