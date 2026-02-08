/**
 * useProfileLevel Hook
 *
 * Manages user profile completion levels for progressive profiling.
 * Allows step-up enrollment when users try to access features requiring
 * higher profile completion levels.
 *
 * Levels:
 * 0 - Anonymous (browsing only)
 * 1 - Authenticated Minimal (phone verified + name)
 * 2 - Local Profile (bairro selected for current city)
 * 3 - Complete Profile (push notifications enabled)
 */

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';

export type ProfileLevel = 0 | 1 | 2 | 3;

export interface ProfileLevelInfo {
    /** Current profile level (0-3) */
    level: ProfileLevel;
    /** Check if user can access a feature requiring the given level */
    canAccess: (requiredLevel: ProfileLevel) => boolean;
    /** List of fields missing for next level */
    missingFields: string[];
    /** Level names for UI display */
    levelName: string;
    /** Next level name */
    nextLevelName: string | null;
    /** Is user authenticated? */
    isAuthenticated: boolean;
    /** Does user have name? */
    hasName: boolean;
    /** Does user have bairro for current city? */
    hasLocalBairro: boolean;
    /** Does user have push notifications? */
    hasPushEnabled: boolean;
}

/**
 * Feature requirements mapping
 */
export const FEATURE_REQUIREMENTS: Record<string, ProfileLevel> = {
    // Level 0 - Anonymous
    'events.view': 0,
    'phones.view': 0,
    'weather.view': 0,
    'masses.view': 0,

    // Level 1 - Authenticated Minimal
    'forum.comment': 1,
    'forum.like': 1,
    'events.save': 1,
    'profile.view': 1,

    // Level 2 - Local Profile
    'reports.create': 2,
    'forum.create': 2,
    'neighborhood.alerts': 2,

    // Level 3 - Complete Profile
    'notifications.push': 3,
    'alerts.personalized': 3,
};

/**
 * Level names for display
 */
const LEVEL_NAMES: Record<ProfileLevel, string> = {
    0: 'Visitante',
    1: 'Morador',
    2: 'Morador Local',
    3: 'Morador Ativo',
};

export function useProfileLevel(): ProfileLevelInfo {
    const { user, isAuthenticated } = useAuthStore();
    const { city } = useTenantStore();

    // Calculate current level based on user state
    const { level, missingFields } = useMemo(() => {
        const missing: string[] = [];

        // Level 0: Not authenticated
        if (!isAuthenticated || !user) {
            return { level: 0 as ProfileLevel, missingFields: ['authentication'] };
        }

        // Check Level 1 requirements
        const hasName = Boolean(user.nome && user.nome.trim().length >= 2);
        const hasTerms = Boolean(user.termsAccepted);

        if (!hasName) missing.push('nome');
        if (!hasTerms) missing.push('terms');

        if (!hasName || !hasTerms) {
            return { level: 0 as ProfileLevel, missingFields: missing };
        }

        // Check Level 2 requirements (local bairro for current city)
        const hasLocalBairro = Boolean(user.bairroId);

        if (!hasLocalBairro) {
            return { level: 1 as ProfileLevel, missingFields: ['bairro'] };
        }

        // Check Level 3 requirements (push notifications)
        // For now, check if push is enabled in preferences
        const hasPushEnabled = Boolean((user as any).push_enabled);

        if (!hasPushEnabled) {
            return { level: 2 as ProfileLevel, missingFields: ['push_notifications'] };
        }

        // Full profile
        return { level: 3 as ProfileLevel, missingFields: [] };
    }, [isAuthenticated, user, city]);

    // Check access permission
    const canAccess = useCallback(
        (requiredLevel: ProfileLevel): boolean => {
            return level >= requiredLevel;
        },
        [level]
    );

    // Derived values
    const hasName = Boolean(user?.nome && user.nome.trim().length >= 2);
    const hasLocalBairro = Boolean(user?.bairroId);
    const hasPushEnabled = Boolean((user as any)?.push_enabled);

    return {
        level,
        canAccess,
        missingFields,
        levelName: LEVEL_NAMES[level],
        nextLevelName: level < 3 ? LEVEL_NAMES[(level + 1) as ProfileLevel] : null,
        isAuthenticated,
        hasName,
        hasLocalBairro,
        hasPushEnabled,
    };
}

/**
 * Get the required level for a feature
 */
export function getFeatureLevel(feature: string): ProfileLevel {
    return FEATURE_REQUIREMENTS[feature] ?? 0;
}

/**
 * Get human-readable description of what's needed for a level
 */
export function getLevelDescription(level: ProfileLevel): string {
    switch (level) {
        case 0:
            return 'Visualizar conteúdo público';
        case 1:
            return 'Telefone verificado e nome cadastrado';
        case 2:
            return 'Bairro selecionado para sua cidade';
        case 3:
            return 'Notificações push ativadas';
        default:
            return '';
    }
}

export default useProfileLevel;
