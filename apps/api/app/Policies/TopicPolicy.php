<?php

namespace App\Policies;

use App\Models\Topic;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TopicPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view the topic.
     */
    public function view(?User $user, Topic $topic): bool
    {
        // Public topics are viewable by anyone
        return $topic->status->value === 'active' ||
            ($user && ($user->id === $topic->user_id || $user->hasAnyRole(['admin', 'moderator'])));
    }

    /**
     * Determine if the user can create topics.
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create topics
        return true;
    }

    /**
     * Determine if the user can update the topic.
     * Only author within 24h edit window.
     */
    public function update(User $user, Topic $topic): bool
    {
        // Admins and moderators can always edit
        if ($user->hasAnyRole(['admin', 'moderator'])) {
            return true;
        }

        // Author can edit within 24h
        return $user->id === $topic->user_id && $topic->isEditableByAuthor();
    }

    /**
     * Determine if the user can delete the topic.
     * Author or moderators.
     */
    public function delete(User $user, Topic $topic): bool
    {
        return $user->id === $topic->user_id || $user->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * Determine if the user can hide the topic (moderation).
     */
    public function hide(User $user, Topic $topic): bool
    {
        return $user->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * Determine if the user can like the topic.
     */
    public function like(User $user, Topic $topic): bool
    {
        // Any authenticated user can like, except their own topic
        return $user->id !== $topic->user_id;
    }

    /**
     * Determine if the user can save the topic.
     */
    public function save(User $user, Topic $topic): bool
    {
        return true;
    }

    /**
     * Determine if the user can report the topic.
     */
    public function report(User $user, Topic $topic): bool
    {
        // Can't report your own topic
        return $user->id !== $topic->user_id;
    }
}
