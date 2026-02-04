<?php

declare(strict_types=1);

namespace App\Domains\Reports\Actions;

use App\Domains\Reports\Models\CitizenReport;
use App\Models\User;

class AssignReportAction
{
    public function execute(
        CitizenReport $report,
        ?User $assignee,
        ?User $actor = null,
        ?string $note = null
    ): CitizenReport {
        $previous = $report->assigned_to;

        $report->forceFill([
            'assigned_to' => $assignee?->id,
            'assigned_at' => $assignee ? now() : null,
        ])->save();

        if (function_exists('activity')) {
            activity()
                ->causedBy($actor)
                ->performedOn($report)
                ->withProperties([
                    'old' => $previous,
                    'new' => $assignee?->id,
                    'note' => $note,
                ])
                ->log('citizen_report_assigned');
        }

        return $report;
    }
}
