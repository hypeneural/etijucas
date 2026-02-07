<?php

namespace App\Traits;

use App\Models\Bairro;
use App\Support\Tenant;
use Illuminate\Http\Response;

/**
 * ValidatesTenant Trait
 * 
 * Provides anti-drift validation methods to ensure data integrity
 * across the multi-tenant system.
 */
trait ValidatesTenant
{
    /**
     * Ensure a bairro belongs to the current tenant city.
     * 
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    protected function ensureBairroInTenant(?string $bairroId): void
    {
        if (!$bairroId) {
            return;
        }

        $bairro = Bairro::find($bairroId);

        if (!$bairro) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Bairro não encontrado.');
        }

        if ($bairro->city_id !== Tenant::cityId()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Bairro não pertence à cidade atual.');
        }
    }

    /**
     * Ensure a city_id matches the current tenant.
     * 
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    protected function ensureCityMatchesTenant(?string $cityId): void
    {
        if ($cityId && $cityId !== Tenant::cityId()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'city_id não corresponde ao tenant atual.');
        }
    }

    /**
     * Get the current tenant city_id.
     * Always use this when creating new records.
     */
    protected function currentCityId(): string
    {
        $cityId = Tenant::cityId();

        if (!$cityId) {
            abort(Response::HTTP_BAD_REQUEST, 'Contexto de cidade não definido.');
        }

        return $cityId;
    }

    /**
     * Validate that a record's city_id matches parent's city_id.
     * Used for hierarchical data (e.g., comment inherits from topic).
     * 
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    protected function ensureCityMatchesParent(?string $childCityId, string $parentCityId): void
    {
        if ($childCityId && $childCityId !== $parentCityId) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'city_id do item não corresponde ao pai.');
        }
    }

    /**
     * Add tenant filter to query (for reads).
     */
    protected function scopeToCurrentCity($query)
    {
        return $query->where('city_id', Tenant::cityId());
    }
}
