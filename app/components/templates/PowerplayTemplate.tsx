'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PowerplayTemplateProps {
    powerplayImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    battingTeam: string;
    score: number;
    wickets: number;
    overs: number;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function PowerplayTemplate({
    powerplayImage,
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: PowerplayTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={powerplayImage}
            templateLayerStyle={{ left: -2, top: -2, width: 1082, height: 1623 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* POWER PLAY Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 203.53, top: 861.72,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: 1.37,
                }}
            >
                power play
            </p>

            {/* VS Section with team logos */}
            {team1Logo && team2Logo && (
                <div className="absolute" style={{ left: 0, top: 0 }}>
                    <div className="absolute" style={{ left: 428, top: 991, width: 88, height: 45 }}>
                        <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <p
                        className="absolute uppercase"
                        style={{
                            left: 528.15, top: 997.42,
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
                    <div className="absolute" style={{ left: 563, top: 992, width: 87, height: 43 }}>
                        <img src={team2Logo} alt="Team 2" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                </div>
            )}

            {/* Team Name and Score */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 1072.7,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 40,
                    color: '#ffffff',
                }}
            >
                <p style={{ margin: 0, lineHeight: '45px' }}>
                    <span style={{ fontWeight: 700 }}>{battingTeam}</span>
                    <span style={{ fontWeight: 500 }}> {score}/{wickets}</span>
                </p>
                <p style={{ margin: 0, fontWeight: 500, lineHeight: '45px' }}>
                    {overs} Overs
                </p>
            </div>
        </BaseTemplate>
    );
}
