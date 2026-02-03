// ======================================================
// useInstallPrompt - Enhanced PWA Installation Hook
// Smart timing, persistence, platform-specific handling
// ======================================================

import { useState, useEffect, useCallback, useMemo } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// Storage keys
const STORAGE_KEYS = {
    DISMISSED_UNTIL: 'install_prompt_dismissed_until',
    NEVER_SHOW: 'install_prompt_never',
    FIRST_VISIT: 'install_prompt_first_visit',
    VISIT_COUNT: 'install_prompt_visit_count',
} as const;

// Delay durations
const DELAYS = {
    INITIAL_SHOW: 30000, // 30 seconds before first showing
    REMIND_7_DAYS: 7 * 24 * 60 * 60 * 1000,
    REMIND_24_HOURS: 24 * 60 * 60 * 1000,
} as const;

export type DismissOption = 'later_24h' | 'later_7d' | 'never';

export type Platform = 'android' | 'ios' | 'desktop' | 'other';

// ===========================================
// GLOBAL EVENT CAPTURE (before React mounts)
// ===========================================
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalPromptCaptured = false;

// Capture the event at module level (runs before React)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        globalDeferredPrompt = e as BeforeInstallPromptEvent;
        globalPromptCaptured = true;
        console.log('[useInstallPrompt] Global capture: beforeinstallprompt event stored');
    });

    window.addEventListener('appinstalled', () => {
        globalDeferredPrompt = null;
        console.log('[useInstallPrompt] App installed');
    });
}

// ===========================================

interface UseInstallPromptReturn {
    /** Whether the install banner should be visible (respects timing + dismissals) */
    shouldShowBanner: boolean;
    /** Whether the app can be installed via native prompt (Android/Chrome) */
    canInstallNative: boolean;
    /** Whether the app is already installed (standalone mode) */
    isInstalled: boolean;
    /** Whether iOS Safari is being used (needs manual instructions) */
    isIOSSafari: boolean;
    /** Current platform */
    platform: Platform;
    /** Trigger the native install prompt (Android only) */
    promptInstall: () => Promise<boolean>;
    /** Dismiss with option: 24h, 7d, or never */
    dismiss: (option: DismissOption) => void;
    /** Show iOS tutorial modal */
    showIOSTutorial: () => void;
    /** Hide iOS tutorial modal */
    hideIOSTutorial: () => void;
    /** Whether iOS tutorial is visible */
    isIOSTutorialVisible: boolean;
    /** Reset all dismissals (for testing/settings) */
    resetDismissals: () => void;
    /** Force show banner (for "Mais" menu) */
    forceShowBanner: () => void;
}

/**
 * Detect if running in standalone mode (already installed)
 */
function checkIsInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

    return isStandalone;
}

/**
 * Detect platform
 */
function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') return 'other';

    const ua = navigator.userAgent;

    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Windows|Mac|Linux/.test(ua) && !/Mobile/.test(ua)) return 'desktop';

    return 'other';
}

/**
 * Detect iOS Safari specifically
 */
function checkIsIOSSafari(): boolean {
    if (typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent;
    const vendor = navigator.vendor;

    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAppleVendor = vendor === 'Apple Computer, Inc.';
    const isNotOtherBrowser = !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

    return isIOS && isAppleVendor && isNotOtherBrowser;
}

/**
 * Check if user has dismissed and dismissal is still active
 */
function checkIsDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;

    // Never show again
    if (localStorage.getItem(STORAGE_KEYS.NEVER_SHOW) === 'true') {
        return true;
    }

    // Dismissed until a specific time
    const dismissedUntil = localStorage.getItem(STORAGE_KEYS.DISMISSED_UNTIL);
    if (dismissedUntil) {
        const until = parseInt(dismissedUntil, 10);
        if (Date.now() < until) {
            return true;
        }
        // Dismissal expired, clear it
        localStorage.removeItem(STORAGE_KEYS.DISMISSED_UNTIL);
    }

    return false;
}

/**
 * Record a visit and get count
 */
function recordVisit(): number {
    if (typeof localStorage === 'undefined') return 1;

    const countStr = localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0';
    const count = parseInt(countStr, 10) + 1;
    localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, count.toString());

    // Record first visit time if not set
    if (!localStorage.getItem(STORAGE_KEYS.FIRST_VISIT)) {
        localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, Date.now().toString());
    }

    return count;
}

/**
 * Enhanced hook to manage PWA installation prompt
 * - Smart timing: waits 30s before showing
 * - Persistence: remembers dismissals (24h, 7d, or forever)
 * - Platform detection: Android native, iOS tutorial, desktop
 */
export function useInstallPrompt(): UseInstallPromptReturn {
    // Initialize from global capture (event may fire before React mounts)
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
    const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
    const [isDismissed, setIsDismissed] = useState(checkIsDismissed);
    const [hasPassed30Seconds, setHasPassed30Seconds] = useState(false);
    const [isIOSTutorialVisible, setIsIOSTutorialVisible] = useState(false);
    const [forceVisible, setForceVisible] = useState(false);

    const platform = useMemo(detectPlatform, []);
    const isIOSSafari = useMemo(checkIsIOSSafari, []);

    // Check global prompt on mount (may have been captured before React hydrated)
    useEffect(() => {
        if (globalDeferredPrompt && !deferredPrompt) {
            console.log('[useInstallPrompt] Found global prompt, syncing to state');
            setDeferredPrompt(globalDeferredPrompt);
        }
    }, [deferredPrompt]);

    // Record visit on mount
    useEffect(() => {
        recordVisit();
    }, []);

    // Wait 30 seconds before allowing banner to show
    useEffect(() => {
        const timer = setTimeout(() => {
            setHasPassed30Seconds(true);
        }, DELAYS.INITIAL_SHOW);

        return () => clearTimeout(timer);
    }, []);

    // Detect if running in standalone mode
    useEffect(() => {
        const checkInstalled = () => setIsInstalled(checkIsInstalled());

        checkInstalled();

        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkInstalled);
        return () => mediaQuery.removeEventListener('change', checkInstalled);
    }, []);

    // Capture the beforeinstallprompt event (Android/Chrome) - also listen for future events
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            const event = e as BeforeInstallPromptEvent;
            globalDeferredPrompt = event; // Update global too
            setDeferredPrompt(event);
            console.log('[useInstallPrompt] beforeinstallprompt captured in useEffect');
        };

        const handleAppInstalled = () => {
            globalDeferredPrompt = null;
            setDeferredPrompt(null);
            setIsInstalled(true);
            // Clear dismissals on successful install
            localStorage.removeItem(STORAGE_KEYS.DISMISSED_UNTIL);
            localStorage.removeItem(STORAGE_KEYS.NEVER_SHOW);
            console.log('[useInstallPrompt] App installed event received');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Prompt install (Android native)
    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) return false;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error showing install prompt:', error);
            return false;
        }
    }, [deferredPrompt]);

    // Dismiss with options
    const dismiss = useCallback((option: DismissOption) => {
        setIsDismissed(true);
        setForceVisible(false);

        switch (option) {
            case 'later_24h':
                localStorage.setItem(
                    STORAGE_KEYS.DISMISSED_UNTIL,
                    (Date.now() + DELAYS.REMIND_24_HOURS).toString()
                );
                break;
            case 'later_7d':
                localStorage.setItem(
                    STORAGE_KEYS.DISMISSED_UNTIL,
                    (Date.now() + DELAYS.REMIND_7_DAYS).toString()
                );
                break;
            case 'never':
                localStorage.setItem(STORAGE_KEYS.NEVER_SHOW, 'true');
                break;
        }
    }, []);

    // iOS tutorial modal controls
    const showIOSTutorial = useCallback(() => {
        setIsIOSTutorialVisible(true);
    }, []);

    const hideIOSTutorial = useCallback(() => {
        setIsIOSTutorialVisible(false);
    }, []);

    // Reset dismissals (for settings)
    const resetDismissals = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.DISMISSED_UNTIL);
        localStorage.removeItem(STORAGE_KEYS.NEVER_SHOW);
        setIsDismissed(false);
    }, []);

    // Force show banner (from "Mais" menu)
    const forceShowBanner = useCallback(() => {
        setForceVisible(true);
        setIsDismissed(false);
    }, []);

    // Determine if banner should show
    const shouldShowBanner = useMemo(() => {
        // Never show if installed
        if (isInstalled) return false;

        // Force visible from menu
        if (forceVisible) return true;

        // Dismissed
        if (isDismissed) return false;

        // Wait for 30 seconds
        if (!hasPassed30Seconds) return false;

        // Android: need prompt captured
        if (platform === 'android' && !deferredPrompt && !isIOSSafari) return false;

        // iOS Safari or has native prompt
        return isIOSSafari || !!deferredPrompt;
    }, [isInstalled, isDismissed, hasPassed30Seconds, deferredPrompt, isIOSSafari, platform, forceVisible]);

    return {
        shouldShowBanner,
        canInstallNative: !!deferredPrompt && !isInstalled,
        isInstalled,
        isIOSSafari: isIOSSafari && !isInstalled,
        platform,
        promptInstall,
        dismiss,
        showIOSTutorial,
        hideIOSTutorial,
        isIOSTutorialVisible,
        resetDismissals,
        forceShowBanner,
    };
}
