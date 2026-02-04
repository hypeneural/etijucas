<?php

namespace App\Domains\Reports\Policies;

use App\Models\User;
use App\Domains\Reports\Models\CitizenReport;
use Illuminate\Auth\Access\HandlesAuthorization;

class CitizenReportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view_any_citizen::report');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('view_citizen::report');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('create_citizen::report');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('update_citizen::report');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('delete_citizen::report');
    }

    /**
     * Determine whether the user can bulk delete.
     */
    public function deleteAny(User $user): bool
    {
        return $user->can('delete_any_citizen::report');
    }

    /**
     * Determine whether the user can permanently delete.
     */
    public function forceDelete(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('force_delete_citizen::report');
    }

    /**
     * Determine whether the user can permanently bulk delete.
     */
    public function forceDeleteAny(User $user): bool
    {
        return $user->can('force_delete_any_citizen::report');
    }

    /**
     * Determine whether the user can restore.
     */
    public function restore(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('restore_citizen::report');
    }

    /**
     * Determine whether the user can bulk restore.
     */
    public function restoreAny(User $user): bool
    {
        return $user->can('restore_any_citizen::report');
    }

    /**
     * Determine whether the user can replicate.
     */
    public function replicate(User $user, CitizenReport $citizenReport): bool
    {
        return $user->can('replicate_citizen::report');
    }

    /**
     * Determine whether the user can reorder.
     */
    public function reorder(User $user): bool
    {
        return $user->can('reorder_citizen::report');
    }
}
