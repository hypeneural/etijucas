<?php

namespace App\Domain\Forum\Enums;

enum ReportStatus: string
{
    case Pending = 'pending';
    case Reviewed = 'reviewed';
    case Dismissed = 'dismissed';
    case ActionTaken = 'action_taken';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendente',
            self::Reviewed => 'Revisado',
            self::Dismissed => 'Descartado',
            self::ActionTaken => 'Ação Tomada',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
