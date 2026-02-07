'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TargetTemplateProps {
    backgroundImage?: string; // Player/team photo from API
    team1Logo?: string;
    team2Logo?: string;
    chasingTeam: string;
    target: number;
}

export default function TargetTemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    chasingTeam,
    target
}: TargetTemplateProps) {
    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* TARGET Title */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 130,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 25,
                        letterSpacing: 4
                    }}
                >
                    TARGET
                </h1>

                {/* Target Details */}
                <p
                    className="uppercase"
                    style={{
                        fontSize: 40,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 600
                    }}
                >
                    <span style={{ color: '#FFE135' }}>{chasingTeam}</span>
                    <span className="text-white"> NEED </span>
                    <span style={{ color: '#FFE135' }}>{target}</span>
                    <span className="text-white"> RUNS TO WIN</span>
                </p>
            </div>
        </BaseTemplate>
    );
}
