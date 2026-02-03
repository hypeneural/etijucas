<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'development'])) {
            return;
        }

        $role = Role::firstOrCreate(['name' => 'admin']);

        $user = User::firstOrCreate(
            ['phone' => '48999999999'],
            [
                'nome' => 'Admin Local',
                'email' => 'admin@etijucas.local',
                'password' => 'admin123',
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]
        );

        if (! $user->hasRole('admin')) {
            $user->assignRole($role);
        }
    }
}
