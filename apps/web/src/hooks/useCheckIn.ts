/**
 * useCheckIn - Hook for daily check-in gamification
 * 
 * Automatically performs check-in once per day when user is logged in.
 * Returns streak data and milestone info for UI display.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

interface StreakData {
    current: number;
    longest: number;
    total_check_ins: number;
    last_check_in: string | null;
    checked_in_today: boolean;
    is_milestone: boolean;
    milestone_value: number | null;
}

interface CheckInResponse {
    success: boolean;
    message: string;
    data: {
        streak: StreakData;
    };
}

const CHECK_IN_KEY = 'etijucas_last_checkin';
const STREAK_QUERY_KEY = ['user', 'streak'];

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if we already attempted check-in today (client-side)
 */
function hasCheckedInToday(): boolean {
    const lastCheckIn = localStorage.getItem(CHECK_IN_KEY);
    return lastCheckIn === getTodayKey();
}

/**
 * Mark check-in as done for today (client-side)
 */
function markCheckedInToday(): void {
    localStorage.setItem(CHECK_IN_KEY, getTodayKey());
}

export function useCheckIn() {
    const { isAuthenticated, user } = useAuthStore();
    const queryClient = useQueryClient();
    const [justReachedMilestone, setJustReachedMilestone] = useState<number | null>(null);

    // Query for streak data
    const {
        data: streakData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: STREAK_QUERY_KEY,
        queryFn: async () => {
            const response = await apiClient.get<{ data: { streak: StreakData } }>('/user/streak');
            return response.data.streak;
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Mutation for check-in
    const checkInMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<CheckInResponse>('/user/check-in');
            return response;
        },
        onSuccess: (response) => {
            const { streak } = response.data;

            // Update cache
            queryClient.setQueryData(STREAK_QUERY_KEY, streak);

            // Handle milestone celebration
            if (streak.is_milestone && streak.milestone_value) {
                setJustReachedMilestone(streak.milestone_value);
            }

            // Mark as checked in today
            markCheckedInToday();
        },
    });

    // Auto check-in on mount (once per day)
    useEffect(() => {
        if (isAuthenticated && !hasCheckedInToday() && !checkInMutation.isPending) {
            // Small delay to not block initial render
            const timer = setTimeout(() => {
                checkInMutation.mutate();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    // Clear milestone celebration after showing
    const clearMilestone = useCallback(() => {
        setJustReachedMilestone(null);
    }, []);

    // Manual check-in (for testing or manual trigger)
    const checkIn = useCallback(() => {
        if (isAuthenticated) {
            checkInMutation.mutate();
        }
    }, [isAuthenticated, checkInMutation]);

    return {
        // Data
        streak: streakData,
        isLoading,
        isCheckingIn: checkInMutation.isPending,

        // Milestone celebration
        justReachedMilestone,
        clearMilestone,

        // Actions
        checkIn,
        refetch,

        // Helpers
        isAuthenticated,
        hasCheckedInToday: streakData?.checked_in_today ?? hasCheckedInToday(),
    };
}

export default useCheckIn;
