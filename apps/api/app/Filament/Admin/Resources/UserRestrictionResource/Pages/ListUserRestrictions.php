<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserRestrictionResource\Pages;

use App\Filament\Admin\Resources\UserRestrictionResource;
use Filament\Resources\Pages\ListRecords;

class ListUserRestrictions extends ListRecords
{
    protected static string $resource = UserRestrictionResource::class;
}
