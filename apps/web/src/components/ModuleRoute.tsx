/**
 * ModuleRoute Component
 * 
 * Wraps page components with ModuleGate for route-level protection.
 * Shows ModuleUnavailable fallback when module is disabled for current tenant.
 * 
 * Usage in App.tsx:
 * ```tsx
 * <Route path="/forum" element={<ModuleRoute module="forum"><ForumScreen /></ModuleRoute>} />
 * ```
 */

import type { ReactNode } from 'react';
import { ModuleGate } from './ModuleGate';
import { ModuleUnavailable } from './ModuleUnavailable';

interface ModuleRouteProps {
    /** Module slug to check (e.g., "forum", "events") */
    module: string;

    /** Human-readable module name for fallback UI */
    moduleName?: string;

    /** Content to render if module is enabled */
    children: ReactNode;
}

// Module slug to display name mapping
const MODULE_NAMES: Record<string, string> = {
    'forum': 'Boca no Trombone',
    'events': 'Agenda de Eventos',
    'coleta-lixo': 'Coleta de Lixo',
    'missas': 'Horários de Missas',
    'telefones': 'Telefones Úteis',
    'turismo': 'Pontos Turísticos',
    'denuncias': 'Fiscaliza Cidadão',
    'votacoes': 'Votações',
    'vereadores': 'Vereadores',
    'veiculos': 'Consulta de Veículos',
    'tempo': 'Previsão do Tempo',
};

export function ModuleRoute({ module, moduleName, children }: ModuleRouteProps) {
    const displayName = moduleName || MODULE_NAMES[module] || module;

    return (
        <ModuleGate
            module={module}
            fallback={<ModuleUnavailable moduleName={displayName} moduleSlug={module} />}
        >
            {children}
        </ModuleGate>
    );
}

export default ModuleRoute;
