<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domain\Moderation\Enums\FlagStatus;
use App\Models\ContentFlag;
use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Models\User;
use App\Models\UserRestriction;
use App\Support\Tenant;
use App\Support\TenantCache;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminOverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_AdminOverviewStats') ?? false;
    }

    protected function getStats(): array
    {
        $cityId = $this->tenantCityId();
        if ($cityId === null) {
            $metrics = [
                'openFlags' => 0,
                'activeRestrictions' => 0,
                'newUsers' => 0,
                'pendingReports' => 0,
            ];
        } else {
            $metrics = TenantCache::remember('admin_overview_stats', 60, function () use ($cityId): array {
                $openFlags = ContentFlag::query()
                    ->where('status', FlagStatus::Open->value)
                    ->where(function (Builder $tenantQuery) use ($cityId): void {
                        $tenantQuery
                            ->where(function (Builder $topicQuery) use ($cityId): void {
                                $topicQuery
                                    ->where('content_flags.content_type', 'topic')
                                    ->whereExists(function ($existsQuery) use ($cityId): void {
                                        $existsQuery
                                            ->select(DB::raw('1'))
                                            ->from('topics')
                                            ->whereColumn('topics.id', 'content_flags.content_id')
                                            ->where('topics.city_id', $cityId);
                                    });
                            })
                            ->orWhere(function (Builder $commentQuery) use ($cityId): void {
                                $commentQuery
                                    ->where('content_flags.content_type', 'comment')
                                    ->whereExists(function ($existsQuery) use ($cityId): void {
                                        $existsQuery
                                            ->select(DB::raw('1'))
                                            ->from('comments')
                                            ->whereColumn('comments.id', 'content_flags.content_id')
                                            ->where('comments.city_id', $cityId);
                                    });
                            })
                            ->orWhere(function (Builder $reportQuery) use ($cityId): void {
                                $reportQuery
                                    ->where('content_flags.content_type', 'report')
                                    ->whereExists(function ($existsQuery) use ($cityId): void {
                                        $existsQuery
                                            ->select(DB::raw('1'))
                                            ->from('citizen_reports')
                                            ->whereColumn('citizen_reports.id', 'content_flags.content_id')
                                            ->where('citizen_reports.city_id', $cityId);
                                    });
                            })
                            ->orWhere(function (Builder $userQuery) use ($cityId): void {
                                $userQuery
                                    ->where('content_flags.content_type', 'user')
                                    ->whereExists(function ($existsQuery) use ($cityId): void {
                                        $existsQuery
                                            ->select(DB::raw('1'))
                                            ->from('users')
                                            ->whereColumn('users.id', 'content_flags.content_id')
                                            ->where('users.city_id', $cityId);
                                    });
                            });
                    })
                    ->count();

            return [
                'openFlags' => $openFlags,
                'activeRestrictions' => UserRestriction::query()
                    ->active()
                    ->whereHas('user', fn(Builder $query) => $query->where('city_id', $cityId))
                    ->count(),
                'newUsers' => User::query()
                    ->where('city_id', $cityId)
                    ->where('created_at', '>=', now()->subDay())
                    ->count(),
                'pendingReports' => CitizenReport::query()
                    ->where('city_id', $cityId)
                    ->whereIn('status', [ReportStatus::Recebido->value, ReportStatus::EmAnalise->value])
                    ->count(),
            ];
            });
        }

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

    private function tenantCityId(): ?string
    {
        $cityId = Tenant::cityId();

        return is_string($cityId) && $cityId !== '' ? $cityId : null;
    }
}
