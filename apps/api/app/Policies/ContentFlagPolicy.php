<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContentFlag;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ContentFlagPolicy
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

    public function view(User $user, ContentFlag $flag): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function update(User $user, ContentFlag $flag): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    public function delete(User $user, ContentFlag $flag): bool
    {
        return $user->hasRole('admin');
    }
}
