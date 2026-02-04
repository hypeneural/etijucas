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

class AdminOverviewStats extends BaseWidget
{
    protected function getStats(): array
    {
        $openFlags = ContentFlag::query()
            ->where('status', FlagStatus::Open->value)
            ->count();

        $activeRestrictions = UserRestriction::query()
            ->active()
            ->count();

        $newUsers = User::query()
            ->where('created_at', '>=', now()->subDay())
            ->count();

        $pendingReports = CitizenReport::query()
            ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAnalise->value])
            ->count();

        return [
            Stat::make('Flags em aberto', $openFlags)
                ->description('Fila de moderacao')
                ->color('warning'),
            Stat::make('Restricoes ativas', $activeRestrictions)
                ->description('Usuarios com restricao')
                ->color('danger'),
            Stat::make('Usuarios novos (24h)', $newUsers)
                ->description('Ultimas 24 horas')
                ->color('success'),
            Stat::make('Reports pendentes', $pendingReports)
                ->description('Fila de denuncias')
                ->color('warning'),
        ];
    }
}
