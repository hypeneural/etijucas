<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Domains\Reports\Models\ReportStatusHistory;
use App\Http\Middleware\ModuleEnabled;
use App\Http\Middleware\RequireTenant;
use App\Http\Middleware\TenantContext;
use App\Models\City;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicReportsVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private City $city;
    private ReportCategory $category;

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

        $this->category = ReportCategory::create([
            'name' => 'Buraco',
            'slug' => 'buraco',
            'icon' => 'mdi:road-variant',
            'color' => '#ef4444',
            'tips' => ['Inclua ponto de referencia.'],
            'active' => true,
            'sort_order' => 1,
        ]);
    }

    public function test_public_list_returns_only_publicly_visible_reports_and_sanitized_resource(): void
    {
        $resolvedReport = $this->createReport(status: ReportStatus::Resolvido);
        $this->createReport(status: ReportStatus::Recebido);

        $response = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/v1/reports');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $resolvedReport->id)
            ->assertJsonPath('data.0.status', ReportStatus::Resolvido->value)
            ->assertJsonMissingPath('data.0.user')
            ->assertJsonMissingPath('data.0.history.0.note')
            ->assertJsonMissingPath('data.0.history.0.by');
    }

    public function test_non_owner_user_cannot_view_non_public_report_details(): void
    {
        $owner = $this->createUser('owner-visibility@test.local');
        $viewer = $this->createUser('viewer-visibility@test.local');
        $receivedReport = $this->createReport(status: ReportStatus::Recebido, user: $owner);

        Sanctum::actingAs($viewer);

        $response = $this->withHeaders($this->tenantHeaders())
            ->getJson("/api/v1/reports/{$receivedReport->id}");

        $response->assertNotFound();
    }

    public function test_owner_can_view_non_public_report_with_private_payload(): void
    {
        $owner = $this->createUser('owner@test.local');
        $report = $this->createReport(
            status: ReportStatus::Recebido,
            user: $owner,
            title: 'Poste sem luz'
        );

        ReportStatusHistory::create([
            'report_id' => $report->id,
            'status' => ReportStatus::EmAnalise->value,
            'note' => 'Internal moderation note',
            'created_by' => $owner->id,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->withHeaders($this->tenantHeaders())
            ->getJson("/api/v1/reports/{$report->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $report->id);

        $historyNotes = collect($response->json('data.history'))
            ->pluck('note')
            ->filter()
            ->values()
            ->all();

        $this->assertContains('Internal moderation note', $historyNotes);
    }

    public function test_public_map_returns_only_publicly_visible_reports(): void
    {
        $visible = $this->createReport(
            status: ReportStatus::Resolvido,
            title: 'Bueiro resolvido',
            latitude: -27.2400,
            longitude: -48.6300,
            addressText: 'Rua A, Centro, Tijucas, SC'
        );

        $this->createReport(
            status: ReportStatus::Recebido,
            title: 'Novo problema ainda pendente',
            latitude: -27.2390,
            longitude: -48.6310,
            addressText: 'Rua B, Centro, Tijucas, SC'
        );

        $response = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/v1/reports/map?bbox=-90,-180,90,180&zoom=12&limit=200');

        $response->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('reports.0.id', $visible->id)
            ->assertJsonPath('reports.0.status', ReportStatus::Resolvido->value)
            ->assertJsonPath('reports.0.address', 'Rua A, Centro, Tijucas, SC');
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeaders(): array
    {
        return ['X-City' => $this->city->slug];
    }

    private function createUser(string $email): User
    {
        return User::create([
            'city_id' => $this->city->id,
            'phone' => '48999' . random_int(10000, 99999),
            'nome' => 'Usuario Teste',
            'email' => $email,
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);
    }

    private function createReport(
        ReportStatus $status,
        ?User $user = null,
        string $title = 'Denuncia teste',
        ?float $latitude = null,
        ?float $longitude = null,
        ?string $addressText = null
    ): CitizenReport {
        $reportUser = $user ?? $this->createUser('user-' . uniqid() . '@test.local');

        return CitizenReport::create([
            'user_id' => $reportUser->id,
            'category_id' => $this->category->id,
            'title' => $title,
            'description' => 'Descricao de teste',
            'status' => $status,
            'address_source' => 'manual',
            'location_quality' => 'manual',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'address_text' => $addressText,
        ]);
    }
}
