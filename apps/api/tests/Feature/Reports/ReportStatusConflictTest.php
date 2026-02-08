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
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReportStatusConflictTest extends TestCase
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

    public function test_update_status_accepts_current_version_token(): void
    {
        $moderator = $this->createModerator();
        $report = $this->createReport();

        $response = $this->patchJson(
            "/api/v1/reports/{$report->id}/status",
            [
                'status' => ReportStatus::EmAnalise->value,
                'note' => 'Triagem inicial concluida.',
                'version' => $report->updated_at?->toIso8601String(),
            ]
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', ReportStatus::EmAnalise->value);

        $this->assertDatabaseHas('citizen_reports', [
            'id' => $report->id,
            'status' => ReportStatus::EmAnalise->value,
        ]);

        $this->assertDatabaseHas('report_status_history', [
            'report_id' => $report->id,
            'status' => ReportStatus::EmAnalise->value,
            'note' => 'Triagem inicial concluida.',
            'created_by' => $moderator->id,
        ]);
    }

    public function test_update_status_returns_conflict_when_version_is_stale(): void
    {
        $this->createModerator();
        $report = $this->createReport();
        $staleVersion = $report->updated_at?->toIso8601String();

        // Ensure updated_at changes at least one second in environments without sub-second precision.
        usleep(1_100_000);
        $report->updateStatus(ReportStatus::EmAnalise, 'Atualizado por outro moderador.', null);
        $report->refresh();

        $response = $this->patchJson(
            "/api/v1/reports/{$report->id}/status",
            [
                'status' => ReportStatus::Resolvido->value,
                'note' => 'Tentativa com versao antiga.',
                'version' => $staleVersion,
            ]
        );

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'REPORT_STATUS_CONFLICT')
            ->assertJsonPath('data.status', ReportStatus::EmAnalise->value)
            ->assertJsonPath('currentVersion', $report->updated_at?->toIso8601String());

        $report->refresh();
        $this->assertSame(ReportStatus::EmAnalise->value, $report->status->value);
    }

    public function test_update_status_accepts_if_unmodified_since_header_as_version_token(): void
    {
        $this->createModerator();
        $report = $this->createReport();

        $response = $this
            ->withHeader('If-Unmodified-Since', (string) $report->updated_at?->toIso8601String())
            ->patchJson(
                "/api/v1/reports/{$report->id}/status",
                [
                    'status' => ReportStatus::EmAnalise->value,
                    'note' => 'Atualizacao via header.',
                ]
            );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', ReportStatus::EmAnalise->value);
    }

    private function createModerator(): User
    {
        Role::firstOrCreate(['name' => 'moderator', 'guard_name' => 'web']);

        $user = User::create([
            'city_id' => $this->city->id,
            'phone' => '48999990055',
            'nome' => 'Moderador Teste',
            'email' => 'moderator-report-conflict@test.local',
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        $user->assignRole('moderator');
        Sanctum::actingAs($user);

        return $user;
    }

    private function createReport(): CitizenReport
    {
        $category = ReportCategory::create([
            'name' => 'Iluminacao',
            'slug' => 'iluminacao',
            'icon' => 'lightbulb',
            'color' => '#f59e0b',
            'tips' => ['Informar ponto de referencia.'],
            'active' => true,
            'sort_order' => 1,
        ]);

        return CitizenReport::create([
            'user_id' => auth()->id(),
            'category_id' => $category->id,
            'status' => ReportStatus::Recebido,
            'title' => 'Poste sem energia',
            'description' => 'A iluminacao publica da rua esta apagada.',
            'address_source' => 'manual',
            'location_quality' => 'manual',
        ]);
    }
}
