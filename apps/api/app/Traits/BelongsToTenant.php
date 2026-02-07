<?php

namespace App\Traits;

use App\Support\Tenant;
use Illuminate\Database\Eloquent\Builder;

/**
 * BelongsToTenant Trait
 * 
 * Aplica automaticamente o contexto de tenant (cidade) em:
 * - CREATE: seta city_id se null
 * - READ: adiciona global scope where city_id = Tenant::cityId()
 * 
 * Uso: use BelongsToTenant; em qualquer Model tenant-aware
 * 
 * @see TENANCY_CONTRACT.md
 */
trait BelongsToTenant
{
    /**
     * Boot the trait
     */
    protected static function bootBelongsToTenant(): void
    {
        // AUTO-SET: ao criar, seta city_id automaticamente se vier null
        static::creating(function ($model) {
            if (empty($model->city_id) && Tenant::cityId()) {
                $model->city_id = Tenant::cityId();
            }
        });

        // GLOBAL SCOPE: toda query é filtrada pelo tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            // Só aplica se tiver tenant definido
            if (Tenant::cityId()) {
                $builder->where(
                    $builder->getModel()->getTable() . '.city_id',
                    Tenant::cityId()
                );
            }
        });
    }

    /**
     * Scope para queries sem filtro de tenant (admin/relatórios)
     * 
     * Uso: Model::withoutTenant()->get()
     */
    public function scopeWithoutTenant(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }

    /**
     * Scope para queries de uma cidade específica
     * 
     * Uso: Model::forCity($cityId)->get()
     */
    public function scopeForCity(Builder $query, string $cityId): Builder
    {
        return $query->withoutGlobalScope('tenant')
            ->where($this->getTable() . '.city_id', $cityId);
    }

    /**
     * Verifica se o model pertence ao tenant atual
     */
    public function belongsToCurrentTenant(): bool
    {
        return $this->city_id === Tenant::cityId();
    }

    /**
     * Relacionamento com City
     */
    public function city(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\City::class);
    }
}
