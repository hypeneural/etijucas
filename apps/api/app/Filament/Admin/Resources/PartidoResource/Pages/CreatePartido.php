<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\PartidoResource\Pages;

use App\Filament\Admin\Resources\PartidoResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePartido extends CreateRecord
{
    protected static string $resource = PartidoResource::class;
}
