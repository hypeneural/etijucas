import { useEffect, useState, useCallback } from 'react';

interface KeyboardState {
    isVisible: boolean;
    height: number;
}

/**
 * Hook to detect and respond to virtual keyboard appearance.
 * Uses the Visual Viewport API for accurate keyboard detection on mobile.
 * 
 * @example
 * const { isVisible, height } = useKeyboardAvoidance();
 * // Adjust bottom padding when keyboard is visible
 */
export function useKeyboardAvoidance() {
    const [keyboardState, setKeyboardState] = useState<KeyboardState>({
        isVisible: false,
        height: 0,
    });

    const updateKeyboardState = useCallback(() => {
        if (typeof window === 'undefined' || !window.visualViewport) {
            return;
        }

        const viewport = window.visualViewport;
        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;
        const keyboardHeight = windowHeight - viewportHeight;

        // Keyboard is considered visible if viewport is significantly smaller
        const isVisible = keyboardHeight > 100;

        setKeyboardState({
            isVisible,
            height: isVisible ? keyboardHeight : 0,
        });

        // If keyboard is visible, scroll focused element into view
        if (isVisible && document.activeElement instanceof HTMLElement) {
            const element = document.activeElement;
            const elementRect = element.getBoundingClientRect();
            const viewportBottom = viewportHeight;

            // If element is below viewport, scroll it into view
            if (elementRect.bottom > viewportBottom - 20) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) {
            return;
        }

        const viewport = window.visualViewport;

        viewport.addEventListener('resize', updateKeyboardState);
        viewport.addEventListener('scroll', updateKeyboardState);

        // Initial check
        updateKeyboardState();

        return () => {
            viewport.removeEventListener('resize', updateKeyboardState);
            viewport.removeEventListener('scroll', updateKeyboardState);
        };
    }, [updateKeyboardState]);

    return keyboardState;
}

/**
 * Simple hook that returns true if the keyboard is currently visible.
 */
export function useIsKeyboardVisible(): boolean {
    const { isVisible } = useKeyboardAvoidance();
    return isVisible;
}

export default useKeyboardAvoidance;
