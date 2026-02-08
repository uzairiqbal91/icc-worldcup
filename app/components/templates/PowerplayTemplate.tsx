'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PowerplayTemplateProps {
    /** DYNAMIC: The main powerplay image - changes per match */
    powerplayImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    /** Batting team name (dynamic) */
    battingTeam: string;
    /** Score (dynamic) */
    score: number;
    /** Wickets (dynamic) */
    wickets: number;
    /** Overs (dynamic) */
    overs: number;
}

export default function PowerplayTemplate({
    powerplayImage = "/assets/templates/powerplay-layer.png",
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs
}: PowerplayTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={powerplayImage}
            templateLayerStyle={{ left: -490, top: 0, width: 1975, height: 1347 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            showVsSection={true}
            vsStyle="bottom-large"
            mycoVariant="white"
        >
            {/* POWER PLAY Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 217, top: 856.76,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: -1.56,
                }}
            >
                Power play
            </p>

            {/* Team Name and Score */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 981.48,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                }}
            >
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: '60px',
                    color: '#ffdc29',
                    letterSpacing: 0.39,
                }}>
                    {battingTeam}
                </p>
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    lineHeight: '60px',
                    color: '#ffffff',
                    letterSpacing: 1.17,
                }}>
                    {score}/{wickets.toString().padStart(2, '0')}{'  '}{overs} Overs
                </p>
            </div>
        </BaseTemplate>
    );
}
