<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Vehicle API (wdapi2.com.br) Configuration
    |--------------------------------------------------------------------------
    */

    'base_url' => env('WDAPI_BASE_URL', 'https://wdapi2.com.br'),

    'token' => env('WDAPI_TOKEN'),

    // Cache TTL in days for successful responses (200)
    'ttl_days_success' => env('WDAPI_TTL_DAYS', 30),

    // Cache TTL in hours for not found responses (406)
    'ttl_hours_not_found' => env('WDAPI_TTL_404', 24),

    // Cache TTL in minutes for error responses (429, 500, etc.)
    'ttl_minutes_error' => env('WDAPI_TTL_ERROR', 10),
];
