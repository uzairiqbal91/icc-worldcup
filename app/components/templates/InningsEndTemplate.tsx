'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PlayerStats {
    name: string;
    runs?: number;
    balls?: number;
    wickets?: number;
    runsGiven?: number;
}

interface InningsEndTemplateProps {
    backgroundImage?: string; // Celebration/fielding photo from API
    team1Logo?: string;
    team2Logo?: string;
    battingTeam: string;
    score: number;
    wickets: number;
    overs: number;
    inningsNumber: number; // 1 or 2
    topBatsmen?: PlayerStats[];
    topBowlers?: PlayerStats[];
}

export default function InningsEndTemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs,
    inningsNumber,
    topBatsmen = [],
    topBowlers = []
}: InningsEndTemplateProps) {
    const inningsText = inningsNumber === 1 ? '1ST' : '2ND';

    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* END OF */}
                <p
                    className="uppercase font-bold"
                    style={{
                        fontSize: 36,
                        fontFamily: 'Arial, sans-serif',
                        color: '#FFE135',
                        marginBottom: -5
                    }}
                >
                    END OF
                </p>

                {/* 1ST INNINGS Title */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 105,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 10,
                        letterSpacing: 2
                    }}
                >
                    {inningsText} INNINGS
                </h1>

                {/* Team Name */}
                <p
                    className="uppercase font-bold"
                    style={{
                        fontSize: 52,
                        fontFamily: 'Arial, sans-serif',
                        color: '#FFE135',
                        marginBottom: 10
                    }}
                >
                    {battingTeam}
                </p>

                {/* Score */}
                <p
                    className="text-white uppercase font-bold"
                    style={{
                        fontSize: 58,
                        fontFamily: 'Arial, sans-serif',
                        letterSpacing: 5,
                        marginBottom: 25
                    }}
                >
                    {score}/{wickets.toString().padStart(2, '0')}  {overs} OVERS
                </p>

                {/* Top Performers */}
                <div
                    className="text-white uppercase"
                    style={{
                        fontSize: 24,
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: 1.8
                    }}
                >
                    <div className="flex flex-wrap gap-x-10 gap-y-1">
                        {topBatsmen.slice(0, 2).map((batsman, i) => {
                            const nameParts = batsman.name.split(' ');
                            const firstName = nameParts[0];
                            const lastName = nameParts.slice(1).join(' ');
                            return (
                                <span key={`bat-${i}`}>
                                    <span className="font-normal text-gray-300">{firstName}</span>
                                    {' '}
                                    <span className="font-bold">{lastName}</span>
                                    {' '}
                                    <span className="font-bold">{batsman.runs}</span>
                                    {batsman.balls && <span className="font-normal text-gray-300"> ({batsman.balls})</span>}
                                </span>
                            );
                        })}
                        {topBowlers.slice(0, 2).map((bowler, i) => {
                            const nameParts = bowler.name.split(' ');
                            const firstName = nameParts[0];
                            const lastName = nameParts.slice(1).join(' ');
                            return (
                                <span key={`bowl-${i}`}>
                                    <span className="font-normal text-gray-300">{firstName}</span>
                                    {' '}
                                    <span className="font-bold">{lastName}</span>
                                    {' '}
                                    <span className="font-bold">{bowler.wickets}-{bowler.runsGiven}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </BaseTemplate>
    );
}
