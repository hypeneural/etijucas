/**
 * useClipboardOTP Hook
 *
 * Clipboard detection for OTP codes with visibilitychange support.
 * Shows a "Paste code" chip when user returns from WhatsApp.
 *
 * Features:
 * - Detects 6-digit codes in clipboard on visibility change
 * - Provides button-triggered read (for iOS Safari compatibility)
 * - Auto-clears after successful paste
 */

import { useState, useEffect, useCallback } from 'react';

interface UseClipboardOTPResult {
    /** Detected OTP code from clipboard (null if none) */
    detectedCode: string | null;
    /** Whether we detected the user returning from another app */
    showPasteChip: boolean;
    /** Manually trigger clipboard read (for button press) */
    readClipboard: () => Promise<string | null>;
    /** Clear the detected code */
    clearDetectedCode: () => void;
    /** Whether clipboard API is supported */
    isSupported: boolean;
}

/**
 * Detects if a string contains a 6-digit OTP code
 */
function extractOtpFromText(text: string): string | null {
    // Match 6 consecutive digits
    const match = text.match(/\b(\d{6})\b/);
    return match ? match[1] : null;
}

export function useClipboardOTP(): UseClipboardOTPResult {
    const [detectedCode, setDetectedCode] = useState<string | null>(null);
    const [showPasteChip, setShowPasteChip] = useState(false);

    // Check if clipboard API is supported
    const isSupported =
        typeof navigator !== 'undefined' &&
        'clipboard' in navigator &&
        typeof navigator.clipboard.readText === 'function';

    /**
     * Manually read clipboard (button-triggered, works on iOS)
     */
    const readClipboard = useCallback(async (): Promise<string | null> => {
        if (!isSupported) return null;

        try {
            const text = await navigator.clipboard.readText();
            const code = extractOtpFromText(text);

            if (code) {
                setDetectedCode(code);
                setShowPasteChip(false);
                return code;
            }
        } catch (error) {
            // Clipboard read failed (permission denied or empty)
            console.debug('Clipboard read failed:', error);
        }

        return null;
    }, [isSupported]);

    /**
     * Clear detected code
     */
    const clearDetectedCode = useCallback(() => {
        setDetectedCode(null);
        setShowPasteChip(false);
    }, []);

    /**
     * Handle visibility change (user returns from WhatsApp)
     */
    useEffect(() => {
        if (!isSupported) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // User returned to app - show paste chip
                // We don't auto-read here (iOS blocks it), just show the CTA
                setShowPasteChip(true);

                // Auto-hide paste chip after 10 seconds
                setTimeout(() => {
                    setShowPasteChip(false);
                }, 10000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSupported]);

    return {
        detectedCode,
        showPasteChip,
        readClipboard,
        clearDetectedCode,
        isSupported,
    };
}

export default useClipboardOTP;
