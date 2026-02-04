<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\EventResource\Pages;

use App\Filament\Admin\Resources\EventResource;
use Filament\Resources\Pages\CreateRecord;

class CreateEvent extends CreateRecord
{
    protected static string $resource = EventResource::class;

    protected function afterCreate(): void
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
        $coverUrl = $record->getFirstMediaUrl('event_cover');
        if ($coverUrl && $record->cover_image_url !== $coverUrl) {
            $updates['cover_image_url'] = $coverUrl;
        }

        $bannerUrl = $record->getFirstMediaUrl('event_banner');
        if ($bannerUrl && $record->banner_image_url !== $bannerUrl) {
            $updates['banner_image_url'] = $bannerUrl;
        }

        $bannerMobileUrl = $record->getFirstMediaUrl('event_banner_mobile');
        if ($bannerMobileUrl && $record->banner_image_mobile_url !== $bannerMobileUrl) {
            $updates['banner_image_mobile_url'] = $bannerMobileUrl;
        }

        if (!empty($updates)) {
            $record->forceFill($updates)->saveQuietly();
        }
    }
}
