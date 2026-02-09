'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface FallOfWicketTemplateProps {
    /** 
     * DYNAMIC: The main fall of wicket image - changes per match
     * Recommended size: 1992×1371px (landscape)
     */
    fallOfWicketImage?: string;
    team1Logo?: string;
    team2Logo?: string;
    /** Batting team name (dynamic) */
    battingTeam: string;
    /** Score at wicket fall (dynamic) */
    score: number;
    /** Wickets fallen (dynamic) */
    wickets: number;
    /** Overs at wicket fall (dynamic) */
    overs: number;
}

export default function FallOfWicketTemplate({
    fallOfWicketImage,
    team1Logo,
    team2Logo,
    battingTeam,
    score,
    wickets,
    overs
}: FallOfWicketTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={fallOfWicketImage}
            templateLayerStyle={{ left: -380, top: -10, width: 1992, height: 1371 }}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            showVsSection={true}
            vsStyle="bottom-large"
            mycoVariant="white"
            iccStyle={{ left: 911, top: 49, width: 124, height: 111 }}
        >
            {/* FALL OF WICKET Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 125, top: 860.76,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 100,
                    lineHeight: '100px',
                    color: '#ffffff',
                    letterSpacing: 0.15,
                }}
            >
                fall of wicket
            </p>

            {/* Team Name and Score */}
            <div
                className="absolute text-center uppercase"
                style={{
                    left: '50%', top: 985.48,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                }}
            >
                <p style={{
                    margin: 0,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: '60px',
                    color: '#ffdc29',
                    letterSpacing: 0.41,
                }}>
                    {battingTeam}
                </p>
                <p style={{
                    margin: 0,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    lineHeight: '60px',
                    color: '#ffffff',
                    letterSpacing: 1.22,
                }}>
                    {score}/{wickets.toString().padStart(2, '0')}{'  '}{overs} Overs
                </p>
            </div>
        </BaseTemplate>
    );
}
