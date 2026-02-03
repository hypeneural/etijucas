<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\UserRestriction;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserRestrictionPolicy
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
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function view(User $user, UserRestriction $restriction): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function update(User $user, UserRestriction $restriction): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function delete(User $user, UserRestriction $restriction): bool
    {
        return $user->hasRole('admin');
    }
}
