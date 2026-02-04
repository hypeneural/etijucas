<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VotacaoCommentResource\Pages;

use App\Filament\Admin\Resources\VotacaoCommentResource;
use Filament\Resources\Pages\ListRecords;

class ListVotacaoComments extends ListRecords
{
    protected static string $resource = VotacaoCommentResource::class;
}
