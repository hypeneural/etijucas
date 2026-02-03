<?php

namespace App\Domain\Events\Enums;

enum AgeRating: string
{
    case Livre = 'livre';
    case Age10 = '10';
    case Age12 = '12';
    case Age14 = '14';
    case Age16 = '16';
    case Age18 = '18';

    public function label(): string
    {
        return match ($this) {
            self::Livre => 'Livre',
            self::Age10 => '10 anos',
            self::Age12 => '12 anos',
            self::Age14 => '14 anos',
            self::Age16 => '16 anos',
            self::Age18 => '18 anos',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Livre => '#22C55E',
            self::Age10 => '#3B82F6',
            self::Age12 => '#FBBF24',
            self::Age14 => '#F97316',
            self::Age16 => '#EF4444',
            self::Age18 => '#000000',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
