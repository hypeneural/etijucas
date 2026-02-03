<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\CommentReportResource\Pages;

use App\Filament\Admin\Resources\CommentReportResource;
use Filament\Resources\Pages\ListRecords;

class ListCommentReports extends ListRecords
{
    protected static string $resource = CommentReportResource::class;
}
