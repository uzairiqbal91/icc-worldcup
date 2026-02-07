'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TargetTemplateProps {
    team1Logo?: string;
    team2Logo?: string;
    playerImage?: string;
    /** Team that needs to chase (dynamic) */
    chasingTeam: string;
    /** Target runs (dynamic) */
    target: number;
}

export default function TargetTemplate({
    team1Logo,
    team2Logo,
    playerImage,
    chasingTeam,
    target
}: TargetTemplateProps) {
    return (
        <BaseTemplate
            templateLayer="/assets/templates/target-layer.png"
            templateLayerStyle={{ left: -410, top: 0, width: 2024, height: 1350 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            playerImage={playerImage}
            mycoVariant="white"
        >
            {/* TARGET Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 349.35, top: 986.76,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: -4.1,
                }}
            >
                target
            </p>

            {/* Chasing team need X runs to win */}
            <p
                className="absolute uppercase"
                style={{
                    left: 239.85, top: 1096.3,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 36,
                    lineHeight: '36px',
                    color: '#ffdc29',
                    letterSpacing: 0.6,
                }}
            >
                {chasingTeam} need {target} runs to win
            </p>
        </BaseTemplate>
    );
}
