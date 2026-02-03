<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserRestrictionResource\Pages;

use App\Filament\Admin\Resources\UserRestrictionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateUserRestriction extends CreateRecord
{
    protected static string $resource = UserRestrictionResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['created_by'] = auth()->id();

        return $data;
    }
}
