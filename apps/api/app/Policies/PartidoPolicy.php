<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domains\Votes\Models\Partido;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PartidoPolicy
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

    public function view(User $user, Partido $partido): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Partido $partido): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Partido $partido): bool
    {
        return $user->hasRole('admin');
    }
}
