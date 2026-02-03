<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can create comments.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can delete the comment.
     * Author or moderators.
     */
    public function delete(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id || $user->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * Determine if the user can like the comment.
     */
    public function like(User $user, Comment $comment): bool
    {
        // Any authenticated user can like, except their own comment
        return $user->id !== $comment->user_id;
    }

    /**
     * Determine if the user can report the comment.
     */
    public function report(User $user, Comment $comment): bool
    {
        // Can't report your own comment
        return $user->id !== $comment->user_id;
    }
}
