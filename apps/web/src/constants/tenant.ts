/**
 * Tenant Constants
 *
 * Centralized multi-tenancy defaults.
 */

// ============================================
// Default City
// ============================================

export const DEFAULT_CITY = {
    slug: 'tijucas-sc',
    name: 'Tijucas',
    uf: 'SC',
    fullName: 'Tijucas/SC',
    ibgeCode: '4218004',
} as const;

export const DEFAULT_CITY_SLUG = DEFAULT_CITY.slug;
export const DEFAULT_CITY_NAME = DEFAULT_CITY.name;
export const DEFAULT_CITY_UF = DEFAULT_CITY.uf;

// ============================================
// Modules (canonical keys)
// ============================================

export const ALL_MODULES = [
    { slug: 'forum', name: 'Boca no Trombone', icon: 'MessageSquare' },
    { slug: 'events', name: 'Agenda de Eventos', icon: 'Calendar' },
    { slug: 'trash', name: 'Coleta de Lixo', icon: 'Trash2' },
    { slug: 'masses', name: 'Horarios de Missas', icon: 'Church' },
    { slug: 'phones', name: 'Telefones Uteis', icon: 'Phone' },
    { slug: 'tourism', name: 'Pontos Turisticos', icon: 'MapPin' },
    { slug: 'reports', name: 'Fiscaliza Cidadao', icon: 'AlertTriangle' },
    { slug: 'voting', name: 'Votacoes', icon: 'Vote' },
    { slug: 'council', name: 'Vereadores', icon: 'Building' },
    { slug: 'vehicles', name: 'Consulta Veiculos', icon: 'Car' },
    { slug: 'weather', name: 'Previsao do Tempo', icon: 'CloudSun' },
] as const;

export const TIJUCAS_MODULES = ALL_MODULES.map((m) => m.slug);

/**
 * Default modules for cities other than Tijucas.
 */
export const DEFAULT_CITY_MODULES = ['forum', 'reports', 'weather'] as const;

// ============================================
// Module Route Mapping
// ============================================

export const MODULE_ROUTES: Record<string, string[]> = {
    forum: ['/forum', '/topico'],
    events: ['/agenda', '/evento'],
    trash: ['/coleta-lixo', '/coleta'],
    masses: ['/missas'],
    phones: ['/telefones', '/telefones-uteis'],
    tourism: ['/pontos-turisticos', '/ponto-turistico', '/turismo'],
    reports: ['/denuncias', '/denuncia', '/minhas-denuncias'],
    voting: ['/votacoes'],
    council: ['/vereadores'],
    vehicles: ['/veiculos', '/consulta-veiculo'],
    weather: ['/tempo', '/previsao'],
};

// ============================================
// Type Exports
// ============================================

export type ModuleSlug = typeof ALL_MODULES[number]['slug'];
