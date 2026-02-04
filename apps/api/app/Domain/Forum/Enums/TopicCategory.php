<?php

namespace App\Domain\Forum\Enums;

enum TopicCategory: string
{
    case Reclamacao = 'reclamacao';
    case Reclamacoes = 'reclamacoes'; // Alias para compatibilidade com seeders
    case Sugestao = 'sugestao';
    case Duvida = 'duvida';
    case Alerta = 'alerta';
    case Elogio = 'elogio';
    case Comercio = 'comercio';
    case Eventos = 'eventos';
    case Outros = 'outros';

    public function label(): string
    {
        return match ($this) {
            self::Reclamacao, self::Reclamacoes => 'Reclamação',
            self::Sugestao => 'Sugestão',
            self::Duvida => 'Dúvida',
            self::Alerta => 'Alerta',
            self::Elogio => 'Elogio',
            self::Comercio => 'Comércio',
            self::Eventos => 'Eventos',
            self::Outros => 'Outros',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Reclamacao, self::Reclamacoes => '#EF4444',
            self::Sugestao => '#3B82F6',
            self::Duvida => '#8B5CF6',
            self::Alerta => '#F97316',
            self::Elogio => '#22C55E',
            self::Comercio => '#F59E0B',
            self::Eventos => '#8B5CF6',
            self::Outros => '#6B7280',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

