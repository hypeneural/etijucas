<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\Concerns;

use Filament\Forms\Components\FileUpload;

trait HasMediaLibraryTrait
{
    protected static function mediaUploadField(
        string $field,
        string $collection,
        int $maxFiles = 1
    ) {
        $spatieUploadClass = 'Filament\\Forms\\Components\\SpatieMediaLibraryFileUpload';

        if (class_exists($spatieUploadClass)) {
            return $spatieUploadClass::make($field)
                ->collection($collection)
                ->maxFiles($maxFiles)
                ->preserveFilenames()
                ->image()
                ->imageEditor()
                ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp']);
        }

        $upload = FileUpload::make($field)
            ->disk('public')
            ->directory($collection)
            ->maxFiles($maxFiles)
            ->preserveFilenames()
            ->image()
            ->imageEditor()
            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp']);

        if ($maxFiles > 1) {
            $upload->multiple();
        }

        return $upload;
    }
}
