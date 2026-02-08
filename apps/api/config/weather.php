<?php

declare(strict_types=1);

return [
    'v2' => [
        /*
        |--------------------------------------------------------------------------
        | Global Toggle
        |--------------------------------------------------------------------------
        |
        | Master switch for Weather V2 endpoints.
        |
        */
        'enabled' => (bool) env('WEATHER_V2_ENABLED', true),

        /*
        |--------------------------------------------------------------------------
        | Rollout Mode
        |--------------------------------------------------------------------------
        |
        | all: enable V2 for every city
        | canary: enable only for cities in WEATHER_V2_CANARY_CITIES
        | off: disable V2 for all cities
        |
        */
        'rollout_mode' => (string) env('WEATHER_V2_ROLLOUT_MODE', 'all'),

        /*
        |--------------------------------------------------------------------------
        | Canary City Slugs
        |--------------------------------------------------------------------------
        |
        | Comma-separated city slugs, example:
        | WEATHER_V2_CANARY_CITIES=tijucas-sc,porto-belo-sc
        |
        */
        'canary_cities' => array_values(array_filter(array_map(
            static fn(string $slug): string => strtolower(trim($slug)),
            explode(',', (string) env('WEATHER_V2_CANARY_CITIES', ''))
        ))),
    ],
];

