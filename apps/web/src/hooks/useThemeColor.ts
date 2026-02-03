import { useCallback, useEffect } from 'react';

/**
 * Hook to dynamically update the browser's theme-color meta tag.
 * This affects the status bar color on mobile devices.
 * 
 * @example
 * const { setThemeColor, resetThemeColor } = useThemeColor();
 * 
 * // When opening a modal with dark backdrop
 * setThemeColor('#1a1a1a');
 * 
 * // When closing
 * resetThemeColor();
 */
export function useThemeColor(defaultColor = '#0891b2') {
    const getMetaTag = useCallback(() => {
        let metaTag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;

        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'theme-color';
            metaTag.content = defaultColor;
            document.head.appendChild(metaTag);
        }

        return metaTag;
    }, [defaultColor]);

    const setThemeColor = useCallback((color: string) => {
        const metaTag = getMetaTag();
        metaTag.content = color;
    }, [getMetaTag]);

    const resetThemeColor = useCallback(() => {
        const metaTag = getMetaTag();
        metaTag.content = defaultColor;
    }, [defaultColor, getMetaTag]);

    // Set default on mount
    useEffect(() => {
        const metaTag = getMetaTag();
        if (!metaTag.content) {
            metaTag.content = defaultColor;
        }
    }, [defaultColor, getMetaTag]);

    return {
        setThemeColor,
        resetThemeColor,
        defaultColor,
    };
}

/**
 * Hook that automatically changes theme color when dark mode is active.
 */
export function useAutoThemeColor(lightColor = '#0891b2', darkColor = '#0e7490') {
    const { setThemeColor } = useThemeColor(lightColor);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setThemeColor(e.matches ? darkColor : lightColor);
        };

        // Initial check
        handleChange(mediaQuery);

        // Listen for changes
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [lightColor, darkColor, setThemeColor]);
}

export default useThemeColor;
