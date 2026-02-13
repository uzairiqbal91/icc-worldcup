'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MatchResultTemplateProps {
    matchResultImage?: string;
    winningTeam: string;
    resultText: string;
    team1Logo?: string;
    team2Logo?: string;
    team1Score?: string;
    team1Overs?: string;
    team2Score?: string;
    team2Overs?: string;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function MatchResultTemplate({
    matchResultImage,
    winningTeam,
    resultText,
    team1Logo,
    team2Logo,
    team1Score,
    team1Overs,
    team2Score,
    team2Overs,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: MatchResultTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={matchResultImage}
            templateLayerStyle={{ left: 0, top: -110, width: 1086, height: 1629 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* Winning Team Name */}
            <p
                className="absolute uppercase"
                style={{
                    left: '50%', top: 945.66,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 72,
                    lineHeight: '72px',
                    color: '#ffffff',
                    letterSpacing: 1.27,
                }}
            >
                {winningTeam}
            </p>

            {/* Result Text (e.g. "in super over", "by 106 runs") */}
            <p
                className="absolute uppercase"
                style={{
                    left: '50%', top: 1020.01,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 40,
                    lineHeight: '40px',
                    color: '#ff9100',
                    letterSpacing: 2.34,
                }}
            >
                {resultText}
            </p>

            {/* Orange line divider */}
            <div className="absolute" style={{ left: 252, top: 1078.5, width: 576, height: 2, backgroundColor: '#ff9100' }} />

            {/* Team 1 score section */}
            <div className="absolute" style={{ left: 0, top: 0 }}>
                {team1Logo && (
                    <div className="absolute" style={{ left: 303, top: 1102, width: 99, height: 50 }}>
                        <img src={team1Logo} alt="" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                )}
                {team1Score && (
                    <>
                        <p
                            className="absolute uppercase"
                            style={{
                                left: 416.26, top: 1097.85,
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 400,
                                fontSize: 34.29,
                                lineHeight: '34.29px',
                                color: '#ffffff',
                                letterSpacing: -1.31,
                            }}
                        >
                            {team1Score}
                        </p>
                        {team1Overs && (
                            <div
                                className="absolute flex items-baseline gap-1"
                                style={{ left: 416.63, top: 1138.87 }}
                            >
                                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.72, lineHeight: '13.72px', color: '#ffffff', letterSpacing: 0.62, textTransform: 'uppercase' }}>
                                    {team1Overs}
                                </span>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.72, lineHeight: '13.72px', color: '#ffffff', letterSpacing: 0.62, textTransform: 'uppercase' }}>
                                    overs
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Team 2 score section */}
            <div className="absolute" style={{ left: 0, top: 0 }}>
                {team2Logo && (
                    <div className="absolute" style={{ left: 584, top: 1101, width: 100, height: 51 }}>
                        <img src={team2Logo} alt="" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                )}
                {team2Score && (
                    <>
                        <p
                            className="absolute uppercase"
                            style={{
                                left: 699.12, top: 1097.85,
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 400,
                                fontSize: 34.29,
                                lineHeight: '34.29px',
                                color: '#ffffff',
                                letterSpacing: -2.34,
                            }}
                        >
                            {team2Score}
                        </p>
                        {team2Overs && (
                            <div
                                className="absolute flex items-baseline gap-1"
                                style={{ left: 699.05, top: 1138.87 }}
                            >
                                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.72, lineHeight: '13.72px', color: '#ffffff', letterSpacing: 0.43, textTransform: 'uppercase' }}>
                                    {team2Overs}
                                </span>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.72, lineHeight: '13.72px', color: '#ffffff', letterSpacing: 0.43, textTransform: 'uppercase' }}>
                                    overs
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </BaseTemplate>
    );
}
