<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Votes\Models\Votacao;
use Filament\Widgets\ChartWidget;

class VotesByYearChart extends ChartWidget
{
    protected static ?string $heading = 'Vota??es por ano';

    public static function canView(): bool
    {
        return auth()->user()?->can('widget_VotesByYearChart') ?? false;
    }

    protected function getData(): array
    {
        $rows = Votacao::query()
            ->selectRaw('YEAR(data) as ano, COUNT(*) as total')
            ->groupBy('ano')
            ->orderBy('ano')
            ->get();

        $labels = $rows->pluck('ano')->map(fn ($ano) => (string) $ano)->all();
        $totals = $rows->pluck('total')->map(fn ($total) => (int) $total)->all();

        return [
            'datasets' => [
                [
                    'label' => 'Vota??es',
                    'data' => $totals,
                    'backgroundColor' => '#F59E0B',
                    'borderColor' => '#D97706',
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
