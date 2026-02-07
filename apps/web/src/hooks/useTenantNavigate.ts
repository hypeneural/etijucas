/**
 * useTenantNavigate - Hook for tenant-aware navigation
 * 
 * Combines react-router's useNavigate with useCityRoute to ensure
 * all navigation preserves the city prefix when in multi-city mode.
 * 
 * Usage:
 * ```tsx
 * const navigate = useTenantNavigate();
 * navigate('/eventos'); // Automatically becomes /sc/tijucas/eventos if in multi-city mode
 * ```
 * 
 * This is the RECOMMENDED way to navigate in the app.
 * Direct usage of react-router's useNavigate should be avoided.
 */

import { useCallback } from 'react';
import { useNavigate as useRouterNavigate, NavigateOptions } from 'react-router-dom';
import { useCityRoute } from './useCityRoute';

type To = string | number;

interface TenantNavigateFunction {
    (to: To, options?: NavigateOptions): void;
}

export function useTenantNavigate(): TenantNavigateFunction {
    const routerNavigate = useRouterNavigate();
    const { buildRoute } = useCityRoute();

    const navigate = useCallback<TenantNavigateFunction>(
        (to, options) => {
            // Handle numeric navigation (back/forward)
            if (typeof to === 'number') {
                routerNavigate(to);
                return;
            }

            // Skip prefixing for external URLs
            if (to.startsWith('http://') || to.startsWith('https://')) {
                window.location.href = to;
                return;
            }

            // Build tenant-aware route and navigate
            const tenantAwarePath = buildRoute(to);
            routerNavigate(tenantAwarePath, options);
        },
        [routerNavigate, buildRoute]
    );

    return navigate;
}

export default useTenantNavigate;
