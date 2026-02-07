<?php

declare(strict_types=1);

namespace App\Jobs\Contracts;

interface TenantAwareJob
{
    public function tenantCityId(): ?string;

    public function tenantModuleKey(): ?string;

    public function tenantTraceId(): ?string;
}

