<?php

declare(strict_types=1);

namespace App\Domain\Content\Enums;

enum PhoneCategory: string
{
    case Emergency = 'emergency';
    case PublicServices = 'public_services';
    case Health = 'health';
    case Education = 'education';
    case Utilities = 'utilities';
    case Other = 'other';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Emergency => 'Emergencia',
            self::PublicServices => 'Servicos publicos',
            self::Health => 'Saude',
            self::Education => 'Educacao',
            self::Utilities => 'Servicos essenciais',
            self::Other => 'Outro',
        };
    }
}
