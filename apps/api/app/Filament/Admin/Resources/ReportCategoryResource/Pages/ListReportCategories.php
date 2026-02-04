<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\ReportCategoryResource\Pages;

use App\Filament\Admin\Resources\ReportCategoryResource;
use Filament\Resources\Pages\ListRecords;

class ListReportCategories extends ListRecords
{
    protected static string $resource = ReportCategoryResource::class;
}
