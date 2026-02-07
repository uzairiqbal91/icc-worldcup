'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface Player {
    name: string;
    isCaptain?: boolean;
    isWicketkeeper?: boolean;
}

interface PlayingXITemplateProps {
    backgroundImage?: string; // Player batting/action photo from API
    team1Logo?: string;
    team2Logo?: string;
    teamName: string;
    opponent: string;
    players: Player[];
}

export default function PlayingXITemplate({
    backgroundImage,
    team1Logo,
    team2Logo,
    teamName,
    opponent,
    players
}: PlayingXITemplateProps) {
    const formatPlayerName = (player: Player) => {
        const parts = player.name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || '';
        let suffix = '';
        if (player.isCaptain && player.isWicketkeeper) suffix = '  (C & WK)';
        else if (player.isCaptain) suffix = '  (C)';
        else if (player.isWicketkeeper) suffix = '  (WK)';
        return { firstName, lastName, suffix };
    };

    return (
        <BaseTemplate
            backgroundImage={backgroundImage}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            showTeamLogos={false}
        >
            {/* Content - Left aligned */}
            <div className="absolute left-16 top-44">
                {/* PLAYING XI Title */}
                <h1
                    className="text-white font-black uppercase"
                    style={{
                        fontSize: 90,
                        fontFamily: 'Arial Black, sans-serif',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
                        marginBottom: 0,
                        letterSpacing: 2
                    }}
                >
                    PLAYING XI
                </h1>

                {/* VS Opponent */}
                <p
                    className="uppercase font-bold"
                    style={{
                        fontSize: 32,
                        fontFamily: 'Arial, sans-serif',
                        color: '#FFE135',
                        marginBottom: 35
                    }}
                >
                    VS {opponent}
                </p>

                {/* Player List */}
                <div style={{ lineHeight: 2.2 }}>
                    {players.slice(0, 11).map((player, i) => {
                        const { firstName, lastName, suffix } = formatPlayerName(player);
                        return (
                            <p
                                key={i}
                                className="uppercase"
                                style={{
                                    fontSize: 30,
                                    fontFamily: 'Arial, sans-serif'
                                }}
                            >
                                <span className="text-gray-400 font-normal">{firstName}</span>
                                {lastName && (
                                    <>
                                        {' '}
                                        <span className="text-white font-bold">{lastName}</span>
                                    </>
                                )}
                                {suffix && <span style={{ color: '#FFE135' }} className="font-bold">{suffix}</span>}
                            </p>
                        );
                    })}
                </div>
            </div>
        </BaseTemplate>
    );
}
