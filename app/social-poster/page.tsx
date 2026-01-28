'use client';

import { useRef } from 'react';

export default function SocialPosterPage() {
    const posterRef = useRef<HTMLDivElement>(null);

    const downloadPoster = async () => {
        if (!posterRef.current) return;
        try {
            // @ts-ignore - dom-to-image doesn't play well with all TS types sometimes
            const domtoimage = (await import('dom-to-image')).default;

            // 1. Create a temporary off-screen container in the real DOM
            const container = document.createElement('div');
            Object.assign(container.style, {
                position: 'fixed',
                left: '-9999px',
                top: '0',
                width: '1080px',
                height: '1350px',
                overflow: 'hidden',
                zIndex: '-1'
            });
            document.body.appendChild(container);

            // 2. Clone the poster into this sterile environment
            const clone = posterRef.current.cloneNode(true) as HTMLDivElement;
            Object.assign(clone.style, {
                transform: 'none',
                position: 'relative',
                left: '0',
                top: '0',
                width: '1080px',
                height: '1350px',
                display: 'block',
                margin: '0',
                padding: '0'
            });
            container.appendChild(clone);

            // 3. Wait for all images in the clone to fully load
            const images = Array.from(clone.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // 4. Small settling delay for layout stabilization
            await new Promise(resolve => setTimeout(resolve, 500));

            // 5. Capture with dom-to-image
            const dataUrl = await domtoimage.toPng(clone, {
                width: 1080,
                height: 1350,
                style: {
                    transform: 'none',
                    left: '0',
                    top: '0'
                }
            });

            // 6. Clean up
            document.body.removeChild(container);

            const link = document.createElement('a');
            link.download = 'match-poster.png';
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-6">India vs New Zealand - Match Poster</h1>

            <div className="flex justify-center">
                <div className="relative" style={{ width: '540px', height: '675px' }}>
                    {/* Scaling wrapper for preview */}
                    <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                        <div
                            id="poster-to-download"
                            ref={posterRef}
                            className="overflow-hidden"
                            style={{
                                width: '1080px',
                                height: '1350px',
                                position: 'relative'
                            }}
                        >
                            {/* Layer 0 - White base */}
                            <div className="absolute inset-0" style={{ backgroundColor: '#ffffff' }} />

                            {/* Layer 1 - Main background */}
                            <div className="absolute inset-0">
                                <img src="/assets/layer1-bg.png" alt="" className="w-full h-full object-cover" />
                            </div>

                            {/* Layer 2 */}
                            <div className="absolute inset-0">
                                <img src="/assets/layer2.png" alt="" className="w-full h-full object-cover" />
                            </div>

                            {/* Layer 3 - Pattern */}
                            <div className="absolute" style={{ left: 0, top: 241, width: 1080, height: 974, opacity: 0.56 }}>
                                <img src="/assets/layer3-pattern.png" alt="" className="w-full h-full object-cover" />
                            </div>

                            {/* Left Accent */}
                            <div className="absolute" style={{ left: -384, top: 173, width: 790, height: 726 }}>
                                <img src="/assets/left-accent.png" alt="" className="w-full h-full object-contain" />
                            </div>

                            {/* Right Accent */}
                            <div className="absolute" style={{ left: 669, top: 173, width: 790, height: 725 }}>
                                <img src="/assets/right-accent.png" alt="" className="w-full h-full object-contain" />
                            </div>

                            {/* India Captain (Left) - Suryakumar Yadav - Transparent */}
                            <div className="absolute" style={{
                                left: -50, top: 160, width: 550, height: 700,
                            }}>
                                <img src="/assets/india-captain-transparent.png" alt="Suryakumar Yadav" className="w-full h-full object-contain object-bottom" />
                            </div>

                            {/* NZ Captain (Right) - Mitchell Santner - Transparent */}
                            <div className="absolute" style={{
                                left: 580, top: 110, width: 550, height: 700,
                            }}>
                                <img src="/assets/nz-captain-transparent.png" alt="Mitchell Santner" className="w-full h-full object-contain object-bottom" />
                            </div>

                            {/* Layer 4 - Decorative overlay */}
                            <div className="absolute" style={{ left: -450, top: 325, width: 2056, height: 1370 }}>
                                <img src="/assets/layer4-decorative.png" alt="" className="w-full h-full object-contain" />
                            </div>

                            {/* India Logo (Center top) */}
                            <div className="absolute" style={{ left: 470, top: 217, width: 140, height: 151 }}>
                                <img src="/assets/india-logo.png" alt="India" className="w-full h-full object-contain" />
                            </div>

                            {/* VS text (small, between logos) */}
                            <div className="absolute flex items-center justify-center" style={{ left: 511.84, top: 377.38, width: 58.825 }}>
                                <span style={{ color: '#ffffff', fontSize: 58.183, letterSpacing: -4.77, lineHeight: '58.183px', fontFamily: 'Inter, sans-serif' }}>
                                    vs
                                </span>
                            </div>

                            {/* NZ Logo (Center bottom) */}
                            <div className="absolute" style={{ left: 465, top: 458, width: 151, height: 151 }}>
                                <img src="/assets/nz-logo.png" alt="New Zealand" className="w-full h-full object-contain" />
                            </div>

                            {/* Bottom Gradient */}
                            <div className="absolute" style={{ left: 0, top: 705, width: 1080, height: 702, opacity: 0.7 }}>
                                <img src="/assets/gradient-bottom.png" alt="" className="w-full h-full object-cover" />
                            </div>

                            {/* Team 1 Name - INDIA */}
                            <p className="absolute uppercase" style={{
                                left: 0, top: 719,
                                width: 1080, textAlign: 'center',
                                fontSize: 85, fontFamily: 'Arial Black, Arial, sans-serif',
                                fontWeight: 900, letterSpacing: 6.87, lineHeight: '85px',
                                color: '#ffffff'
                            }}>
                                INDIA
                            </p>

                            {/* VS (Yellow) */}
                            <p className="absolute uppercase" style={{
                                left: 0, top: 815,
                                width: 1080, textAlign: 'center',
                                fontSize: 44, fontFamily: 'Inter, sans-serif',
                                fontWeight: 600, letterSpacing: -4.13, lineHeight: '44px', color: '#FFDC29'
                            }}>
                                VS
                            </p>

                            {/* Team 2 Name - NEW ZEALAND */}
                            <p className="absolute uppercase" style={{
                                left: 0, top: 870,
                                width: 1080, textAlign: 'center',
                                fontSize: 85, fontFamily: 'Arial Black, Arial, sans-serif',
                                fontWeight: 900, letterSpacing: 5.23, lineHeight: '85px',
                                color: '#ffffff'
                            }}>
                                NEW ZEALAND
                            </p>

                            {/* Date Box (Green) */}
                            <div className="absolute" style={{ left: 330, top: 1028, width: 421, height: 79 }}>
                                <img src="/assets/date-box.svg" alt="" className="w-full h-full" />
                            </div>

                            {/* Date Text */}
                            <p className="absolute" style={{
                                left: 351.5, top: 1041.23,
                                fontSize: 50, fontFamily: 'Inter, sans-serif',
                                fontWeight: 600, letterSpacing: -2.34, lineHeight: '50px', color: '#120852'
                            }}>
                                27 Jan | Monday
                            </p>

                            {/* Time Box (Purple) */}
                            <div className="absolute" style={{ left: 414, top: 1107, width: 252, height: 79 }}>
                                <img src="/assets/time-box.svg" alt="" className="w-full h-full" />
                            </div>

                            {/* Time Text */}
                            <p className="absolute" style={{
                                left: 428.18, top: 1118.08,
                                fontSize: 55, fontFamily: 'Inter, sans-serif',
                                fontWeight: 600, letterSpacing: -2.9, lineHeight: '55px',
                                color: '#ffffff'
                            }}>
                                07:00 PM
                            </p>

                            {/* Trophy */}
                            <div className="absolute" style={{ left: 862, top: 807, width: 218, height: 241 }}>
                                <img src="/assets/trophy-body.png" alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="absolute" style={{ left: 924, top: 918, width: 118, height: 268 }}>
                                <img src="/assets/trophy-top.png" alt="" className="w-full h-full object-contain" />
                            </div>

                            {/* Top Left - MYCO Logo */}
                            <div className="absolute" style={{ left: 42, top: 60, width: 177, height: 74 }}>
                                <img src="/assets/myco-logo.png" alt="MYCO" className="w-full h-full object-contain" />
                            </div>

                            {/* Vertical Divider */}
                            <div className="absolute" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', left: 252.28, top: 34.54, width: 0.825, height: 92.74 }} />
                            {/* Top Left - Geo Super Logo */}
                            <div className="absolute" style={{ left: 287, top: 35, width: 87, height: 93 }}>
                                <img src="/assets/geo-super-logo.png" alt="Geo Super" className="w-full h-full object-contain" />
                            </div>

                            {/* Top Right - ICC U19 Logo */}
                            <div className="absolute" style={{ left: 774, top: 40, width: 245, height: 74 }}>
                                <img src="/assets/icc-u19-logo.png" alt="ICC U19 World Cup" className="w-full h-full object-contain" />
                            </div>

                            {/* Bottom Bar */}
                            <div className="absolute" style={{ left: 0, top: 1281, width: 1080, height: 69 }}>
                                <img src="/assets/bottom-bar.png" alt="" className="w-full h-full object-cover" />
                            </div>

                            {/* Bottom Sponsors Left */}
                            <div className="absolute" style={{ left: 43, top: 1308, width: 441, height: 20 }}>
                                <img src="/assets/sponsors-left.png" alt="Sponsors" className="w-full h-full object-contain" />
                            </div>

                            {/* Bottom Sponsors Right */}
                            <div className="absolute" style={{ left: 520, top: 1300, width: 439, height: 36 }}>
                                <img src="/assets/sponsors-right.png" alt="Download the app" className="w-full h-full object-contain" />
                            </div>

                            {/* Bottom Dividers */}
                            <div className="absolute" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', left: 500.25, top: 1297.79, width: 1.85, height: 43.42 }} />
                            <div className="absolute" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', left: 977.25, top: 1297.79, width: 1.85, height: 43.42 }} />

                            {/* Bottom Geo Super Logo */}
                            <div className="absolute" style={{ left: 997, top: 1298, width: 41, height: 43 }}>
                                <img src="/assets/geo-super-small.png" alt="Geo Super" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={downloadPoster}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-semibold transition-all text-lg"
                >
                    Download Poster (1080x1350)
                </button>
            </div>
        </div>
    );
}
