<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TagResource\Pages;

use App\Filament\Admin\Resources\TagResource;
use Filament\Resources\Pages\ListRecords;

class ListTags extends ListRecords
{
    protected static string $resource = TagResource::class;
}
