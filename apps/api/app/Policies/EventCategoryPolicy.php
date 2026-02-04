<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\EventCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EventCategoryPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, EventCategory $category): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, EventCategory $category): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, EventCategory $category): bool
    {
        return $user->hasRole('admin');
    }
}
