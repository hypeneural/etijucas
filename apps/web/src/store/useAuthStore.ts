// Auth Store
// Global state for authentication

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api.types';

interface AuthStore {
    // State
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;

    // Actions
    setAuth: (user: User, token: string, refreshToken: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;

    // Computed-like helpers
    hasRole: (role: string) => boolean;
    isVerified: () => boolean;
    needsOnboarding: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: (user, token, refreshToken) => set({
                user,
                token,
                refreshToken,
                isAuthenticated: true,
            }),

            logout: () => set({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
            }),

            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null,
            })),

            hasRole: (role: string) => {
                const { user } = get();
                return user?.roles?.includes(role) ?? false;
            },

            isVerified: () => {
                const { user } = get();
                return user?.phoneVerified ?? false;
            },

            needsOnboarding: () => {
                const { user, isAuthenticated } = get();
                return isAuthenticated && user && !user.profileCompleted;
            },
        }),
        {
            name: 'etijucas-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
