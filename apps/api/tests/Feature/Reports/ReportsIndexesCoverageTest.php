<?php

namespace Tests\Feature\Reports;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportsIndexesCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_citizen_reports_contains_expected_tenant_composite_indexes(): void
    {
        $indexes = $this->getIndexNames('citizen_reports');

        $this->assertContains('citizen_reports_city_created_idx', $indexes);
        $this->assertContains('citizen_reports_city_status_created_idx', $indexes);
        $this->assertContains('citizen_reports_city_category_created_idx', $indexes);
    }

    /**
     * @return array<int, string>
     */
    private function getIndexNames(string $table): array
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return collect(DB::select("PRAGMA index_list('{$table}')"))
                ->pluck('name')
                ->values()
                ->all();
        }

        if ($driver === 'mysql' || $driver === 'mariadb') {
            return collect(DB::select("SHOW INDEX FROM {$table}"))
                ->pluck('Key_name')
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }
}
