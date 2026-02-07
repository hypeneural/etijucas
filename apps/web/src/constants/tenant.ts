/**
 * Tenant Constants
 * 
 * Configurações centralizadas para multi-tenancy.
 * Por enquanto, Tijucas/SC é a cidade fixa.
 * No futuro, será resolvido dinamicamente.
 */

// ============================================
// Default City (Fixo: Tijucas/SC)
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
// Modules - Todos ativos para Tijucas
// ============================================

export const ALL_MODULES = [
    { slug: 'forum', name: 'Boca no Trombone', icon: 'MessageSquare' },
    { slug: 'events', name: 'Agenda de Eventos', icon: 'Calendar' },
    { slug: 'coleta-lixo', name: 'Coleta de Lixo', icon: 'Trash2' },
    { slug: 'missas', name: 'Horários de Missas', icon: 'Church' },
    { slug: 'telefones', name: 'Telefones Úteis', icon: 'Phone' },
    { slug: 'turismo', name: 'Pontos Turísticos', icon: 'MapPin' },
    { slug: 'denuncias', name: 'Fiscaliza Cidadão', icon: 'AlertTriangle' },
    { slug: 'votacoes', name: 'Votações', icon: 'Vote' },
    { slug: 'veiculos', name: 'Consulta Veículos', icon: 'Car' },
] as const;

export const TIJUCAS_MODULES = ALL_MODULES.map(m => m.slug);

/**
 * Default modules for cities OTHER than Tijucas
 * Only forum, denuncias, and tempo are enabled by default
 */
export const DEFAULT_CITY_MODULES = ['forum', 'denuncias', 'tempo'] as const;

// ============================================
// Module Route Mapping
// ============================================

export const MODULE_ROUTES: Record<string, string[]> = {
    'forum': ['/forum', '/topico'],
    'events': ['/agenda', '/evento'],
    'coleta-lixo': ['/coleta-lixo', '/coleta'],
    'missas': ['/missas'],
    'telefones': ['/telefones', '/telefones-uteis'],
    'turismo': ['/pontos-turisticos', '/ponto-turistico', '/turismo'],
    'denuncias': ['/denuncias', '/denuncia', '/minhas-denuncias'],
    'votacoes': ['/votacoes', '/vereadores'],
    'veiculos': ['/veiculos', '/consulta-veiculo'],
    'tempo': ['/tempo', '/previsao'],
};

// ============================================
// Type Exports
// ============================================

export type ModuleSlug = typeof ALL_MODULES[number]['slug'];

