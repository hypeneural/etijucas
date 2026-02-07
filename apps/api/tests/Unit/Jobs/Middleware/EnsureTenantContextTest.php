<?php

namespace Tests\Unit\Jobs\Middleware;

use App\Jobs\Contracts\TenantAwareJob;
use App\Jobs\Middleware\EnsureTenantContext;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class EnsureTenantContextTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cities');
        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        DB::table('cities')->insert([
            'id' => '00000000-0000-0000-0000-0000000000c1',
            'name' => 'Cidade 1',
            'slug' => 'cidade-1',
            'active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('cities')->insert([
            'id' => '00000000-0000-0000-0000-0000000000c2',
            'name' => 'Cidade 2',
            'slug' => 'cidade-2',
            'active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_sets_and_restores_tenant_context_for_tenant_aware_job(): void
    {
        $middleware = new EnsureTenantContext();
        $job = new class implements TenantAwareJob {
            public function tenantCityId(): ?string
            {
                return '00000000-0000-0000-0000-0000000000c1';
            }

            public function tenantModuleKey(): ?string
            {
                return 'reports';
            }

            public function tenantTraceId(): ?string
            {
                return 'trace-test-1';
            }
        };

        $called = false;

        $middleware->handle($job, function () use (&$called): void {
            $called = true;
            $this->assertTrue(app()->bound('tenant.city'));
            $this->assertSame('00000000-0000-0000-0000-0000000000c1', app('tenant.city')->id);
            $this->assertSame('queue_job', app('tenant.resolution_source'));
        });

        $this->assertTrue($called);
        $this->assertFalse(app()->bound('tenant.city'));
        $this->assertFalse(app()->bound('tenant.resolution_source'));
    }

    public function test_fails_fast_when_city_id_is_missing(): void
    {
        Log::spy();

        $middleware = new EnsureTenantContext();
        $job = new class implements TenantAwareJob {
            public function tenantCityId(): ?string
            {
                return null;
            }

            public function tenantModuleKey(): ?string
            {
                return 'reports';
            }

            public function tenantTraceId(): ?string
            {
                return 'trace-test-2';
            }
        };

        try {
            $middleware->handle($job, static function (): void {
                // no-op
            });
            $this->fail('Expected RuntimeException was not thrown.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Tenant-aware job requires city_id.', $exception->getMessage());
        }

        Log::shouldHaveReceived('error')
            ->once()
            ->with('tenant_job_missing_city_id', Mockery::type('array'));
    }

    public function test_fails_fast_when_city_id_is_unknown(): void
    {
        Log::spy();

        $middleware = new EnsureTenantContext();
        $job = new class implements TenantAwareJob {
            public function tenantCityId(): ?string
            {
                return '00000000-0000-0000-0000-0000000000ff';
            }

            public function tenantModuleKey(): ?string
            {
                return 'reports';
            }

            public function tenantTraceId(): ?string
            {
                return 'trace-test-3';
            }
        };

        try {
            $middleware->handle($job, static function (): void {
                // no-op
            });
            $this->fail('Expected RuntimeException was not thrown.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('Tenant city not found for queued job', $exception->getMessage());
        }

        Log::shouldHaveReceived('error')
            ->once()
            ->with('tenant_job_city_not_found', Mockery::type('array'));
    }

    public function test_each_job_uses_its_own_city_context_without_leaking(): void
    {
        $middleware = new EnsureTenantContext();

        $cityOneJob = new class implements TenantAwareJob {
            public function tenantCityId(): ?string
            {
                return '00000000-0000-0000-0000-0000000000c1';
            }

            public function tenantModuleKey(): ?string
            {
                return 'reports';
            }

            public function tenantTraceId(): ?string
            {
                return 'trace-a';
            }
        };

        $cityTwoJob = new class implements TenantAwareJob {
            public function tenantCityId(): ?string
            {
                return '00000000-0000-0000-0000-0000000000c2';
            }

            public function tenantModuleKey(): ?string
            {
                return 'reports';
            }

            public function tenantTraceId(): ?string
            {
                return 'trace-b';
            }
        };

        $middleware->handle($cityOneJob, function (): void {
            $this->assertSame('00000000-0000-0000-0000-0000000000c1', app('tenant.city')->id);
        });

        $this->assertFalse(app()->bound('tenant.city'));

        $middleware->handle($cityTwoJob, function (): void {
            $this->assertSame('00000000-0000-0000-0000-0000000000c2', app('tenant.city')->id);
        });

        $this->assertFalse(app()->bound('tenant.city'));
    }
}
