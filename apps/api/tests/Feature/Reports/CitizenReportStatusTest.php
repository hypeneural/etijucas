<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Enums\ReportStatus;
use App\Domains\Reports\Models\CitizenReport;
use App\Domains\Reports\Models\ReportCategory;
use App\Models\City;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CitizenReportStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_status_creates_history_and_sets_resolved_at(): void
    {
        $city = City::create([
            'ibge_code' => 4218203,
            'name' => 'Tijucas',
            'uf' => 'SC',
            'slug' => 'tijucas-sc',
            'status' => 'active',
            'active' => true,
            'timezone' => 'America/Sao_Paulo',
        ]);

        app()->instance('tenant.city', $city);

        $user = User::create([
            'city_id' => $city->id,
            'phone' => '48999999996',
            'nome' => 'Reporter',
            'email' => 'reporter@test.local',
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        $category = ReportCategory::create([
            'name' => 'Iluminacao publica',
            'icon' => 'lightbulb',
            'color' => '#f59e0b',
        ]);

        $report = CitizenReport::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'status' => ReportStatus::Recebido,
            'title' => 'Poste apagado',
            'description' => 'Poste da rua principal esta apagado ha dias.',
        ]);

        $report->updateStatus(ReportStatus::EmAnalise, 'Em triagem', $user->id);

        $this->assertDatabaseHas('citizen_reports', [
            'id' => $report->id,
            'status' => ReportStatus::EmAnalise->value,
        ]);

        $this->assertDatabaseHas('report_status_history', [
            'report_id' => $report->id,
            'status' => ReportStatus::EmAnalise->value,
            'note' => 'Em triagem',
            'created_by' => $user->id,
        ]);

        $report->updateStatus(ReportStatus::Resolvido, null, $user->id);
        $report->refresh();

        $this->assertNotNull($report->resolved_at);
    }
}
