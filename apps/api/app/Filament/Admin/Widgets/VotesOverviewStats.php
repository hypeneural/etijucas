<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Votes\Enums\StatusVotacao;
use App\Domains\Votes\Models\Votacao;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class VotesOverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_VotesOverviewStats') ?? false;
    }

    protected function getStats(): array
    {
        $total = Votacao::query()->count();
        $aprovadas = Votacao::query()->where('status', StatusVotacao::APROVADO->value)->count();
        $rejeitadas = Votacao::query()->where('status', StatusVotacao::REJEITADO->value)->count();
        $emAndamento = Votacao::query()->where('status', StatusVotacao::EM_ANDAMENTO->value)->count();

        $comentarios = Votacao::query()->sum('comments_count');

        return [
            Stat::make('Total', $total)->color('gray'),
            Stat::make('Aprovadas', $aprovadas)->color('success'),
            Stat::make('Rejeitadas', $rejeitadas)->color('danger'),
            Stat::make('Em andamento', $emAndamento)->color('info'),
            Stat::make('Comentarios', $comentarios)->color('warning'),
        ];
    }
}
