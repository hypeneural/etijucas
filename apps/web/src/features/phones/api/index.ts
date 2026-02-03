/**
 * Phones - Static Data
 * 
 * Telefones úteis são dados estáticos (não vêm da API).
 * @see src/data/phoneContacts.ts
 */

// Query keys for caching if needed
export const phonesKeys = {
    all: ['phones'] as const,
};

// No API hooks - uses static data from src/data/phoneContacts.ts
