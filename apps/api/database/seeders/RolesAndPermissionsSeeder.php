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
            'tourism.manage',
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
            'view_any_user::restriction',
            'view_user::restriction',
            'create_user::restriction',
            'update_user::restriction',
            // Flags
            'view_any_content::flag',
            'view_content::flag',
            'update_content::flag',
            // Topic Reports
            'view_any_topic::report',
            'view_topic::report',
            'update_topic::report',
            // Comment Reports
            'view_any_comment::report',
            'view_comment::report',
            'update_comment::report',
            // Comments
            'view_any_comment',
            'view_comment',
            'update_comment',
            'delete_comment',
            // Activity log
            'view_any_activity::log',
            'view_activity::log',
            // Moderation queue page
            'page_moderation_queue',
            'page_reports_dashboard',
            'page_geo_issues',
            // Citizen Reports
            'view_any_citizen::report',
            'view_citizen::report',
            'update_citizen::report',
            // Report Categories
            'view_any_report::category',
            'view_report::category',
        ];

        $availableFilamentPermissions = Permission::query()
            ->whereIn('name', $filamentPermissions)
            ->pluck('name')
            ->all();

        $moderatorRole->syncPermissions(array_unique(array_merge(
            $moderatorBasePermissions,
            $availableFilamentPermissions
        )));

        // Operator Role - Content operations
        $operatorRole = Role::firstOrCreate(['name' => 'operator']);
        $operatorBasePermissions = [
            'events.manage',
            'tourism.manage',
            'phones.manage',
            'bairros.manage',
        ];

        $operatorFilamentPermissions = [
            // Bairros
            'view_any_bairro',
            'view_bairro',
            'create_bairro',
            'update_bairro',
            'delete_bairro',
            // Phones
            'view_any_phone',
            'view_phone',
            'create_phone',
            'update_phone',
            'delete_phone',
            // Event Categories
            'view_any_event::category',
            'view_event::category',
            'create_event::category',
            'update_event::category',
            'delete_event::category',
            // Tags
            'view_any_tag',
            'view_tag',
            'create_tag',
            'update_tag',
            'delete_tag',
            // Venues
            'view_any_venue',
            'view_venue',
            'create_venue',
            'update_venue',
            'delete_venue',
            // Events
            'view_any_event',
            'view_event',
            'create_event',
            'update_event',
            'delete_event',
            // Tourism Spots
            'view_any_tourism::spot',
            'view_tourism::spot',
            'create_tourism::spot',
            'update_tourism::spot',
            'delete_tourism::spot',
            // Tourism Reviews
            'view_any_tourism::review',
            'view_tourism::review',
            'update_tourism::review',
            'delete_tourism::review',
            // Organizers
            'view_any_organizer',
            'view_organizer',
            'create_organizer',
            'update_organizer',
            'delete_organizer',
            // Event RSVPs
            'view_any_event::rsvp',
            'view_event::rsvp',
            'update_event::rsvp',
            'delete_event::rsvp',
        ];

        $availableOperatorFilamentPermissions = Permission::query()
            ->whereIn('name', $operatorFilamentPermissions)
            ->pluck('name')
            ->all();

        $operatorRole->syncPermissions(array_unique(array_merge(
            $operatorBasePermissions,
            $availableOperatorFilamentPermissions
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
                ['operator', $operatorRole->permissions->pluck('name')->join(', ')],
                ['admin', 'All permissions'],
            ]
        );
    }
}
