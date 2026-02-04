<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VereadorResource\Pages;

use App\Filament\Admin\Resources\VereadorResource;
use Filament\Resources\Pages\ListRecords;

class ListVereadores extends ListRecords
{
    protected static string $resource = VereadorResource::class;
}
