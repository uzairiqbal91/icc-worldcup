'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PlayerOfTheMatchTemplateProps {
    /** DYNAMIC: Player image */
    playerImage?: string;
    /** Player name (dynamic) */
    playerName: string;
    /** Team 1 logo (dynamic) */
    team1Logo?: string;
    /** Team 2 logo (dynamic) */
    team2Logo?: string;
    /** Image position offset X (for drag/drop repositioning) */
    imageOffsetX?: number;
    /** Image position offset Y (for drag/drop repositioning) */
    imageOffsetY?: number;
}

export default function PlayerOfTheMatchTemplate({
    playerImage,
    playerName,
    team1Logo,
    team2Logo,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: PlayerOfTheMatchTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={playerImage}
            templateLayerStyle={{ left: -471, top: 0, width: 2023, height: 1350 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* PLAYER OF THE MATCH Title */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 846.72,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '90px',
                    color: '#ffffff',
                    letterSpacing: -0.59,
                }}
            >
                <p style={{ margin: 0 }}>player of</p>
                <p style={{ margin: 0 }}>the match</p>
            </div>

            {/* VS Section with team logos */}
            {team1Logo && team2Logo && (
                <div className="absolute" style={{ left: 0, top: 0 }}>
                    <div className="absolute" style={{ left: 431, top: 1061, width: 90, height: 44 }}>
                        <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <p
                        className="absolute uppercase"
                        style={{
                            left: 533, top: 1068,
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
                    <div className="absolute" style={{ left: 570, top: 1061, width: 90, height: 44 }}>
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
                    letterSpacing: 1.41,
                }}
            >
                {playerName}
            </p>
        </BaseTemplate>
    );
}
