<?php

namespace App\Domain\Forum\Enums;

enum ReportMotivo: string
{
    case Spam = 'spam';
    case Ofensivo = 'ofensivo';
    case Falso = 'falso';
    case Outro = 'outro';

    public function label(): string
    {
        return match ($this) {
            self::Spam => 'Spam',
            self::Ofensivo => 'Conteúdo Ofensivo',
            self::Falso => 'Informação Falsa',
            self::Outro => 'Outro',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
