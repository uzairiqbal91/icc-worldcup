'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TossTemplateProps {
    backgroundImage?: string; // Toss moment photo from API
    team1Logo?: string;
    team2Logo?: string;
    tossWinner: string;
    tossDecision: string; // 'Batting' or 'Bowling'
}

export default function TossTemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    tossWinner,
    tossDecision
}: TossTemplateProps) {
    const decisionText = tossDecision.toLowerCase().includes('bat')
        ? 'ELECTED TO BAT FIRST'
        : 'ELECTED TO BOWL FIRST';

    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* TOSS UPDATE Title */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 95,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 25,
                        letterSpacing: 2
                    }}
                >
                    TOSS UPDATE
                </h1>

                {/* Toss Result */}
                <p
                    className="uppercase"
                    style={{
                        fontSize: 38,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 600,
                        lineHeight: 1.5
                    }}
                >
                    <span style={{ color: '#FFE135' }}>{tossWinner}</span>
                    <span className="text-white"> WON THE TOSS</span>
                </p>
                <p
                    className="uppercase text-white"
                    style={{
                        fontSize: 38,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 600
                    }}
                >
                    & {decisionText}
                </p>
            </div>
        </BaseTemplate>
    );
}
