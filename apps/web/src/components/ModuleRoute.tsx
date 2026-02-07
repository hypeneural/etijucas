/**
 * ModuleRoute Component
 *
 * Wraps page components with ModuleGate for route-level protection.
 * Shows ModuleUnavailable fallback when module is disabled for current tenant.
 */

import type { ReactNode } from 'react';
import { ModuleGate } from './ModuleGate';
import { ModuleUnavailable } from './ModuleUnavailable';
import { useTenantStore } from '@/store/useTenantStore';

interface ModuleRouteProps {
  /** Canonical module key (e.g. forum, events, reports) */
  module: string;
  moduleName?: string;
  children: ReactNode;
}

export function ModuleRoute({ module, moduleName, children }: ModuleRouteProps) {
  const normalizedModule = module.toLowerCase();
  const moduleConfig = useTenantStore((state) =>
    state.modules.find((item) => {
      const key = (item.key || '').toLowerCase();
      const slug = (item.slug || '').toLowerCase();
      return key === normalizedModule || slug === normalizedModule;
    })
  );
  const displayName = moduleName || moduleConfig?.namePtbr || moduleConfig?.name || module;

  return (
    <ModuleGate module={module} fallback={<ModuleUnavailable moduleName={displayName} moduleSlug={module} />}>
      {children}
    </ModuleGate>
  );
}

export default ModuleRoute;
