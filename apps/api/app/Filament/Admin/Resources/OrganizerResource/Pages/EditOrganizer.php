<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\OrganizerResource\Pages;

use App\Filament\Admin\Resources\OrganizerResource;
use Filament\Resources\Pages\EditRecord;

class EditOrganizer extends EditRecord
{
    protected static string $resource = OrganizerResource::class;

    protected function afterSave(): void
    {
        $this->syncAvatarUrlFromMedia();
    }

    private function syncAvatarUrlFromMedia(): void
    {
        $record = $this->record;
        if (! $record) {
            return;
        }

        $mediaUrl = $record->getFirstMediaUrl('avatar');
        if ($mediaUrl && $record->avatar_url !== $mediaUrl) {
            $record->forceFill(['avatar_url' => $mediaUrl])->saveQuietly();
        }
    }
}
