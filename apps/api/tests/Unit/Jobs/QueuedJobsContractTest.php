<?php

namespace Tests\Unit\Jobs;

use App\Jobs\Contracts\GlobalQueueJob;
use App\Jobs\Contracts\TenantAwareJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use RuntimeException;
use Tests\TestCase;

class QueuedJobsContractTest extends TestCase
{
    public function test_each_queued_job_has_explicit_tenant_contract(): void
    {
        $jobsPath = app_path('Jobs');
        $files = glob($jobsPath . DIRECTORY_SEPARATOR . '*.php');
        if ($files === false) {
            throw new RuntimeException('Failed to read jobs directory.');
        }

        $violations = [];

        foreach ($files as $file) {
            $class = 'App\\Jobs\\' . pathinfo($file, PATHINFO_FILENAME);

            if (!class_exists($class)) {
                continue;
            }

            if (!is_subclass_of($class, ShouldQueue::class)) {
                continue;
            }

            $isTenantAware = is_subclass_of($class, TenantAwareJob::class);
            $isGlobal = is_subclass_of($class, GlobalQueueJob::class);

            if (!$isTenantAware && !$isGlobal) {
                $violations[] = $class;
            }
        }

        $this->assertSame([], $violations, 'Queued jobs without explicit tenancy contract: ' . implode(', ', $violations));
    }
}

