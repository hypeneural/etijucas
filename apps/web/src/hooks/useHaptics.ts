import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticPatterns {
    light: number;
    medium: number;
    heavy: number;
    success: number[];
    warning: number[];
    error: number[];
    selection: number;
}

const patterns: HapticPatterns = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    warning: [30, 50, 30],
    error: [50, 100, 50, 100, 50],
    selection: 5,
};

/**
 * Hook for haptic feedback using the Vibration API.
 * Provides native-like tactile feedback on supported devices.
 * 
 * @example
 * const { vibrate, isSupported } = useHaptics();
 * 
 * <button onClick={() => vibrate('light')}>
 *   Tap me
 * </button>
 */
export function useHaptics() {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const vibrate = useCallback((pattern: HapticPattern = 'light') => {
        if (!isSupported) return false;

        try {
            const vibrationPattern = patterns[pattern];
            navigator.vibrate(vibrationPattern);
            return true;
        } catch {
            return false;
        }
    }, [isSupported]);

    const vibrateOnce = useCallback((duration: number = 10) => {
        if (!isSupported) return false;

        try {
            navigator.vibrate(duration);
            return true;
        } catch {
            return false;
        }
    }, [isSupported]);

    const stop = useCallback(() => {
        if (!isSupported) return;
        navigator.vibrate(0);
    }, [isSupported]);

    return {
        isSupported,
        vibrate,
        vibrateOnce,
        stop,
        patterns: Object.keys(patterns) as HapticPattern[],
    };
}

/**
 * Simple haptic feedback for common interactions.
 * Use this for quick, one-off haptic feedback.
 */
export function hapticFeedback(pattern: HapticPattern = 'light'): boolean {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
        return false;
    }

    try {
        const vibrationPattern = patterns[pattern];
        navigator.vibrate(vibrationPattern);
        return true;
    } catch {
        return false;
    }
}

export default useHaptics;
