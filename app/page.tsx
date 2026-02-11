'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    TossTemplate,
    PowerplayTemplate,
    InningsEndTemplate,
    TargetTemplate,
    MatchResultTemplate,
    PlayingXITemplate,
    MilestoneTemplate,
    FallOfWicketTemplate
} from './components/templates';
import Toast from './components/Toast';
import LoginPage from './components/LoginPage';
import LiveMatches from './components/LiveMatches';
import { useAuth } from './context/AuthContext';

// Match types for live data
interface LiveMatch {
    matchId: number;
    seriesId: number;
    seriesName: string;
    matchDesc: string;
    matchFormat: string;
    state: string;
    status: string;
    category: 'live' | 'completed' | 'upcoming';
    team1: { id: number; name: string; shortName: string; imageUrl: string | null };
    team2: { id: number; name: string; shortName: string; imageUrl: string | null };
    venue: string;
    city: string;
    isLive: boolean;
    isCompleted: boolean;
}

interface MatchDetails {
    matchId: string;
    state: string;
    status: string;
    team1: {
        id: number;
        name: string;
        shortName: string;
        imageUrl: string | null;
        players: Array<{ id: number; name: string; fullName: string; isCaptain: boolean; isKeeper: boolean; }>;
    };
    team2: {
        id: number;
        name: string;
        shortName: string;
        imageUrl: string | null;
        players: Array<{ id: number; name: string; fullName: string; isCaptain: boolean; isKeeper: boolean; }>;
    };
    toss: { winner: string; decision: string } | null;
    innings: Array<{
        battingTeam: string;
        battingTeamShort: string;
        score: number;
        wickets: number;
        overs: number;
        target: number | null;
        // Powerplay specific data
        powerplayScore: number | null;
        powerplayWickets: number | null;
        powerplayOvers: number | null;
        isComplete: boolean;
        isPowerplayComplete: boolean;
        batsmen: Array<{ name: string; runs: number; balls: number }>;
        bowlers: Array<{ name: string; wickets: number; runs: number }>;
    }>;
    currentInnings: any;
    events: string[];
    result: string | null;
}

type TemplateType = 'toss' | 'powerplay' | 'innings_end' | 'target' | 'match_result' | 'playing_xi' | 'milestone' | 'fall_of_wicket';

// Preview component with drag functionality
interface PreviewWithDragProps {
    posterRef: React.RefObject<HTMLDivElement | null>;
    renderTemplate: () => React.ReactNode;
    hasImage: boolean;
    imageOffset: { x: number; y: number };
    onImageOffsetChange: (x: number, y: number) => void;
}

function PreviewWithDrag({ posterRef, renderTemplate, hasImage, imageOffset, onImageOffsetChange }: PreviewWithDragProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialOffsetRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!hasImage) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialOffsetRef.current = { x: imageOffset.x, y: imageOffset.y };
    }, [hasImage, imageOffset]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!hasImage) return;
        const touch = e.touches[0];
        setIsDragging(true);
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        initialOffsetRef.current = { x: imageOffset.x, y: imageOffset.y };
    }, [hasImage, imageOffset]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;
            // Scale factor: preview is 0.4x, so multiply by 2.5 to get actual movement
            const scale = 2.5;
            onImageOffsetChange(
                initialOffsetRef.current.x + (deltaX * scale),
                initialOffsetRef.current.y + (deltaY * scale)
            );
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            const deltaX = touch.clientX - dragStartRef.current.x;
            const deltaY = touch.clientY - dragStartRef.current.y;
            const scale = 2.5;
            onImageOffsetChange(
                initialOffsetRef.current.x + (deltaX * scale),
                initialOffsetRef.current.y + (deltaY * scale)
            );
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, onImageOffsetChange]);

    return (
        <div
            className="relative"
            style={{
                width: '432px',
                height: '540px',
                cursor: hasImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                <div ref={posterRef}>
                    {renderTemplate()}
                </div>
            </div>
            {/* Drag overlay indicator */}
            {hasImage && (
                <div
                    className={`absolute inset-0 rounded-lg transition-all duration-200 ${isDragging ? 'border-4 border-green-500 bg-green-500/10' : 'border-2 border-transparent hover:border-green-400/50'}`}
                    style={{ pointerEvents: 'none' }}
                />
            )}
            {/* Drag hint */}
            {hasImage && !isDragging && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                    Drag to reposition image
                </div>
            )}
        </div>
    );
}

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

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export default function TemplatesPage() {
    const { isAuthenticated, logout } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('toss');
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedTeam1, setSelectedTeam1] = useState<number | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const posterRef = useRef<HTMLDivElement>(null);

    // Live match states
    const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
    const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
    const [loadingMatch, setLoadingMatch] = useState(false);
    const [detectedEvents, setDetectedEvents] = useState<string[]>([]);

    // Form states for each template — pre-filled with sample data
    const [tossForm, setTossForm] = useState<TossForm>({ tossWinner: '', tossDecision: 'bat' });
    const [powerplayForm, setPowerplayForm] = useState<PowerplayForm>({ battingTeam: '', score: 58, wickets: 1, overs: 6 });
    const [inningsEndForm, setInningsEndForm] = useState<InningsEndForm>({
        battingTeam: '', score: 213, wickets: 4, overs: 20, inningsNumber: 1,
        batsman1Name: 'Suryakumar Yadav', batsman1Runs: 82, batsman1Balls: 53,
        batsman2Name: 'Rohit Sharma', batsman2Runs: 64, batsman2Balls: 41,
        bowler1Name: 'Trent Boult', bowler1Wickets: 2, bowler1Runs: 38,
        bowler2Name: 'Tim Southee', bowler2Wickets: 1, bowler2Runs: 42,
    });
    const [targetForm, setTargetForm] = useState<TargetForm>({ chasingTeam: '', target: 214 });
    const [matchResultForm, setMatchResultForm] = useState<MatchResultForm>({ winningTeam: '', resultText: 'won by 65 runs' });
    const [playingXIForm, setPlayingXIForm] = useState<PlayingXIForm>({
        teamName: '', opponent: '',
        players: ''
    });
    const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>({ playerFirstName: 'Suryakumar', playerLastName: 'Yadav', milestone: 100 });
    const [fallOfWicketForm, setFallOfWicketForm] = useState<FallOfWicketForm>({ battingTeam: '', score: 42, wickets: 3, overs: 7.2 });

    const [team1LogoUrl, setTeam1LogoUrl] = useState('');
    const [team2LogoUrl, setTeam2LogoUrl] = useState('');

    const [tossLayerImage, setTossLayerImage] = useState('');
    const [powerplayLayerImage, setPowerplayLayerImage] = useState('');
    const [inningsEndLayerImage, setInningsEndLayerImage] = useState('');
    const [targetLayerImage, setTargetLayerImage] = useState('');
    const [matchResultLayerImage, setMatchResultLayerImage] = useState('');
    const [playingXILayerImage, setPlayingXILayerImage] = useState('');
    const [milestoneLayerImage, setMilestoneLayerImage] = useState('');
    const [fallOfWicketLayerImage, setFallOfWicketLayerImage] = useState('');

    // Image position offsets for drag and drop repositioning
    const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const [savedImages, setSavedImages] = useState<any[]>([]);
    const [loadingSavedImages, setLoadingSavedImages] = useState(false);
    const [savingImage, setSavingImage] = useState(false);

    const [savedTeam1Logos, setSavedTeam1Logos] = useState<any[]>([]);
    const [savedTeam2Logos, setSavedTeam2Logos] = useState<any[]>([]);
    const [savedMilestoneLogos, setSavedMilestoneLogos] = useState<any[]>([]);

    const [templateFileKey, setTemplateFileKey] = useState(0);
    const [team1LogoFileKey, setTeam1LogoFileKey] = useState(0);
    const [team2LogoFileKey, setTeam2LogoFileKey] = useState(0);
    const [milestoneLogoFileKey, setMilestoneLogoFileKey] = useState(0);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; message: string; onConfirm: () => void } | null>(null);

    const [isTemplateFromGallery, setIsTemplateFromGallery] = useState(false);
    const [isTeam1LogoFromGallery, setIsTeam1LogoFromGallery] = useState(false);
    const [isTeam2LogoFromGallery, setIsTeam2LogoFromGallery] = useState(false);

    const [team1Selection, setTeam1Selection] = useState<number | null>(null);
    const [team2Selection, setTeam2Selection] = useState<number | null>(null);

    const [milestoneTeamId, setMilestoneTeamId] = useState<number | null>(null);

    const [selectedMilestonePlayer, setSelectedMilestonePlayer] = useState<number | null>(null);
    const [selectedBatsman1, setSelectedBatsman1] = useState<number | null>(null);
    const [selectedBatsman2, setSelectedBatsman2] = useState<number | null>(null);
    const [selectedBowler1, setSelectedBowler1] = useState<number | null>(null);
    const [selectedBowler2, setSelectedBowler2] = useState<number | null>(null);
    const [bowlingTeam, setBowlingTeam] = useState('');

    // Store match batsmen and bowlers for dropdowns (from live API data)
    const [matchBatsmen, setMatchBatsmen] = useState<{ id: number; name: string; runs: number; balls: number }[]>([]);
    const [matchBowlers, setMatchBowlers] = useState<{ id: number; name: string; wickets: number; runs: number; overs: number }[]>([]);

    const [selectedPlayingXIPlayers, setSelectedPlayingXIPlayers] = useState<number[]>([]);

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

    useEffect(() => {
        const t1 = teams.find(t => t.team_id === selectedTeam1);
        const t2 = teams.find(t => t.team_id === selectedTeam2);
        if (!team1LogoUrl && t1?.image_url) setTeam1LogoUrl(t1.image_url);
        if (!team2LogoUrl && t2?.image_url) setTeam2LogoUrl(t2.image_url);
    }, [teams, selectedTeam1, selectedTeam2, team1LogoUrl, team2LogoUrl]);

    useEffect(() => {
        let teamId: number | null = null;
        let milestone: string | null = null;

        if (selectedTemplate === 'toss' && tossForm.tossWinner)
            teamId = teams.find(t => t.name.toUpperCase() === tossForm.tossWinner)?.team_id || null;
        else if (selectedTemplate === 'powerplay' && powerplayForm.battingTeam)
            teamId = teams.find(t => t.name.toUpperCase() === powerplayForm.battingTeam)?.team_id || null;
        else if (selectedTemplate === 'innings_end' && inningsEndForm.battingTeam)
            teamId = teams.find(t => t.name.toUpperCase() === inningsEndForm.battingTeam)?.team_id || null;
        else if (selectedTemplate === 'target' && targetForm.chasingTeam)
            teamId = teams.find(t => t.name.toUpperCase() === targetForm.chasingTeam)?.team_id || null;
        else if (selectedTemplate === 'match_result' && matchResultForm.winningTeam)
            teamId = teams.find(t => t.name.toUpperCase() === matchResultForm.winningTeam)?.team_id || null;
        else if (selectedTemplate === 'playing_xi' && playingXIForm.teamName)
            teamId = teams.find(t => t.name.toUpperCase() === playingXIForm.teamName)?.team_id || null;
        else if (selectedTemplate === 'milestone' && milestoneTeamId) {
            teamId = milestoneTeamId;
        }
        else if (selectedTemplate === 'fall_of_wicket' && fallOfWicketForm.battingTeam)
            teamId = teams.find(t => t.name.toUpperCase() === fallOfWicketForm.battingTeam)?.team_id || null;

        if (teamId) {
            const playerId = selectedTemplate === 'milestone' ? selectedMilestonePlayer || undefined : undefined;
            // For milestone template, pass the milestone value (50 or 100) to filter saved images
            const milestoneValue = selectedTemplate === 'milestone' ? milestoneForm.milestone.toString() : undefined;
            fetchSavedImages(teamId, 'template', milestoneValue, selectedTemplate, playerId);
        } else {
            setSavedImages([]);
        }
    }, [
        selectedTemplate,
        tossForm.tossWinner,
        powerplayForm.battingTeam,
        inningsEndForm.battingTeam,
        targetForm.chasingTeam,
        matchResultForm.winningTeam,
        playingXIForm.teamName,
        milestoneTeamId,
        milestoneForm.milestone,
        selectedMilestonePlayer,
        fallOfWicketForm.battingTeam,
        teams
    ]);


    useEffect(() => {
        setTossLayerImage('');
        setPowerplayLayerImage('');
        setInningsEndLayerImage('');
        setTargetLayerImage('');
        setMatchResultLayerImage('');
        setPlayingXILayerImage('');
        setMilestoneLayerImage('');
        setFallOfWicketLayerImage('');
        setTemplateFileKey(prev => prev + 1);
        setImageOffset({ x: 0, y: 0 }); // Reset image position when template changes
    }, [
        selectedTemplate
    ]);

    useEffect(() => {
        if (team1Selection) {
            fetchSavedLogos(team1Selection, setSavedTeam1Logos);
        } else {
            setSavedTeam1Logos([]);
        }
    }, [team1Selection]);

    useEffect(() => {
        if (team2Selection) {
            fetchSavedLogos(team2Selection, setSavedTeam2Logos);
        } else {
            setSavedTeam2Logos([]);
        }
    }, [team2Selection]);

    useEffect(() => {
        if (milestoneTeamId) {
            fetchSavedLogos(milestoneTeamId, setSavedMilestoneLogos);
        } else {
            setSavedMilestoneLogos([]);
        }
    }, [milestoneTeamId]);

    const fetchSavedLogos = async (teamId: number, setSavedLogos: (logos: any[]) => void) => {
        try {
            const params = new URLSearchParams();
            params.append('team_id', teamId.toString());
            params.append('image_type', 'logo');
            const res = await fetch(`/api/template-images?${params.toString()}`);
            const data = await res.json();
            setSavedLogos(data.images || []);
        } catch (error) {
            console.error('Error fetching saved logos:', error);
            setSavedLogos([]);
        }
    };

    // Helper to find team by name (case-insensitive)
    const findTeamByName = (teamName: string): Team | undefined => {
        const normalizedName = teamName?.toLowerCase().trim();
        return teams.find(t =>
            t.name.toLowerCase() === normalizedName ||
            t.short_name?.toLowerCase() === normalizedName
        );
    };

    // Fetch and auto-select saved image for a template
    const fetchAndAutoSelectImage = async (teamId: number, templateType: string, setImageFn: (url: string) => void) => {
        try {
            const params = new URLSearchParams();
            params.append('team_id', teamId.toString());
            params.append('image_type', 'template');
            params.append('template_type', templateType);
            const res = await fetch(`/api/template-images?${params.toString()}`);
            const data = await res.json();
            if (data.images && data.images.length > 0) {
                setImageFn(data.images[0].image_url);
                setIsTemplateFromGallery(true);
            }
        } catch (error) {
            console.error(`Error fetching saved image for ${templateType}:`, error);
        }
    };

    // Fetch and auto-select team logo
    const fetchAndAutoSelectLogo = async (teamId: number, setLogoFn: (url: string) => void, setGalleryFlag?: (flag: boolean) => void) => {
        try {
            const params = new URLSearchParams();
            params.append('team_id', teamId.toString());
            params.append('image_type', 'logo');
            const res = await fetch(`/api/template-images?${params.toString()}`);
            const data = await res.json();
            if (data.images && data.images.length > 0) {
                setLogoFn(data.images[0].image_url);
                if (setGalleryFlag) setGalleryFlag(true);
            }
        } catch (error) {
            console.error('Error fetching saved logo:', error);
        }
    };

    // Handle match selection from LiveMatches
    const handleSelectMatch = async (match: LiveMatch) => {
        setSelectedMatch(match);
        setLoadingMatch(true);

        try {
            // For UPCOMING matches - don't call API, just auto-fill team names
            if (match.category === 'upcoming') {
                setMatchDetails(null);
                setDetectedEvents([]);
                await autoFillForUpcomingMatch(match);
            } else {
                // For LIVE and COMPLETED matches - call API for full data
                const res = await fetch(`/api/match-details?matchId=${match.matchId}`);
                const data = await res.json();

                if (data.success) {
                    setMatchDetails(data);
                    setDetectedEvents(data.events || []);
                    await autoFillFromMatchData(data, match);
                }
            }
        } catch (error) {
            console.error('Error fetching match details:', error);
        } finally {
            setLoadingMatch(false);
        }
    };

    // Auto-fill for UPCOMING matches - only team names, no API call
    const autoFillForUpcomingMatch = async (match: LiveMatch) => {
        // Find teams in database
        const dbTeam1 = findTeamByName(match.team1.name) || findTeamByName(match.team1.shortName);
        const dbTeam2 = findTeamByName(match.team2.name) || findTeamByName(match.team2.shortName);

        // Use database team names for dropdowns (they need to match exactly)
        const team1Name = dbTeam1?.name?.toUpperCase() || match.team1.name?.toUpperCase() || '';
        const team2Name = dbTeam2?.name?.toUpperCase() || match.team2.name?.toUpperCase() || '';

        // Auto-select teams in dropdowns
        if (dbTeam1) {
            setSelectedTeam1(dbTeam1.team_id);
            setTeam1Selection(dbTeam1.team_id);
            await fetchAndAutoSelectLogo(dbTeam1.team_id, setTeam1LogoUrl, setIsTeam1LogoFromGallery);
        }
        if (dbTeam2) {
            setSelectedTeam2(dbTeam2.team_id);
            setTeam2Selection(dbTeam2.team_id);
            await fetchAndAutoSelectLogo(dbTeam2.team_id, setTeam2LogoUrl, setIsTeam2LogoFromGallery);
        }

        // Fallback to API logos
        if (!team1LogoUrl && match.team1.imageUrl) setTeam1LogoUrl(match.team1.imageUrl);
        if (!team2LogoUrl && match.team2.imageUrl) setTeam2LogoUrl(match.team2.imageUrl);

        // Get players from database for upcoming matches
        let playersText = '';
        if (dbTeam1) {
            const teamPlayers = players.filter(p => p.team_id === dbTeam1.team_id);
            const sortedPlayers = teamPlayers.sort((a, b) => {
                if (a.role === 'Captain') return -1;
                if (b.role === 'Captain') return 1;
                return 0;
            });
            playersText = sortedPlayers.map(p => {
                let suffix = '';
                if (p.role === 'Captain') suffix = ' (C)';
                else if (p.role === 'Wicket Keeper') suffix = ' (WK)';
                return p.name + suffix;
            }).join('\n');
        }

        // Fill all templates with just team names (no scores/data)
        setTossForm({ tossWinner: team1Name, tossDecision: 'bat' });
        setPlayingXIForm({ teamName: team1Name, opponent: team2Name, players: playersText });
        setPowerplayForm({ battingTeam: team1Name, score: 0, wickets: 0, overs: 0 });
        setInningsEndForm({
            battingTeam: team1Name, score: 0, wickets: 0, overs: 0, inningsNumber: 1,
            batsman1Name: '', batsman1Runs: 0, batsman1Balls: 0,
            batsman2Name: '', batsman2Runs: 0, batsman2Balls: 0,
            bowler1Name: '', bowler1Wickets: 0, bowler1Runs: 0,
            bowler2Name: '', bowler2Wickets: 0, bowler2Runs: 0,
        });
        setTargetForm({ chasingTeam: team2Name, target: 0 });
        setFallOfWicketForm({ battingTeam: team1Name, score: 0, wickets: 0, overs: 0 });
        setMilestoneForm({ playerFirstName: '', playerLastName: '', milestone: 50 });
        setMatchResultForm({ winningTeam: team1Name, resultText: '' });

        // Set default milestone team to team1 for upcoming matches
        if (dbTeam1) {
            setMilestoneTeamId(dbTeam1.team_id);
        }

        // Fetch template images if teams found
        if (dbTeam1) {
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'toss', setTossLayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'playing_xi', setPlayingXILayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'powerplay', setPowerplayLayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'innings_end', setInningsEndLayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'fall_of_wicket', setFallOfWicketLayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'match_result', setMatchResultLayerImage);
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'milestone', setMilestoneLayerImage);
        }
        if (dbTeam2) {
            await fetchAndAutoSelectImage(dbTeam2.team_id, 'target', setTargetLayerImage);
        }
    };

    // Auto-fill form data from live match
    const autoFillFromMatchData = async (data: MatchDetails, match: LiveMatch) => {
        // Find teams in database
        const dbTeam1 = findTeamByName(match.team1.name) || findTeamByName(match.team1.shortName);
        const dbTeam2 = findTeamByName(match.team2.name) || findTeamByName(match.team2.shortName);

        // Auto-select teams in dropdowns
        if (dbTeam1) {
            setSelectedTeam1(dbTeam1.team_id);
            setTeam1Selection(dbTeam1.team_id);
            // Fetch and auto-select logo
            await fetchAndAutoSelectLogo(dbTeam1.team_id, setTeam1LogoUrl, setIsTeam1LogoFromGallery);
        }
        if (dbTeam2) {
            setSelectedTeam2(dbTeam2.team_id);
            setTeam2Selection(dbTeam2.team_id);
            // Fetch and auto-select logo
            await fetchAndAutoSelectLogo(dbTeam2.team_id, setTeam2LogoUrl, setIsTeam2LogoFromGallery);
        }

        // Fallback to API logos if no saved logos
        if (!team1LogoUrl && match.team1.imageUrl) setTeam1LogoUrl(match.team1.imageUrl);
        if (!team2LogoUrl && match.team2.imageUrl) setTeam2LogoUrl(match.team2.imageUrl);

        // Use database team names for dropdowns (they need to match exactly)
        const team1Name = dbTeam1?.name?.toUpperCase() || data.team1?.name?.toUpperCase() || match.team1.name?.toUpperCase() || '';
        const team2Name = dbTeam2?.name?.toUpperCase() || data.team2?.name?.toUpperCase() || match.team2.name?.toUpperCase() || '';

        // Auto-fill toss
        if (data.toss) {
            setTossForm({
                tossWinner: data.toss.winner?.toUpperCase() || team1Name,
                tossDecision: data.toss.decision || 'bat',
            });
            // Auto-select toss template image
            const tossWinnerTeam = findTeamByName(data.toss.winner || '');
            if (tossWinnerTeam) {
                await fetchAndAutoSelectImage(tossWinnerTeam.team_id, 'toss', setTossLayerImage);
            }
        } else {
            setTossForm({ tossWinner: team1Name, tossDecision: 'bat' });
        }

        // Auto-fill Playing XI
        let playersText = '';
        if (data.team1?.players?.length > 0) {
            // Use players from match API
            playersText = data.team1.players.map(p => {
                let suffix = '';
                if (p.isCaptain && p.isKeeper) suffix = ' (C & WK)';
                else if (p.isCaptain) suffix = ' (C)';
                else if (p.isKeeper) suffix = ' (WK)';
                return p.name + suffix;
            }).join('\n');
        } else if (dbTeam1) {
            // Fallback to database players for upcoming matches
            const teamPlayers = players.filter(p => p.team_id === dbTeam1.team_id);
            const sortedPlayers = teamPlayers.sort((a, b) => {
                if (a.role === 'Captain') return -1;
                if (b.role === 'Captain') return 1;
                return 0;
            });
            playersText = sortedPlayers.map(p => {
                let suffix = '';
                if (p.role === 'Captain' && p.role === 'Wicket Keeper') suffix = ' (C & WK)';
                else if (p.role === 'Captain') suffix = ' (C)';
                else if (p.role === 'Wicket Keeper') suffix = ' (WK)';
                return p.name + suffix;
            }).join('\n');
        }

        setPlayingXIForm({
            teamName: team1Name,
            opponent: team2Name,
            players: playersText,
        });

        // Auto-select playing XI image
        if (dbTeam1) {
            await fetchAndAutoSelectImage(dbTeam1.team_id, 'playing_xi', setPlayingXILayerImage);
        }

        // Auto-fill from innings data
        if (data.innings && data.innings.length > 0) {
            const firstInnings = data.innings[0];
            const secondInnings = data.innings[1];
            const currentInnings = data.currentInnings || firstInnings;

            // Powerplay - use CURRENT batting team's powerplay data
            // If second innings is in progress, use that; otherwise use first innings
            const powerplayInnings = currentInnings || firstInnings;
            if (powerplayInnings) {
                const powerplayTeam = powerplayInnings.battingTeam?.toUpperCase() || team1Name;

                // Use powerplay data from API
                const ppScore = Number(powerplayInnings.powerplayScore) || 0;
                const ppWickets = powerplayInnings.powerplayWickets !== null ? Number(powerplayInnings.powerplayWickets) : 0;
                const ppOvers = Number(powerplayInnings.powerplayOvers) || 6;

                setPowerplayForm({
                    battingTeam: powerplayTeam,
                    score: ppScore,
                    wickets: ppWickets,
                    overs: ppOvers,
                });
                // Auto-select powerplay image for current batting team
                const ppTeam = findTeamByName(powerplayInnings.battingTeam || '');
                if (ppTeam) {
                    await fetchAndAutoSelectImage(ppTeam.team_id, 'powerplay', setPowerplayLayerImage);
                }
            }

            // Innings End
            if (firstInnings) {
                const topBatsmen = firstInnings.batsmen?.slice(0, 2) || [];
                const topBowlers = firstInnings.bowlers?.slice(0, 2) || [];

                // Store all match batsmen and bowlers for dropdowns
                setMatchBatsmen(firstInnings.batsmen || []);
                setMatchBowlers(firstInnings.bowlers || []);

                // Find the bowling team name (opposite of batting team)
                const battingTeamName = firstInnings.battingTeam?.toUpperCase() || team1Name;
                const bowlTeamName = battingTeamName === team1Name ? team2Name : team1Name;
                setBowlingTeam(bowlTeamName);

                // Use LIVE score from match data (more up-to-date) over stale scorecard data
                // Determine which team's score to use based on batting order
                const liveTeam1Score = (match as any).score?.team1Score;
                const liveTeam2Score = (match as any).score?.team2Score;

                // Check if first innings batting team matches team1 or team2
                const isTeam1Batting = firstInnings.battingTeam?.toLowerCase() === match.team1.name?.toLowerCase() ||
                    firstInnings.battingTeamShort?.toLowerCase() === match.team1.shortName?.toLowerCase();

                const liveFirstInningsScore = isTeam1Batting ? liveTeam1Score : liveTeam2Score;

                // Use the higher score (live vs scorecard) to handle API delays
                const scorecardScore = Number(firstInnings.score) || 0;
                const liveScore = liveFirstInningsScore?.runs || 0;
                const finalScore = Math.max(scorecardScore, liveScore);

                const scorecardWickets = Number(firstInnings.wickets) || 0;
                const liveWickets = liveFirstInningsScore?.wickets || 0;
                const finalWickets = Math.max(scorecardWickets, liveWickets);

                const scorecardOvers = parseFloat(firstInnings.overs) || 0;
                const liveOvers = liveFirstInningsScore?.overs || 0;
                const finalOvers = Math.max(scorecardOvers, liveOvers);

                setInningsEndForm({
                    battingTeam: battingTeamName,
                    score: finalScore,
                    wickets: finalWickets,
                    overs: finalOvers,
                    inningsNumber: 1,
                    batsman1Name: topBatsmen[0]?.name || '',
                    batsman1Runs: Number(topBatsmen[0]?.runs) || 0,
                    batsman1Balls: Number(topBatsmen[0]?.balls) || 0,
                    batsman2Name: topBatsmen[1]?.name || '',
                    batsman2Runs: Number(topBatsmen[1]?.runs) || 0,
                    batsman2Balls: Number(topBatsmen[1]?.balls) || 0,
                    bowler1Name: topBowlers[0]?.name || '',
                    bowler1Wickets: Number(topBowlers[0]?.wickets) || 0,
                    bowler1Runs: Number(topBowlers[0]?.runs) || 0,
                    bowler2Name: topBowlers[1]?.name || '',
                    bowler2Wickets: Number(topBowlers[1]?.wickets) || 0,
                    bowler2Runs: Number(topBowlers[1]?.runs) || 0,
                });

                // Auto-select batsmen in dropdown by matching names
                if (topBatsmen[0]?.name) {
                    const bat1 = players.find(p =>
                        p.name.toLowerCase().includes(topBatsmen[0].name.split(' ').pop()?.toLowerCase() || '') ||
                        topBatsmen[0].name.toLowerCase().includes(p.name.split(' ').pop()?.toLowerCase() || '')
                    );
                    if (bat1) setSelectedBatsman1(bat1.player_id);
                }
                if (topBatsmen[1]?.name) {
                    const bat2 = players.find(p =>
                        p.name.toLowerCase().includes(topBatsmen[1].name.split(' ').pop()?.toLowerCase() || '') ||
                        topBatsmen[1].name.toLowerCase().includes(p.name.split(' ').pop()?.toLowerCase() || '')
                    );
                    if (bat2) setSelectedBatsman2(bat2.player_id);
                }

                // Auto-select bowlers in dropdown by matching names
                if (topBowlers[0]?.name) {
                    const bowl1 = players.find(p =>
                        p.name.toLowerCase().includes(topBowlers[0].name.split(' ').pop()?.toLowerCase() || '') ||
                        topBowlers[0].name.toLowerCase().includes(p.name.split(' ').pop()?.toLowerCase() || '')
                    );
                    if (bowl1) setSelectedBowler1(bowl1.player_id);
                }
                if (topBowlers[1]?.name) {
                    const bowl2 = players.find(p =>
                        p.name.toLowerCase().includes(topBowlers[1].name.split(' ').pop()?.toLowerCase() || '') ||
                        topBowlers[1].name.toLowerCase().includes(p.name.split(' ').pop()?.toLowerCase() || '')
                    );
                    if (bowl2) setSelectedBowler2(bowl2.player_id);
                }

                // Auto-select innings end image
                const ieTeam = findTeamByName(firstInnings.battingTeam || '');
                if (ieTeam) {
                    await fetchAndAutoSelectImage(ieTeam.team_id, 'innings_end', setInningsEndLayerImage);
                }

                // Target - use live score for more accurate target
                const chasingTeam = secondInnings?.battingTeam?.toUpperCase() || team2Name;
                // Use the finalScore we calculated above (which uses live data)
                const targetValue = secondInnings?.target ? Number(secondInnings.target) : finalScore + 1;
                setTargetForm({
                    chasingTeam: chasingTeam,
                    target: targetValue,
                });

                // Auto-select target image
                const targetTeam = findTeamByName(secondInnings?.battingTeam || data.team2?.name || '');
                if (targetTeam) {
                    await fetchAndAutoSelectImage(targetTeam.team_id, 'target', setTargetLayerImage);
                }
            }

            // Fall of wicket (current innings)
            if (currentInnings) {
                setFallOfWicketForm({
                    battingTeam: currentInnings.battingTeam?.toUpperCase() || team1Name,
                    score: Number(currentInnings.score) || 0,
                    wickets: Number(currentInnings.wickets) || 0,
                    overs: parseFloat(currentInnings.overs) || 0,
                });
                // Auto-select fall of wicket image
                const fowTeam = findTeamByName(currentInnings.battingTeam || '');
                if (fowTeam) {
                    await fetchAndAutoSelectImage(fowTeam.team_id, 'fall_of_wicket', setFallOfWicketLayerImage);
                }
            }

            // Check for milestones - PRIORITIZE CURRENT BATTING TEAM
            let highestMilestone: { name: string; runs: number; teamName: string } | null = null;

            // First check current batting team for milestones
            if (currentInnings?.batsmen) {
                currentInnings.batsmen.forEach((bat: any) => {
                    if (bat.runs >= 50 && (!highestMilestone || bat.runs > highestMilestone.runs)) {
                        highestMilestone = { name: bat.name, runs: bat.runs, teamName: currentInnings.battingTeam || '' };
                    }
                });
            }

            // If no milestone in current innings, check other innings
            if (!highestMilestone) {
                data.innings.forEach((inn: any) => {
                    // Skip current innings as we already checked it
                    if (inn.inningsId === currentInnings?.inningsId) return;
                    inn.batsmen?.forEach((bat: any) => {
                        if (bat.runs >= 50 && (!highestMilestone || bat.runs > highestMilestone.runs)) {
                            highestMilestone = { name: bat.name, runs: bat.runs, teamName: inn.battingTeam || '' };
                        }
                    });
                });
            }

            if (highestMilestone) {
                const nameParts = highestMilestone.name.split(' ');
                setMilestoneForm({
                    playerFirstName: nameParts[0] || '',
                    playerLastName: nameParts.slice(1).join(' ') || nameParts[0],
                    milestone: highestMilestone.runs >= 100 ? 100 : 50,
                });
                // Set milestone team
                const milestoneTeam = findTeamByName(highestMilestone.teamName);
                if (milestoneTeam) {
                    setMilestoneTeamId(milestoneTeam.team_id);
                    await fetchAndAutoSelectImage(milestoneTeam.team_id, 'milestone', setMilestoneLayerImage);
                }
            } else {
                setMilestoneForm({ playerFirstName: '', playerLastName: '', milestone: 50 });
                // Default milestone team to current batting team if no milestone found
                const currentBattingTeam = findTeamByName(currentInnings?.battingTeam || '');
                if (currentBattingTeam) {
                    setMilestoneTeamId(currentBattingTeam.team_id);
                } else if (dbTeam1) {
                    setMilestoneTeamId(dbTeam1.team_id);
                }
            }
        } else {
            // No innings data - set defaults
            setPowerplayForm({ battingTeam: team1Name, score: 0, wickets: 0, overs: 0 });
            setInningsEndForm({
                battingTeam: team1Name, score: 0, wickets: 0, overs: 0, inningsNumber: 1,
                batsman1Name: '', batsman1Runs: 0, batsman1Balls: 0,
                batsman2Name: '', batsman2Runs: 0, batsman2Balls: 0,
                bowler1Name: '', bowler1Wickets: 0, bowler1Runs: 0,
                bowler2Name: '', bowler2Wickets: 0, bowler2Runs: 0,
            });
            setTargetForm({ chasingTeam: team2Name, target: 0 });
            setFallOfWicketForm({ battingTeam: team1Name, score: 0, wickets: 0, overs: 0 });
            setMilestoneForm({ playerFirstName: '', playerLastName: '', milestone: 50 });
        }

        // Match result
        if (data.state === 'Complete') {
            // The full result text is in match.status from live matches API (e.g., "Australia won by 67 runs")
            // data.status contains toss info, so we skip it
            const resultText = match.status || data.result || '';

            if (resultText && resultText.includes(' won ')) {
                const resultParts = resultText.split(' won ');
                const winningTeamName = resultParts[0]?.trim().toUpperCase() || '';
                setMatchResultForm({
                    winningTeam: winningTeamName,
                    resultText: 'won ' + (resultParts[1]?.trim() || ''),
                });
                // Auto-select match result image
                const winnerTeam = findTeamByName(resultParts[0]?.trim() || '');
                if (winnerTeam) {
                    await fetchAndAutoSelectImage(winnerTeam.team_id, 'match_result', setMatchResultLayerImage);
                }
            } else if (resultText) {
                // Result exists but in a different format (e.g., "Match tied", "Match drawn")
                setMatchResultForm({ winningTeam: team1Name, resultText: resultText });
            } else {
                setMatchResultForm({ winningTeam: team1Name, resultText: '' });
            }
        } else {
            setMatchResultForm({ winningTeam: team1Name, resultText: '' });
        }
    };

    // Go back to match list
    const handleBackToMatches = () => {
        setSelectedMatch(null);
        setMatchDetails(null);
        setDetectedEvents([]);
    };

    // Refresh match data
    const refreshMatchData = async () => {
        if (!selectedMatch) return;
        setLoadingMatch(true);
        try {
            const res = await fetch(`/api/match-details?matchId=${selectedMatch.matchId}`);
            const data = await res.json();
            if (data.success) {
                setMatchDetails(data);
                setDetectedEvents(data.events || []);
                await autoFillFromMatchData(data, selectedMatch);
            }
        } catch (error) {
            console.error('Error refreshing match:', error);
        } finally {
            setLoadingMatch(false);
        }
    };

    const team1 = teams.find(t => t.team_id === selectedTeam1);
    const team2 = teams.find(t => t.team_id === selectedTeam2);

    const resolvedTeam1Logo = team1LogoUrl || team1?.image_url;
    const resolvedTeam2Logo = team2LogoUrl || team2?.image_url;

    // Resolve milestone team logo based on which team the milestone player belongs to
    const milestoneTeam = teams.find(t => t.team_id === milestoneTeamId);
    const resolvedMilestoneTeamLogo = milestoneTeamId === selectedTeam1
        ? resolvedTeam1Logo
        : (milestoneTeamId === selectedTeam2
            ? resolvedTeam2Logo
            : milestoneTeam?.image_url);

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

    const parsePlayingXI = (text: string) => {
        return text.split('\n').filter(line => line.trim()).map(line => {
            const isCaptain = line.includes('(C)') && !line.includes('(WK)');
            const isWicketkeeper = line.includes('(WK)') && !line.includes('(C)');
            const isBoth = line.includes('(C') && line.includes('WK)');
            const name = line.replace(/\s*\(C\s*&?\s*WK\)\s*/g, '').replace(/\s*\(C\)\s*/g, '').replace(/\s*\(WK\)\s*/g, '').trim();
            return { name, isCaptain: isCaptain || isBoth, isWicketkeeper: isWicketkeeper || isBoth };
        });
    };

    const fetchSavedImages = async (teamId?: number, imageType?: string, milestone?: string, templateType?: string, playerId?: number) => {
        setLoadingSavedImages(true);
        try {
            const params = new URLSearchParams();
            if (teamId) params.append('team_id', teamId.toString());
            if (imageType) params.append('image_type', imageType);

            if (milestone) {
                params.append('milestone', milestone);
            } else {
                params.append('milestone', 'null');
            }

            if (templateType) {
                params.append('template_type', templateType);
            }

            if (playerId && templateType === 'milestone') {
                params.append('player_id', playerId.toString());
            }

            const res = await fetch(`/api/template-images?${params.toString()}`);
            const data = await res.json();
            setSavedImages(data.images || []);
        } catch (error) {
            console.error('Error fetching saved images:', error);
            setSavedImages([]);
        } finally {
            setLoadingSavedImages(false);
        }
    };

    const saveAllImages = async () => {
        const currentImage = getCurrentTemplateImage();

        // Check if there's anything to save
        const hasTemplateImage = !!currentImage;
        const hasTeam1Logo = !!team1LogoUrl && team1LogoUrl.startsWith('data:');
        const hasTeam2Logo = !!team2LogoUrl && team2LogoUrl.startsWith('data:');

        if (!hasTemplateImage && !hasTeam1Logo && !hasTeam2Logo) {
            setToast({ message: 'Please upload at least one image to save', type: 'error' });
            return;
        }

        // Determine team_id based on template
        let teamId: number | null = null;
        let milestone: string | null = null;

        if (selectedTemplate === 'toss') teamId = teams.find(t => t.name.toUpperCase() === tossForm.tossWinner)?.team_id || null;
        else if (selectedTemplate === 'powerplay') teamId = teams.find(t => t.name.toUpperCase() === powerplayForm.battingTeam)?.team_id || null;
        else if (selectedTemplate === 'innings_end') teamId = teams.find(t => t.name.toUpperCase() === inningsEndForm.battingTeam)?.team_id || null;
        else if (selectedTemplate === 'target') teamId = teams.find(t => t.name.toUpperCase() === targetForm.chasingTeam)?.team_id || null;
        else if (selectedTemplate === 'match_result') teamId = teams.find(t => t.name.toUpperCase() === matchResultForm.winningTeam)?.team_id || null;
        else if (selectedTemplate === 'playing_xi') teamId = teams.find(t => t.name.toUpperCase() === playingXIForm.teamName)?.team_id || null;
        else if (selectedTemplate === 'milestone') {
            teamId = milestoneTeamId;
            milestone = milestoneForm.milestone.toString();
        }
        else if (selectedTemplate === 'fall_of_wicket') teamId = teams.find(t => t.name.toUpperCase() === fallOfWicketForm.battingTeam)?.team_id || null;

        setSavingImage(true);
        let savedCount = 0;
        let errorCount = 0;
        let duplicateCount = 0;

        try {
            // Save template image if exists
            if (hasTemplateImage) {
                let description = `${selectedTemplate} template`;

                if (selectedTemplate === 'milestone' && milestoneTeamId && selectedMilestonePlayer) {
                    const team = teams.find(t => t.team_id === milestoneTeamId);
                    const player = players.find(p => p.player_id === selectedMilestonePlayer);
                    if (team && player) {
                        description = `${team.name} - ${player.name} - ${milestoneForm.milestone} milestone`;
                    }
                }

                const res = await fetch('/api/template-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: teamId,
                        player_id: selectedTemplate === 'milestone' ? selectedMilestonePlayer : null,
                        image_url: currentImage,
                        image_type: 'template',
                        milestone: milestone,
                        template_type: selectedTemplate,
                        description: description
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.duplicate) {
                        duplicateCount++;
                    } else {
                        savedCount++;
                    }
                } else {
                    errorCount++;
                }
            }

            // Save team 1 logo if uploaded (data: URL means user uploaded it)
            if (hasTeam1Logo && team1Selection) {
                const res = await fetch('/api/template-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: team1Selection,
                        image_url: team1LogoUrl,
                        image_type: 'logo',
                        description: `Team logo`
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.duplicate) {
                        duplicateCount++;
                    } else {
                        savedCount++;
                    }
                } else {
                    errorCount++;
                }
            }

            // Save team 2 logo if uploaded
            if (hasTeam2Logo && team2Selection) {
                const res = await fetch('/api/template-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: team2Selection,
                        image_url: team2LogoUrl,
                        image_type: 'logo',
                        description: `Team logo`
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.duplicate) {
                        duplicateCount++;
                    } else {
                        savedCount++;
                    }
                } else {
                    errorCount++;
                }
            }

            // For milestone template, save team logo with milestoneTeamId
            if (selectedTemplate === 'milestone' && hasTeam1Logo && milestoneTeamId) {
                const res = await fetch('/api/template-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        team_id: milestoneTeamId,
                        image_url: team1LogoUrl,
                        image_type: 'logo',
                        description: `Team logo`
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.duplicate) {
                        duplicateCount++;
                    } else {
                        savedCount++;
                    }
                } else {
                    errorCount++;
                }
            }

            // Show appropriate messages
            if (savedCount > 0 && duplicateCount > 0) {
                setToast({ message: `Saved ${savedCount} new image(s). ${duplicateCount} duplicate(s) skipped.`, type: 'success' });
            } else if (savedCount > 0) {
                setToast({ message: `Saved ${savedCount} image(s) successfully!`, type: 'success' });
            } else if (duplicateCount > 0) {
                setToast({ message: `All images already saved (${duplicateCount} duplicate(s) skipped)`, type: 'info' });
            }

            if (errorCount > 0) {
                setToast({ message: `Failed to save ${errorCount} image(s)`, type: 'error' });
            }

            // Refresh saved images lists (only if something was saved or attempted)
            if (savedCount > 0 || duplicateCount > 0) {
                if (teamId) {
                    const playerId = selectedTemplate === 'milestone' ? selectedMilestonePlayer || undefined : undefined;
                    // For milestone template, pass the milestone value to filter correctly
                    const milestoneValue = selectedTemplate === 'milestone' ? milestoneForm.milestone.toString() : undefined;
                    fetchSavedImages(teamId, 'template', milestoneValue, selectedTemplate, playerId);
                }
                // Refresh saved logos
                if (team1Selection) fetchSavedLogos(team1Selection, setSavedTeam1Logos);
                if (team2Selection) fetchSavedLogos(team2Selection, setSavedTeam2Logos);
                if (milestoneTeamId) fetchSavedLogos(milestoneTeamId, setSavedMilestoneLogos);
                // Reset file input keys only if new images were saved
                if (savedCount > 0) {
                    setTemplateFileKey(prev => prev + 1);
                    setTeam1LogoFileKey(prev => prev + 1);
                    setTeam2LogoFileKey(prev => prev + 1);
                    setMilestoneLogoFileKey(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Error saving images:', error);
            setToast({ message: 'Error saving images. Please try again.', type: 'error' });
        } finally {
            setSavingImage(false);
        }
    };

    const getCurrentTemplateImage = () => {
        switch (selectedTemplate) {
            case 'toss': return tossLayerImage;
            case 'powerplay': return powerplayLayerImage;
            case 'innings_end': return inningsEndLayerImage;
            case 'target': return targetLayerImage;
            case 'match_result': return matchResultLayerImage;
            case 'playing_xi': return playingXILayerImage;
            case 'milestone': return milestoneLayerImage;
            case 'fall_of_wicket': return fallOfWicketLayerImage;
            default: return '';
        }
    };

    const setCurrentTemplateImage = (imageUrl: string) => {
        switch (selectedTemplate) {
            case 'toss': setTossLayerImage(imageUrl); break;
            case 'powerplay': setPowerplayLayerImage(imageUrl); break;
            case 'innings_end': setInningsEndLayerImage(imageUrl); break;
            case 'target': setTargetLayerImage(imageUrl); break;
            case 'match_result': setMatchResultLayerImage(imageUrl); break;
            case 'playing_xi': setPlayingXILayerImage(imageUrl); break;
            case 'milestone': setMilestoneLayerImage(imageUrl); break;
            case 'fall_of_wicket': setFallOfWicketLayerImage(imageUrl); break;
        }
    };

    const clearCurrentTemplateImage = () => {
        setCurrentTemplateImage('');
        setTemplateFileKey(prev => prev + 1);
        setIsTemplateFromGallery(false);
        setImageOffset({ x: 0, y: 0 }); // Reset position when clearing image
    };

    const handleImageOffsetChange = (x: number, y: number) => {
        setImageOffset({ x, y });
    };

    const resetImagePosition = () => {
        setImageOffset({ x: 0, y: 0 });
    };

    const deleteSavedImage = async (imageId: number, imageType: 'template' | 'logo') => {
        // Show confirmation dialog
        setConfirmDialog({
            show: true,
            message: `Are you sure you want to delete this ${imageType === 'template' ? 'template image' : 'logo'}?`,
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    const res = await fetch(`/api/template-images?id=${imageId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        setToast({ message: 'Image deleted successfully', type: 'success' });
                        // Refresh the appropriate saved images list
                        if (imageType === 'template') {
                            let teamId: number | null = null;
                            let milestone: string | null = null;
                            let playerId: number | undefined = undefined;
                            if (selectedTemplate === 'toss') teamId = teams.find(t => t.name.toUpperCase() === tossForm.tossWinner)?.team_id || null;
                            else if (selectedTemplate === 'powerplay') teamId = teams.find(t => t.name.toUpperCase() === powerplayForm.battingTeam)?.team_id || null;
                            else if (selectedTemplate === 'innings_end') teamId = teams.find(t => t.name.toUpperCase() === inningsEndForm.battingTeam)?.team_id || null;
                            else if (selectedTemplate === 'target') teamId = teams.find(t => t.name.toUpperCase() === targetForm.chasingTeam)?.team_id || null;
                            else if (selectedTemplate === 'match_result') teamId = teams.find(t => t.name.toUpperCase() === matchResultForm.winningTeam)?.team_id || null;
                            else if (selectedTemplate === 'playing_xi') teamId = teams.find(t => t.name.toUpperCase() === playingXIForm.teamName)?.team_id || null;
                            else if (selectedTemplate === 'milestone') {
                                teamId = milestoneTeamId;
                                milestone = milestoneForm.milestone.toString();
                                playerId = selectedMilestonePlayer || undefined;
                            }
                            else if (selectedTemplate === 'fall_of_wicket') teamId = teams.find(t => t.name.toUpperCase() === fallOfWicketForm.battingTeam)?.team_id || null;
                            if (teamId) fetchSavedImages(teamId, 'template', milestone || undefined, selectedTemplate, playerId);
                        } else {
                            // Refresh logo lists
                            if (team1Selection) fetchSavedLogos(team1Selection, setSavedTeam1Logos);
                            if (team2Selection) fetchSavedLogos(team2Selection, setSavedTeam2Logos);
                            if (milestoneTeamId) fetchSavedLogos(milestoneTeamId, setSavedMilestoneLogos);
                        }
                    } else {
                        setToast({ message: 'Failed to delete image', type: 'error' });
                    }
                } catch (error) {
                    console.error('Error deleting image:', error);
                    setToast({ message: 'Error deleting image', type: 'error' });
                }
            }
        });
    };

    const renderTemplate = () => {
        switch (selectedTemplate) {
            case 'toss':
                return (
                    <TossTemplate
                        tossImage={tossLayerImage}
                        tossWinner={tossForm.tossWinner}
                        tossDecision={tossForm.tossDecision}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'powerplay':
                return (
                    <PowerplayTemplate
                        powerplayImage={powerplayLayerImage}
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        battingTeam={powerplayForm.battingTeam}
                        score={powerplayForm.score}
                        wickets={powerplayForm.wickets}
                        overs={powerplayForm.overs}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'innings_end':
                return (
                    <InningsEndTemplate
                        inningsEndImage={inningsEndLayerImage}
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
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
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'target':
                return (
                    <TargetTemplate
                        targetImage={targetLayerImage}
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        chasingTeam={targetForm.chasingTeam}
                        target={targetForm.target}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'match_result':
                return (
                    <MatchResultTemplate
                        matchResultImage={matchResultLayerImage}
                        winningTeam={matchResultForm.winningTeam}
                        resultText={matchResultForm.resultText}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'playing_xi':
                return (
                    <PlayingXITemplate
                        playingXIImage={playingXILayerImage}
                        teamName={playingXIForm.teamName}
                        opponent={playingXIForm.opponent}
                        players={parsePlayingXI(playingXIForm.players)}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'milestone':
                return (
                    <MilestoneTemplate
                        milestoneImage={milestoneLayerImage}
                        playerFirstName={milestoneForm.playerFirstName}
                        playerLastName={milestoneForm.playerLastName}
                        milestone={milestoneForm.milestone}
                        teamLogo={resolvedMilestoneTeamLogo}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
                    />
                );
            case 'fall_of_wicket':
                return (
                    <FallOfWicketTemplate
                        fallOfWicketImage={fallOfWicketLayerImage}
                        team1Logo={resolvedTeam1Logo}
                        team2Logo={resolvedTeam2Logo}
                        battingTeam={fallOfWicketForm.battingTeam}
                        score={fallOfWicketForm.score}
                        wickets={fallOfWicketForm.wickets}
                        overs={fallOfWicketForm.overs}
                        imageOffsetX={imageOffset.x}
                        imageOffsetY={imageOffset.y}
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
                            <select className={inputClass} value={tossForm.tossWinner} onChange={e => {
                                setTossForm(f => ({ ...f, tossWinner: e.target.value }));
                                clearCurrentTemplateImage();
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
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
                            <select className={inputClass} value={powerplayForm.battingTeam} onChange={e => {
                                const selectedTeamName = e.target.value;
                                setPowerplayForm(f => ({ ...f, battingTeam: selectedTeamName }));
                                clearCurrentTemplateImage();

                                // Auto-fill powerplay data from match innings
                                if (selectedTeamName && matchDetails?.innings) {
                                    const inningsData = matchDetails.innings.find(
                                        inn => inn.battingTeam?.toUpperCase() === selectedTeamName ||
                                               inn.battingTeamShort?.toUpperCase() === selectedTeamName
                                    );
                                    if (inningsData) {
                                        // Use powerplay data from API
                                        const ppScore = Number(inningsData.powerplayScore) || 0;
                                        const ppWickets = inningsData.powerplayWickets !== null ? Number(inningsData.powerplayWickets) : 0;
                                        const ppOvers = Number(inningsData.powerplayOvers) || 6;

                                        setPowerplayForm(f => ({
                                            ...f,
                                            score: ppScore,
                                            wickets: ppWickets,
                                            overs: ppOvers,
                                        }));
                                    }
                                }
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
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
                            <select className={inputClass} value={inningsEndForm.battingTeam} onChange={e => {
                                setInningsEndForm(f => ({ ...f, battingTeam: e.target.value }));
                                clearCurrentTemplateImage();
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Innings #</label>
                                <div className="flex gap-2">
                                    {[1, 2].map(n => (
                                        <button key={n} onClick={() => {
                                            // Update innings number and auto-fill from match data if available
                                            const inningsData = matchDetails?.innings?.[n - 1];
                                            if (inningsData) {
                                                const topBatsmen = inningsData.batsmen?.slice(0, 2) || [];
                                                const topBowlers = inningsData.bowlers?.slice(0, 2) || [];

                                                // Update match batsmen and bowlers for dropdowns
                                                setMatchBatsmen(inningsData.batsmen || []);
                                                setMatchBowlers(inningsData.bowlers || []);

                                                setInningsEndForm({
                                                    battingTeam: inningsData.battingTeam?.toUpperCase() || '',
                                                    score: Number(inningsData.score) || 0,
                                                    wickets: Number(inningsData.wickets) || 0,
                                                    overs: parseFloat(inningsData.overs) || 0,
                                                    inningsNumber: n,
                                                    batsman1Name: topBatsmen[0]?.name || '',
                                                    batsman1Runs: Number(topBatsmen[0]?.runs) || 0,
                                                    batsman1Balls: Number(topBatsmen[0]?.balls) || 0,
                                                    batsman2Name: topBatsmen[1]?.name || '',
                                                    batsman2Runs: Number(topBatsmen[1]?.runs) || 0,
                                                    batsman2Balls: Number(topBatsmen[1]?.balls) || 0,
                                                    bowler1Name: topBowlers[0]?.name || '',
                                                    bowler1Wickets: Number(topBowlers[0]?.wickets) || 0,
                                                    bowler1Runs: Number(topBowlers[0]?.runs) || 0,
                                                    bowler2Name: topBowlers[1]?.name || '',
                                                    bowler2Wickets: Number(topBowlers[1]?.wickets) || 0,
                                                    bowler2Runs: Number(topBowlers[1]?.runs) || 0,
                                                });
                                                // Update bowling team (opposite of batting team)
                                                if (inningsData.battingTeam) {
                                                    const battingTeamUpper = inningsData.battingTeam.toUpperCase();
                                                    const team1Name = matchDetails?.team1?.name?.toUpperCase() || '';
                                                    const team2Name = matchDetails?.team2?.name?.toUpperCase() || '';
                                                    if (battingTeamUpper === team1Name || battingTeamUpper === matchDetails?.team1?.shortName?.toUpperCase()) {
                                                        setBowlingTeam(team2Name);
                                                    } else {
                                                        setBowlingTeam(team1Name);
                                                    }
                                                }
                                            } else {
                                                setInningsEndForm(f => ({ ...f, inningsNumber: n }));
                                            }
                                        }}
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

                        {/* Bowling Team Dropdown */}
                        <div>
                            <label className={labelClass}>Bowling Team</label>
                            <select
                                className={inputClass}
                                value={bowlingTeam}
                                onChange={e => setBowlingTeam(e.target.value)}
                            >
                                <option value="">Select Bowling Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="border-t border-gray-600 pt-2 mt-1">
                            <p className="text-xs text-gray-500 mb-2">Top Batsmen (from {inningsEndForm.battingTeam || 'Batting Team'})</p>
                            {[1, 2].map(i => {
                                const key = i as 1 | 2;
                                const selectedBatsmanName = i === 1 ? inningsEndForm.batsman1Name : inningsEndForm.batsman2Name;

                                return (
                                    <div key={i} className="mb-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-3">
                                                <label className={labelClass}>Batsman {i}</label>
                                                <select
                                                    className={inputClass}
                                                    value={selectedBatsmanName || ''}
                                                    onChange={e => {
                                                        const selectedName = e.target.value;
                                                        const batsman = matchBatsmen.find(b => b.name === selectedName);
                                                        if (i === 1) {
                                                            setInningsEndForm(f => ({
                                                                ...f,
                                                                batsman1Name: selectedName,
                                                                batsman1Runs: batsman?.runs || 0,
                                                                batsman1Balls: batsman?.balls || 0,
                                                            }));
                                                        } else {
                                                            setInningsEndForm(f => ({
                                                                ...f,
                                                                batsman2Name: selectedName,
                                                                batsman2Runs: batsman?.runs || 0,
                                                                batsman2Balls: batsman?.balls || 0,
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select Player</option>
                                                    {matchBatsmen.map(batsman => (
                                                        <option key={batsman.id || batsman.name} value={batsman.name}>
                                                            {batsman.name} - {batsman.runs}({batsman.balls})
                                                        </option>
                                                    ))}
                                                </select>
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
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-600 pt-2 mt-1">
                            <p className="text-xs text-gray-500 mb-2">Top Bowlers (from {bowlingTeam || 'Bowling Team'})</p>
                            {[1, 2].map(i => {
                                const key = i as 1 | 2;
                                const selectedBowlerName = i === 1 ? inningsEndForm.bowler1Name : inningsEndForm.bowler2Name;

                                return (
                                    <div key={i} className="mb-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-3">
                                                <label className={labelClass}>Bowler {i}</label>
                                                <select
                                                    className={inputClass}
                                                    value={selectedBowlerName || ''}
                                                    onChange={e => {
                                                        const selectedName = e.target.value;
                                                        const bowler = matchBowlers.find(b => b.name === selectedName);
                                                        if (i === 1) {
                                                            setInningsEndForm(f => ({
                                                                ...f,
                                                                bowler1Name: selectedName,
                                                                bowler1Wickets: bowler?.wickets || 0,
                                                                bowler1Runs: bowler?.runs || 0,
                                                            }));
                                                        } else {
                                                            setInningsEndForm(f => ({
                                                                ...f,
                                                                bowler2Name: selectedName,
                                                                bowler2Wickets: bowler?.wickets || 0,
                                                                bowler2Runs: bowler?.runs || 0,
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select Player</option>
                                                    {matchBowlers.map(bowler => (
                                                        <option key={bowler.id || bowler.name} value={bowler.name}>
                                                            {bowler.name} - {bowler.wickets}/{bowler.runs} ({bowler.overs} ov)
                                                        </option>
                                                    ))}
                                                </select>
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
                            <select className={inputClass} value={targetForm.chasingTeam} onChange={e => {
                                const selectedTeamName = e.target.value;
                                setTargetForm(f => ({ ...f, chasingTeam: selectedTeamName }));
                                clearCurrentTemplateImage();

                                // Auto-calculate target from match data
                                if (selectedTeamName && matchDetails?.innings?.length >= 1) {
                                    // Find the innings where selected team is batting (chasing)
                                    const chasingInnings = matchDetails.innings.find(
                                        inn => inn.battingTeam?.toUpperCase() === selectedTeamName ||
                                               inn.battingTeamShort?.toUpperCase() === selectedTeamName
                                    );
                                    // If chasing team's innings exists and has target, use it
                                    if (chasingInnings?.target) {
                                        setTargetForm(f => ({ ...f, target: Number(chasingInnings.target) }));
                                    } else {
                                        // Find the other innings (first innings) and calculate target
                                        const firstInnings = matchDetails.innings.find(
                                            inn => (inn.battingTeam?.toUpperCase() !== selectedTeamName &&
                                                   inn.battingTeamShort?.toUpperCase() !== selectedTeamName)
                                        );
                                        if (firstInnings) {
                                            setTargetForm(f => ({ ...f, target: (Number(firstInnings.score) || 0) + 1 }));
                                        }
                                    }
                                }
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
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
                            <select className={inputClass} value={matchResultForm.winningTeam} onChange={e => {
                                setMatchResultForm(f => ({ ...f, winningTeam: e.target.value }));
                                clearCurrentTemplateImage();
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
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
                                <select className={inputClass} value={playingXIForm.teamName} onChange={e => {
                                    const selectedTeamName = e.target.value;
                                    setPlayingXIForm(f => ({ ...f, teamName: selectedTeamName }));
                                    clearCurrentTemplateImage();

                                    // Auto-populate players from match data or database
                                    if (selectedTeamName && matchDetails) {
                                        // Check if selected team matches team1 or team2 from match data
                                        const isTeam1 = matchDetails.team1?.name?.toUpperCase() === selectedTeamName ||
                                                        matchDetails.team1?.shortName?.toUpperCase() === selectedTeamName;
                                        const isTeam2 = matchDetails.team2?.name?.toUpperCase() === selectedTeamName ||
                                                        matchDetails.team2?.shortName?.toUpperCase() === selectedTeamName;

                                        if (isTeam1 && matchDetails.team1?.players?.length > 0) {
                                            // Use playing XI from match data
                                            const playersText = matchDetails.team1.players.map(p => {
                                                let suffix = '';
                                                if (p.isCaptain && p.isKeeper) suffix = ' (C & WK)';
                                                else if (p.isCaptain) suffix = ' (C)';
                                                else if (p.isKeeper) suffix = ' (WK)';
                                                return p.name + suffix;
                                            }).join('\n');
                                            setPlayingXIForm(f => ({ ...f, players: playersText }));
                                        } else if (isTeam2 && matchDetails.team2?.players?.length > 0) {
                                            // Use playing XI from match data
                                            const playersText = matchDetails.team2.players.map(p => {
                                                let suffix = '';
                                                if (p.isCaptain && p.isKeeper) suffix = ' (C & WK)';
                                                else if (p.isCaptain) suffix = ' (C)';
                                                else if (p.isKeeper) suffix = ' (WK)';
                                                return p.name + suffix;
                                            }).join('\n');
                                            setPlayingXIForm(f => ({ ...f, players: playersText }));
                                        } else {
                                            // Fallback to database players
                                            const team = teams.find(t => t.name.toUpperCase() === selectedTeamName);
                                            if (team) {
                                                const teamPlayers = players.filter(p => p.team_id === team.team_id);
                                                const sortedPlayers = teamPlayers.sort((a, b) => {
                                                    if (a.role === 'Captain') return -1;
                                                    if (b.role === 'Captain') return 1;
                                                    return 0;
                                                });
                                                const playerNames = sortedPlayers.map(p => p.name).join('\n');
                                                setPlayingXIForm(f => ({ ...f, players: playerNames }));
                                            }
                                        }
                                    } else if (selectedTeamName) {
                                        // No match data, use database players
                                        const team = teams.find(t => t.name.toUpperCase() === selectedTeamName);
                                        if (team) {
                                            const teamPlayers = players.filter(p => p.team_id === team.team_id);
                                            const sortedPlayers = teamPlayers.sort((a, b) => {
                                                if (a.role === 'Captain') return -1;
                                                if (b.role === 'Captain') return 1;
                                                return 0;
                                            });
                                            const playerNames = sortedPlayers.map(p => p.name).join('\n');
                                            setPlayingXIForm(f => ({ ...f, players: playerNames }));
                                        }
                                    } else {
                                        setPlayingXIForm(f => ({ ...f, players: '' }));
                                    }
                                }}>
                                    <option value="">Select Team</option>
                                    {teams.map(team => (
                                        <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Opponent</label>
                                <select className={inputClass} value={playingXIForm.opponent} onChange={e => setPlayingXIForm(f => ({ ...f, opponent: e.target.value }))}>
                                    <option value="">Select Team</option>
                                    {teams.map(team => (
                                        <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                    ))}
                                </select>
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
                const milestoneTeamPlayers = milestoneTeamId ? players.filter(p => p.team_id === milestoneTeamId) : [];
                return (
                    <>
                        <div>
                            <label className={labelClass}>Team</label>
                            <select
                                className={inputClass}
                                value={milestoneTeamId || ''}
                                onChange={e => {
                                    const teamId = e.target.value ? parseInt(e.target.value) : null;
                                    setMilestoneTeamId(teamId);
                                    setSelectedMilestonePlayer(null);
                                    setMilestoneForm(f => ({ ...f, playerFirstName: '', playerLastName: '' }));
                                    setMilestoneLogoFileKey(prev => prev + 1);
                                    const team = teams.find(t => t.team_id === teamId);
                                    if (team?.image_url) {
                                        setTeam1LogoUrl(team.image_url);
                                    } else {
                                        setTeam1LogoUrl('');
                                    }
                                }}
                            >
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.team_id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        {milestoneTeamId && (
                            <div>
                                <label className={labelClass}>Player</label>
                                <select
                                    className={inputClass}
                                    value={selectedMilestonePlayer || ''}
                                    onChange={e => {
                                        const playerId = e.target.value ? parseInt(e.target.value) : null;
                                        setSelectedMilestonePlayer(playerId);
                                        if (playerId) {
                                            const player = players.find(p => p.player_id === playerId);
                                            if (player) {
                                                const nameParts = player.name.split(' ');
                                                const firstName = nameParts[0] || '';
                                                const lastName = nameParts.slice(1).join(' ') || nameParts[0];
                                                setMilestoneForm(f => ({
                                                    ...f,
                                                    playerFirstName: firstName,
                                                    playerLastName: lastName
                                                }));
                                            }
                                        }
                                    }}
                                >
                                    <option value="">Select Player</option>
                                    {milestoneTeamPlayers.map(player => (
                                        <option key={player.player_id} value={player.player_id}>{player.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
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
                            <select className={inputClass} value={fallOfWicketForm.battingTeam} onChange={e => {
                                const selectedTeamName = e.target.value;
                                setFallOfWicketForm(f => ({ ...f, battingTeam: selectedTeamName }));
                                clearCurrentTemplateImage();

                                // Auto-fill from match innings data
                                if (selectedTeamName && matchDetails?.innings) {
                                    const inningsData = matchDetails.innings.find(
                                        inn => inn.battingTeam?.toUpperCase() === selectedTeamName ||
                                               inn.battingTeamShort?.toUpperCase() === selectedTeamName
                                    );
                                    if (inningsData) {
                                        setFallOfWicketForm(f => ({
                                            ...f,
                                            score: Number(inningsData.score) || 0,
                                            wickets: Number(inningsData.wickets) || 0,
                                            overs: parseFloat(inningsData.overs) || 0,
                                        }));
                                    }
                                }
                            }}>
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.team_id} value={team.name.toUpperCase()}>{team.name}</option>
                                ))}
                            </select>
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

    // Show login page if not authenticated (must be after all hooks)
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Show live matches page if no match is selected
    if (!selectedMatch) {
        return (
            <div className="relative">
                <LiveMatches onSelectMatch={handleSelectMatch} />
                <button
                    onClick={logout}
                    className="absolute top-6 right-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm"
                >
                    Logout
                </button>
            </div>
        );
    }

    if (loading || loadingMatch) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">{loadingMatch ? 'Loading match data...' : 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Header with Match Info and Actions */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBackToMatches}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Matches
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold">{selectedMatch.team1.name} vs {selectedMatch.team2.name}</h1>
                    <p className="text-gray-400 text-sm">{selectedMatch.matchDesc} • {selectedMatch.seriesName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshMatchData}
                        disabled={loadingMatch}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition text-sm flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${loadingMatch ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Template Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {templates.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setSelectedTemplate(t.key)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${selectedTemplate === t.key
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
                    <h3 className="font-bold text-sm text-green-400 uppercase tracking-wide mb-3">Setting</h3>

                    {/* Template-specific fields - TEAM NAMES FIRST */}
                    {renderFormFields()}

                    {/* BACKGROUND IMAGE - Dynamic per match */}
                    <div className="border-b border-gray-600 pb-3 mb-3">
                        <p className="text-xs text-gray-500 mb-2">
                            {selectedTemplate === 'toss' && 'Toss Template Image (Recommended: 2069×1361px)'}
                            {selectedTemplate === 'powerplay' && 'Powerplay Template Image (Recommended: 1975×1347px)'}
                            {selectedTemplate === 'innings_end' && 'Innings End Template Image (Recommended: 2048×1359px)'}
                            {selectedTemplate === 'target' && 'Target Template Image (Recommended: 2024×1350px)'}
                            {selectedTemplate === 'match_result' && 'Match Result Template Image (Recommended: 1972×1359px)'}
                            {selectedTemplate === 'playing_xi' && 'Playing XI Template Image (Recommended: 2107×1353px)'}
                            {selectedTemplate === 'milestone' && 'Milestone Template Image (Recommended: 2048×1405px)'}
                            {selectedTemplate === 'fall_of_wicket' && 'Fall of Wicket Template Image (Recommended: 1992×1371px)'}
                        </p>
                        <div>
                            <label className={labelClass}>Upload Image (PNG, JPG, JPEG, WebP, GIF)</label>
                            <input
                                key={`${selectedTemplate}-${templateFileKey}`}
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const dataUrl = await fileToDataUrl(file);
                                        setIsTemplateFromGallery(false); // Mark as newly uploaded
                                        if (selectedTemplate === 'toss') setTossLayerImage(dataUrl);
                                        else if (selectedTemplate === 'powerplay') setPowerplayLayerImage(dataUrl);
                                        else if (selectedTemplate === 'innings_end') setInningsEndLayerImage(dataUrl);
                                        else if (selectedTemplate === 'target') setTargetLayerImage(dataUrl);
                                        else if (selectedTemplate === 'match_result') setMatchResultLayerImage(dataUrl);
                                        else if (selectedTemplate === 'playing_xi') setPlayingXILayerImage(dataUrl);
                                        else if (selectedTemplate === 'milestone') setMilestoneLayerImage(dataUrl);
                                        else if (selectedTemplate === 'fall_of_wicket') setFallOfWicketLayerImage(dataUrl);
                                    }
                                }}
                            />
                            {(() => {
                                const currentImage =
                                    selectedTemplate === 'toss' ? tossLayerImage :
                                        selectedTemplate === 'powerplay' ? powerplayLayerImage :
                                            selectedTemplate === 'innings_end' ? inningsEndLayerImage :
                                                selectedTemplate === 'target' ? targetLayerImage :
                                                    selectedTemplate === 'match_result' ? matchResultLayerImage :
                                                        selectedTemplate === 'playing_xi' ? playingXILayerImage :
                                                            selectedTemplate === 'milestone' ? milestoneLayerImage :
                                                                selectedTemplate === 'fall_of_wicket' ? fallOfWicketLayerImage : '';
                                return currentImage ? (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-12 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                                <img src={currentImage} alt="Template" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            </div>
                                            <span className="text-xs text-green-400 truncate flex-1">Image selected</span>
                                            <button
                                                onClick={clearCurrentTemplateImage}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {/* Drag instruction and reset position */}
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Drag image in preview to reposition</span>
                                            {(imageOffset.x !== 0 || imageOffset.y !== 0) && (
                                                <button
                                                    onClick={resetImagePosition}
                                                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition"
                                                >
                                                    Reset Position
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* Saved Images Display */}
                            {(() => {
                                // Determine which team to fetch images for
                                let teamId: number | null = null;
                                let milestone: string | null = null;
                                let teamLabel = 'team';

                                if (selectedTemplate === 'toss' && tossForm.tossWinner) {
                                    teamId = teams.find(t => t.name.toUpperCase() === tossForm.tossWinner)?.team_id || null;
                                    teamLabel = tossForm.tossWinner;
                                }
                                else if (selectedTemplate === 'powerplay' && powerplayForm.battingTeam) {
                                    teamId = teams.find(t => t.name.toUpperCase() === powerplayForm.battingTeam)?.team_id || null;
                                    teamLabel = powerplayForm.battingTeam;
                                }
                                else if (selectedTemplate === 'innings_end' && inningsEndForm.battingTeam) {
                                    teamId = teams.find(t => t.name.toUpperCase() === inningsEndForm.battingTeam)?.team_id || null;
                                    teamLabel = inningsEndForm.battingTeam;
                                }
                                else if (selectedTemplate === 'target' && targetForm.chasingTeam) {
                                    teamId = teams.find(t => t.name.toUpperCase() === targetForm.chasingTeam)?.team_id || null;
                                    teamLabel = targetForm.chasingTeam;
                                }
                                else if (selectedTemplate === 'match_result' && matchResultForm.winningTeam) {
                                    teamId = teams.find(t => t.name.toUpperCase() === matchResultForm.winningTeam)?.team_id || null;
                                    teamLabel = matchResultForm.winningTeam;
                                }
                                else if (selectedTemplate === 'playing_xi' && playingXIForm.teamName) {
                                    teamId = teams.find(t => t.name.toUpperCase() === playingXIForm.teamName)?.team_id || null;
                                    teamLabel = playingXIForm.teamName;
                                }
                                else if (selectedTemplate === 'milestone' && milestoneTeamId) {
                                    teamId = milestoneTeamId;
                                    milestone = milestoneForm.milestone.toString();
                                    const team = teams.find(t => t.team_id === milestoneTeamId);
                                    teamLabel = team?.name || 'team';
                                }
                                else if (selectedTemplate === 'fall_of_wicket' && fallOfWicketForm.battingTeam) {
                                    teamId = teams.find(t => t.name.toUpperCase() === fallOfWicketForm.battingTeam)?.team_id || null;
                                    teamLabel = fallOfWicketForm.battingTeam;
                                }

                                return (
                                    <div className="mt-3 border-t border-gray-600 pt-3">
                                        <p className="text-xs text-gray-500 mb-2">
                                            {teamId ? `Saved Images for ${teamLabel}:` : 'Select a team to see saved images'}
                                        </p>
                                        {teamId ? (
                                            loadingSavedImages ? (
                                                <p className="text-xs text-gray-400">Loading...</p>
                                            ) : savedImages.length > 0 ? (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {savedImages.map(img => (
                                                        <div key={img.id} className="relative group">
                                                            <div
                                                                onClick={() => {
                                                                    setCurrentTemplateImage(img.image_url);
                                                                    setTemplateFileKey(prev => prev + 1);
                                                                    setIsTemplateFromGallery(true);
                                                                }}
                                                                className="cursor-pointer border-2 border-gray-600 hover:border-green-500 rounded overflow-hidden transition"
                                                                title="Click to use this image"
                                                            >
                                                                <img src={img.image_url} alt="Saved" className="w-full h-16 object-cover" />
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteSavedImage(img.id, 'template');
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition"
                                                                title="Delete"
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400">No saved images yet for this template</p>
                                            )
                                        ) : (
                                            <p className="text-xs text-yellow-400">Select a team above to see saved images</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Custom Logo URLs - only for templates that show logos */}
                    {['powerplay', 'innings_end', 'target', 'fall_of_wicket'].includes(selectedTemplate) && (
                        <div className="border-b border-gray-600 pb-3 mb-3">
                            <p className="text-xs text-gray-500 mb-2">Team Logo Images (VS Section)</p>
                            <div className="space-y-3">
                                {/* Team 1 Logo */}
                                <div>
                                    <label className={labelClass}>Team 1</label>
                                    <select
                                        className={inputClass}
                                        value={team1Selection || ''}
                                        onChange={e => {
                                            const teamId = Number(e.target.value);
                                            setTeam1Selection(teamId);
                                            setTeam1LogoFileKey(prev => prev + 1);
                                            const team = teams.find(t => t.team_id === teamId);
                                            if (team?.image_url) {
                                                setTeam1LogoUrl(team.image_url);
                                            } else {
                                                setTeam1LogoUrl('');
                                            }
                                        }}
                                    >
                                        <option value="">Select Team 1</option>
                                        {teams.map(team => (
                                            <option key={team.team_id} value={team.team_id}>{team.name}</option>
                                        ))}
                                    </select>
                                    {team1Selection && (
                                        <div className="mt-2">
                                            {/* Saved logos for Team 1 */}
                                            {savedTeam1Logos.length > 0 && (
                                                <div className="mb-2">
                                                    <label className={labelClass}>Saved Logos (click to use)</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {savedTeam1Logos.map(logo => (
                                                            <div key={logo.id} className="relative group">
                                                                <div
                                                                    onClick={() => {
                                                                        setTeam1LogoUrl(logo.image_url);
                                                                        setTeam1LogoFileKey(prev => prev + 1);
                                                                        setIsTeam1LogoFromGallery(true);
                                                                    }}
                                                                    className="w-10 h-10 bg-gray-600 rounded cursor-pointer border-2 border-gray-500 hover:border-green-500 overflow-hidden transition"
                                                                    title="Click to use this logo"
                                                                >
                                                                    <img src={logo.image_url} alt="Saved logo" className="w-full h-full object-contain" />
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteSavedImage(logo.id, 'logo'); }}
                                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                                                    title="Delete"
                                                                >x</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <label className={labelClass}>Upload Logo</label>
                                            <input
                                                key={team1LogoFileKey}
                                                type="file"
                                                accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                                                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const dataUrl = await fileToDataUrl(file);
                                                        setTeam1LogoUrl(dataUrl);
                                                        setIsTeam1LogoFromGallery(false); // Mark as newly uploaded
                                                    }
                                                }}
                                            />
                                            {team1LogoUrl && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                                        <img src={team1LogoUrl} alt="Team 1" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    </div>
                                                    <span className="text-xs text-green-400 truncate flex-1">Logo selected</span>
                                                    <button
                                                        onClick={() => { setTeam1LogoUrl(''); setTeam1LogoFileKey(prev => prev + 1); setIsTeam1LogoFromGallery(false); }}
                                                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                                                    >Clear</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Team 2 Logo */}
                                <div>
                                    <label className={labelClass}>Team 2</label>
                                    <select
                                        className={inputClass}
                                        value={team2Selection || ''}
                                        onChange={e => {
                                            const teamId = Number(e.target.value);
                                            setTeam2Selection(teamId);
                                            setTeam2LogoFileKey(prev => prev + 1);
                                            const team = teams.find(t => t.team_id === teamId);
                                            if (team?.image_url) {
                                                setTeam2LogoUrl(team.image_url);
                                            } else {
                                                setTeam2LogoUrl('');
                                            }
                                        }}
                                    >
                                        <option value="">Select Team 2</option>
                                        {teams.map(team => (
                                            <option key={team.team_id} value={team.team_id}>{team.name}</option>
                                        ))}
                                    </select>
                                    {team2Selection && (
                                        <div className="mt-2">
                                            {/* Saved logos for Team 2 */}
                                            {savedTeam2Logos.length > 0 && (
                                                <div className="mb-2">
                                                    <label className={labelClass}>Saved Logos (click to use)</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {savedTeam2Logos.map(logo => (
                                                            <div key={logo.id} className="relative group">
                                                                <div
                                                                    onClick={() => {
                                                                        setTeam2LogoUrl(logo.image_url);
                                                                        setTeam2LogoFileKey(prev => prev + 1);
                                                                        setIsTeam2LogoFromGallery(true);
                                                                    }}
                                                                    className="w-10 h-10 bg-gray-600 rounded cursor-pointer border-2 border-gray-500 hover:border-green-500 overflow-hidden transition"
                                                                    title="Click to use this logo"
                                                                >
                                                                    <img src={logo.image_url} alt="Saved logo" className="w-full h-full object-contain" />
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteSavedImage(logo.id, 'logo'); }}
                                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                                                    title="Delete"
                                                                >x</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <label className={labelClass}>Upload Logo</label>
                                            <input
                                                key={team2LogoFileKey}
                                                type="file"
                                                accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                                                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const dataUrl = await fileToDataUrl(file);
                                                        setTeam2LogoUrl(dataUrl);
                                                        setIsTeam2LogoFromGallery(false); // Mark as newly uploaded
                                                    }
                                                }}
                                            />
                                            {team2LogoUrl && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                                        <img src={team2LogoUrl} alt="Team 2" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    </div>
                                                    <span className="text-xs text-green-400 truncate flex-1">Logo selected</span>
                                                    <button
                                                        onClick={() => { setTeam2LogoUrl(''); setTeam2LogoFileKey(prev => prev + 1); setIsTeam2LogoFromGallery(false); }}
                                                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                                                    >Clear</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Single Team Logo - for milestone template */}
                    {selectedTemplate === 'milestone' && milestoneTeamId && (
                        <div className="border-b border-gray-600 pb-3 mb-3">
                            <p className="text-xs text-gray-500 mb-2">Team Logo</p>
                            <div>
                                {/* Saved logos for milestone team */}
                                {savedMilestoneLogos.length > 0 && (
                                    <div className="mb-2">
                                        <label className={labelClass}>Saved Logos (click to use)</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {savedMilestoneLogos.map(logo => (
                                                <div key={logo.id} className="relative group">
                                                    <div
                                                        onClick={() => {
                                                            setTeam1LogoUrl(logo.image_url);
                                                            setMilestoneLogoFileKey(prev => prev + 1);
                                                            setIsTeam1LogoFromGallery(true);
                                                        }}
                                                        className="w-10 h-10 bg-gray-600 rounded cursor-pointer border-2 border-gray-500 hover:border-green-500 overflow-hidden transition"
                                                        title="Click to use this logo"
                                                    >
                                                        <img src={logo.image_url} alt="Saved logo" className="w-full h-full object-contain" />
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSavedImage(logo.id, 'logo'); }}
                                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                                        title="Delete"
                                                    >x</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <label className={labelClass}>Upload Logo</label>
                                <input
                                    key={milestoneLogoFileKey}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                                    className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const dataUrl = await fileToDataUrl(file);
                                            setTeam1LogoUrl(dataUrl);
                                            setIsTeam1LogoFromGallery(false); // Mark as newly uploaded
                                        }
                                    }}
                                />
                                {team1LogoUrl && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                                            <img src={team1LogoUrl} alt="Team Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                        <span className="text-xs text-green-400 truncate flex-1">Logo selected</span>
                                        <button
                                            onClick={() => { setTeam1LogoUrl(''); setMilestoneLogoFileKey(prev => prev + 1); setIsTeam1LogoFromGallery(false); }}
                                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                                        >Clear</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SAVE ALL BUTTON - only show when NEW image is uploaded (data: URL), not when using saved images */}
                    {(() => {
                        const currentTemplateImage = getCurrentTemplateImage();
                        // Only count as "has NEW image" if it's uploaded AND not from gallery
                        const hasNewTemplateImage = !!currentTemplateImage && currentTemplateImage.startsWith('data:') && !isTemplateFromGallery;
                        const hasNewTeam1Logo = !!team1LogoUrl && team1LogoUrl.startsWith('data:') && !isTeam1LogoFromGallery;
                        const hasNewTeam2Logo = !!team2LogoUrl && team2LogoUrl.startsWith('data:') && !isTeam2LogoFromGallery;
                        const hasAnyNewImage = hasNewTemplateImage || hasNewTeam1Logo || hasNewTeam2Logo;

                        if (!hasAnyNewImage) return null;

                        return (
                            <div className="mt-4 pt-4 border-t border-gray-600">
                                <button
                                    onClick={saveAllImages}
                                    disabled={savingImage}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-base"
                                >
                                    {savingImage ? 'Saving...' : 'Save Images'}
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Saves template image and team logos for reuse
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {/* Preview + Download */}
                <div className="flex-1 flex flex-col items-center">
                    <PreviewWithDrag
                        posterRef={posterRef}
                        renderTemplate={renderTemplate}
                        hasImage={!!getCurrentTemplateImage()}
                        imageOffset={imageOffset}
                        onImageOffsetChange={handleImageOffsetChange}
                    />

                    <button
                        onClick={downloadPoster}
                        className="mt-6 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all text-lg"
                    >
                        Download Poster (1080x1350)
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirmation Dialog */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setConfirmDialog(null)}>
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-green-500 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-green-400 mb-4">Confirm Delete</h3>
                        <p className="text-gray-300 mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
