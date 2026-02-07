'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MatchResultTemplateProps {
    team1Logo?: string;
    team2Logo?: string;
    playerImage?: string;
    /** The winning team name (dynamic) */
    winningTeam: string;
    /** Result text e.g. "won by 106 runs" (dynamic) */
    resultText: string;
}

export default function MatchResultTemplate({
    team1Logo,
    team2Logo,
    playerImage,
    winningTeam,
    resultText
}: MatchResultTemplateProps) {
    return (
        <BaseTemplate
            templateLayer="/assets/templates/match-end-layer.png"
            templateLayerStyle={{ left: -818, top: 0, width: 1972, height: 1359 }}
            templateLayer2="/assets/templates/match-end-layer7.png"
            templateLayer2Style={{ left: 911, top: 45, width: 124, height: 111 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            playerImage={playerImage}
            mycoVariant="color"
        >
            {/* Winning Team Name */}
            <p
                className="absolute uppercase"
                style={{
                    left: 149.4, top: 944,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 150,
                    lineHeight: '150px',
                    color: '#ffffff',
                    letterSpacing: -2.2,
                }}
            >
                {winningTeam}
            </p>

            {/* Result Text */}
            <p
                className="absolute uppercase"
                style={{
                    left: 320.45, top: 1086,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffdc29',
                    letterSpacing: 0.14,
                }}
            >
                {resultText}
            </p>
        </BaseTemplate>
    );
}
