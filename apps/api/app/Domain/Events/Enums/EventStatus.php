<?php

namespace App\Domain\Events\Enums;

enum EventStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Cancelled = 'cancelled';
    case Finished = 'finished';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::Published => 'Publicado',
            self::Cancelled => 'Cancelado',
            self::Finished => 'Finalizado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => '#6B7280',
            self::Published => '#22C55E',
            self::Cancelled => '#EF4444',
            self::Finished => '#3B82F6',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
