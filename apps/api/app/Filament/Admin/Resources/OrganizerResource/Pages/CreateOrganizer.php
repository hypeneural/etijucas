<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\OrganizerResource\Pages;

use App\Filament\Admin\Resources\OrganizerResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOrganizer extends CreateRecord
{
    protected static string $resource = OrganizerResource::class;
}
