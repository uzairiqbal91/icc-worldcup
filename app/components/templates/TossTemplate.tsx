'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TossTemplateProps {
    team1Logo?: string;
    team2Logo?: string;
    playerImage?: string;
    /** Toss winning team (dynamic) */
    tossWinner: string;
    /** Toss decision: 'bat' or 'bowl' (dynamic) */
    tossDecision: string;
}

export default function TossTemplate({
    team1Logo,
    team2Logo,
    playerImage,
    tossWinner,
    tossDecision
}: TossTemplateProps) {
    const decisionText = tossDecision.toLowerCase().includes('bat')
        ? 'elected to bat first'
        : 'elected to bowl first';

    return (
        <BaseTemplate
            templateLayer="/assets/templates/toss-layer.png"
            templateLayerStyle={{ left: -570, top: 0, width: 2069, height: 1361 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            playerImage={playerImage}
            showVsSection={false}
            mycoVariant="white"
        >
            {/* TOSS UPDATE Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 210.54, top: 966.3,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: -3.61,
                }}
            >
                Toss Update
            </p>

            {/* Toss result text */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 1083.74,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 36,
                    letterSpacing: 0.06,
                }}
            >
                <p style={{ margin: 0, lineHeight: '43.2px' }}>
                    <span style={{ fontWeight: 700, color: '#ffdc29' }}>{tossWinner}</span>
                    <span style={{ fontWeight: 400, color: '#ffdc29' }}> won the toss</span>
                </p>
                <p style={{ margin: 0, fontWeight: 400, color: '#ffdc29', lineHeight: '43.2px' }}>
                    & {decisionText}
                </p>
            </div>
        </BaseTemplate>
    );
}
