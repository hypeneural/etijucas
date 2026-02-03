/**
 * Core Router Module
 * 
 * Utilitários de roteamento: guards, permissões, navegação.
 */

export { AuthGuard, RoleGuard } from './AuthGuard';
export { can, usePermissions, Can } from './permissions';
