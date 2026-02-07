<?php

declare(strict_types=1);

namespace App\Jobs\Middleware;

use App\Jobs\Contracts\TenantAwareJob;
use App\Models\City;
use Closure;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class EnsureTenantContext
{
    public function handle(object $job, Closure $next): void
    {
        if (!$job instanceof TenantAwareJob) {
            $next($job);
            return;
        }

        $cityId = $job->tenantCityId();
        $moduleKey = $job->tenantModuleKey();
        $traceId = $job->tenantTraceId();

        if (!is_string($cityId) || trim($cityId) === '') {
            Log::error('tenant_job_missing_city_id', [
                'job' => $job::class,
                'module_key' => $moduleKey,
                'trace_id' => $traceId,
            ]);

            throw new RuntimeException('Tenant-aware job requires city_id.');
        }

        $city = City::query()->whereKey($cityId)->first();
        if (!$city) {
            Log::error('tenant_job_city_not_found', [
                'job' => $job::class,
                'city_id' => $cityId,
                'module_key' => $moduleKey,
                'trace_id' => $traceId,
            ]);

            throw new RuntimeException(sprintf('Tenant city not found for queued job: %s', $cityId));
        }

        $hadCity = app()->bound('tenant.city');
        $hadSource = app()->bound('tenant.resolution_source');
        $previousCity = $hadCity ? app('tenant.city') : null;
        $previousSource = $hadSource ? app('tenant.resolution_source') : null;

        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', 'queue_job');

        try {
            $next($job);
        } finally {
            if ($hadCity) {
                app()->instance('tenant.city', $previousCity);
            } else {
                app()->forgetInstance('tenant.city');
            }

            if ($hadSource) {
                app()->instance('tenant.resolution_source', $previousSource);
            } else {
                app()->forgetInstance('tenant.resolution_source');
            }
        }
    }
}

