/**
 * PersistGate - Blocks rendering until React Query cache is restored
 * 
 * This prevents the "Rendered more hooks than during the previous render"
 * error (#310) that can occur when components try to render while
 * the cache is being restored from IndexedDB.
 * 
 * @see https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient
 */

import { ReactNode } from 'react';
import { useIsRestoring } from '@tanstack/react-query';

interface PersistGateProps {
    children: ReactNode;
    /**
     * Fallback component to show while cache is being restored.
     * If not provided, nothing is rendered during restoration.
     */
    fallback?: ReactNode;
}

/**
 * Default loading fallback for persist gate
 */
function DefaultFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
}

/**
 * PersistGate component that blocks rendering until cache restoration is complete.
 * 
 * Usage:
 * ```tsx
 * <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
 *   <PersistGate fallback={<Loading />}>
 *     <App />
 *   </PersistGate>
 * </PersistQueryClientProvider>
 * ```
 */
export function PersistGate({ children, fallback }: PersistGateProps) {
    const isRestoring = useIsRestoring();

    if (isRestoring) {
        return <>{fallback ?? <DefaultFallback />}</>;
    }

    return <>{children}</>;
}

export default PersistGate;
