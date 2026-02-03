<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\PhoneResource\Pages;

use App\Filament\Admin\Resources\PhoneResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePhone extends CreateRecord
{
    protected static string $resource = PhoneResource::class;
}
