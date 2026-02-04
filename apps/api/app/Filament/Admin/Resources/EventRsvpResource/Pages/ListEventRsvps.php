<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventRsvpResource\Pages;

use App\Filament\Admin\Resources\EventRsvpResource;
use Filament\Resources\Pages\ListRecords;

class ListEventRsvps extends ListRecords
{
    protected static string $resource = EventRsvpResource::class;
}
