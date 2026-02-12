'use client';

import React from 'react';

interface TossTemplateProps {
    /** DYNAMIC: The main toss image with stadium/players - changes per match */
    tossImage?: string;
    /** Toss winning team (dynamic) */
    tossWinner: string;
    /** Toss decision: 'bat' or 'bowl' (dynamic) */
    tossDecision: string;
    /** Image position offset X (for drag/drop repositioning) */
    imageOffsetX?: number;
    /** Image position offset Y (for drag/drop repositioning) */
    imageOffsetY?: number;
}

export default function TossTemplate({
    tossImage = "/assets/templates/toss-layer.png",
    tossWinner,
    tossDecision,
    imageOffsetX = 0,
    imageOffsetY = 0,
}: TossTemplateProps) {
    const decisionText = tossDecision.toLowerCase().includes('bat')
        ? 'elect to bat first.'
        : 'elect to bowl first.';

    return (
        <div
            className="relative overflow-hidden"
            style={{ width: 1080, height: 1350, backgroundColor: '#ffffff' }}
        >
            {/* Background */}
            <div className="absolute" style={{ left: 0, top: 0, width: 1080, height: 1350 }}>
                <img
                    src="/assets/templates/bg-common.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Layer 1 - Dynamic toss image (stadium/players) */}
            {tossImage && (
                <div className="absolute" style={{
                    left: -471 + imageOffsetX,
                    top: 0 + imageOffsetY,
                    width: 2023,
                    height: 1350,
                }}>
                    <img
                        key={tossImage}
                        src={tossImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin={tossImage.startsWith('data:') ? undefined : "anonymous"}
                    />
                </div>
            )}

            {/* Layer 2 - Gradient overlay */}
            <div className="absolute" style={{ left: 0, top: 335, width: 1080, height: 1015 }}>
                <img
                    src="/assets/templates/toss-layer2-gradient.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            {/* Vector Smart Object - subtle pattern at 5% opacity */}
            <div className="absolute" style={{ left: -2, top: 893, width: 1079, height: 533, opacity: 0.05 }}>
                <img
                    src="/assets/templates/toss-vector-smart.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            {/* Layer 6 - Left lightning bolt / zigzag decoration */}
            <div className="absolute" style={{ left: -2, top: 996, width: 332, height: 290 }}>
                <img
                    src="/assets/templates/toss-layer6-left.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            {/* Layer 7 - Right lightning bolt / zigzag decoration */}
            <div className="absolute" style={{ left: 764, top: 932, width: 316, height: 389 }}>
                <img
                    src="/assets/templates/toss-layer7-right.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            {/* Myco X Geo Super logo - Top Left */}
            <div className="absolute" style={{ left: 55, top: 52, width: 288, height: 87 }}>
                <img
                    src="/assets/templates/myco-geo-super.png"
                    alt="MYCO"
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            {/* ICC T20 World Cup logo - Top Right */}
            <div className="absolute" style={{ left: 918, top: 41, width: 109, height: 109 }}>
                <img
                    src="/assets/templates/toss-icc-logo.png"
                    alt="ICC"
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

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
                <p style={{ margin: 0 }}>
                    {tossWinner} win the Toss
                </p>
                <p style={{ margin: 0 }}>
                    & {decisionText}
                </p>
            </div>

            {/* Footer bar */}
            <div className="absolute" style={{ left: 0, top: 1281, width: 1080, height: 69 }}>
                <img
                    src="/assets/templates/footer-bar.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>
        </div>
    );
}
