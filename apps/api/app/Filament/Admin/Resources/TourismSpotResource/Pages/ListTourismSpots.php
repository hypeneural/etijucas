<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TourismSpotResource\Pages;

use App\Filament\Admin\Resources\TourismSpotResource;
use Filament\Resources\Pages\ListRecords;

class ListTourismSpots extends ListRecords
{
    protected static string $resource = TourismSpotResource::class;
}
