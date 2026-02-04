<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CommentResource\Pages;

use App\Filament\Admin\Resources\CommentResource;
use Filament\Resources\Pages\ViewRecord;

class ViewComment extends ViewRecord
{
    protected static string $resource = CommentResource::class;
}
