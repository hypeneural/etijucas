// useReports Hook
// React Query hooks for citizen reports

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';
import { reportService } from '@/services';
import { Report } from '@/types';
import { ReportFilters, PaginatedResponse, CreateReportDTO } from '@/types/api.types';

/**
 * Get paginated reports with filters
 */
export function useReports(filters?: ReportFilters) {
    return useQuery<PaginatedResponse<Report>>({
        queryKey: ['reports', 'list', filters],
        queryFn: () => reportService.getAll(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get current user's reports
 */
export function useMyReports() {
    return useQuery<Report[]>({
        queryKey: ['reports', 'mine'],
        queryFn: () => reportService.getMyReports(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get a single report by ID
 */
export function useReport(id: string) {
    return useQuery<Report | undefined>({
        queryKey: ['reports', 'detail', id],
        queryFn: () => reportService.getById(id),
        enabled: !!id,
    });
}

/**
 * Create a new report
 */
export function useCreateReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReportDTO) => reportService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] });
        },
    });
}
