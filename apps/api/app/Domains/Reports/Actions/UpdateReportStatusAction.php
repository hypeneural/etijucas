<?php

declare(strict_types=1);

namespace App\Domains\Reports\Actions;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Models\User;

class UpdateReportStatusAction
{
    public function execute(
        CitizenReport $report,
        ReportStatus $newStatus,
        ?string $note = null,
        ?User $actor = null
    ): CitizenReport {
        $previousStatus = $report->status;

        $report->updateStatus($newStatus, $note, $actor?->id);

        if (function_exists('activity')) {
            activity()
                ->causedBy($actor)
                ->performedOn($report)
                ->withProperties([
                    'old' => $previousStatus?->value,
                    'new' => $newStatus->value,
                    'note' => $note,
                ])
                ->log('citizen_report_status_updated');
        }

        return $report;
    }
}
