<?php

namespace App\Domain\Events\Enums;

enum RsvpStatus: string
{
    case Going = 'going';
    case Maybe = 'maybe';
    case NotGoing = 'not_going';

    public function label(): string
    {
        return match ($this) {
            self::Going => 'Vou',
            self::Maybe => 'Talvez',
            self::NotGoing => 'Não vou',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Going => '#22C55E',
            self::Maybe => '#FBBF24',
            self::NotGoing => '#EF4444',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
