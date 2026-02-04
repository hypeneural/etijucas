<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventRsvpResource\Pages;

use App\Filament\Admin\Resources\EventRsvpResource;
use Filament\Resources\Pages\EditRecord;

class EditEventRsvp extends EditRecord
{
    protected static string $resource = EventRsvpResource::class;
}
