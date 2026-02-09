/**
 * Auto-generated types from OpenAPI specification
 *
 * Generated at: 2026-02-08T11:36:09.538Z
 * Source: contracts/openapi.yaml
 *
 * For full type generation, install openapi-typescript:
 *   pnpm add -Dw openapi-typescript
 *   npx openapi-typescript contracts/openapi.yaml -o packages/sdk/src/schema.d.ts
 */
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
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: Record<string, string[]>;
}
export interface EventTag {
    id: string;
    name: string;
    slug: string;
}
export interface Topic {
    id: string;
    title: string;
    content: string;
    category: string;
    bairro_id?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    comments_count: number;
    likes_count: number;
    is_liked: boolean;
    is_saved: boolean;
    user?: User;
    bairro?: Bairro;
    images?: string[];
}
export interface Comment {
    id: string;
    content: string;
    topic_id: string;
    user_id: string;
    parent_id?: string;
    created_at: string;
    updated_at: string;
    user?: User;
    likes_count: number;
    is_liked: boolean;
    replies?: Comment[];
}
//# sourceMappingURL=generated-types.d.ts.map