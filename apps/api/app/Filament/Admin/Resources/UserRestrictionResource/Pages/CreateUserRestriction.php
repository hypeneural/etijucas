<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserRestrictionResource\Pages;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Filament\Admin\Resources\UserRestrictionResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;

class CreateUserRestriction extends CreateRecord
{
    protected static string $resource = UserRestrictionResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['created_by'] = auth()->id();
        $data['scope_city_id'] = $this->resolveScopeCityId($data);

        return $data;
    }

    private function resolveScopeCityId(array $data): ?string
    {
        if (($data['scope'] ?? null) === RestrictionScope::Global->value) {
            return null;
        }

        $userId = $data['user_id'] ?? null;
        if (!is_string($userId) || $userId === '') {
            return null;
        }

        return User::query()->where('id', $userId)->value('city_id');
    }
}
