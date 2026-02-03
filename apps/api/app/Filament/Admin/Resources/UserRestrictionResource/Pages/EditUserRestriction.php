<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserRestrictionResource\Pages;

use App\Filament\Admin\Resources\UserRestrictionResource;
use Filament\Resources\Pages\EditRecord;

class EditUserRestriction extends EditRecord
{
    protected static string $resource = UserRestrictionResource::class;
}
