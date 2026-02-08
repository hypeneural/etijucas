import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { isOfflineLikeReportError } from './report.service';

describe('report.service offline error detection', () => {
    beforeEach(() => {
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: true,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns true when browser is offline', () => {
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: false,
        });

        expect(isOfflineLikeReportError(new Error('anything'))).toBe(true);
    });

    it('returns true for ApiError OFFLINE', () => {
        const error = new ApiError('offline', 0, 'OFFLINE');
        expect(isOfflineLikeReportError(error)).toBe(true);
    });

    it('returns true for fetch/network TypeError', () => {
        expect(isOfflineLikeReportError(new TypeError('Failed to fetch'))).toBe(true);
    });

    it('returns false for validation ApiError', () => {
        const error = new ApiError('validation', 422, 'VALIDATION_ERROR');
        expect(isOfflineLikeReportError(error)).toBe(false);
    });
});

