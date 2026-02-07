<?php

namespace Tests\Unit\Domain\Moderation;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use App\Domain\Moderation\Services\RestrictionEnforcementService;
use App\Models\City;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RestrictionEnforcementServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('user_restrictions');
        Schema::create('user_restrictions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('type', 40);
            $table->string('scope', 20)->default('global');
            $table->uuid('scope_city_id')->nullable();
            $table->string('scope_module_key', 50)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('user_restrictions');

        parent::tearDown();
    }

    public function test_local_restriction_only_blocks_target_city(): void
    {
        $this->insertRestriction([
            'id' => '00000000-0000-0000-0000-000000000001',
            'user_id' => '00000000-0000-0000-0000-0000000000u1',
            'type' => RestrictionType::MuteForum->value,
            'scope' => RestrictionScope::Forum->value,
            'scope_module_key' => 'forum',
            'scope_city_id' => '00000000-0000-0000-0000-0000000000c1',
        ]);

        $service = new RestrictionEnforcementService();
        $user = new User();
        $user->forceFill(['id' => '00000000-0000-0000-0000-0000000000u1']);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c1');
        $blockedInTargetCity = $service->firstBlockingRestriction(
            $user,
            'forum',
            [RestrictionType::MuteForum->value]
        );

        $this->assertNotNull($blockedInTargetCity);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c2');
        $notBlockedOutsideTargetCity = $service->firstBlockingRestriction(
            $user,
            'forum',
            [RestrictionType::MuteForum->value]
        );

        $this->assertNull($notBlockedOutsideTargetCity);
    }

    public function test_global_restriction_blocks_all_cities(): void
    {
        $this->insertRestriction([
            'id' => '00000000-0000-0000-0000-000000000002',
            'user_id' => '00000000-0000-0000-0000-0000000000u2',
            'type' => RestrictionType::MuteForum->value,
            'scope' => RestrictionScope::Global->value,
            'scope_module_key' => null,
            'scope_city_id' => null,
        ]);

        $service = new RestrictionEnforcementService();
        $user = new User();
        $user->forceFill(['id' => '00000000-0000-0000-0000-0000000000u2']);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c1');
        $blockedInCityA = $service->firstBlockingRestriction(
            $user,
            'forum',
            [RestrictionType::MuteForum->value]
        );

        $this->assertNotNull($blockedInCityA);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c2');
        $blockedInCityB = $service->firstBlockingRestriction(
            $user,
            'forum',
            [RestrictionType::MuteForum->value]
        );

        $this->assertNotNull($blockedInCityB);
    }

    public function test_module_restriction_does_not_affect_other_module(): void
    {
        $this->insertRestriction([
            'id' => '00000000-0000-0000-0000-000000000003',
            'user_id' => '00000000-0000-0000-0000-0000000000u3',
            'type' => RestrictionType::BlockUploads->value,
            'scope' => RestrictionScope::Forum->value,
            'scope_module_key' => 'forum',
            'scope_city_id' => null,
        ]);

        $service = new RestrictionEnforcementService();
        $user = new User();
        $user->forceFill(['id' => '00000000-0000-0000-0000-0000000000u3']);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c1');

        $blockedInForum = $service->firstBlockingRestriction(
            $user,
            'forum',
            [RestrictionType::BlockUploads->value]
        );
        $this->assertNotNull($blockedInForum);

        $notBlockedInReports = $service->firstBlockingRestriction(
            $user,
            'reports',
            [RestrictionType::BlockUploads->value]
        );
        $this->assertNull($notBlockedInReports);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function insertRestriction(array $data): void
    {
        DB::table('user_restrictions')->insert(array_merge([
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addDay(),
            'revoked_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $data));
    }

    private function bindTenant(string $cityId): void
    {
        $city = new City();
        $city->forceFill([
            'id' => $cityId,
            'slug' => 'city-' . substr($cityId, -2),
        ]);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', 'test');
    }
}

