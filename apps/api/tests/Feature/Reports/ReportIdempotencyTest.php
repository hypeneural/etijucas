<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Models\City;
use App\Models\CityModule;
use App\Models\Module;
use App\Models\User;
use App\Http\Middleware\ModuleEnabled;
use App\Http\Middleware\RequireTenant;
use App\Http\Middleware\TenantContext;
use App\Services\ModuleResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private City $city;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            ThrottleRequests::class,
            ThrottleRequestsWithRedis::class,
            TenantContext::class,
            RequireTenant::class,
            ModuleEnabled::class,
        ]);
        $this->city = $this->createTenantCity();
        app()->instance('tenant.city', $this->city);
        $this->enableReportsModuleForCity($this->city);
    }

    public function test_same_idempotency_key_and_payload_returns_replay_without_creating_duplicate(): void
    {
        $user = $this->createAuthenticatedUser($this->city);
        $category = $this->createCategory();
        $idempotencyKey = '11111111-1111-4111-8111-111111111111';

        $payload = [
            'categoryId' => $category->id,
            'title' => 'Buraco grande na via principal',
            'description' => 'Rua com buraco causando risco para motos.',
            'addressSource' => 'manual',
            'locationQuality' => 'manual',
        ];

        $firstResponse = $this->withHeaders($this->tenantHeaders($idempotencyKey))
            ->postJson('/api/v1/reports', $payload);

        $firstResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertHeader('X-Idempotency-Key', $idempotencyKey);

        $protocol = $firstResponse->json('data.protocol');

        $secondResponse = $this->withHeaders($this->tenantHeaders($idempotencyKey))
            ->postJson('/api/v1/reports', $payload);

        $secondResponse->assertCreated()
            ->assertJsonPath('data.protocol', $protocol)
            ->assertHeader('X-Idempotency-Replay', 'true')
            ->assertHeader('X-Idempotency-Key', $idempotencyKey);

        $this->assertSame(1, CitizenReport::count());
    }

    public function test_same_idempotency_key_with_different_payload_returns_conflict(): void
    {
        $user = $this->createAuthenticatedUser($this->city);
        $category = $this->createCategory();
        $idempotencyKey = '22222222-2222-4222-8222-222222222222';

        $firstPayload = [
            'categoryId' => $category->id,
            'title' => 'Luminaria queimada',
            'description' => 'Poste em frente ao mercado sem luz.',
            'addressSource' => 'manual',
            'locationQuality' => 'manual',
        ];

        $secondPayload = [
            'categoryId' => $category->id,
            'title' => 'Semaforo apagado',
            'description' => 'Cruzamento principal sem sinalizacao luminosa.',
            'addressSource' => 'manual',
            'locationQuality' => 'manual',
        ];

        $this->withHeaders($this->tenantHeaders($idempotencyKey))
            ->postJson('/api/v1/reports', $firstPayload)
            ->assertCreated();

        $conflictResponse = $this->withHeaders($this->tenantHeaders($idempotencyKey))
            ->postJson('/api/v1/reports', $secondPayload);

        $conflictResponse->assertStatus(409)
            ->assertJsonPath('code', 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH')
            ->assertHeader('X-Idempotency-Key', $idempotencyKey);

        $this->assertSame(1, CitizenReport::count());
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeaders(string $idempotencyKey): array
    {
        return [
            'X-City' => $this->city->slug,
            'X-Idempotency-Key' => $idempotencyKey,
        ];
    }

    private function createTenantCity(): City
    {
        return City::create([
            'ibge_code' => 4218203,
            'name' => 'Tijucas',
            'uf' => 'SC',
            'slug' => 'tijucas-sc',
            'status' => 'active',
            'active' => true,
            'timezone' => 'America/Sao_Paulo',
        ]);
    }

    private function enableReportsModuleForCity(City $city): void
    {
        $module = Module::create([
            'module_key' => 'reports',
            'slug' => 'denuncias',
            'route_slug_ptbr' => 'denuncias',
            'name' => 'Reports',
            'name_ptbr' => 'Denuncias',
            'description' => 'Modulo de denuncias',
            'icon' => 'megaphone',
            'is_core' => false,
            'current_version' => 1,
            'sort_order' => 1,
        ]);

        CityModule::create([
            'city_id' => $city->id,
            'module_id' => $module->id,
            'enabled' => true,
            'version' => 1,
            'settings' => [],
        ]);

        ModuleResolver::clearCache($city->id);
    }

    private function createCategory(): ReportCategory
    {
        return ReportCategory::create([
            'name' => 'Iluminacao',
            'slug' => 'iluminacao',
            'icon' => 'lightbulb',
            'color' => '#f59e0b',
            'tips' => ['Inclua referencia visual da rua.'],
            'active' => true,
            'sort_order' => 1,
        ]);
    }

    private function createAuthenticatedUser(City $city): User
    {
        $user = User::create([
            'city_id' => $city->id,
            'phone' => '48999990001',
            'nome' => 'Usuario Teste',
            'email' => 'report-idempotency@test.local',
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        Sanctum::actingAs($user);

        return $user;
    }
}
