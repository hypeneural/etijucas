<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum FlagContentType: string
{
    case Topic = 'topic';
    case Comment = 'comment';
    case Report = 'report';
    case User = 'user';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Topic => 'Topico',
            self::Comment => 'Comentario',
            self::Report => 'Denuncia',
            self::User => 'Usuario',
        };
    }
}
