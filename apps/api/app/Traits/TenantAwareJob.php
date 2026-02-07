<?php

namespace App\Traits;

use App\Models\City;
use App\Support\Tenant;

/**
 * Tenant Aware Job Trait
 * 
 * Ensures jobs maintain tenant context when dispatched.
 * Use this trait in any job that operates on tenant-specific data.
 * 
 * Usage:
 * ```php
 * class ProcessReportJob implements ShouldQueue
 * {
 *     use TenantAwareJob;
 *     
 *     public function __construct(public CitizenReport $report)
 *     {
 *         $this->captureTenantContext();
 *     }
 *     
 *     public function handle(): void
 *     {
 *         $this->restoreTenantContext();
 *         // ... job logic with proper tenant scope
 *     }
 * }
 * ```
 */
trait TenantAwareJob
{
    /**
     * The tenant city ID captured when job was dispatched.
     */
    protected ?string $tenantCityId = null;

    /**
     * The tenant city slug captured when job was dispatched.
     */
    protected ?string $tenantCitySlug = null;

    /**
     * Capture current tenant context when job is created.
     * Call this in the job constructor.
     */
    public function captureTenantContext(): void
    {
        $this->tenantCityId = Tenant::cityId();
        $this->tenantCitySlug = Tenant::citySlug();
    }

    /**
     * Restore tenant context when job is processed.
     * Call this at the start of the handle() method.
     */
    public function restoreTenantContext(): void
    {
        if (!$this->tenantCityId) {
            return;
        }

        $city = City::find($this->tenantCityId);

        if ($city) {
            app()->instance('tenant.city', $city);
        }
    }

    /**
     * Get the captured tenant city ID.
     */
    public function getTenantCityId(): ?string
    {
        return $this->tenantCityId;
    }

    /**
     * Get the captured tenant city slug.
     */
    public function getTenantCitySlug(): ?string
    {
        return $this->tenantCitySlug;
    }

    /**
     * Check if job has tenant context.
     */
    public function hasTenantContext(): bool
    {
        return $this->tenantCityId !== null;
    }
}
