<?php

namespace App\Services;

use App\DTOs\AddressDTO;
use App\DTOs\MatchResult;
use App\Jobs\LogAddressMismatch;
use App\Models\Bairro;
use App\Models\BairroAlias;
use App\Models\City;
use App\Support\Normalizer;

/**
 * AddressMatcherService
 * 
 * Resolves city_id and bairro_id from address data.
 */
class AddressMatcherService
{
    /**
     * Match address to city and bairro.
     * 
     * @param string $tenantCityId The tenant's city ID
     * @param AddressDTO $address Address data from CEP lookup
     * @return MatchResult
     */
    public function match(string $tenantCityId, AddressDTO $address): MatchResult
    {
        // 1. Verify CEP city matches tenant city
        $cepCity = null;
        if ($address->ibgeCode) {
            $cepCity = City::where('ibge_code', $address->ibgeCode)->first();
        }

        $cityOk = $cepCity && $cepCity->id === $tenantCityId;

        if (!$cityOk) {
            return MatchResult::cityMismatch($tenantCityId, $cepCity);
        }

        // 2. No bairro to match
        if (empty($address->bairroText)) {
            return MatchResult::none($tenantCityId, $cepCity->id, '');
        }

        // 3. Normalize bairro text
        $normKey = Normalizer::toCanonicalKey($address->bairroText);

        // 4. Try direct match by slug
        $bairro = Bairro::where('city_id', $tenantCityId)
            ->where('slug', $normKey)
            ->where('active', true)
            ->first();

        if ($bairro) {
            return MatchResult::direct($tenantCityId, $bairro);
        }

        // 5. Try alias match
        $alias = BairroAlias::where('city_id', $tenantCityId)
            ->where('alias_slug', $normKey)
            ->where('enabled', true)
            ->first();

        if ($alias) {
            return MatchResult::alias($tenantCityId, $alias->bairro, $alias);
        }

        // 6. No match - dispatch job to log mismatch
        LogAddressMismatch::dispatch(
            $tenantCityId,
            $normKey,
            $address->bairroText,
            'viacep'
        );

        return MatchResult::none($tenantCityId, $cepCity->id, $normKey);
    }

    /**
     * Get available bairros for a city.
     * 
     * @param string $cityId City ID
     * @return \Illuminate\Support\Collection
     */
    public function getAvailableBairros(string $cityId)
    {
        return Bairro::where('city_id', $cityId)
            ->where('active', true)
            ->ordered()
            ->get(['id', 'nome', 'slug']);
    }
}
