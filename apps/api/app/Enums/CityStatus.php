<?php

namespace App\Enums;

/**
 * CityStatus Enum
 * 
 * Controla o status de ativação de uma cidade na plataforma.
 * 
 * @see TENANCY_CONTRACT.md
 */
enum CityStatus: string
{
    /**
     * Cidade em rascunho, não visível publicamente.
     * Apenas admins podem acessar.
     */
    case Draft = 'draft';

    /**
     * Cidade em staging/testes.
     * Visível para usuários com convite ou link especial.
     */
    case Staging = 'staging';

    /**
     * Cidade ativa e operacional.
     * Totalmente visível e funcional.
     */
    case Active = 'active';

    /**
     * Cidade pausada temporariamente.
     * Conteúdo preservado mas não aceita novos dados.
     */
    case Paused = 'paused';

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::Staging => 'Teste',
            self::Active => 'Ativa',
            self::Paused => 'Pausada',
        };
    }

    /**
     * Get badge color for UI
     */
    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Staging => 'yellow',
            self::Active => 'green',
            self::Paused => 'red',
        };
    }

    /**
     * Check if city is publicly accessible
     */
    public function isPublic(): bool
    {
        return $this === self::Active;
    }

    /**
     * Check if city accepts new content
     */
    public function acceptsContent(): bool
    {
        return in_array($this, [self::Staging, self::Active]);
    }

    /**
     * Check if city is visible at all (for any user type)
     */
    public function isVisible(): bool
    {
        return $this !== self::Draft;
    }
}
