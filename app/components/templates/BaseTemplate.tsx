'use client';

import React from 'react';

interface BaseTemplateProps {
    children: React.ReactNode;
    /** DYNAMIC: The main template image (stadium/match scene) - changes per match */
    templateLayer?: string;
    templateLayerStyle?: React.CSSProperties;
    /** Image position offset X (for drag/drop repositioning) */
    imageOffsetX?: number;
    /** Image position offset Y (for drag/drop repositioning) */
    imageOffsetY?: number;
    /** Optional second template-specific layer */
    templateLayer2?: string;
    templateLayer2Style?: React.CSSProperties;
    /** Optional third template-specific layer */
    templateLayer3?: string;
    templateLayer3Style?: React.CSSProperties;
    /** Show the dark top overlay (Layer 9) - default true */
    showDarkOverlay?: boolean;
    /** Show right lightning bolt (Layer 7) - default true */
    showRightBolt?: boolean;
}

export default function BaseTemplate({
    children,
    templateLayer,
    templateLayerStyle,
    imageOffsetX = 0,
    imageOffsetY = 0,
    templateLayer2,
    templateLayer2Style,
    templateLayer3,
    templateLayer3Style,
    showDarkOverlay = true,
    showRightBolt = true,
}: BaseTemplateProps) {
    return (
        <div
            className="relative overflow-hidden"
            style={{ width: 1080, height: 1350, backgroundColor: '#0a1628' }}
        >
            {/* Background */}
            <div className="absolute" style={{ left: 0, top: 0, width: 1080, height: 1350 }}>
                <img
                    src="/assets/templates/bg-common.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* DYNAMIC: Template-specific main layer */}
            {templateLayer && (
                <div className="absolute" style={{
                    ...templateLayerStyle,
                    left: ((templateLayerStyle?.left as number) || 0) + imageOffsetX,
                    top: ((templateLayerStyle?.top as number) || 0) + imageOffsetY,
                }}>
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

            {/* Layer 9 - Dark top overlay */}
            {showDarkOverlay && (
                <div className="absolute" style={{ left: 0, top: 0, width: 1080, height: 704, mixBlendMode: 'multiply', opacity: 0.6 }}>
                    <img src="/assets/templates/layer9-dark-overlay.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
                </div>
            )}

            {/* Layer 2 - Gradient overlay */}
            <div className="absolute" style={{ left: 0, top: 335, width: 1080, height: 1015 }}>
                <img src="/assets/templates/toss-layer2-gradient.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Vector Smart Object - subtle pattern at 5% opacity */}
            <div className="absolute" style={{ left: -2, top: 893, width: 1079, height: 533, opacity: 0.05 }}>
                <img src="/assets/templates/toss-vector-smart.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Layer 6 - Left lightning bolt */}
            <div className="absolute" style={{ left: -2, top: 996, width: 332, height: 290 }}>
                <img src="/assets/templates/toss-layer6-left.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Layer 7 - Right lightning bolt */}
            {showRightBolt && (
                <div className="absolute" style={{ left: 764, top: 932, width: 316, height: 389 }}>
                    <img src="/assets/templates/toss-layer7-right.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
                </div>
            )}

            {/* Myco X Geo Super logo - Top Left */}
            <div className="absolute" style={{ left: 55, top: 52, width: 288, height: 87 }}>
                <img src="/assets/templates/myco-geo-super.png" alt="MYCO" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* ICC T20 World Cup logo - Top Right */}
            <div className="absolute" style={{ left: 918, top: 40, width: 109, height: 110 }}>
                <img src="/assets/templates/icc-logo.png" alt="ICC" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Dynamic content */}
            {children}

            {/* Footer bar */}
            <div className="absolute" style={{ left: 0, top: 1281, width: 1080, height: 69 }}>
                <img src="/assets/templates/footer-bar.png" alt="" className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );
}
