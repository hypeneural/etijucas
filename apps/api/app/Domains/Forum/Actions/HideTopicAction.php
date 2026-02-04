<?php

declare(strict_types=1);

namespace App\Domains\Forum\Actions;

use App\Domain\Forum\Enums\TopicStatus;
use App\Models\Topic;
use App\Models\User;

class HideTopicAction
{
    public function execute(Topic $topic, ?User $actor = null, ?string $reason = null): Topic
    {
        $topic->update(['status' => TopicStatus::Hidden]);

        if (function_exists('activity')) {
            $activity = activity()
                ->causedBy($actor)
                ->performedOn($topic);

            if ($reason) {
                $activity->withProperties(['motivo' => $reason]);
            }

            $activity->log('topic_hidden');
        }

        return $topic;
    }
}
