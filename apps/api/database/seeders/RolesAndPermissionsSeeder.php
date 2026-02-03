<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Topics (Forum)
            'topics.create',
            'topics.update.own',
            'topics.delete.own',
            'topics.moderate',
            // Comments
            'comments.create',
            'comments.delete.own',
            'comments.moderate',
            // Reports (Denuncias)
            'reports.create',
            'reports.delete.own',
            'reports.status.update',
            // Admin Content
            'events.manage',
            'phones.manage',
            'trash.manage',
            'masses.manage',
            'alerts.manage',
            'users.manage',
            'bairros.manage',
            // Moderacao
            'flags.manage',
            'restrictions.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // User Role - Basic permissions
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $userRole->syncPermissions([
            'topics.create',
            'topics.update.own',
            'topics.delete.own',
            'comments.create',
            'comments.delete.own',
            'reports.create',
            'reports.delete.own',
        ]);

        // Moderator Role - User permissions + moderation
        $moderatorRole = Role::firstOrCreate(['name' => 'moderator']);
        $moderatorBasePermissions = [
            // Inherited from user
            'topics.create',
            'topics.update.own',
            'topics.delete.own',
            'comments.create',
            'comments.delete.own',
            'reports.create',
            'reports.delete.own',
            // Moderation permissions
            'topics.moderate',
            'comments.moderate',
            'reports.status.update',
            'alerts.manage',
            'flags.manage',
            'restrictions.manage',
        ];

        $filamentPermissions = [
            // Users
            'view_any_user',
            'view_user',
            'update_user',
            // Bairros
            'view_any_bairro',
            'view_bairro',
            // Restrictions
            'view_any_user_restriction',
            'view_user_restriction',
            'create_user_restriction',
            'update_user_restriction',
            // Flags
            'view_any_content_flag',
            'view_content_flag',
            'update_content_flag',
            // Activity log
            'view_any_activity_log',
            'view_activity_log',
            // Moderation queue page
            'page_moderation_queue',
        ];

        $availableFilamentPermissions = Permission::query()
            ->whereIn('name', $filamentPermissions)
            ->pluck('name')
            ->all();

        $moderatorRole->syncPermissions(array_unique(array_merge(
            $moderatorBasePermissions,
            $availableFilamentPermissions
        )));

        // Admin Role - All permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());

        $this->command->info('Roles and permissions seeded successfully!');
        $this->command->table(
            ['Role', 'Permissions'],
            [
                ['user', $userRole->permissions->pluck('name')->join(', ')],
                ['moderator', $moderatorRole->permissions->pluck('name')->join(', ')],
                ['admin', 'All permissions'],
            ]
        );
    }
}
