<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\PhoneResource\Pages;

use App\Filament\Admin\Resources\PhoneResource;
use Filament\Resources\Pages\ListRecords;

class ListPhones extends ListRecords
{
    protected static string $resource = PhoneResource::class;
}
