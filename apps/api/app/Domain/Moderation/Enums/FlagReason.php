<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum FlagReason: string
{
    case Spam = 'spam';
    case PersonalData = 'personal_data';
    case Hate = 'hate';
    case Violence = 'violence';
    case Scam = 'scam';
    case Misinformation = 'misinformation';
    case Harassment = 'harassment';
    case Other = 'other';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Spam => 'Spam',
            self::PersonalData => 'Dados pessoais',
            self::Hate => 'Discurso de odio',
            self::Violence => 'Violencia',
            self::Scam => 'Golpe',
            self::Misinformation => 'Desinformacao',
            self::Harassment => 'Assedio',
            self::Other => 'Outro',
        };
    }
}
