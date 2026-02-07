'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MilestoneTemplateProps {
    team1Logo?: string;
    team2Logo?: string;
    playerImage?: string;
    /** Player first name (dynamic) */
    playerFirstName: string;
    /** Player last name (dynamic) */
    playerLastName: string;
    /** Milestone: 50 or 100 (dynamic) */
    milestone: number;
}

export default function MilestoneTemplate({
    team1Logo,
    team2Logo,
    playerImage,
    playerFirstName,
    playerLastName,
    milestone
}: MilestoneTemplateProps) {
    return (
        <BaseTemplate
            templateLayer="/assets/templates/milestone-layer.png"
            templateLayerStyle={{ left: -484, top: 0, width: 2048, height: 1405 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            playerImage={playerImage}
            playerImageStyle={{ left: 50, top: 150, width: 500, height: 650 }}
            showVsSection={false}
            mycoVariant="white"
        >
            {/* Milestone number (50 or 100) */}
            <p
                className="absolute uppercase"
                style={{
                    left: 285.28, top: 636,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 311.42,
                    lineHeight: '311.42px',
                    color: '#ffffff',
                    letterSpacing: -31.02,
                }}
            >
                {milestone}
            </p>

            {/* RUNS */}
            <p
                className="absolute uppercase"
                style={{
                    left: 471.44, top: 937.48,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffffff',
                    letterSpacing: 0.38,
                }}
            >
                runs
            </p>

            {/* Divider line */}
            <div className="absolute" style={{ left: 271, top: 1022, width: 538, height: 1 }}>
                <img src="/assets/templates/line-divider.svg" alt="" className="w-full" />
            </div>

            {/* Player first name */}
            <p
                className="absolute uppercase"
                style={{
                    left: 478.4, top: 1070.43,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: '30px',
                    color: '#ffffff',
                    letterSpacing: 6,
                }}
            >
                {playerFirstName}
            </p>

            {/* Player last name */}
            <p
                className="absolute uppercase"
                style={{
                    left: 406.95, top: 1102.04,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffdc29',
                    letterSpacing: 9.6,
                }}
            >
                {playerLastName}
            </p>

            {/* Tournament logo */}
            <div className="absolute" style={{ left: 502, top: 1179, width: 76, height: 89 }}>
                <img src="/assets/templates/milestone-layer10.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </BaseTemplate>
    );
}
