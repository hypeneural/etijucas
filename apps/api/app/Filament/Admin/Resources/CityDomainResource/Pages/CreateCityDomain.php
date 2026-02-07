<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CityDomainResource\Pages;

use App\Filament\Admin\Resources\CityDomainResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCityDomain extends CreateRecord
{
    protected static string $resource = CityDomainResource::class;
}
