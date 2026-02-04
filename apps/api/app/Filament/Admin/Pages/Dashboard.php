<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use App\Filament\Admin\Widgets\AdminOverviewStats;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $navigationIcon = 'heroicon-o-home';

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_Dashboard') ?? false;
    }

    protected function getHeaderWidgets(): array
    {
        return [
            AdminOverviewStats::class,
        ];
    }
}
