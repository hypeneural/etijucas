<?php

declare(strict_types=1);

namespace App\Domains\Votes\Enums;

enum TipoVoto: string
{
    case SIM = 'SIM';
    case NAO = 'NAO';
    case ABSTENCAO = 'ABSTENCAO';
    case NAO_VOTOU = 'NAO_VOTOU';

    public function label(): string
    {
        return match ($this) {
            self::SIM => 'Sim',
            self::NAO => 'Não',
            self::ABSTENCAO => 'Abstenção',
            self::NAO_VOTOU => 'Ausente',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SIM => '#22C55E',       // green-500
            self::NAO => '#EF4444',       // red-500
            self::ABSTENCAO => '#F59E0B', // amber-500
            self::NAO_VOTOU => '#6B7280', // gray-500
        };
    }
}
