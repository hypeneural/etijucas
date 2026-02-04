<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VotacaoResource\Pages;

use App\Filament\Admin\Resources\VotacaoResource;
use Filament\Resources\Pages\EditRecord;

class EditVotacao extends EditRecord
{
    protected static string $resource = VotacaoResource::class;
}
