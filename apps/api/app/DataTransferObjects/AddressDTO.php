<?php

namespace App\DataTransferObjects;

use App\Models\Bairro;
use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

/**
 * AddressDTO - Estrutura padronizada de endereço
 * 
 * Usado para:
 * - Campo users.address (JSON)
 * - Eventos, denúncias, pontos turísticos
 * - Resolução via CEP (ViaCEP)
 * 
 * @see GEO_BAIRROS_ADDRESS.md
 */
class AddressDTO implements Arrayable, JsonSerializable
{
    public function __construct(
        public readonly ?string $cep = null,
        public readonly ?string $logradouro = null,
        public readonly ?string $numero = null,
        public readonly ?string $complemento = null,
        public readonly ?string $bairro = null,
        public readonly ?string $bairroId = null,
        public readonly ?string $cidade = null,
        public readonly ?string $cityId = null,
        public readonly ?string $uf = null,
        public readonly ?float $latitude = null,
        public readonly ?float $longitude = null,
        public readonly ?string $source = null, // 'cep', 'gps', 'manual', 'geocode'
    ) {
    }

    /**
     * Create from array (e.g., JSON from database)
     */
    public static function fromArray(?array $data): ?self
    {
        if (!$data) {
            return null;
        }

        return new self(
            cep: $data['cep'] ?? null,
            logradouro: $data['logradouro'] ?? null,
            numero: $data['numero'] ?? null,
            complemento: $data['complemento'] ?? null,
            bairro: $data['bairro'] ?? null,
            bairroId: $data['bairro_id'] ?? $data['bairroId'] ?? null,
            cidade: $data['cidade'] ?? null,
            cityId: $data['city_id'] ?? $data['cityId'] ?? null,
            uf: $data['uf'] ?? null,
            latitude: isset($data['latitude']) ? (float) $data['latitude'] : null,
            longitude: isset($data['longitude']) ? (float) $data['longitude'] : null,
            source: $data['source'] ?? null,
        );
    }

    /**
     * Create from ViaCEP response
     */
    public static function fromViaCep(array $viaCepData, ?string $cityId = null): self
    {
        return new self(
            cep: $viaCepData['cep'] ?? null,
            logradouro: $viaCepData['logradouro'] ?? null,
            bairro: $viaCepData['bairro'] ?? null,
            cidade: $viaCepData['localidade'] ?? null,
            cityId: $cityId,
            uf: $viaCepData['uf'] ?? null,
            source: 'cep',
        );
    }

    /**
     * Create from GPS coordinates
     */
    public static function fromGps(float $latitude, float $longitude): self
    {
        return new self(
            latitude: $latitude,
            longitude: $longitude,
            source: 'gps',
        );
    }

    /**
     * Check if address is complete enough
     */
    public function isComplete(): bool
    {
        return $this->logradouro && $this->bairro && $this->cidade;
    }

    /**
     * Check if has GPS coordinates
     */
    public function hasCoordinates(): bool
    {
        return $this->latitude !== null && $this->longitude !== null;
    }

    /**
     * Check if bairro is resolved (has bairroId)
     */
    public function hasBairroResolved(): bool
    {
        return $this->bairroId !== null;
    }

    /**
     * Get formatted one-line address
     */
    public function getFormattedAddress(): string
    {
        $parts = [];

        if ($this->logradouro) {
            $part = $this->logradouro;
            if ($this->numero) {
                $part .= ', ' . $this->numero;
            }
            if ($this->complemento) {
                $part .= ' - ' . $this->complemento;
            }
            $parts[] = $part;
        }

        if ($this->bairro) {
            $parts[] = $this->bairro;
        }

        if ($this->cidade && $this->uf) {
            $parts[] = "{$this->cidade}/{$this->uf}";
        }

        if ($this->cep) {
            $parts[] = $this->cep;
        }

        return implode(', ', $parts);
    }

    /**
     * Get short address (street + number)
     */
    public function getShortAddress(): string
    {
        if (!$this->logradouro) {
            return '';
        }

        return $this->numero
            ? "{$this->logradouro}, {$this->numero}"
            : $this->logradouro;
    }

    /**
     * Merge with another AddressDTO (fills gaps)
     */
    public function merge(AddressDTO $other): self
    {
        return new self(
            cep: $this->cep ?? $other->cep,
            logradouro: $this->logradouro ?? $other->logradouro,
            numero: $this->numero ?? $other->numero,
            complemento: $this->complemento ?? $other->complemento,
            bairro: $this->bairro ?? $other->bairro,
            bairroId: $this->bairroId ?? $other->bairroId,
            cidade: $this->cidade ?? $other->cidade,
            cityId: $this->cityId ?? $other->cityId,
            uf: $this->uf ?? $other->uf,
            latitude: $this->latitude ?? $other->latitude,
            longitude: $this->longitude ?? $other->longitude,
            source: $this->source ?? $other->source,
        );
    }

    /**
     * Create new DTO with updated values
     */
    public function with(array $updates): self
    {
        return new self(
            cep: $updates['cep'] ?? $this->cep,
            logradouro: $updates['logradouro'] ?? $this->logradouro,
            numero: $updates['numero'] ?? $this->numero,
            complemento: $updates['complemento'] ?? $this->complemento,
            bairro: $updates['bairro'] ?? $this->bairro,
            bairroId: $updates['bairroId'] ?? $updates['bairro_id'] ?? $this->bairroId,
            cidade: $updates['cidade'] ?? $this->cidade,
            cityId: $updates['cityId'] ?? $updates['city_id'] ?? $this->cityId,
            uf: $updates['uf'] ?? $this->uf,
            latitude: $updates['latitude'] ?? $this->latitude,
            longitude: $updates['longitude'] ?? $this->longitude,
            source: $updates['source'] ?? $this->source,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'cep' => $this->cep,
            'logradouro' => $this->logradouro,
            'numero' => $this->numero,
            'complemento' => $this->complemento,
            'bairro' => $this->bairro,
            'bairro_id' => $this->bairroId,
            'cidade' => $this->cidade,
            'city_id' => $this->cityId,
            'uf' => $this->uf,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'source' => $this->source,
        ];
    }

    /**
     * JSON serialize
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
