<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domain\Moderation\Enums\FlagStatus;
use App\Models\ContentFlag;
use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Models\User;
use App\Models\UserRestriction;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;

class AdminOverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_AdminOverviewStats') ?? false;
    }

    protected function getStats(): array
    {
        $metrics = Cache::remember('admin_overview_stats', now()->addSeconds(60), function (): array {
            return [
                'openFlags' => ContentFlag::query()
                    ->where('status', FlagStatus::Open->value)
                    ->count(),
                'activeRestrictions' => UserRestriction::query()
                    ->active()
                    ->count(),
                'newUsers' => User::query()
                    ->where('created_at', '>=', now()->subDay())
                    ->count(),
                'pendingReports' => CitizenReport::query()
                    ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAnalise->value])
                    ->count(),
            ];
        });

        return [
            Stat::make('Flags em aberto', $metrics['openFlags'])
                ->description('Fila de moderacao')
                ->color('warning'),
            Stat::make('Restri??es ativas', $metrics['activeRestrictions'])
                ->description('Usu?rios com restricao')
                ->color('danger'),
            Stat::make('Usu?rios novos (24h)', $metrics['newUsers'])
                ->description('Ultimas 24 horas')
                ->color('success'),
            Stat::make('Reports pendentes', $metrics['pendingReports'])
                ->description('Fila de denuncias')
                ->color('warning'),
        ];
    }
}
