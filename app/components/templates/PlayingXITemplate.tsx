'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface Player {
    name: string;
    isCaptain?: boolean;
    isWicketkeeper?: boolean;
}

interface PlayingXITemplateProps {
    playingXIImage?: string;
    teamName: string;
    opponent: string;
    players: Player[];
    team1Logo?: string;
    team2Logo?: string;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function PlayingXITemplate({
    playingXIImage,
    teamName,
    opponent,
    players,
    team1Logo,
    team2Logo,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: PlayingXITemplateProps) {
    return (
        <BaseTemplate
            templateLayer={playingXIImage}
            templateLayerStyle={{ left: -120, top: 0, width: 2107, height: 1353 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
            templateLayer2="/assets/templates/playing-xi-layer2.png"
            templateLayer2Style={{ left: 0, top: 0, width: 1316, height: 1352 }}
            showRightBolt={false}
        >
            {/* PLAYING XI Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 50.54, top: 213.91,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 72,
                    lineHeight: '72px',
                    color: '#ffffff',
                    letterSpacing: -1.8,
                }}
            >
                playing xi
            </p>

            {/* Player List */}
            <div
                className="absolute uppercase"
                style={{
                    left: 52.14, top: 318.57,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 30,
                    lineHeight: '42px',
                    color: '#ffffff',
                    letterSpacing: 0.59,
                    whiteSpace: 'nowrap',
                }}
            >
                {players.slice(0, 11).map((player, i) => {
                    const parts = player.name.split(' ');
                    const firstName = parts[0];
                    const lastName = parts.slice(1).join(' ') || '';
                    let suffix = '';
                    if (player.isCaptain && player.isWicketkeeper) suffix = '  (C)  (WK)';
                    else if (player.isCaptain) suffix = '  (C)';
                    else if (player.isWicketkeeper) suffix = '  (WK)';

                    return (
                        <p key={i} style={{ margin: 0 }}>
                            <span style={{ fontWeight: 400 }}>{firstName} </span>
                            <span style={{ fontWeight: 700 }}>{lastName}</span>
                            {suffix && <span style={{ fontWeight: 400 }}>{suffix}</span>}
                        </p>
                    );
                })}
            </div>

            {/* VS Section with team logos */}
            {team1Logo && team2Logo && (
                <div className="absolute" style={{ left: 0, top: 0 }}>
                    <div className="absolute" style={{ left: 54, top: 893, width: 114, height: 58 }}>
                        <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <p
                        className="absolute uppercase"
                        style={{
                            left: 183.65, top: 901.63,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: 39.23,
                            lineHeight: '39.23px',
                            color: '#ff9100',
                            letterSpacing: 19.62,
                        }}
                    >
                        v
                    </p>
                    <div className="absolute" style={{ left: 228, top: 894, width: 115, height: 57 }}>
                        <img src={team2Logo} alt="Team 2" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                </div>
            )}
        </BaseTemplate>
    );
}
