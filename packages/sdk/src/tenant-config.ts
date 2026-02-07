export interface TenantCityConfig {
    id: string;
    name: string;
    slug: string;
    uf: string;
    fullName: string;
    status: 'staging' | 'active' | 'inactive' | 'archived';
    ibgeCode?: string;
}

export interface TenantBrandConfig {
    appName: string;
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export interface TenantModuleConfig {
    key: string;
    slug: string;
    routeSlugPtbr?: string;
    name: string;
    namePtbr?: string;
    icon?: string;
    description?: string;
    enabled: boolean;
    settings?: Record<string, unknown>;
}

export interface TenantGeoConfig {
    defaultBairroId?: string;
    lat?: number;
    lon?: number;
}

export interface TenantFeaturesConfig {
    offlineEnabled?: boolean;
    pushNotifications?: boolean;
}

export interface TenantConfigPayload {
    city: TenantCityConfig;
    brand: TenantBrandConfig;
    modules: TenantModuleConfig[];
    geo: TenantGeoConfig;
    features?: TenantFeaturesConfig;
}

export interface TenantConfigResponse {
    success: boolean;
    data: TenantConfigPayload;
    meta?: {
        requestId?: string;
        cachedAt?: string;
        version?: string;
    };
}

export interface TenantCityListItem {
    id: string;
    name: string;
    slug: string;
    uf: string;
    fullName: string;
}

export interface TenantCitiesResponse {
    success: boolean;
    data: TenantCityListItem[];
    meta?: {
        count?: number;
    };
}

export interface TenantCityDetectData extends TenantCityListItem {
    distance?: number;
}

export interface TenantCityDetectResponse {
    success: boolean;
    data?: TenantCityDetectData;
    error?: string;
    message?: string;
}
