<?php

declare(strict_types=1);

namespace App\Filament\Admin\Widgets;

use App\Domains\Votes\Models\Votacao;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class VotesEngagementStats extends BaseWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->can('widget_VotesEngagementStats') ?? false;
    }

    protected function getStats(): array
    {
        $likes = Votacao::query()->sum('likes_count');
        $dislikes = Votacao::query()->sum('dislikes_count');
        $comments = Votacao::query()->sum('comments_count');

        return [
            Stat::make('Likes', $likes)->color('success'),
            Stat::make('Dislikes', $dislikes)->color('danger'),
            Stat::make('Coment?rios', $comments)->color('warning'),
        ];
    }
}
