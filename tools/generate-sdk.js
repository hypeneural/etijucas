#!/usr/bin/env node
/**
 * SDK Generator Script
 * 
 * Generates TypeScript SDK from OpenAPI specification.
 * 
 * Usage: pnpm sdk:gen (from monorepo root)
 * 
 * This script reads contracts/openapi.yaml and generates:
 * - Type definitions in packages/sdk/src/types.ts
 * - API client methods in packages/sdk/src/api.ts
 * 
 * For production use, consider using:
 * - openapi-typescript (just types)
 * - openapi-fetch (types + fetch client)
 * - orval (full client generation)
 * 
 * This scaffold provides a basic implementation.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const OPENAPI_PATH = resolve(ROOT, 'contracts/openapi.yaml');
const SDK_TYPES_PATH = resolve(ROOT, 'packages/sdk/src/generated-types.ts');

function main() {
    console.log('🔄 SDK Generation started...');

    // Check if OpenAPI spec exists
    if (!existsSync(OPENAPI_PATH)) {
        console.error('❌ OpenAPI spec not found at:', OPENAPI_PATH);
        console.error('   Please create contracts/openapi.yaml first.');
        process.exit(1);
    }

    console.log('📄 Reading OpenAPI spec from:', OPENAPI_PATH);
    const spec = readFileSync(OPENAPI_PATH, 'utf-8');

    // For a production-ready solution, install and use:
    // npm install -D openapi-typescript
    // npx openapi-typescript contracts/openapi.yaml -o packages/sdk/src/types.ts

    console.log('');
    console.log('⚡ For production SDK generation, run:');
    console.log('');
    console.log('   pnpm add -Dw openapi-typescript openapi-fetch');
    console.log('   npx openapi-typescript contracts/openapi.yaml -o packages/sdk/src/schema.d.ts');
    console.log('');

    // Generate a placeholder types file
    const generatedTypes = `/**
 * Auto-generated types from OpenAPI specification
 * 
 * Generated at: ${new Date().toISOString()}
 * Source: contracts/openapi.yaml
 * 
 * For full type generation, install openapi-typescript:
 *   pnpm add -Dw openapi-typescript
 *   npx openapi-typescript contracts/openapi.yaml -o packages/sdk/src/schema.d.ts
 */

// Placeholder types - will be replaced by actual generated types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bairro_id: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_featured: boolean;
  image_url: string | null;
  category: EventCategory;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface Bairro {
  id: string;
  name: string;
  city_id: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
`;

    writeFileSync(SDK_TYPES_PATH, generatedTypes);
    console.log('✅ Generated placeholder types at:', SDK_TYPES_PATH);
    console.log('');
    console.log('🎉 SDK generation complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Install openapi-typescript for full type generation');
    console.log('  2. Configure Laravel to auto-generate openapi.yaml');
    console.log('  3. Add sdk:gen to CI/CD pipeline');
}

main();
