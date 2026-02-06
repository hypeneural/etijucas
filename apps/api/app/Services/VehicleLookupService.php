<?php

namespace App\Services;

use App\Models\VehicleCache;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VehicleLookupService
{
    public function __construct(
        private WdApiClient $client
    ) {
    }

    /**
     * Get vehicle data from cache or fetch from API.
     * 
     * @param string $plate Normalized plate
     * @param array $opts Options: refresh (bool), premium (bool)
     * @return VehicleCache
     */
    public function getOrFetch(string $plate, array $opts = []): VehicleCache
    {
        $refresh = (bool) ($opts['refresh'] ?? false);
        $plate = $this->normalizePlate($plate);

        // Lock to prevent concurrent API calls for the same plate
        $lockKey = "vehicle_lookup:{$plate}";
        $lock = Cache::lock($lockKey, 10);

        try {
            return $lock->block(5, function () use ($plate, $refresh) {
                return $this->doLookup($plate, $refresh);
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            // If lock times out, try to return cached data anyway
            $cached = VehicleCache::byPlate($plate)->first();
            if ($cached) {
                return $cached;
            }

            // Create a temporary error entry
            return $this->createErrorEntry($plate, 503, 'Servidor ocupado, tente novamente.');
        }
    }

    /**
     * Perform the actual lookup logic.
     */
    private function doLookup(string $plate, bool $refresh): VehicleCache
    {
        $now = Carbon::now();
        $existing = VehicleCache::byPlate($plate)->first();

        // Cache hit: return if valid and not forcing refresh
        if ($existing && !$refresh && $existing->isValid()) {
            $existing->increment('hits');
            Log::info('VehicleLookupService: Cache hit', ['plate' => $plate]);
            return $existing->fresh();
        }

        // Fetch from API
        $api = $this->client->consult($plate);
        $status = $api['status'];
        $json = $api['json'];

        // Handle error responses
        if ($status !== 200 || !is_array($json)) {
            return $this->storeApiFailure($plate, $status, $api['error'] ?? 'Erro na consulta.', $existing);
        }

        // Extract useful fields
        return $this->storeSuccess($plate, $json, $existing);
    }

    /**
     * Store successful API response.
     */
    private function storeSuccess(string $plate, array $json, ?VehicleCache $existing): VehicleCache
    {
        $now = Carbon::now();
        $extra = $json['extra'] ?? null;
        $fipe = $json['fipe'] ?? null;

        $plateType = $this->detectPlateType($plate);
        $finalDigit = is_numeric(substr($plate, -1)) ? (int) substr($plate, -1) : null;

        $ttlDays = (int) config('vehicle.ttl_days_success', 30);
        $expiresAt = $now->copy()->addDays($ttlDays);

        $data = [
            'plate' => $plate,
            'plate_type' => $plateType,
            'final_digit' => $finalDigit,
            'brand' => $json['marca'] ?? $json['MARCA'] ?? null,
            'model' => $json['modelo'] ?? $json['MODELO'] ?? null,
            'color' => $json['cor'] ?? null,
            'uf' => $json['uf'] ?? ($extra['uf'] ?? null),
            'municipio' => $json['municipio'] ?? ($extra['municipio'] ?? null),
            'situacao' => $json['situacao'] ?? null,
            'logo_url' => $json['logo'] ?? null,
            'payload' => $json,
            'extra' => $extra,
            'fipe' => $fipe,
            'fetched_at' => $now,
            'expires_at' => $expiresAt,
            'last_status' => 200,
            'last_error' => null,
        ];

        if ($existing) {
            $existing->update($data);
            $existing->increment('hits');
            return $existing->fresh();
        }

        $created = VehicleCache::create($data);
        $created->increment('hits');

        Log::info('VehicleLookupService: Stored new vehicle data', ['plate' => $plate]);

        return $created->fresh();
    }

    /**
     * Store API failure (for negative caching).
     */
    private function storeApiFailure(string $plate, int $status, string $error, ?VehicleCache $existing): VehicleCache
    {
        $now = Carbon::now();

        // Determine TTL based on error type
        if ($status === 406) {
            // Not found: cache for longer
            $ttlHours = (int) config('vehicle.ttl_hours_not_found', 24);
            $expiresAt = $now->copy()->addHours($ttlHours);
        } else {
            // Other errors: short cache
            $ttlMinutes = (int) config('vehicle.ttl_minutes_error', 10);
            $expiresAt = $now->copy()->addMinutes($ttlMinutes);
        }

        $data = [
            'plate' => $plate,
            'plate_type' => $this->detectPlateType($plate),
            'final_digit' => is_numeric(substr($plate, -1)) ? (int) substr($plate, -1) : null,
            'payload' => null,
            'extra' => null,
            'fipe' => null,
            'fetched_at' => $now,
            'expires_at' => $expiresAt,
            'last_status' => $status,
            'last_error' => $error,
        ];

        if ($existing) {
            $existing->update($data);
            $existing->increment('hits');
            return $existing->fresh();
        }

        $created = VehicleCache::create($data);
        $created->increment('hits');

        Log::warning('VehicleLookupService: Stored API failure', [
            'plate' => $plate,
            'status' => $status,
            'error' => $error,
        ]);

        return $created->fresh();
    }

    /**
     * Create a temporary error entry (not persisted).
     */
    private function createErrorEntry(string $plate, int $status, string $error): VehicleCache
    {
        $entry = new VehicleCache();
        $entry->plate = $plate;
        $entry->last_status = $status;
        $entry->last_error = $error;
        return $entry;
    }

    /**
     * Normalize plate format.
     */
    public function normalizePlate(string $plate): string
    {
        $plate = strtoupper($plate);
        $plate = preg_replace('/[^A-Z0-9]/', '', $plate);
        return substr($plate, 0, 7);
    }

    /**
     * Detect plate type (old or mercosul).
     */
    public function detectPlateType(string $plate): ?string
    {
        $plate = $this->normalizePlate($plate);

        if (strlen($plate) !== 7) {
            return null;
        }

        // Old format: ABC1234
        if (preg_match('/^[A-Z]{3}\d{4}$/', $plate)) {
            return 'old';
        }

        // Mercosul format: ABC1D23
        if (preg_match('/^[A-Z]{3}\d[A-Z]\d{2}$/', $plate)) {
            return 'mercosul';
        }

        return null;
    }

    /**
     * Validate plate format.
     */
    public function isValidPlate(string $plate): bool
    {
        return $this->detectPlateType($plate) !== null;
    }
}
