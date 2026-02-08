/**
 * useReportCategories - Fetch and cache report categories
 */

import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import type { ReportCategory } from '@/types/report';
import { useTenantStore } from '@/store/useTenantStore';

export function useReportCategories() {
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');

    const query = useQuery({
        queryKey: ['reports', tenantCacheScope, 'categories'],
        queryFn: () => reportService.getCategories(),
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    });

    return {
        categories: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function getCategoryById(
    categories: ReportCategory[],
    id: string | null
): ReportCategory | undefined {
    if (!id) return undefined;
    return categories.find((c) => c.id === id);
}

export default useReportCategories;
