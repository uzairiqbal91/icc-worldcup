'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MatchResultTemplateProps {
    /** DYNAMIC: The main match result image - changes per match */
    matchResultImage?: string;
    /** The winning team name (dynamic) */
    winningTeam: string;
    /** Result text e.g. "won by 106 runs" (dynamic) */
    resultText: string;
}

export default function MatchResultTemplate({
    matchResultImage = "/assets/templates/match-end-layer.png",
    winningTeam,
    resultText
}: MatchResultTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={matchResultImage}
            templateLayerStyle={{ left: -818, top: 0, width: 1972, height: 1359 }}
            templateLayer2="/assets/templates/match-end-layer7.png"
            templateLayer2Style={{ left: 911, top: 45, width: 124, height: 111 }}
            showVsSection={false}
            mycoVariant="color"
        >
            {/* Winning Team Name */}
            <p
                className="absolute uppercase text-center"
                style={{
                    left: '50%', top: 944,
                    transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 150,
                    lineHeight: '150px',
                    color: '#ffffff',
                    letterSpacing: -2.2,
                    whiteSpace: 'nowrap',
                }}
            >
                {winningTeam}
            </p>

            {/* Result Text */}
            <p
                className="absolute uppercase text-center"
                style={{
                    left: '50%', top: 1086,
                    transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffdc29',
                    letterSpacing: 0.14,
                    whiteSpace: 'nowrap',
                }}
            >
                {resultText}
            </p>
        </BaseTemplate>
    );
}
