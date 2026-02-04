<?php

declare(strict_types=1);

namespace App\Domains\Forum\Actions;

use App\Domain\Forum\Enums\TopicStatus;
use App\Models\Topic;
use App\Models\User;

class RestoreTopicAction
{
    public function execute(Topic $topic, ?User $actor = null): Topic
    {
        $topic->update(['status' => TopicStatus::Active]);

        if (function_exists('activity')) {
            activity()
                ->causedBy($actor)
                ->performedOn($topic)
                ->log('topic_restored');
        }

        return $topic;
    }
}
