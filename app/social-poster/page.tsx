'use client';

import { useRef, useState } from 'react';
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

type TemplateType = 'match_end' | 'target' | 'innings_end' | 'powerplay' | 'playing_xi' | 'milestone' | 'toss' | 'fall_of_wicket';

export default function SocialPosterPage() {
    const posterRef = useRef<HTMLDivElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('match_end');

    // Dynamic match data - these would come from API/props
    const [matchData] = useState({
        team1Logo: '/assets/team1-logo.png',
        team2Logo: '/assets/team2-logo.png',
        team1Name: 'Sri Lanka',
        team2Name: 'Ireland',
    });

    const downloadPoster = async () => {
        if (!posterRef.current) return;
        try {
            // @ts-ignore
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
                height: '1350px',
                display: 'block',
                margin: '0',
                padding: '0'
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
                height: 1350,
                style: {
                    transform: 'none',
                    left: '0',
                    top: '0'
                }
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
        { key: 'match_end', label: 'Match End' },
        { key: 'target', label: 'Target' },
        { key: 'innings_end', label: '1st Innings End' },
        { key: 'powerplay', label: 'Powerplay End' },
        { key: 'playing_xi', label: 'Playing XI' },
        { key: 'milestone', label: '50/100' },
        { key: 'toss', label: 'Toss' },
        { key: 'fall_of_wicket', label: 'Fall of Wicket' },
    ];

    const renderTemplate = () => {
        switch (selectedTemplate) {
            case 'match_end':
                return (
                    <MatchResultTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        winningTeam={matchData.team1Name}
                        resultText="won by 106 runs"
                    />
                );
            case 'target':
                return (
                    <TargetTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        chasingTeam={matchData.team2Name}
                        target={267}
                    />
                );
            case 'innings_end':
                return (
                    <InningsEndTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        battingTeam={matchData.team1Name}
                        score={267}
                        wickets={5}
                        overs={50}
                        inningsNumber={1}
                        topBatsmen={[
                            { name: 'Vimath Dinsara', runs: 95, balls: 102 },
                            { name: 'Chamika Heenatigala', runs: 51, balls: 53 },
                        ]}
                        topBowlers={[
                            { name: 'Oliver Riley', wickets: 2, runsGiven: 51 },
                            { name: 'Luke Murray', wickets: 1, runsGiven: 47 },
                        ]}
                    />
                );
            case 'powerplay':
                return (
                    <PowerplayTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        battingTeam={matchData.team1Name}
                        score={44}
                        wickets={2}
                        overs={10}
                    />
                );
            case 'playing_xi':
                return (
                    <PlayingXITemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        teamName="Pakistan"
                        opponent="Zimbabwe"
                        players={[
                            { name: 'Ali Hassan Baloch' },
                            { name: 'Sameer Minhas' },
                            { name: 'Usman Khan' },
                            { name: 'Ahmed Hussain' },
                            { name: 'Farhan Yousuf', isCaptain: true },
                            { name: 'Huzaifa Ahsan' },
                            { name: 'Hamza Zahoor', isWicketkeeper: true },
                            { name: 'Abdul Subhan' },
                            { name: 'Momin Qamar' },
                            { name: 'Mohammad Sayyam' },
                            { name: 'Ali Raza' },
                        ]}
                    />
                );
            case 'milestone':
                return (
                    <MilestoneTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        playerFirstName="TanEz"
                        playerLastName="francis"
                        milestone={100}
                    />
                );
            case 'toss':
                return (
                    <TossTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        tossWinner={matchData.team1Name}
                        tossDecision="bat"
                    />
                );
            case 'fall_of_wicket':
                return (
                    <FallOfWicketTemplate
                        team1Logo={matchData.team1Logo}
                        team2Logo={matchData.team2Logo}
                        battingTeam="Tanzania"
                        score={31}
                        wickets={3}
                        overs={15.3}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Social Media Poster Generator</h1>

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

            <div className="flex justify-center">
                <div className="relative" style={{ width: '540px', height: '675px' }}>
                    <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                        <div
                            id="poster-to-download"
                            ref={posterRef}
                            className="overflow-hidden"
                            style={{
                                width: '1080px',
                                height: '1350px',
                                position: 'relative'
                            }}
                        >
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
        </div>
    );
}
