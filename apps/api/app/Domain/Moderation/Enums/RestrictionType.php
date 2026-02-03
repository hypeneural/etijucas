<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Enums;

enum RestrictionType: string
{
    case SuspendLogin = 'suspend_login';
    case MuteForum = 'mute_forum';
    case ShadowbanForum = 'shadowban_forum';
    case BlockUploads = 'block_uploads';
    case RateLimitForum = 'rate_limit_forum';

    public static function values(): array
    {
        return array_map(static fn(self $case) => $case->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::SuspendLogin => 'Suspender login',
            self::MuteForum => 'Silenciar no forum',
            self::ShadowbanForum => 'Shadowban no forum',
            self::BlockUploads => 'Bloquear uploads',
            self::RateLimitForum => 'Limitar postagens no forum',
        };
    }
}
