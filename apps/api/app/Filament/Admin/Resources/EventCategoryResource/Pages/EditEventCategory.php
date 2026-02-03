<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventCategoryResource\Pages;

use App\Filament\Admin\Resources\EventCategoryResource;
use Filament\Resources\Pages\EditRecord;

class EditEventCategory extends EditRecord
{
    protected static string $resource = EventCategoryResource::class;
}
