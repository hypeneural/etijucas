<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domains\Votes\Models\Legislatura;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class LegislaturaPolicy
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

    public function view(User $user, Legislatura $legislatura): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Legislatura $legislatura): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Legislatura $legislatura): bool
    {
        return $user->hasRole('admin');
    }
}
