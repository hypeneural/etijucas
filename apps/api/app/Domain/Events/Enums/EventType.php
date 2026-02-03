<?php

namespace App\Domain\Events\Enums;

enum EventType: string
{
    case Single = 'single';
    case MultiDay = 'multi_day';
    case Recurring = 'recurring';

    public function label(): string
    {
        return match ($this) {
            self::Single => 'Evento único',
            self::MultiDay => 'Evento multi-dia',
            self::Recurring => 'Evento recorrente',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
