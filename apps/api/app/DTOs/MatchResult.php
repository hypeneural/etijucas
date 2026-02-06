<?php

namespace App\DTOs;

use App\Models\Bairro;
use App\Models\BairroAlias;
use App\Models\City;

/**
 * MatchResult
 * 
 * Data transfer object for address matching results.
 */
class MatchResult
{
    public const METHOD_DIRECT = 'direct';
    public const METHOD_ALIAS = 'alias';
    public const METHOD_NONE = 'none';
    public const METHOD_CITY_MISMATCH = 'city_mismatch';

    public function __construct(
        public readonly string $tenantCityId,
        public readonly ?string $cepCityId,
        public readonly bool $cityOk,
        public readonly ?string $bairroId,
        public readonly bool $bairroOk,
        public readonly string $method,
        public readonly float $confidence,
        public readonly ?string $bairroTextKey = null,
    ) {
    }

    /**
     * Create a direct match result.
     */
    public static function direct(string $tenantCityId, Bairro $bairro): self
    {
        return new self(
            tenantCityId: $tenantCityId,
            cepCityId: $bairro->city_id,
            cityOk: true,
            bairroId: $bairro->id,
            bairroOk: true,
            method: self::METHOD_DIRECT,
            confidence: 1.0,
        );
    }

    /**
     * Create an alias match result.
     */
    public static function alias(string $tenantCityId, Bairro $bairro, BairroAlias $alias): self
    {
        return new self(
            tenantCityId: $tenantCityId,
            cepCityId: $bairro->city_id,
            cityOk: true,
            bairroId: $bairro->id,
            bairroOk: true,
            method: self::METHOD_ALIAS,
            confidence: 0.9,
        );
    }

    /**
     * Create a no-match result.
     */
    public static function none(string $tenantCityId, ?string $cepCityId, string $bairroTextKey): self
    {
        return new self(
            tenantCityId: $tenantCityId,
            cepCityId: $cepCityId,
            cityOk: $tenantCityId === $cepCityId,
            bairroId: null,
            bairroOk: false,
            method: self::METHOD_NONE,
            confidence: 0.0,
            bairroTextKey: $bairroTextKey,
        );
    }

    /**
     * Create a city mismatch result.
     */
    public static function cityMismatch(string $tenantCityId, ?City $cepCity): self
    {
        return new self(
            tenantCityId: $tenantCityId,
            cepCityId: $cepCity?->id,
            cityOk: false,
            bairroId: null,
            bairroOk: false,
            method: self::METHOD_CITY_MISMATCH,
            confidence: 0.0,
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'tenant_city_id' => $this->tenantCityId,
            'cep_city_id' => $this->cepCityId,
            'city_ok' => $this->cityOk,
            'bairro_id' => $this->bairroId,
            'bairro_ok' => $this->bairroOk,
            'method' => $this->method,
            'confidence' => $this->confidence,
        ];
    }

    /**
     * Get UI hints based on match result.
     */
    public function getUiHints(): array
    {
        $hints = [
            'should_lock_bairro' => $this->bairroOk,
            'focus_next' => $this->bairroOk ? 'numero' : 'bairro',
            'toast' => null,
        ];

        if (!$this->cityOk) {
            $hints['toast'] = 'Este CEP é de outra cidade. Apenas moradores de Tijucas podem se cadastrar.';
        } elseif (!$this->bairroOk) {
            $hints['toast'] = 'Selecione seu bairro para finalizar.';
        }

        return $hints;
    }
}
