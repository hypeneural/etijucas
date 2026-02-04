<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;

class ReportsOverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_ReportsOverviewStats') ?? false;
    }

    protected function getStats(): array
    {
        $metrics = Cache::remember('reports_overview_stats', now()->addSeconds(60), function (): array {
            return [
                'total' => CitizenReport::query()->count(),
                'pending' => CitizenReport::query()
                    ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAn?lise->value])
                    ->count(),
                'resolved' => CitizenReport::query()
                    ->where('status', ReportStatus::Resolvido->value)
                    ->count(),
                'rejected' => CitizenReport::query()
                    ->where('status', ReportStatus::Rejeitado->value)
                    ->count(),
            ];
        });

        return [
            Stat::make('Total', $metrics['total'])->color('gray'),
            Stat::make('Pendentes', $metrics['pending'])->color('warning'),
            Stat::make('Resolvidos', $metrics['resolved'])->color('success'),
            Stat::make('Rejeitados', $metrics['rejected'])->color('danger'),
        ];
    }
}
