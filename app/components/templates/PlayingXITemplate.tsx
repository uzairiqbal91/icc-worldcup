'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface Player {
    name: string;
    isCaptain?: boolean;
    isWicketkeeper?: boolean;
}

interface PlayingXITemplateProps {
    /** 
     * DYNAMIC: The main playing XI image - changes per match
     * Recommended size: 2107×1353px (landscape)
     */
    playingXIImage?: string;
    /** Team name (dynamic) */
    teamName: string;
    /** Opponent name (dynamic) */
    opponent: string;
    /** List of 11 players (dynamic) */
    players: Player[];
}

export default function PlayingXITemplate({
    playingXIImage,
    teamName,
    opponent,
    players
}: PlayingXITemplateProps) {
    return (
        <BaseTemplate
            templateLayer={playingXIImage}
            templateLayerStyle={{ left: -120, top: 0, width: 2107, height: 1353 }}
            templateLayer2="/assets/templates/playing-xi-layer2.png"
            templateLayer2Style={{ left: 0, top: 0, width: 1316, height: 1352 }}
            // templateLayer3="/assets/templates/playing-xi-layer14.png"
            templateLayer3Style={{ left: 511, top: 105, width: 569, height: 1180 }}
            showVsSection={false}
            mycoVariant="color-white"
        >
            {/* Playing XI Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 31.52, top: 263.86,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 80,
                    lineHeight: '80px',
                    color: '#ffffff',
                    letterSpacing: -0.63,
                }}
            >
                Playing XI
            </p>

            {/* VS Opponent */}
            <p
                className="absolute uppercase"
                style={{
                    left: 35.45, top: 341.87,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: '30px',
                    color: '#ffdc29',
                    letterSpacing: 0.76,
                }}
            >
                vs {opponent}
            </p>

            {/* Player List */}
            <div
                className="absolute uppercase"
                style={{
                    left: 38.99, top: 394.57,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 30,
                    lineHeight: '60px',
                    color: '#ffffff',
                    letterSpacing: -0.13,
                    whiteSpace: 'nowrap',
                }}
            >
                {players.slice(0, 11).map((player, i) => {
                    const parts = player.name.split(' ');
                    const firstName = parts[0];
                    const lastName = parts.slice(1).join(' ') || '';
                    let suffix = '';
                    if (player.isCaptain && player.isWicketkeeper) suffix = '  (C & WK)';
                    else if (player.isCaptain) suffix = '  (C)';
                    else if (player.isWicketkeeper) suffix = '  (WK)';

                    return (
                        <p key={i} style={{ margin: 0 }}>
                            <span style={{ fontWeight: 400 }}>{firstName} </span>
                            <span style={{ fontWeight: 700 }}>{lastName}</span>
                            {suffix && <span style={{ fontWeight: 700, color: '#ffdc29' }}>{suffix}</span>}
                        </p>
                    );
                })}
            </div>
        </BaseTemplate>
    );
}
