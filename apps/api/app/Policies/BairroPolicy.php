<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BairroPolicy
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
        return $user->hasAnyRole(['admin', 'moderator', 'operator']);
    }

    public function view(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'moderator', 'operator']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'operator']);
    }

    public function update(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'operator']);
    }

    public function delete(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'operator']);
    }
}
