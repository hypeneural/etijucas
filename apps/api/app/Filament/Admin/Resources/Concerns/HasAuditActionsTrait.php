<?php

declare(strict_types=1);

namespace App\Filament\Admin\Resources\Concerns;

use Illuminate\Database\Eloquent\Model;

trait HasAuditActionsTrait
{
    protected function logAudit(string $event, ?Model $record = null, array $properties = []): void
    {
        if (!function_exists('activity')) {
            return;
        }

        $activity = activity();

        if ($record) {
            $activity->performedOn($record);
        }

        $user = auth()->user();
        if ($user) {
            $activity->causedBy($user);
        }

        if (!empty($properties)) {
            $activity->withProperties($properties);
        }

        $activity->log($event);
    }
}
