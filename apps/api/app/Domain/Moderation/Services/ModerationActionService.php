<?php

declare(strict_types=1);

namespace App\Domain\Moderation\Services;

use App\Domain\Forum\Enums\ReportStatus as ForumReportStatus;
use App\Domain\Forum\Enums\TopicStatus;
use App\Domain\Moderation\Enums\FlagAction;
use App\Domain\Moderation\Enums\FlagStatus;
use App\Models\CommentReport;
use App\Models\ContentFlag;
use App\Models\TopicReport;
use App\Models\User;
use App\Models\UserRestriction;
use Illuminate\Database\Eloquent\Model;

class ModerationActionService
{
    public function markFlagReviewing(ContentFlag $flag, User $actor): void
    {
        $flag->markReviewing($actor);

        $this->log($actor, $flag, 'content_flag_reviewing', [
            'status' => FlagStatus::Reviewing->value,
        ]);
    }

    public function dismissFlag(ContentFlag $flag, User $actor): void
    {
        $flag->markDismissed($actor);

        $this->log($actor, $flag, 'content_flag_dismissed', [
            'status' => FlagStatus::Dismissed->value,
        ]);
    }

    public function takeFlagAction(ContentFlag $flag, User $actor, array $data): ?UserRestriction
    {
        $action = FlagAction::from($data['action']);
        $flag->markActionTaken($actor, $action);

        $restrictionId = null;
        $restriction = null;

        if ($action === FlagAction::RestrictUser) {
            $restriction = UserRestriction::create([
                'user_id' => $data['user_id'],
                'type' => $data['restriction_type'],
                'scope' => $data['restriction_scope'],
                'reason' => $data['restriction_reason'] ?? 'Aplicada via moderacao',
                'created_by' => $actor->id,
                'starts_at' => now(),
                'ends_at' => $data['restriction_ends_at'] ?? null,
            ]);

            $restrictionId = $restriction->id;
        }

        $this->log($actor, $flag, 'content_flag_action_taken', [
            'status' => FlagStatus::ActionTaken->value,
            'action' => $action->value,
            'restriction_id' => $restrictionId,
        ]);

        return $restriction;
    }

    public function dismissTopicReport(TopicReport $report, User $actor): void
    {
        $report->update(['status' => ForumReportStatus::Dismissed]);

        $this->log($actor, $report, 'topic_report_dismissed', [
            'status' => ForumReportStatus::Dismissed->value,
        ]);
    }

    public function hideTopicFromReport(TopicReport $report, User $actor): void
    {
        $topicId = $report->topic_id;
        $report->topic?->update(['status' => TopicStatus::Hidden]);
        $report->update(['status' => ForumReportStatus::ActionTaken]);

        $this->log($actor, $report, 'topic_report_topic_hidden', [
            'status' => ForumReportStatus::ActionTaken->value,
            'topic_id' => $topicId,
        ]);
    }

    public function dismissCommentReport(CommentReport $report, User $actor): void
    {
        $report->update(['status' => ForumReportStatus::Dismissed]);

        $this->log($actor, $report, 'comment_report_dismissed', [
            'status' => ForumReportStatus::Dismissed->value,
        ]);
    }

    public function deleteCommentFromReport(CommentReport $report, User $actor): void
    {
        $commentId = $report->comment_id;
        $topicId = $report->comment?->topic_id;

        $report->comment?->delete();
        $report->update(['status' => ForumReportStatus::ActionTaken]);

        $this->log($actor, $report, 'comment_report_comment_deleted', [
            'status' => ForumReportStatus::ActionTaken->value,
            'comment_id' => $commentId,
            'topic_id' => $topicId,
        ]);
    }

    private function log(User $actor, Model $record, string $event, array $properties = []): void
    {
        if (!function_exists('activity')) {
            return;
        }

        $activity = activity()
            ->causedBy($actor)
            ->performedOn($record);

        if (!empty($properties)) {
            $activity->withProperties($properties);
        }

        $activity->log($event);
    }
}
