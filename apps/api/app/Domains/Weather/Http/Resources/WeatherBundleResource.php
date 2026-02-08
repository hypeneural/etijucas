<?php

declare(strict_types=1);

namespace App\Domains\Weather\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeatherBundleResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = is_array($this->resource) ? $this->resource : [];
        $location = is_array($payload['location'] ?? null) ? $payload['location'] : [];
        $cache = is_array($payload['cache'] ?? null) ? $payload['cache'] : [];
        $errors = is_array($payload['errors'] ?? null) ? $payload['errors'] : [];
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];

        return [
            'contract_version' => (string) ($payload['contract_version'] ?? '2.0'),
            'provider' => (string) ($payload['provider'] ?? 'unknown'),
            'request_id' => (string) ($payload['request_id'] ?? ''),
            'location' => [
                'city_slug' => (string) ($location['city_slug'] ?? ''),
                'lat' => isset($location['lat']) ? (float) $location['lat'] : null,
                'lon' => isset($location['lon']) ? (float) $location['lon'] : null,
                'timezone' => (string) ($location['timezone'] ?? 'America/Sao_Paulo'),
                'is_coastal' => (bool) ($location['is_coastal'] ?? false),
            ],
            'cache' => [
                'generated_at_utc' => (string) ($cache['generated_at_utc'] ?? ''),
                'expires_at_utc' => (string) ($cache['expires_at_utc'] ?? ''),
                'stale_until_utc' => (string) ($cache['stale_until_utc'] ?? ''),
                'degraded' => (bool) ($cache['degraded'] ?? false),
                'degraded_reason' => isset($cache['degraded_reason']) ? (string) $cache['degraded_reason'] : null,
            ],
            'errors' => $errors,
            'data' => $data,
        ];
    }
}
