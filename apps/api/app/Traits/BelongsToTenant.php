<?php

namespace App\Traits;

use App\Support\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

/**
 * BelongsToTenant Trait
 * 
 * Aplica automaticamente o contexto de tenant (cidade) em:
 * - CREATE: seta city_id se null
 * - SAVE: valida que city_id pertence ao tenant (em HTTP)
 * - READ: adiciona global scope where city_id = Tenant::cityId()
 * 
 * Uso: use BelongsToTenant; em qualquer Model tenant-aware
 * 
 * @see MULTI_TENANCY_ANALYSIS.md
 */
trait BelongsToTenant
{
    /**
     * Cache table=>has city_id to avoid repeated schema checks.
     *
     * @var array<string, bool>
     */
    protected static array $tenantCityColumnCache = [];

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

            if (self::requiresCityId($model) && empty($model->city_id)) {
                throw new \DomainException('Registro tenant-aware exige city_id explicito.');
            }
        });

        // INVARIANTE #2: city_id do model deve ser igual ao tenant (em contexto HTTP)
        // INVARIANTE #4: bairro_id deve pertencer ao mesmo city_id
        static::saving(function ($model) {
            // Validação de city_id (só em HTTP, não em CLI/Jobs)
            if (!app()->runningInConsole()) {
                if ($model->city_id && Tenant::cityId() && $model->city_id !== Tenant::cityId()) {
                    Log::warning('BelongsToTenant: tentativa de salvar com city_id diferente do tenant', [
                        'model' => get_class($model),
                        'model_id' => $model->id ?? 'new',
                        'model_city_id' => $model->city_id,
                        'tenant_city_id' => Tenant::cityId(),
                        'user_id' => auth()->id(),
                    ]);

                    throw new \DomainException(
                        "Tentativa de salvar com city_id ({$model->city_id}) diferente do tenant (" . Tenant::cityId() . ")"
                    );
                }
            }

            // Validação de bairro_id pertence ao city_id
            if ($model->bairro_id && $model->city_id) {
                $bairro = \App\Models\Bairro::find($model->bairro_id);

                if ($bairro && $bairro->city_id !== $model->city_id) {
                    throw new \DomainException(
                        "Bairro {$model->bairro_id} não pertence à cidade {$model->city_id}"
                    );
                }
            }
        });

        // GLOBAL SCOPE: toda query é filtrada pelo tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            // Só aplica se tiver tenant definido
            // Em CLI/Queue, não aplica automaticamente - usar forCity() explícito
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
     * ⚠️ AUDITADO: registra uso para observabilidade
     * 
     * Uso: Model::withoutTenant()->get()
     */
    public function scopeWithoutTenant(Builder $query): Builder
    {
        // 🔒 Auditoria: registra todo uso de withoutTenant
        Log::info('BelongsToTenant::withoutTenant() usado', [
            'model' => get_class($query->getModel()),
            'caller' => self::getCallerInfo(),
            'user_id' => auth()->id(),
            'tenant_city_id' => Tenant::cityId(),
        ]);

        return $query->withoutGlobalScope('tenant');
    }

    /**
     * Scope para queries de uma cidade específica
     * 
     * Uso seguro para Jobs e CLI: Model::forCity($cityId)->get()
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

    /**
     * Get caller info for audit logging
     */
    private static function getCallerInfo(): array
    {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);

        // Skip internal calls to get the actual caller
        foreach ($trace as $frame) {
            if (!isset($frame['class']))
                continue;
            if (str_contains($frame['class'], 'BelongsToTenant'))
                continue;
            if (str_contains($frame['class'], 'Eloquent'))
                continue;

            return [
                'class' => $frame['class'] ?? null,
                'function' => $frame['function'] ?? null,
                'line' => $frame['line'] ?? null,
            ];
        }

        return ['unknown' => true];
    }

    private static function requiresCityId(object $model): bool
    {
        if (!method_exists($model, 'getTable')) {
            return false;
        }

        $table = $model->getTable();
        if (!is_string($table) || $table === '') {
            return false;
        }

        if (array_key_exists($table, self::$tenantCityColumnCache)) {
            return self::$tenantCityColumnCache[$table];
        }

        try {
            self::$tenantCityColumnCache[$table] = Schema::hasColumn($table, 'city_id');
        } catch (\Throwable) {
            self::$tenantCityColumnCache[$table] = false;
        }

        return self::$tenantCityColumnCache[$table];
    }
}

