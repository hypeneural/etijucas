<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\VereadorResource\Pages;

use App\Filament\Admin\Resources\VereadorResource;
use Filament\Resources\Pages\EditRecord;

class EditVereador extends EditRecord
{
    protected static string $resource = VereadorResource::class;

    protected function afterSave(): void
    {
        $this->syncFotoUrlFromMedia();
    }

    private function syncFotoUrlFromMedia(): void
    {
        $record = $this->record;
        if (! $record) {
            return;
        }

        $mediaUrl = $record->getFirstMediaUrl('vereador_avatar');
        if ($mediaUrl && $record->foto_url !== $mediaUrl) {
            $record->forceFill(['foto_url' => $mediaUrl])->saveQuietly();
        }
    }
}
