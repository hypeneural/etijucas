<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\OrganizerResource\Pages;

use App\Filament\Admin\Resources\OrganizerResource;
use Filament\Resources\Pages\ListRecords;

class ListOrganizers extends ListRecords
{
    protected static string $resource = OrganizerResource::class;
}
