<?php

namespace App\Services;

use App\DTOs\AddressDTO;
use App\Exceptions\CepNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CepLookupService
 * 
 * Handles ViaCEP API lookups with caching and rate limiting.
 */
class CepLookupService
{
    /**
     * Cache TTL in days.
     */
    private const CACHE_TTL_DAYS = 90;

    /**
     * Lock timeout in seconds.
     */
    private const LOCK_TIMEOUT = 10;

    /**
     * Lock wait time in seconds.
     */
    private const LOCK_WAIT = 5;

    /**
     * ViaCEP API base URL.
     */
    private const VIACEP_URL = 'https://viacep.com.br/ws';

    /**
     * Lookup address by CEP.
     * 
     * @param string $cep CEP with or without formatting
     * @return AddressDTO
     * @throws CepNotFoundException
     */
    public function lookup(string $cep): AddressDTO
    {
        $cep = $this->normalizeCep($cep);

        if (!$this->isValidCep($cep)) {
            throw new CepNotFoundException('CEP inválido. Deve conter 8 dígitos.');
        }

        $cacheKey = "viacep:{$cep}";

        // Try cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Use lock to prevent stampede
        return Cache::lock("lock:viacep:{$cep}", self::LOCK_TIMEOUT)
            ->block(self::LOCK_WAIT, function () use ($cep, $cacheKey) {
                // Check again after acquiring lock
                if (Cache::has($cacheKey)) {
                    return Cache::get($cacheKey);
                }

                $dto = $this->fetchFromApi($cep);

                // Cache the result
                Cache::put($cacheKey, $dto, now()->addDays(self::CACHE_TTL_DAYS));

                return $dto;
            });
    }

    /**
     * Fetch address from ViaCEP API.
     */
    private function fetchFromApi(string $cep): AddressDTO
    {
        try {
            $response = Http::timeout(10)
                ->retry(2, 100)
                ->get(self::VIACEP_URL . "/{$cep}/json/");

            if (!$response->ok()) {
                Log::warning('ViaCEP API error', [
                    'cep' => $cep,
                    'status' => $response->status(),
                ]);
                throw new CepNotFoundException('Erro ao consultar CEP. Tente novamente.');
            }

            $data = $response->json();

            // ViaCEP returns { erro: true } for non-existent CEPs
            if (!empty($data['erro'])) {
                throw new CepNotFoundException('CEP não encontrado.');
            }

            return AddressDTO::fromViaCep($data);
        } catch (CepNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('ViaCEP lookup failed', [
                'cep' => $cep,
                'error' => $e->getMessage(),
            ]);
            throw new CepNotFoundException('Erro de conexão ao consultar CEP.');
        }
    }

    /**
     * Normalize CEP to 8 digits.
     */
    private function normalizeCep(string $cep): string
    {
        return preg_replace('/\D/', '', $cep);
    }

    /**
     * Validate CEP format.
     */
    private function isValidCep(string $cep): bool
    {
        return preg_match('/^\d{8}$/', $cep) === 1;
    }

    /**
     * Clear cache for a specific CEP.
     */
    public function clearCache(string $cep): void
    {
        $cep = $this->normalizeCep($cep);
        Cache::forget("viacep:{$cep}");
    }
}
