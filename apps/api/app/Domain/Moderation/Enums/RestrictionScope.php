<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum RestrictionScope: string
{
    case Global = 'global';
    case Forum = 'forum';
    case Reports = 'reports';
    case Uploads = 'uploads';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Global => 'Global',
            self::Forum => 'Forum',
            self::Reports => 'Reports',
            self::Uploads => 'Uploads',
        };
    }
}
