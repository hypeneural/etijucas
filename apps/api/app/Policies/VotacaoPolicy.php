<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domains\Votes\Models\Votacao;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class VotacaoPolicy
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

    public function view(User $user, Votacao $votacao): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Votacao $votacao): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Votacao $votacao): bool
    {
        return $user->hasRole('admin');
    }
}
