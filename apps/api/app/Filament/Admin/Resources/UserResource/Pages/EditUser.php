<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\UserResource\Pages;

use App\Filament\Admin\Resources\UserResource;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected array $originalRoles = [];

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $this->originalRoles = $this->record->roles
            ->pluck('name')
            ->sort()
            ->values()
            ->all();

        return $data;
    }

    protected function afterSave(): void
    {
        $currentRoles = $this->record->roles
            ->pluck('name')
            ->sort()
            ->values()
            ->all();

        if ($currentRoles !== $this->originalRoles) {
            activity()
                ->causedBy(auth()->user())
                ->performedOn($this->record)
                ->withProperties([
                    'old' => $this->originalRoles,
                    'new' => $currentRoles,
                ])
                ->log('roles_updated');
        }
    }
}
