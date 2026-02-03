/**
 * Auto-generated types from OpenAPI specification
 * 
 * Generated at: 2026-02-03T18:23:55.132Z
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
