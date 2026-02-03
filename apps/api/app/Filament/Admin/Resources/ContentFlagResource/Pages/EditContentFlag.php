<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\ContentFlagResource\Pages;

use App\Filament\Admin\Resources\ContentFlagResource;
use Filament\Resources\Pages\EditRecord;

class EditContentFlag extends EditRecord
{
    protected static string $resource = ContentFlagResource::class;
}
