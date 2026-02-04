<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\TourismSpotResource\Pages;

use App\Filament\Admin\Resources\TourismSpotResource;
use Filament\Resources\Pages\EditRecord;

class EditTourismSpot extends EditRecord
{
    protected static string $resource = TourismSpotResource::class;

    protected function afterSave(): void
    {
        $this->syncMediaToLegacyFields();
    }

    private function syncMediaToLegacyFields(): void
    {
        $record = $this->record;
        if (! $record) {
            return;
        }

        $updates = [];
        $coverUrl = $record->getFirstMediaUrl('tourism_cover');
        if ($coverUrl && $record->image_url !== $coverUrl) {
            $updates['image_url'] = $coverUrl;
        }

        $galleryUrls = $record->getMedia('tourism_gallery')
            ->map(fn ($media) => $media->getUrl())
            ->values()
            ->all();

        if (!empty($galleryUrls)) {
            $updates['gallery'] = $galleryUrls;
        }

        if (!empty($updates)) {
            $record->forceFill($updates)->saveQuietly();
        }
    }
}
