<?php

namespace Tests\Unit\Jobs;

use App\Jobs\LogAddressMismatch;
use App\Jobs\Middleware\EnsureTenantContext;
use Tests\TestCase;

class LogAddressMismatchTest extends TestCase
{
    public function test_generates_trace_id_and_exposes_tenant_payload_contract(): void
    {
        $job = new LogAddressMismatch(
            cityId: '00000000-0000-0000-0000-0000000000c1',
            bairroTextKey: 'centro',
            bairroTextExample: 'Centro'
        );

        $this->assertSame('00000000-0000-0000-0000-0000000000c1', $job->tenantCityId());
        $this->assertSame('reports', $job->tenantModuleKey());
        $this->assertNotEmpty($job->tenantTraceId());
    }

    public function test_registers_tenant_context_middleware(): void
    {
        $job = new LogAddressMismatch(
            cityId: '00000000-0000-0000-0000-0000000000c1',
            bairroTextKey: 'centro',
            bairroTextExample: 'Centro',
            provider: 'viacep',
            moduleKey: 'reports',
            traceId: 'trace-fixed'
        );

        $middlewares = $job->middleware();

        $this->assertCount(1, $middlewares);
        $this->assertInstanceOf(EnsureTenantContext::class, $middlewares[0]);
        $this->assertSame('trace-fixed', $job->tenantTraceId());
    }
}

