<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserRestrictionResource\Pages;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Filament\Admin\Resources\UserRestrictionResource;
use App\Models\User;
use Filament\Resources\Pages\EditRecord;

class EditUserRestriction extends EditRecord
{
    protected static string $resource = UserRestrictionResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (($data['scope'] ?? null) === RestrictionScope::Global->value) {
            $data['scope_city_id'] = null;
            return $data;
        }

        $userId = $data['user_id'] ?? $this->record?->user_id;
        if (is_string($userId) && $userId !== '') {
            $data['scope_city_id'] = User::query()->where('id', $userId)->value('city_id');
        }

        return $data;
    }
}
