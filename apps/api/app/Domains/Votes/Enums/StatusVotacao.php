<?php

declare(strict_types=1);

namespace App\Domains\Votes\Enums;

enum StatusVotacao: string
{
    case APROVADO = 'APROVADO';
    case REJEITADO = 'REJEITADO';
    case EM_ANDAMENTO = 'EM_ANDAMENTO';
    case ARQUIVADO = 'ARQUIVADO';

    public function label(): string
    {
        return match ($this) {
            self::APROVADO => 'Aprovado',
            self::REJEITADO => 'Rejeitado',
            self::EM_ANDAMENTO => 'Em Andamento',
            self::ARQUIVADO => 'Arquivado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::APROVADO => '#22C55E',
            self::REJEITADO => '#EF4444',
            self::EM_ANDAMENTO => '#3B82F6',
            self::ARQUIVADO => '#6B7280',
        };
    }
}
