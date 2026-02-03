<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\BairroResource\Pages;

use App\Filament\Admin\Resources\BairroResource;
use Filament\Resources\Pages\ListRecords;

class ListBairros extends ListRecords
{
    protected static string $resource = BairroResource::class;
}
