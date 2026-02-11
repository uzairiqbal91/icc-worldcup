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
    /**
     * DYNAMIC: The main innings end image - changes per match
     * Recommended size: 2048×1359px (landscape)
     */
    inningsEndImage?: string;
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
    /** Innings number 1 or 2 (dynamic) */
    inningsNumber: number;
    /** Top batsmen stats (dynamic) */
    topBatsmen?: PlayerStats[];
    /** Top bowlers stats (dynamic) */
    topBowlers?: PlayerStats[];
    /** Image position offset X (for drag/drop repositioning) */
    imageOffsetX?: number;
    /** Image position offset Y (for drag/drop repositioning) */
    imageOffsetY?: number;
}

export default function InningsEndTemplate({
    inningsEndImage,
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs,
    inningsNumber,
    topBatsmen = [],
    topBowlers = [],
    imageOffsetX = 0,
    imageOffsetY = 0,
}: InningsEndTemplateProps) {
    const inningsText = inningsNumber === 1 ? '1st Innings' : '2nd Innings';

    const formatBatsmen = () => {
        return topBatsmen.slice(0, 2).map((bat, i) => {
            const parts = bat.name.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            return (
                <span key={`bat-${i}`}>
                    <span style={{ fontWeight: 500 }}>{firstName} </span>
                    <span style={{ fontWeight: 700 }}>{lastName}</span>
                    <span style={{ fontWeight: 700 }}>{' '}{bat.runs}</span>
                    {bat.balls && <span style={{ fontWeight: 500 }}> ({bat.balls})</span>}
                    {i < topBatsmen.slice(0, 2).length - 1 && '   '}
                </span>
            );
        });
    };

    const formatBowlers = () => {
        return topBowlers.slice(0, 2).map((bowl, i) => {
            const parts = bowl.name.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            return (
                <span key={`bowl-${i}`}>
                    <span style={{ fontWeight: 500 }}>{firstName} </span>
                    <span style={{ fontWeight: 700 }}>{lastName}</span>
                    <span style={{ fontWeight: 700 }}>{' '}{bowl.wickets}-{bowl.runsGiven}</span>
                    {i < topBowlers.slice(0, 2).length - 1 && '   '}
                </span>
            );
        });
    };

    return (
        <BaseTemplate
            templateLayer={inningsEndImage}
            templateLayerStyle={{ left: -530, top: 0, width: 2048, height: 1359 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            mycoVariant="white"
        >
            {/* End of */}
            <p
                className="absolute uppercase"
                style={{
                    left: 465.23, top: 812.43,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 30,
                    lineHeight: '30px',
                    color: '#d40000',
                    letterSpacing: 6,
                }}
            >
                End of
            </p>

            {/* 1st Innings */}
            <p
                className="absolute uppercase"
                style={{
                    left: 238.6, top: 836.76,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: -1.86,
                }}
            >
                {inningsText}
            </p>

            {/* Team name and Score */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 943.48,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                }}
            >
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: '55px',
                    color: '#ffdc29',
                    letterSpacing: 0.59,
                }}>
                    {battingTeam}
                </p>
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    lineHeight: '55px',
                    color: '#ffffff',
                    letterSpacing: 1.78,
                }}>
                    {score}/{wickets}{'  '}{overs} Overs
                </p>
            </div>

            {/* Top Batsmen - First Line */}
            {topBatsmen.length > 0 && (
                <div
                    className="absolute uppercase text-center"
                    style={{
                        left: '50%', top: 1065,
                        transform: 'translateX(-50%)',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: '28px',
                        color: '#ffffff',
                        letterSpacing: 2.08,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatBatsmen()}
                </div>
            )}

            {/* Top Bowlers - Second Line */}
            {topBowlers.length > 0 && (
                <div
                    className="absolute uppercase text-center"
                    style={{
                        left: '50%', top: 1100,
                        transform: 'translateX(-50%)',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: '28px',
                        color: '#ffffff',
                        letterSpacing: 2.08,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatBowlers()}
                </div>
            )}
        </BaseTemplate>
    );
}
