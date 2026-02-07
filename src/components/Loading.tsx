import React from 'react';

interface LoadingProps {
    fullScreen?: boolean;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({
    fullScreen = false,
    text = "Establishing neural link...",
    size = 'md'
}) => {
    const sizeMap = {
        sm: { container: 32, core: 8 },
        md: { container: 64, core: 16 },
        lg: { container: 96, core: 24 }
    };

    const containerSize = sizeMap[size].container;
    const coreSize = sizeMap[size].core;

    return (
        <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className="neural-loader">
                <div className="neural-core"></div>
                <div className="pulse-ring ring-1"></div>
                <div className="pulse-ring ring-2"></div>
                <div className="pulse-ring ring-3"></div>
            </div>
            {text && <div className="loading-text">{text}</div>}

            <style>{`
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    width: 100%;
                    height: 100%;
                    min-height: 200px;
                }

                .loading-container.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    background: var(--color-bg-primary);
                }

                .neural-loader {
                    position: relative;
                    width: ${containerSize}px;
                    height: ${containerSize}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .neural-core {
                    width: ${coreSize}px;
                    height: ${coreSize}px;
                    background-color: var(--color-primary);
                    border-radius: 50%;
                    box-shadow: 0 0 15px var(--color-primary);
                    animation: corePulse 2s ease-in-out infinite;
                    z-index: 2;
                }

                .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    border: 1px solid var(--color-primary);
                    opacity: 0;
                    z-index: 1;
                }

                .ring-1 {
                    width: ${coreSize}px;
                    height: ${coreSize}px;
                    animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .ring-2 {
                    width: ${coreSize}px;
                    height: ${coreSize}px;
                    animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s;
                }

                .ring-3 {
                    width: ${coreSize}px;
                    height: ${coreSize}px;
                    animation: ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite 1.2s;
                }

                .loading-text {
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    animation: textFade 2s ease-in-out infinite;
                }

                @keyframes corePulse {
                    0%, 100% { transform: scale(0.9); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 25px var(--color-primary); }
                }

                @keyframes ripple {
                    0% {
                        width: ${coreSize}px;
                        height: ${coreSize}px;
                        opacity: 0.6;
                        border-width: 2px;
                    }
                    100% {
                        width: ${containerSize * 2}px;
                        height: ${containerSize * 2}px;
                        opacity: 0;
                        border-width: 0px;
                    }
                }

                @keyframes textFade {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
