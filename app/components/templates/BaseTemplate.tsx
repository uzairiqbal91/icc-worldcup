'use client';

import React from 'react';

interface BaseTemplateProps {
    children: React.ReactNode;
    backgroundImage?: string; // Dynamic background from API/database
    team1Logo?: string;
    team2Logo?: string;
    showTeamLogos?: boolean;
    showMycoLogo?: boolean;
    showIccLogo?: boolean;
}

export default function BaseTemplate({
    children,
    backgroundImage,
    team1Logo,
    team2Logo,
    showTeamLogos = true,
    showMycoLogo = true,
    showIccLogo = true
}: BaseTemplateProps) {
    return (
        <div
            className="relative overflow-hidden"
            style={{
                width: '1080px',
                height: '1350px',
                backgroundColor: '#1a365d'
            }}
        >
            {/* Background Image - Dynamic from API */}
            {backgroundImage && (
                <div className="absolute inset-0">
                    <img
                        src={backgroundImage}
                        alt=""
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                </div>
            )}

            {/* Gradient Overlay for text readability */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.95) 100%)'
                }}
            />

            {/* MYCO Logo - Top Left */}
            {showMycoLogo && (
                <div
                    className="absolute z-20 flex items-center"
                    style={{ left: 40, top: 35 }}
                >
                    <span
                        className="font-black italic text-white"
                        style={{
                            fontSize: 52,
                            fontFamily: 'Arial Black, sans-serif',
                            letterSpacing: -2
                        }}
                    >
                        myco
                    </span>
                </div>
            )}

            {/* ICC World Cup Logo - Top Right */}
            {showIccLogo && (
                <div
                    className="absolute z-20"
                    style={{ right: 40, top: 30, width: 100, height: 90 }}
                >
                    <div className="text-right">
                        <div className="text-white text-xs font-bold" style={{ fontSize: 10 }}>ICC</div>
                        <div className="text-white text-xs" style={{ fontSize: 8 }}>U19 MEN'S CRICKET</div>
                        <div className="text-white font-bold" style={{ fontSize: 14 }}>WORLD CUP</div>
                        <div className="text-yellow-400 text-xs" style={{ fontSize: 8 }}>ZIMBABWE & NAMIBIA 2026</div>
                    </div>
                </div>
            )}

            {/* Yellow/Green Decorative Triangle - Bottom Right */}
            <div className="absolute z-10" style={{ right: -50, bottom: 60 }}>
                <svg width="350" height="350" viewBox="0 0 350 350">
                    <defs>
                        <linearGradient id="triGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFE135" />
                            <stop offset="50%" stopColor="#4CAF50" />
                            <stop offset="100%" stopColor="#1B5E20" />
                        </linearGradient>
                    </defs>
                    <polygon
                        points="350,0 350,350 0,350"
                        fill="url(#triGradient)"
                    />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>

            {/* Team Logos with VS - Bottom Center */}
            {showTeamLogos && team1Logo && team2Logo && (
                <div
                    className="absolute z-20 flex items-center justify-center gap-6"
                    style={{ bottom: 50, left: '50%', transform: 'translateX(-50%)' }}
                >
                    <div
                        className="rounded-lg overflow-hidden bg-white/10 p-2"
                        style={{ width: 70, height: 70 }}
                    >
                        <img
                            src={team1Logo}
                            alt="Team 1"
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                        />
                    </div>
                    <span
                        className="text-white font-bold"
                        style={{ fontSize: 24 }}
                    >
                        VS
                    </span>
                    <div
                        className="rounded-lg overflow-hidden bg-white/10 p-2"
                        style={{ width: 70, height: 70 }}
                    >
                        <img
                            src={team2Logo}
                            alt="Team 2"
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
