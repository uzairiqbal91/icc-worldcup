'use client';

import React from 'react';
import BaseTemplate from './BaseTemplate';

interface TossTemplateProps {
    tossImage?: string;
    tossWinner: string;
    tossDecision: string;
    description?: string;
    imageOffsetX?: number;
    imageOffsetY?: number;
}

export default function TossTemplate({
    tossImage = "/assets/templates/toss-layer.png",
    tossWinner,
    tossDecision,
    description,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: TossTemplateProps) {
    const defaultDescription = tossDecision.toLowerCase().includes('bat')
        ? 'win the toss & elect to bat first'
        : 'win the toss & elect to bowl first';
    const displayDescription = description || defaultDescription;

    return (
        <BaseTemplate
            templateLayer={tossImage}
            templateLayerStyle={{ left: -471, top: 0, width: 2023, height: 1350 }}
            imageOffsetX={imageOffsetX}
            imageOffsetY={imageOffsetY}
            showDarkOverlay={false}
        >
            {/* TOSS UPDATE Title */}
            <p
                className="absolute uppercase"
                style={{
                    left: 276.22, top: 951.38,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 77,
                    lineHeight: '77px',
                    color: '#ffffff',
                    letterSpacing: -0.45,
                }}
            >
                toss update
            </p>

            {/* Toss result text */}
            <div
                className="absolute text-center"
                style={{
                    left: '50%', top: 1045.03,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: 36,
                    lineHeight: '43.2px',
                    color: '#00e6fd',
                    letterSpacing: -1.08,
                }}
            >
                <p style={{ margin: 0 }}>{tossWinner}</p>
                <p style={{ margin: 0 }}>{displayDescription}</p>
            </div>
        </BaseTemplate>
    );
}
