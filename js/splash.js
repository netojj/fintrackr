// ═══════════════════════════════════════════════════
// FinTrackr — Splash Screen Controller
// Cinematic brand reveal, plays once per tab session
// ═══════════════════════════════════════════════════

(function () {
    'use strict';

    const SPLASH_KEY = 'fintrackr_splash_seen';
    const SPLASH_DURATION = 2800; // Total ms before fade-out starts

    function shouldShowSplash() {
        // Don't show on repeat visits in same tab
        if (sessionStorage.getItem(SPLASH_KEY)) return false;
        // Don't show if prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        return true;
    }

    function initSplash() {
        if (!shouldShowSplash()) {
            const el = document.getElementById('splashScreen');
            if (el) el.remove();
            document.body.classList.add('app-ready');
            return;
        }

        sessionStorage.setItem(SPLASH_KEY, '1');

        const splash = document.getElementById('splashScreen');
        if (!splash) return;

        // After animation completes, fade out and remove
        setTimeout(() => {
            document.body.classList.add('app-ready');
            splash.classList.add('fade-out');
            // Remove from DOM after transition
            setTimeout(() => {
                splash.remove();
            }, 700);
        }, SPLASH_DURATION);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSplash);
    } else {
        initSplash();
    }
})();
