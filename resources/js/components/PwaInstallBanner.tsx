import React, { useState, useEffect } from 'react';
import { isIOS, isMobile } from 'react-device-detect';

// Define the type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export default function PwaInstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const hasDismissed = localStorage.getItem('dismissedPwaInstallBanner');
        if (hasDismissed || !isMobile) {
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            setIsVisible(true);
        };

        // Logic for browsers that support the install prompt (e.g., Chrome on Android)
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Logic for iOS, which does not support the prompt. We show instructions instead.
        const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as any).standalone;
        if (isIOS && !isInStandaloneMode) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            setDeferredPrompt(null);
            setIsVisible(false);
        });
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('dismissedPwaInstallBanner', 'true');
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 animate-slide-up">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4 shrink-0">
                        {/* PWA App Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold">Install App</h4>
                        <p className="text-sm text-gray-300">Add to Home Screen for quick access.</p>
                    </div>
                </div>

                {/* Conditional button/text based on OS */}
                {deferredPrompt && !isIOS ? (
                    <button
                        onClick={handleInstallClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md whitespace-nowrap"
                    >
                        Install
                    </button>
                ) : isIOS ? (
                    <div className="text-xs text-center text-gray-400 p-2 border border-gray-600 rounded-md">
                        Tap <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mx-1" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg> and "Add to Home Screen"
                    </div>
                ) : null}
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
