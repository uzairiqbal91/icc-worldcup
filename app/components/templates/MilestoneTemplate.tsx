'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface MilestoneTemplateProps {
    backgroundImage?: string; // Player celebration photo from API
    playerImage?: string; // Player face/action image from API
    team1Logo?: string;
    team2Logo?: string;
    playerName: string;
    teamName: string;
    milestone: number; // 50 or 100
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
}

export default function MilestoneTemplate({
    backgroundImage,
    playerImage,
    team1Logo,
    team2Logo,
    playerName,
    teamName,
    milestone,
    runs,
    balls,
    fours,
    sixes,
    strikeRate
}: MilestoneTemplateProps) {
    const isCentury = milestone >= 100;
    const milestoneText = isCentury ? 'CENTURY!' : 'FIFTY!';

    return (
        <BaseTemplate
            backgroundImage={backgroundImage || playerImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
        >
            {/* Content positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-16 pb-44">
                {/* Milestone Badge */}
                <div
                    className="inline-block px-8 py-3 rounded-full mb-6"
                    style={{
                        background: isCentury
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                            : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                    }}
                >
                    <span
                        className="font-black uppercase"
                        style={{
                            fontSize: 36,
                            fontFamily: 'Arial Black, sans-serif',
                            color: isCentury ? '#000' : '#fff'
                        }}
                    >
                        {milestone}* {milestoneText}
                    </span>
                </div>

                {/* Player Name */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 80,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 5,
                        letterSpacing: 2
                    }}
                >
                    {playerName}
                </h1>

                {/* Team Name */}
                <p
                    className="uppercase font-bold"
                    style={{
                        fontSize: 36,
                        fontFamily: 'Arial, sans-serif',
                        color: '#FFE135',
                        marginBottom: 30
                    }}
                >
                    {teamName}
                </p>

                {/* Stats Row */}
                <div className="flex gap-16">
                    <div className="text-center">
                        <p className="text-white font-black" style={{ fontSize: 60 }}>{runs}*</p>
                        <p className="text-gray-400 uppercase" style={{ fontSize: 18 }}>RUNS</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-black" style={{ fontSize: 60 }}>{balls}</p>
                        <p className="text-gray-400 uppercase" style={{ fontSize: 18 }}>BALLS</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-black" style={{ fontSize: 60 }}>{fours}</p>
                        <p className="text-gray-400 uppercase" style={{ fontSize: 18 }}>FOURS</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-black" style={{ fontSize: 60 }}>{sixes}</p>
                        <p className="text-gray-400 uppercase" style={{ fontSize: 18 }}>SIXES</p>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-black" style={{ fontSize: 60 }}>{strikeRate}</p>
                        <p className="text-gray-400 uppercase" style={{ fontSize: 18 }}>S/R</p>
                    </div>
                </div>
            </div>
        </BaseTemplate>
    );
}
