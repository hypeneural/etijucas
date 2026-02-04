/**
 * useHaptic - Hook para feedback háptico nativo
 * Suporta Vibration API e preferência de usuário
 */

// Tipos de feedback háptico
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Padrões de vibração em ms
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 20],
    warning: [30, 50, 30],
    error: [50, 100, 50, 100, 50],
    selection: 5,
};

// Storage key para preferência
const HAPTIC_ENABLED_KEY = 'haptic-enabled';

// Checar se Vibration API está disponível
function canVibrate(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// Checar se feedback háptico está habilitado pelo usuário
function isHapticEnabled(): boolean {
    if (typeof localStorage === 'undefined') return true;
    const stored = localStorage.getItem(HAPTIC_ENABLED_KEY);
    return stored !== 'false'; // Default: enabled
}

// Setar preferência de haptic
export function setHapticEnabled(enabled: boolean): void {
    localStorage.setItem(HAPTIC_ENABLED_KEY, String(enabled));
}

// Disparar feedback háptico
export function haptic(type: HapticType = 'light'): void {
    if (!canVibrate() || !isHapticEnabled()) return;

    const pattern = HAPTIC_PATTERNS[type];
    try {
        navigator.vibrate(pattern);
    } catch {
        // Silently fail if vibration not supported
    }
}

// Hook conveniente
export function useHaptic() {
    return {
        trigger: haptic,
        light: () => haptic('light'),
        medium: () => haptic('medium'),
        heavy: () => haptic('heavy'),
        success: () => haptic('success'),
        warning: () => haptic('warning'),
        error: () => haptic('error'),
        selection: () => haptic('selection'),
        isSupported: canVibrate(),
        isEnabled: isHapticEnabled,
        setEnabled: setHapticEnabled,
    };
}

export default useHaptic;
