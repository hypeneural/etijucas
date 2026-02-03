<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRestriction;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'moderator']);
        Role::firstOrCreate(['name' => 'user']);
    }

    public function test_admin_can_access_admin_panel(): void
    {
        $admin = User::create([
            'phone' => '48999999990',
            'nome' => 'Admin',
            'email' => 'admin@test.local',
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk();
    }

    public function test_regular_user_cannot_access_admin_panel(): void
    {
        $user = User::create([
            'phone' => '48999999991',
            'nome' => 'User',
            'email' => 'user@test.local',
            'password' => 'password',
        ]);
        $user->assignRole('user');

        $this->actingAs($user)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_moderator_cannot_manage_roles(): void
    {
        $moderator = User::create([
            'phone' => '48999999992',
            'nome' => 'Moderator',
            'email' => 'mod@test.local',
            'password' => 'password',
        ]);
        $moderator->assignRole('moderator');

        $target = User::create([
            'phone' => '48999999993',
            'nome' => 'Target',
            'email' => 'target@test.local',
            'password' => 'password',
        ]);
        $target->assignRole('user');

        $policy = new UserPolicy();

        $this->assertFalse($policy->manageRoles($moderator, $target));
    }

    public function test_restriction_activity_is_logged(): void
    {
        $admin = User::create([
            'phone' => '48999999994',
            'nome' => 'Admin',
            'email' => 'admin2@test.local',
            'password' => 'password',
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $user = User::create([
            'phone' => '48999999995',
            'nome' => 'User',
            'email' => 'user2@test.local',
            'password' => 'password',
        ]);
        $user->assignRole('user');

        $restriction = UserRestriction::create([
            'user_id' => $user->id,
            'type' => 'suspend_login',
            'scope' => 'global',
            'reason' => 'Teste',
            'created_by' => $admin->id,
            'starts_at' => now(),
        ]);

        $this->assertDatabaseHas('activity_log', [
            'subject_type' => UserRestriction::class,
            'subject_id' => $restriction->id,
            'event' => 'created',
        ]);

        $restriction->revoke($admin);

        $this->assertDatabaseHas('activity_log', [
            'subject_type' => UserRestriction::class,
            'subject_id' => $restriction->id,
            'event' => 'updated',
        ]);
    }
}
