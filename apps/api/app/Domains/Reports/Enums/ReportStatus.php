<?php

namespace App\Domains\Reports\Enums;

enum ReportStatus: string
{
    case Recebido = 'recebido';
    case EmAnalise = 'em_analise';
    case Resolvido = 'resolvido';
    case Rejeitado = 'rejeitado';

    public function label(): string
    {
        return match ($this) {
            self::Recebido => 'Recebido',
            self::EmAnalise => 'Em Análise',
            self::Resolvido => 'Resolvido',
            self::Rejeitado => 'Rejeitado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Recebido => '#3B82F6', // blue
            self::EmAnalise => '#F59E0B', // amber
            self::Resolvido => '#10B981', // green
            self::Rejeitado => '#EF4444', // red
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Recebido => 'inbox',
            self::EmAnalise => 'clock',
            self::Resolvido => 'check-circle',
            self::Rejeitado => 'x-circle',
        };
    }
}
