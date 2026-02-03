/**
 * Auth Guard Component
 * 
 * Protege rotas que exigem autenticação.
 * Redireciona para login se não autenticado.
 * 
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <ProfilePage />
 * </AuthGuard>
 * ```
 * 
 * Ou nas rotas:
 * ```tsx
 * <Route path="/perfil" element={<AuthGuard><ProfilePage /></AuthGuard>} />
 * ```
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Custom hook wrapper for auth state
 */
function useAuth() {
    const { user, isAuthenticated } = useAuthStore();
    return { user, isAuthenticated, isLoading: false };
}

interface AuthGuardProps {
    children: ReactNode;
    /** Redireciona para esta rota se não autenticado */
    redirectTo?: string;
    /** Se true, mostra loading enquanto verifica auth */
    showLoading?: boolean;
}

export function AuthGuard({
    children,
    redirectTo = '/login',
    showLoading = true
}: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Mostra loading enquanto verifica autenticação
    if (isLoading && showLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Redireciona para login se não autenticado
    if (!isAuthenticated) {
        // Salva a localização atual para redirecionar após login
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

/**
 * Role Guard Component
 * 
 * Protege rotas que exigem roles específicas.
 * 
 * Usage:
 * ```tsx
 * <RoleGuard roles={['admin', 'moderator']}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
interface RoleGuardProps {
    children: ReactNode;
    roles: string[];
    /** Fallback se não tiver permissão */
    fallback?: ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
    const { user } = useAuth();

    // Verifica se usuário tem alguma das roles
    const hasRole = user?.roles?.some(role => roles.includes(role)) ?? false;

    if (!hasRole) {
        return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default AuthGuard;
