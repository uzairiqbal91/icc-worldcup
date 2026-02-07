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
    team1Logo?: string;
    team2Logo?: string;
    playerImage?: string;
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
}

export default function InningsEndTemplate({
    team1Logo,
    team2Logo,
    playerImage,
    battingTeam,
    score,
    wickets,
    overs,
    inningsNumber,
    topBatsmen = [],
    topBowlers = []
}: InningsEndTemplateProps) {
    const inningsText = inningsNumber === 1 ? '1st Innings' : '2nd Innings';

    const formatPerformers = () => {
        const performers: React.ReactNode[] = [];
        topBatsmen.slice(0, 2).forEach((bat, i) => {
            const parts = bat.name.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            performers.push(
                <span key={`bat-${i}`}>
                    <span style={{ fontWeight: 500 }}>{firstName} </span>
                    <span style={{ fontWeight: 700 }}>{lastName}</span>
                    <span style={{ fontWeight: 700 }}>{' '}{bat.runs}</span>
                    {bat.balls && <span style={{ fontWeight: 500 }}> ({bat.balls})</span>}
                    {'   '}
                </span>
            );
        });
        topBowlers.slice(0, 2).forEach((bowl, i) => {
            const parts = bowl.name.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            performers.push(
                <span key={`bowl-${i}`}>
                    <span style={{ fontWeight: 500 }}>{firstName} </span>
                    <span style={{ fontWeight: 700 }}>{lastName}</span>
                    <span style={{ fontWeight: 700 }}>{' '}{bowl.wickets}-{bowl.runsGiven}</span>
                    {'   '}
                </span>
            );
        });
        return performers;
    };

    return (
        <BaseTemplate
            templateLayer="/assets/templates/innings-end-layer.png"
            templateLayerStyle={{ left: -530, top: 0, width: 2048, height: 1359 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            playerImage={playerImage}
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
                    {score}/{wickets.toString().padStart(2, '0')}{'  '}{overs} Overs
                </p>
            </div>

            {/* Top Performers */}
            {(topBatsmen.length > 0 || topBowlers.length > 0) && (
                <div
                    className="absolute uppercase"
                    style={{
                        left: 176.71, top: 1075.32,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: 24,
                        lineHeight: '28px',
                        color: '#ffffff',
                        letterSpacing: 2.08,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatPerformers()}
                </div>
            )}
        </BaseTemplate>
    );
}
