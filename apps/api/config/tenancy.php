<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Trusted Hosts
    |--------------------------------------------------------------------------
    |
    | Hosts that are allowed to resolve tenants. Supports wildcards.
    | If a host is not in this list and not in city_domains, it will be rejected.
    |
    */
    'trusted_hosts' => array_filter([
        env('APP_URL_HOST', 'etijucas.com.br'),
        'www.' . env('APP_URL_HOST', 'etijucas.com.br'),
        '*.cidadeconectada.app',
        // Development hosts
        'localhost',
        '127.0.0.1',
        env('TENANCY_EXTRA_HOST'),
    ]),

    /*
    |--------------------------------------------------------------------------
    | Allow Header Override
    |--------------------------------------------------------------------------
    |
    | When true, allows the X-City header to override tenant resolution.
    | Useful for mobile apps and development. Disable in strict environments.
    |
    */
    'allow_header_override' => env('TENANCY_ALLOW_HEADER', true),

    /*
    |--------------------------------------------------------------------------
    | Default City Slug
    |--------------------------------------------------------------------------
    |
    | The city slug to use when no tenant context can be resolved.
    | This is the fallback for requests that don't specify a city.
    |
    */
    'default_city_slug' => env('TENANCY_DEFAULT_CITY', 'tijucas-sc'),

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    |
    | TTL for caching tenant-related data.
    |
    */
    'cache' => [
        'domain_map_ttl' => 3600,      // 1 hour
        'city_config_ttl' => 900,       // 15 minutes
        'module_status_ttl' => 900,     // 15 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Observability
    |--------------------------------------------------------------------------
    |
    | Runtime signals for tenancy hardening and incident response.
    |
    */
    'observability' => [
        'enable_mismatch_alerts' => filter_var(env('TENANCY_MISMATCH_ALERTS_ENABLED', true), FILTER_VALIDATE_BOOL),
        'tenant_mismatch_window_seconds' => (int) env('TENANCY_MISMATCH_WINDOW', 300),
        'tenant_mismatch_alert_threshold' => (int) env('TENANCY_MISMATCH_THRESHOLD', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Strict Mode
    |--------------------------------------------------------------------------
    |
    | When true, requests without a valid tenant will be rejected.
    | When false, requests will fall back to the default city.
    |
    */
    'strict_mode' => env('TENANCY_STRICT', false),
];
