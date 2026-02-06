<?php

namespace App\DTOs;

/**
 * AddressDTO
 * 
 * Data transfer object for address data from ViaCEP.
 */
class AddressDTO
{
    public function __construct(
        public readonly string $cep,
        public readonly ?string $logradouro,
        public readonly ?string $complemento,
        public readonly ?string $bairroText,
        public readonly ?string $localidade,
        public readonly ?string $uf,
        public readonly ?int $ibgeCode,
        public readonly ?string $ddd = null,
    ) {
    }

    /**
     * Create from ViaCEP response.
     */
    public static function fromViaCep(array $data): self
    {
        return new self(
            cep: preg_replace('/\D/', '', $data['cep'] ?? ''),
            logradouro: $data['logradouro'] ?? null,
            complemento: $data['complemento'] ?? null,
            bairroText: $data['bairro'] ?? null,
            localidade: $data['localidade'] ?? null,
            uf: $data['uf'] ?? null,
            ibgeCode: isset($data['ibge']) ? (int) $data['ibge'] : null,
            ddd: $data['ddd'] ?? null,
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'cep' => $this->cep,
            'logradouro' => $this->logradouro,
            'complemento' => $this->complemento,
            'bairro_text' => $this->bairroText,
            'city_name' => $this->localidade,
            'uf' => $this->uf,
            'ibge_code' => $this->ibgeCode,
            'ddd' => $this->ddd,
        ];
    }
}
