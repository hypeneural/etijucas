<?php

namespace App\Domain\Events\Enums;

enum TicketType: string
{
    case Free = 'free';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Gratuito',
            self::Paid => 'Pago',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
