<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ReportsOverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_ReportsOverviewStats') ?? false;
    }

    protected function getStats(): array
    {
        $total = CitizenReport::query()->count();

        $pending = CitizenReport::query()
            ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAnalise->value])
            ->count();

        $resolved = CitizenReport::query()
            ->where('status', ReportStatus::Resolvido->value)
            ->count();

        $rejected = CitizenReport::query()
            ->where('status', ReportStatus::Rejeitado->value)
            ->count();

        return [
            Stat::make('Total', $total)->color('gray'),
            Stat::make('Pendentes', $pending)->color('warning'),
            Stat::make('Resolvidos', $resolved)->color('success'),
            Stat::make('Rejeitados', $rejected)->color('danger'),
        ];
    }
}
