<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Support\Tenant;
use App\Support\TenantCache;
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
        $cityId = $this->tenantCityId();
        if ($cityId === null) {
            $metrics = [
                'total' => 0,
                'pending' => 0,
                'resolved' => 0,
                'rejected' => 0,
            ];
        } else {
            $metrics = TenantCache::remember('reports_overview_stats', 60, function () use ($cityId): array {
                return [
                    'total' => CitizenReport::query()
                        ->where('city_id', $cityId)
                        ->count(),
                    'pending' => CitizenReport::query()
                        ->where('city_id', $cityId)
                        ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAnalise->value])
                        ->count(),
                    'resolved' => CitizenReport::query()
                        ->where('city_id', $cityId)
                        ->where('status', ReportStatus::Resolvido->value)
                        ->count(),
                    'rejected' => CitizenReport::query()
                        ->where('city_id', $cityId)
                        ->where('status', ReportStatus::Rejeitado->value)
                        ->count(),
                ];
            });
        }

        return [
            Stat::make('Total', $metrics['total'])->color('gray'),
            Stat::make('Pendentes', $metrics['pending'])->color('warning'),
            Stat::make('Resolvidos', $metrics['resolved'])->color('success'),
            Stat::make('Rejeitados', $metrics['rejected'])->color('danger'),
        ];
    }

    private function tenantCityId(): ?string
    {
        $cityId = Tenant::cityId();

        return is_string($cityId) && $cityId !== '' ? $cityId : null;
    }
}
