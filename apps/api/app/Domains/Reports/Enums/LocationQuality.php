<?php

namespace App\Domains\Reports\Enums;

enum LocationQuality: string
{
    case Precisa = 'precisa';
    case Aproximada = 'aproximada';
    case Manual = 'manual';

    public function label(): string
    {
        return match ($this) {
            self::Precisa => 'Localização precisa',
            self::Aproximada => 'Localização aproximada',
            self::Manual => 'Endereço informado',
        };
    }
}
