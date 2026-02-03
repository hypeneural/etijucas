<?php

namespace App\Domain\Events\Enums;

enum MediaType: string
{
    case Image = 'image';
    case Video = 'video';

    public function label(): string
    {
        return match ($this) {
            self::Image => 'Imagem',
            self::Video => 'Vídeo',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
