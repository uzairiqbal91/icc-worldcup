'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface PlayerStats {
    name: string;
    runs?: number;
    balls?: number;
    wickets?: number;
    runsGiven?: number;
}

interface InningsEndTemplateProps {
    inningsEndImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    battingTeam: string;
    score: number;
    wickets: number;
    overs: number;
    inningsNumber: number;
    chasingTeam?: string;
    target?: number;
    topBatsmen?: PlayerStats[];
    topBowlers?: PlayerStats[];
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function InningsEndTemplate({
    inningsEndImage,
    team1Logo,
    battingTeam,
    score,
    wickets,
    overs,
    inningsNumber,
    chasingTeam,
    target,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: InningsEndTemplateProps) {
    const inningsText = inningsNumber === 1 ? '1st innings' : '2nd innings';

    return (
        <BaseTemplate
            templateLayer={inningsEndImage}
            templateLayerStyle={{ left: -600, top: 0, width: 2032, height: 1355 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* END OF text */}
            <p
                className="absolute uppercase"
                style={{
                    left: 490.15, top: 923.46,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 24,
                    lineHeight: '24px',
                    color: '#ffffff',
                    letterSpacing: 2.06,
                }}
            >
                end of
            </p>

            {/* 1ST INNINGS Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 313.07, top: 945.66,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 72,
                    lineHeight: '72px',
                    color: '#ffffff',
                    letterSpacing: 0.91,
                }}
            >
                {inningsText}
            </p>

            {/* Orange line divider */}
            <div className="absolute" style={{ left: 252, top: 1028.5, width: 576, height: 2, backgroundColor: '#ff9100' }} />

            {/* Score section with team flag */}
            <div className="absolute" style={{ left: 0, top: 0 }}>
                {team1Logo && (
                    <div className="absolute" style={{ left: 442, top: 1062, width: 99, height: 50 }}>
                        <img src={team1Logo} alt="" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                )}
                <p
                    className="absolute uppercase"
                    style={{
                        left: 555.26, top: 1057.85,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        fontSize: 34.29,
                        lineHeight: '34.29px',
                        color: '#ffffff',
                        letterSpacing: -1.31,
                    }}
                >
                    {score}/{wickets}
                </p>
                <div
                    className="absolute flex items-baseline gap-1"
                    style={{ left: 555.63, top: 1098.87 }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: 13.72,
                            lineHeight: '13.72px',
                            color: '#ffffff',
                            letterSpacing: 0.64,
                            textTransform: 'uppercase',
                        }}
                    >
                        {overs}
                    </span>
                    <span
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: 13.72,
                            lineHeight: '13.72px',
                            color: '#ffffff',
                            letterSpacing: 0.64,
                            textTransform: 'uppercase',
                        }}
                    >
                        overs
                    </span>
                </div>
            </div>

            {/* Target text */}
            {chasingTeam && target && (
                <p
                    className="absolute uppercase"
                    style={{
                        left: '50%', top: 1139.69,
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 24,
                        lineHeight: '24px',
                        color: '#ffffff',
                        letterSpacing: 0.47,
                    }}
                >
                    <span style={{ fontWeight: 700 }}>{chasingTeam} </span>
                    <span style={{ fontWeight: 400 }}>need {target} runs to win</span>
                </p>
            )}
        </BaseTemplate>
    );
}
