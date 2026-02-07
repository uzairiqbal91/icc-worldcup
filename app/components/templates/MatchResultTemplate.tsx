'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MatchResultTemplateProps {
    backgroundImage?: string; // Winning team celebration photo from API
    team1Logo?: string;
    team2Logo?: string;
    winningTeam: string;
    resultText: string; // e.g., "WON BY 106 RUNS" or "WON BY 5 WICKETS"
}

export default function MatchResultTemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    winningTeam,
    resultText
}: MatchResultTemplateProps) {
    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* Winning Team Name */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 110,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 15,
                        letterSpacing: 3
                    }}
                >
                    {winningTeam}
                </h1>

                {/* Result Text */}
                <p
                    className="uppercase font-bold"
                    style={{
                        fontSize: 50,
                        fontFamily: 'Arial, sans-serif',
                        color: '#FFE135'
                    }}
                >
                    {resultText}
                </p>
            </div>
        </BaseTemplate>
    );
}
