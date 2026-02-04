<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
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
            // Widgets (Filament)
            'widget_VotesOverviewStats',
            'widget_VotesEngagementStats',
            'widget_VotesByYearChart',
            // Filament Votacoes
            'view_any_votacao',
            'view_votacao',
            'create_votacao',
            'update_votacao',
            'delete_votacao',
            // Filament Vereadores
            'view_any_vereador',
            'view_vereador',
            'create_vereador',
            'update_vereador',
            'delete_vereador',
            // Filament Partidos
            'view_any_partido',
            'view_partido',
            'create_partido',
            'update_partido',
            'delete_partido',
            // Filament Legislaturas
            'view_any_legislatura',
            'view_legislatura',
            'create_legislatura',
            'update_legislatura',
            'delete_legislatura',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // User Role - Basic permissions
        $userRole = Role::firstOrCreate(['name' => 'user']);
        DB::table('role_has_permissions')->where('role_id', $userRole->id)->delete();
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
        DB::table('role_has_permissions')->where('role_id', $moderatorRole->id)->delete();
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
            'page_Dashboard',
            'page_ModerationQueue',
            'page_ReportsDashboard',
            'page_GeoIssues',
            // Widgets
            'widget_AdminOverviewStats',
            'widget_ReportsOverviewStats',
            'widget_VotesOverviewStats',
            'widget_VotesEngagementStats',
            'widget_VotesByYearChart',
            // Citizen Reports
            'view_any_citizen::report',
            'view_citizen::report',
            'update_citizen::report',
            // Report Categories
            'view_any_report::category',
            'view_report::category',
            // Votacoes & Vereadores (read-only for moderator)
            'view_any_votacao',
            'view_votacao',
            'view_any_vereador',
            'view_vereador',
            // Partidos (read-only for moderator)
            'view_any_partido',
            'view_partido',
            // Legislaturas (read-only for moderator)
            'view_any_legislatura',
            'view_legislatura',
        ];

        $availableFilamentPermissions = Permission::query()
            ->whereIn('name', $filamentPermissions)
            ->pluck('name')
            ->all();

        $moderatorRole->syncPermissions(array_unique(array_merge(
            $moderatorBasePermissions,
            $availableFilamentPermissions
        )));

        // Remove legacy operator role (roles suportados: admin, moderator, user)
        Role::where('name', 'operator')->delete();

        // Admin Role - All permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        DB::table('role_has_permissions')->where('role_id', $adminRole->id)->delete();
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
