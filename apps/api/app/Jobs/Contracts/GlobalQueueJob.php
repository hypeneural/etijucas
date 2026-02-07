<?php

declare(strict_types=1);

namespace App\Jobs\Contracts;

/**
 * Marker interface for queued jobs that are intentionally global.
 *
 * Use only for operational or migration jobs that are not bound to a single tenant.
 */
interface GlobalQueueJob
{
}

