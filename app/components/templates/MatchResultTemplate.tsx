'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MatchResultTemplateProps {
    /**
     * DYNAMIC: The main match result image - changes per match
     * Recommended size: 1972×1359px (landscape)
     */
    matchResultImage?: string;
    /** The winning team name (dynamic) */
    winningTeam: string;
    /** Result text e.g. "won by 106 runs" (dynamic) */
    resultText: string;
    /** Image position offset X (for drag/drop repositioning) */
    imageOffsetX?: number;
    /** Image position offset Y (for drag/drop repositioning) */
    imageOffsetY?: number;
}

export default function MatchResultTemplate({
    matchResultImage,
    winningTeam,
    resultText,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: MatchResultTemplateProps) {
    // Calculate font size based on team name length to prevent overflow
    const getTeamNameFontSize = (teamName: string) => {
        const length = teamName.length;
        if (length <= 8) return 150;
        if (length <= 10) return 130;
        if (length <= 12) return 110;
        if (length <= 15) return 90;
        return 70;
    };

    const teamNameFontSize = getTeamNameFontSize(winningTeam);

    return (
        <BaseTemplate
            templateLayer={matchResultImage}
            templateLayerStyle={{ left: -818, top: 0, width: 1972, height: 1359 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
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
                    fontSize: teamNameFontSize,
                    lineHeight: `${teamNameFontSize}px`,
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
