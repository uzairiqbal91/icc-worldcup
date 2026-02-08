'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TargetTemplateProps {
    /** DYNAMIC: The main target image - changes per match */
    targetImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    /** Team that needs to chase (dynamic) */
    chasingTeam: string;
    /** Target runs (dynamic) */
    target: number;
}

export default function TargetTemplate({
    targetImage = "/assets/templates/target-layer.png",
    team1Logo,
    team2Logo,
    chasingTeam,
    target
}: TargetTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={targetImage}
            templateLayerStyle={{ left: -410, top: 0, width: 2024, height: 1350 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            mycoVariant="white"
        >
            {/* TARGET Title */}
            <p
                className="absolute uppercase text-center"
                style={{
                    left: '50%', top: 986.76,
                    transform: 'translateX(-50%)',
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
                className="absolute uppercase text-center"
                style={{
                    left: '50%', top: 1096.3,
                    transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 36,
                    lineHeight: '36px',
                    color: '#ffdc29',
                    letterSpacing: 0.6,
                    whiteSpace: 'nowrap',
                }}
            >
                {chasingTeam} need {target} runs to win
            </p>
        </BaseTemplate>
    );
}
