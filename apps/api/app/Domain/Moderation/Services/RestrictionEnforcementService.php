<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Services;

use App\Domain\Moderation\Enums\RestrictionType;
use App\Models\User;
use App\Models\UserRestriction;
use App\Support\Tenant;

class RestrictionEnforcementService
{
    /**
     * @param list<string> $typeValues
     */
    public function firstBlockingRestriction(User $user, string $moduleKey, array $typeValues): ?UserRestriction
    {
        $validTypeValues = array_values(array_filter($typeValues, static function (string $value): bool {
            return RestrictionType::tryFrom($value) !== null;
        }));

        if ($validTypeValues === []) {
            return null;
        }

        $cityId = Tenant::cityId();

        return UserRestriction::query()
            ->active()
            ->where('user_id', $user->id)
            ->whereIn('type', $validTypeValues)
            ->forModule($moduleKey)
            ->when(
                is_string($cityId) && $cityId !== '',
                fn($query) => $query->where(function ($cityQuery) use ($cityId): void {
                    $cityQuery->whereNull('scope_city_id')
                        ->orWhere('scope_city_id', $cityId);
                })
            )
            ->orderByDesc('created_at')
            ->first();
    }
}
