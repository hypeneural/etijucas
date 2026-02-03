<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum FlagAction: string
{
    case None = 'none';
    case Hide = 'hide';
    case Delete = 'delete';
    case WarnUser = 'warn_user';
    case RestrictUser = 'restrict_user';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::None => 'Sem acao',
            self::Hide => 'Ocultar',
            self::Delete => 'Remover',
            self::WarnUser => 'Advertir usuario',
            self::RestrictUser => 'Aplicar restricao',
        };
    }
}
