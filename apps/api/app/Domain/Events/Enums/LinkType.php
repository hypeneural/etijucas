<?php

namespace App\Domain\Events\Enums;

enum LinkType: string
{
    case Instagram = 'instagram';
    case WhatsApp = 'whatsapp';
    case Website = 'website';
    case Facebook = 'facebook';
    case YouTube = 'youtube';
    case TikTok = 'tiktok';
    case Ticket = 'ticket';
    case Maps = 'maps';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Instagram => 'Instagram',
            self::WhatsApp => 'WhatsApp',
            self::Website => 'Site',
            self::Facebook => 'Facebook',
            self::YouTube => 'YouTube',
            self::TikTok => 'TikTok',
            self::Ticket => 'Ingressos',
            self::Maps => 'Mapa',
            self::Other => 'Outro',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Instagram => 'instagram',
            self::WhatsApp => 'whatsapp',
            self::Website => 'globe',
            self::Facebook => 'facebook',
            self::YouTube => 'youtube',
            self::TikTok => 'tiktok',
            self::Ticket => 'ticket',
            self::Maps => 'map-pin',
            self::Other => 'link',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
