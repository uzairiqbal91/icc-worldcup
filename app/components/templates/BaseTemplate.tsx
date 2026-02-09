'use client';

import React from 'react';

interface BaseTemplateProps {
    children: React.ReactNode;
    /** DYNAMIC: The main template image (stadium/match scene) - changes per match */
    templateLayer?: string;
    templateLayerStyle?: React.CSSProperties;
    /** Optional second template-specific layer */
    templateLayer2?: string;
    templateLayer2Style?: React.CSSProperties;
    /** Optional third template-specific layer */
    templateLayer3?: string;
    templateLayer3Style?: React.CSSProperties;
    /** Team 1 logo URL (dynamic) */
    team1Logo?: string;
    /** Team 2 logo URL (dynamic) */
    team2Logo?: string;
    /** Whether to show VS section with team logos at bottom */
    showVsSection?: boolean;
    /** VS section positioning variant */
    vsStyle?: 'bottom-center' | 'bottom-large';
    /** Which myco logo variant to use */
    mycoVariant?: 'white' | 'color' | 'color-white';
    /** ICC logo position style override */
    iccStyle?: React.CSSProperties;
}

export default function BaseTemplate({
    children,
    templateLayer,
    templateLayerStyle,
    templateLayer2,
    templateLayer2Style,
    templateLayer3,
    templateLayer3Style,
    team1Logo,
    team2Logo,
    showVsSection = true,
    vsStyle = 'bottom-center',
    mycoVariant = 'white',
    iccStyle,
}: BaseTemplateProps) {
    const mycoSrc = mycoVariant === 'color'
        ? '/assets/templates/myco-color.png'
        : mycoVariant === 'color-white'
            ? '/assets/templates/myco-color-white.png'
            : '/assets/templates/myco-white.png';

    return (
        <div
            className="relative overflow-hidden"
            style={{ width: 1080, height: 1350, backgroundColor: '#ffffff' }}
        >
            {/* Static base background */}
            <div className="absolute" style={{ left: 0, top: 0, width: 1080, height: 1350 }}>
                <img
                    src="/assets/templates/bg-common.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* DYNAMIC: Template-specific main layer - this is the image that changes per match */}
            {templateLayer && (
                <div className="absolute" style={templateLayerStyle}>
                    <img
                        key={templateLayer}
                        src={templateLayer}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin={templateLayer.startsWith('data:') ? undefined : "anonymous"}
                    />
                </div>
            )}

            {/* Optional template-specific layer 2 */}
            {templateLayer2 && templateLayer2Style && (
                <div className="absolute" style={templateLayer2Style}>
                    <img src={templateLayer2} alt="" className="absolute inset-0 w-full h-full object-contain" />
                </div>
            )}

            {/* Optional template-specific layer 3 */}
            {templateLayer3 && templateLayer3Style && (
                <div className="absolute" style={templateLayer3Style}>
                    <img src={templateLayer3} alt="" className="absolute inset-0 w-full h-full object-contain" />
                </div>
            )}

            {/* Layer 2 - Gradient overlay */}
            <div className="absolute" style={{ left: 0, top: 299, width: 1080, height: 1051 }}>
                <img src="/assets/templates/layer2-gradient.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Layer 4 - Decorative bottom right */}
            <div className="absolute" style={{ left: 720, top: 946, width: 878, height: 804 }}>
                <img src="/assets/templates/layer4-decorative-br.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* ICC Logo - Top Right */}
            <div className="absolute" style={iccStyle || { left: 911, top: 45, width: 124, height: 111 }}>
                <img src="/assets/templates/icc-logo.png" alt="ICC" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* MYCO Logo - Top Left */}
            <div className="absolute" style={{ left: 38, top: 56, width: 215, height: 89 }}>
                <img src={mycoSrc} alt="MYCO" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Dynamic content */}
            {children}

            {/* VS Section with team logos */}
            {showVsSection && team1Logo && team2Logo && (
                <div className="absolute" style={{ left: 0, top: 0, width: '0.01px', height: '0.01px' }}>
                    {vsStyle === 'bottom-large' ? (
                        <>
                            <div className="absolute" style={{ left: 416, top: 1157, width: 86, height: 88 }}>
                                <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                            <p
                                className="absolute uppercase"
                                style={{
                                    left: 523.83, top: 1189.45,
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500, fontSize: 24,
                                    lineHeight: '24px', color: '#ffffff',
                                    letterSpacing: -0.75
                                }}
                            >
                                vs
                            </p>
                            <div className="absolute" style={{ left: 574, top: 1154, width: 90, height: 94 }}>
                                <img src={team2Logo} alt="Team 2" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="absolute" style={{ left: 440, top: 1214, width: 70, height: 72 }}>
                                <img src={team1Logo} alt="Team 1" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                            <p
                                className="absolute uppercase"
                                style={{
                                    left: 526.96, top: 1240.66,
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500, fontSize: 19.4,
                                    lineHeight: '19.4px', color: '#ffffff',
                                    letterSpacing: -0.6
                                }}
                            >
                                vs
                            </p>
                            <div className="absolute" style={{ left: 567, top: 1212, width: 73, height: 76 }}>
                                <img src={team2Logo} alt="Team 2" className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Layer 5 - Decorative bottom left */}
            <div className="absolute" style={{ left: -367, top: 1137, width: 580, height: 500 }}>
                <img src="/assets/templates/layer5-decorative-bl.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );
}
