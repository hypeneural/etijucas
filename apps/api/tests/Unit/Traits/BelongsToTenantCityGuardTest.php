<?php

namespace Tests\Unit\Traits;

use App\Models\City;
use App\Traits\BelongsToTenant;
use DomainException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BelongsToTenantCityGuardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('tenant_guard_probes', function (Blueprint $table): void {
            $table->increments('id');
            $table->uuid('city_id')->nullable();
            $table->string('name');
        });
    }

    protected function tearDown(): void
    {
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');
        Schema::dropIfExists('tenant_guard_probes');

        parent::tearDown();
    }

    public function test_fails_creation_without_city_id_and_without_tenant_context(): void
    {
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Registro tenant-aware exige city_id explicito.');

        TenantGuardProbe::query()->create([
            'name' => 'invalid-without-city',
        ]);
    }

    public function test_auto_sets_city_id_from_tenant_context_when_missing(): void
    {
        $city = new City();
        $city->forceFill([
            'id' => '00000000-0000-0000-0000-0000000000c1',
            'slug' => 'cidade-a',
        ]);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', 'test');

        $row = TenantGuardProbe::query()->create([
            'name' => 'valid-with-tenant',
        ]);

        $this->assertSame('00000000-0000-0000-0000-0000000000c1', $row->city_id);
    }
}

class TenantGuardProbe extends Model
{
    use BelongsToTenant;

    protected $table = 'tenant_guard_probes';

    public $timestamps = false;

    protected $guarded = [];
}

