import { describe, expect, it } from 'vitest';
import { resolveQuickAccessModuleKey } from './QuickAccessGridVivo';
import type { QuickAccessItem } from '@/types/home.types';

describe('QuickAccess module contract', () => {
  it('prefers module_key from backend payload', () => {
    const item: QuickAccessItem = {
      id: 'custom',
      label: 'Custom',
      icon: 'calendar',
      route: '/agenda',
      module_key: 'events',
      badge: null,
    };

    expect(resolveQuickAccessModuleKey(item)).toBe('events');
  });

  it('does not infer module when module_key is absent and fallback flag is off', () => {
    const item: QuickAccessItem = {
      id: 'eventos',
      label: 'Eventos',
      icon: 'calendar',
      route: '/agenda',
      badge: null,
    };

    expect(resolveQuickAccessModuleKey(item)).toBeNull();
  });
});
