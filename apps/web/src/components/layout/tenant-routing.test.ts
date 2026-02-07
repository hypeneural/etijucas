import { describe, expect, it } from 'vitest';
import { filterTabsByModules } from './BottomTabBar';
import { normalizeTenantPath } from './MainLayout';

describe('tenant menu/module gate', () => {
  it('hides tabs for disabled modules', () => {
    const tabs = [
      { id: 'home' as const, label: 'Inicio', icon: () => null },
      { id: 'reportar' as const, label: 'Fiscaliza', icon: () => null },
      { id: 'forum' as const, label: 'Trombone', icon: () => null },
      { id: 'agenda' as const, label: 'Agenda', icon: () => null },
      { id: 'mais' as const, label: 'Mais', icon: () => null },
    ];

    const visible = filterTabsByModules(tabs, (moduleKey) => moduleKey === 'forum');

    expect(visible.map((tab) => tab.id)).toEqual(['home', 'forum', 'mais']);
  });
});

describe('tenant route normalization', () => {
  it('strips /uf/cidade prefix to compute active tab path', () => {
    expect(normalizeTenantPath('/sc/tijucas/forum')).toBe('/forum');
    expect(normalizeTenantPath('/sc/tijucas')).toBe('/');
    expect(normalizeTenantPath('/agenda')).toBe('/agenda');
  });
});

