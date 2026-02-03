/**
 * Permissions Helper
 * 
 * Verifica se o usuário tem permissão para realizar ações.
 * Usa as capabilities retornadas pelo endpoint /auth/me.
 * 
 * Usage:
 * ```ts
 * import { can, usePermissions } from '@/core/router/permissions';
 * 
 * // Em componentes
 * const { can } = usePermissions();
 * if (can('forum.topic.create')) { ... }
 * 
 * // Fora de componentes (com user passado)
 * if (can('forum.topic.delete', user)) { ... }
 * ```
 */

import { useAuthStore } from '@/store/useAuthStore';

type Permission =
    // Forum
    | 'forum.topic.create'
    | 'forum.topic.edit'
    | 'forum.topic.delete'
    | 'forum.comment.create'
    | 'forum.comment.delete'
    | 'forum.moderate'
    // Events
    | 'events.create'
    | 'events.edit'
    | 'events.delete'
    // Reports
    | 'reports.create'
    | 'reports.view_all'
    | 'reports.moderate'
    // Admin
    | 'admin.access'
    | 'admin.users.manage'
    | 'admin.content.manage';

interface User {
    id: string;
    roles?: string[];
    permissions?: string[];
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function can(permission: Permission, user?: User | null): boolean {
    if (!user) return false;

    // Admins têm todas as permissões
    if (user.roles?.includes('admin')) {
        return true;
    }

    // Verifica permissões explícitas
    if (user.permissions?.includes(permission)) {
        return true;
    }

    // Mapeamento de roles para permissões
    const rolePermissions: Record<string, Permission[]> = {
        moderator: [
            'forum.topic.delete',
            'forum.comment.delete',
            'forum.moderate',
            'reports.view_all',
            'reports.moderate',
        ],
        user: [
            'forum.topic.create',
            'forum.topic.edit', // próprios
            'forum.comment.create',
            'reports.create',
        ],
    };

    // Verifica se alguma role do usuário tem a permissão
    for (const role of user.roles || []) {
        if (rolePermissions[role]?.includes(permission)) {
            return true;
        }
    }

    // Permissões padrão para usuários autenticados
    const defaultPermissions: Permission[] = [
        'forum.topic.create',
        'forum.comment.create',
        'reports.create',
    ];

    return defaultPermissions.includes(permission);
}

/**
 * Hook para verificar permissões no contexto atual
 */
export function usePermissions() {
    const { user, isAuthenticated } = useAuthStore();

    return {
        can: (permission: Permission) => can(permission, user as User),
        isAuthenticated,
        isAdmin: user?.roles?.includes('admin') ?? false,
        isModerator: user?.roles?.includes('moderator') ?? false,
    };
}

/**
 * Componente para renderização condicional baseada em permissão
 */
interface CanProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
    const { can } = usePermissions();

    if (can(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

export default can;
