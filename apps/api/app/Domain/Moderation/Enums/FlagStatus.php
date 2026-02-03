<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum FlagStatus: string
{
    case Open = 'open';
    case Reviewing = 'reviewing';
    case ActionTaken = 'action_taken';
    case Dismissed = 'dismissed';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Em aberto',
            self::Reviewing => 'Em analise',
            self::ActionTaken => 'Acao tomada',
            self::Dismissed => 'Dispensada',
        };
    }
}
