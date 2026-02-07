/**
 * ModuleGate Component
 * 
 * Conditionally renders children based on whether a module is enabled for the current tenant.
 * Uses useTenantStore to check module availability.
 * 
 * Usage:
 * ```tsx
 * <ModuleGate module="forum">
 *   <ForumPage />
 * </ModuleGate>
 * 
 * <ModuleGate module="events" fallback={<ComingSoon />}>
 *   <EventsPage />
 * </ModuleGate>
 * ```
 */

import type { ReactNode } from 'react';
import { useTenantStore } from '../store/useTenantStore';

interface ModuleGateProps {
    /** Module slug to check (e.g., "forum", "events", "coleta-lixo") */
    module: string;

    /** Content to render if module is enabled */
    children: ReactNode;

    /** Content to render if module is disabled (optional) */
    fallback?: ReactNode;

    /** If true, renders nothing instead of fallback when disabled */
    silent?: boolean;
}

export function ModuleGate({
    module,
    children,
    fallback = null,
    silent = false,
}: ModuleGateProps) {
    const isEnabled = useTenantStore((state) => state.isModuleEnabled(module));
    const isBootstrapped = useTenantStore((state) => state.isBootstrapped);

    // While bootstrapping, render nothing to avoid flash
    if (!isBootstrapped) {
        return null;
    }

    // If module is enabled, render children
    if (isEnabled) {
        return <>{children}</>;
    }

    // If silent mode, render nothing
    if (silent) {
        return null;
    }

    // Otherwise render fallback
    return <>{fallback}</>;
}

/**
 * Hook to check if a module is enabled
 */
export function useModuleEnabled(module: string): boolean {
    const isEnabled = useTenantStore((state) => state.isModuleEnabled(module));
    const isBootstrapped = useTenantStore((state) => state.isBootstrapped);

    return isBootstrapped && isEnabled;
}

/**
 * Hook to get all enabled modules
 */
export function useEnabledModules() {
    return useTenantStore((state) => state.modules);
}

export default ModuleGate;
