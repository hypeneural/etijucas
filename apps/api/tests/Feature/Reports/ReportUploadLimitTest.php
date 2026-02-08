<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Http\Middleware\ModuleEnabled;
use App\Http\Middleware\RequireTenant;
use App\Http\Middleware\TenantContext;
use App\Models\City;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportUploadLimitTest extends TestCase
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

        $this->city = City::create([
            'ibge_code' => 4218203,
            'name' => 'Tijucas',
            'uf' => 'SC',
            'slug' => 'tijucas-sc',
            'status' => 'active',
            'active' => true,
            'timezone' => 'America/Sao_Paulo',
        ]);

        app()->instance('tenant.city', $this->city);
    }

    public function test_create_report_rejects_image_larger_than_8mb(): void
    {
        $user = $this->createAuthenticatedUser('upload-limit-reject@test.local');
        $category = $this->createCategory();

        $response = $this->withHeaders($this->tenantHeaders('33333333-3333-4333-8333-333333333333'))
            ->post('/api/v1/reports', [
                'categoryId' => $category->id,
                'title' => 'Buraco profundo na avenida central',
                'description' => 'Descricao de teste para validar limite de upload.',
                'addressSource' => 'manual',
                'locationQuality' => 'manual',
                'images' => [
                    UploadedFile::fake()->image('oversized.jpg', 3000, 3000)->size(9000),
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['images.0']);

        $this->assertSame(0, CitizenReport::count());
    }

    public function test_create_report_accepts_image_up_to_8mb(): void
    {
        $user = $this->createAuthenticatedUser('upload-limit-accept@test.local');
        $category = $this->createCategory();

        $response = $this->withHeaders($this->tenantHeaders('44444444-4444-4444-8444-444444444444'))
            ->post('/api/v1/reports', [
                'categoryId' => $category->id,
                'title' => 'Iluminacao publica com defeito',
                'description' => 'Descricao de teste para upload dentro do limite.',
                'addressSource' => 'manual',
                'locationQuality' => 'manual',
                'images' => [
                    UploadedFile::fake()->image('within-limit.jpg', 2048, 1536)->size(7900),
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $report = CitizenReport::first();
        $this->assertNotNull($report);
        $this->assertSame(1, $report->getMedia('report_images')->count());
    }

    public function test_add_media_rejects_image_larger_than_8mb(): void
    {
        $user = $this->createAuthenticatedUser('upload-limit-media@test.local');
        $category = $this->createCategory();

        $report = CitizenReport::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Teste add media',
            'description' => 'Descricao de teste',
            'status' => ReportStatus::Recebido,
            'address_source' => 'manual',
            'location_quality' => 'manual',
        ]);

        $response = $this->withHeaders($this->tenantHeaders('55555555-5555-4555-8555-555555555555'))
            ->post("/api/v1/reports/{$report->id}/media", [
                'images' => [
                    UploadedFile::fake()->image('too-big-media.jpg', 3000, 3000)->size(9000),
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['images.0']);

        $report->refresh();
        $this->assertSame(0, $report->getMedia('report_images')->count());
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeaders(string $idempotencyKey): array
    {
        return [
            'X-City' => $this->city->slug,
            'X-Idempotency-Key' => $idempotencyKey,
            'Accept' => 'application/json',
        ];
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

    private function createAuthenticatedUser(string $email): User
    {
        $user = User::create([
            'city_id' => $this->city->id,
            'phone' => '4899999' . random_int(1000, 9999),
            'nome' => 'Usuario Upload Teste',
            'email' => $email,
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        Sanctum::actingAs($user);

        return $user;
    }
}
