'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TargetTemplateProps {
    targetImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    /** Batting team name (dynamic) */
    battingTeam: string;
    /** Total score (dynamic) */
    score: number;
    /** Wickets fallen (dynamic) */
    wickets: number;
    /** Overs bowled (dynamic) */
    overs: number;
    /** Chasing team name (dynamic) */
    chasingTeam: string;
    /** Target runs (dynamic) */
    target: number;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function TargetTemplate({
    targetImage,
    team1Logo,
    chasingTeam,
    battingTeam,
    score,
    wickets,
    overs,
    target,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: TargetTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={targetImage}
            templateLayerStyle={{ left: -600, top: 0, width: 2032, height: 1355 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
        >
            {/* TARGET Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 288.53, top: 904.62,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 120,
                    lineHeight: '120px',
                    color: '#ffffff',
                    letterSpacing: 6,
                }}
            >
                target
            </p>

            {/* Score section with team flag */}
            <div className="absolute" style={{ left: 0, top: 0 }}>
                {team1Logo && (
                    <div className="absolute" style={{ left: 442, top: 1042, width: 99, height: 50 }}>
                        <img src={team1Logo} alt="" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                )}
                <p
                    className="absolute uppercase"
                    style={{
                        left: 555.26, top: 1037.85,
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
                    style={{ left: 555.63, top: 1078.87 }}
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

            {/* Orange line divider */}
            <div className="absolute" style={{ left: 252, top: 1117.5, width: 576, height: 2, backgroundColor: '#ff9100' }} />

            {/* Target text */}
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
        </BaseTemplate>
    );
}
