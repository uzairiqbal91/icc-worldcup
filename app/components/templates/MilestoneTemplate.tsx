'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MilestoneTemplateProps {
    /** 
     * DYNAMIC: The main milestone image - changes per match
     * Recommended size: 2048×1405px (landscape)
     */
    milestoneImage?: string;
    /** Player first name (dynamic) */
    playerFirstName: string;
    /** Player last name (dynamic) */
    playerLastName: string;
    /** Milestone: 50 or 100 (dynamic) */
    milestone: number;
    /** Team logo URL (dynamic) - single team for player milestone */
    teamLogo?: string;
}

export default function MilestoneTemplate({
    milestoneImage,
    playerFirstName,
    playerLastName,
    milestone,
    teamLogo
}: MilestoneTemplateProps) {
    return (
        <BaseTemplate
            templateLayer={milestoneImage}
            templateLayerStyle={{ left: -484, top: 0, width: 2048, height: 1405 }}
            showVsSection={false}
            mycoVariant="white"
        >
            {/* Milestone number (50 or 100) */}
            <div
                className="absolute uppercase"
                style={{
                    left: milestone === 100 ? 240 : 245,
                    top: 636,
                    width: 538,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 311.42,
                    lineHeight: '311.42px',
                    color: '#ffffff',
                    letterSpacing: -31.02,
                    zIndex: 20,
                }}
            >
                {milestone}
            </div>

            {/* RUNS */}
            <div
                className="absolute uppercase"
                style={{
                    left: 540,
                    top: 937.48,
                    transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffffff',
                    letterSpacing: 0.38,
                    zIndex: 20,
                }}
            >
                runs
            </div>

            {/* Divider line - yellow separator */}
            <div
                className="absolute"
                style={{
                    left: 271,
                    top: 1022,
                    width: 538,
                    height: 1,
                    backgroundColor: '#ffdc29',
                    zIndex: 20
                }}
            />

            {/* Player first name */}
            <p
                className="absolute uppercase"
                style={{
                    left: 271, top: 1070.43,
                    width: 538,
                    textAlign: 'center',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: '30px',
                    color: '#ffffff',
                    letterSpacing: 6,
                    zIndex: 20,
                }}
            >
                {playerFirstName}
            </p>

            {/* Player last name */}
            <p
                className="absolute uppercase"
                style={{
                    left: 271, top: 1102.04,
                    width: 538,
                    textAlign: 'center',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 48,
                    lineHeight: '48px',
                    color: '#ffdc29',
                    letterSpacing: 9.6,
                    zIndex: 20,
                }}
            >
                {playerLastName}
            </p>

            {/* Team logo */}
            {teamLogo && (
                <div className="absolute" style={{ left: 502, top: 1179, width: 76, height: 89, zIndex: 20 }}>
                    <img src={teamLogo} alt="" className="absolute inset-0 w-full h-full object-contain" />
                </div>
            )}

        </BaseTemplate>
    );
}
