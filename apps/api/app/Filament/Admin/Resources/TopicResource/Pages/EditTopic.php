<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TopicResource\Pages;

use App\Filament\Admin\Resources\TopicResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTopic extends EditRecord
{
    protected static string $resource = TopicResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

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

        $mediaUrl = $record->getFirstMediaUrl('foto');
        if ($mediaUrl && $record->foto_url !== $mediaUrl) {
            $record->forceFill(['foto_url' => $mediaUrl])->saveQuietly();
        }
    }
}
