<?php

namespace App\Domain\Forum\Enums;

enum TopicStatus: string
{
    case Active = 'active';
    case Hidden = 'hidden';
    case Deleted = 'deleted';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Ativo',
            self::Hidden => 'Oculto',
            self::Deleted => 'Deletado',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
