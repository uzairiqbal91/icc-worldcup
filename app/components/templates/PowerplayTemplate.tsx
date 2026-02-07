'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PowerplayTemplateProps {
    backgroundImage?: string; // Batting action photo from API
    team1Logo?: string;
    team2Logo?: string;
    battingTeam: string;
    score: number;
    wickets: number;
    overs: number;
}

export default function PowerplayTemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs
}: PowerplayTemplateProps) {
    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* POWER PLAY Title */}
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
                    POWER PLAY
                </h1>

                {/* Team Name */}
                <p
                    className="text-white uppercase font-bold"
                    style={{
                        fontSize: 52,
                        fontFamily: 'Arial, sans-serif',
                        marginBottom: 15
                    }}
                >
                    {battingTeam}
                </p>

                {/* Score */}
                <p
                    className="text-white uppercase font-bold"
                    style={{
                        fontSize: 60,
                        fontFamily: 'Arial, sans-serif',
                        letterSpacing: 6
                    }}
                >
                    {score}/{wickets.toString().padStart(2, '0')}  {overs} OVERS
                </p>
            </div>
        </BaseTemplate>
    );
}
