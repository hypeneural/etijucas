<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CitizenReportResource\Pages;

use App\Filament\Admin\Resources\CitizenReportResource;
use Filament\Resources\Pages\ListRecords;

class ListCitizenReports extends ListRecords
{
    protected static string $resource = CitizenReportResource::class;
}
