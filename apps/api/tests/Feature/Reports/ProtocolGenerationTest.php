<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Models\CitizenReport;
use App\Models\City;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProtocolGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_protocol_based_on_city_slug_prefix(): void
    {
        try {
            // City 1: Tijucas -> TIJ
            $city1 = City::create([
                'name' => 'Tijucas',
                'slug' => 'tijucas-sc',
                'uf' => 'SC',
                'ibge_code' => 4218203,
                'status' => 'active',
                'active' => true,
            ]);

            // City 2: Balneário Camboriú -> BAL
            $city2 = City::create([
                'name' => 'Balneário Camboriú',
                'slug' => 'balneario-camboriu',
                'uf' => 'SC',
                'ibge_code' => 4202008,
                'status' => 'active',
                'active' => true,
            ]);

            $user1 = User::create([
                'city_id' => $city1->id,
                'nome' => 'User 1',
                'email' => 'user1@test.com',
                'password' => 'password',
                'phone' => '11999991111',
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]);

            $user2 = User::create([
                'city_id' => $city2->id,
                'nome' => 'User 2',
                'email' => 'user2@test.com',
                'password' => 'password',
                'phone' => '11999992222',
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]);

            // Mock Tenant Context for City 1
            $this->mockTenant($city1);

            $report1 = CitizenReport::create([
                'user_id' => $user1->id,
                'city_id' => $city1->id,
                'description' => 'Test Report 1',
                'status' => 'recebido', // Assuming default status
                'category_id' => \App\Domains\Reports\Models\ReportCategory::create(['name' => 'General', 'color' => '#000', 'icon' => 'test-icon'])->id,
                'title' => 'Report Title',
            ]);

            $this->assertTrue(str_starts_with($report1->protocol, 'TIJ-'), "Protocol {$report1->protocol} should start with TIJ-");

            // Switch Tenant Context for City 2
            $this->mockTenant($city2);

            $report2 = CitizenReport::create([
                'user_id' => $user2->id,
                'city_id' => $city2->id,
                'description' => 'Test Report 2',
                'status' => 'recebido',
                'category_id' => $report1->category_id,
                'title' => 'Report Title 2',
            ]);

            $this->assertTrue(str_starts_with($report2->protocol, 'BAL-'), "Protocol {$report2->protocol} should start with BAL-");
        } catch (\Throwable $e) {
            dump($e->getMessage());
            throw $e;
        }
    }

    public function test_increments_sequence_per_city_independent_of_others(): void
    {
        try {
            $cityA = City::create([
                'slug' => 'alpha-city',
                'name' => 'Alpha',
                'uf' => 'SC',
                'ibge_code' => 10,
                'status' => 'active',
                'active' => true
            ]); // ALP

            $cityB = City::create([
                'slug' => 'beta-city',
                'name' => 'Beta',
                'uf' => 'SC',
                'ibge_code' => 20,
                'status' => 'active',
                'active' => true
            ]);  // BET

            $userA = User::create([
                'city_id' => $cityA->id,
                'nome' => 'User A',
                'email' => 'a@test.com',
                'password' => 'p',
                'phone' => '11999993333',
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]);

            $userB = User::create([
                'city_id' => $cityB->id,
                'nome' => 'User B',
                'email' => 'b@test.com',
                'password' => 'p',
                'phone' => '11999994444',
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]);

            $catId = \App\Domains\Reports\Models\ReportCategory::create(['name' => 'G', 'color' => '#000', 'icon' => 'test-icon'])->id;

            // Create 2 reports for City A
            $this->mockTenant($cityA);
            $r1 = CitizenReport::create(['user_id' => $userA->id, 'city_id' => $cityA->id, 'description' => 'A1', 'category_id' => $catId, 'title' => 'T1', 'status' => 'recebido']);
            $r2 = CitizenReport::create(['user_id' => $userA->id, 'city_id' => $cityA->id, 'description' => 'A2', 'category_id' => $catId, 'title' => 'T2', 'status' => 'recebido']);

            // Create 1 report for City B
            $this->mockTenant($cityB);
            $r3 = CitizenReport::create(['user_id' => $userB->id, 'city_id' => $cityB->id, 'description' => 'B1', 'category_id' => $catId, 'title' => 'T3', 'status' => 'recebido']);

            // Check sequences
            // ALP-2026-000001
            // ALP-2026-000002
            // BET-2026-000001

            $this->assertStringEndsWith('000001', $r1->protocol);
            $this->assertStringEndsWith('000002', $r2->protocol);
            $this->assertStringEndsWith('000001', $r3->protocol);
        } catch (\Throwable $e) {
            dump($e->getMessage());
            throw $e;
        }
    }

    protected function mockTenant(City $city)
    {
        app()->instance('tenant.city', $city);
        app()->instance('tenant.city_id', $city->id);
        // Also might need to bind Tenant facade logic if it's complex, 
        // but typically instance binding is enough for simple lookups.
    }
}
