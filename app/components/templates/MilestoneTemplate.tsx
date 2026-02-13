'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MilestoneTemplateProps {
    milestoneImage?: string;
    playerFirstName: string;
    playerLastName: string;
    milestone: number;
    team1Logo?: string;
    team2Logo?: string;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function MilestoneTemplate({
    milestoneImage,
    playerFirstName,
    playerLastName,
    milestone,
    team1Logo,
    team2Logo,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: MilestoneTemplateProps) {
    // Combine first + last name for display
    const playerName = `${playerFirstName} ${playerLastName}`.trim();

    return (
        <BaseTemplate
            templateLayer={milestoneImage}
            templateLayerStyle={{ left: 0, top: 0, width: 1091, height: 1636 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* Milestone number (50 or 100) */}
            <p
                className="absolute uppercase"
                style={{
                    left: '50%', top: 760.72,
                    transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 300,
                    lineHeight: '300px',
                    color: '#ffffff',
                    letterSpacing: -16.41,
                }}
            >
                {milestone}
            </p>

            {/* VS Section with team logos */}
            {team1Logo && team2Logo && (
                <div className="absolute" style={{ left: 0, top: 0 }}>
                    <div className="absolute" style={{ left: 431, top: 1061, width: 80, height: 45 }}>
                        <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <p
                        className="absolute uppercase"
                        style={{
                            left: 523, top: 1068,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: 30,
                            lineHeight: '30px',
                            color: '#ff9100',
                            letterSpacing: 15,
                        }}
                    >
                        v
                    </p>
                    <div className="absolute" style={{ left: 560, top: 1061, width: 80, height: 45 }}>
                        <img src={team2Logo} alt="Team 2" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                </div>
            )}

            {/* Orange line divider */}
            <div className="absolute" style={{ left: 252, top: 1128.5, width: 576, height: 2, backgroundColor: '#ff9100' }} />

            {/* Player name */}
            <p
                className="absolute uppercase"
                style={{
                    left: '50%', top: 1154.25,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 30,
                    lineHeight: '30px',
                    color: '#ffe900',
                    letterSpacing: 3,
                }}
            >
                {playerName}
            </p>
        </BaseTemplate>
    );
}
