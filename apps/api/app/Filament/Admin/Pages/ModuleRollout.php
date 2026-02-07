<?php

declare(strict_types=1);

namespace App\Filament\Admin\Pages;

use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Artisan;

class ModuleRollout extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-bolt';

    protected static ?string $navigationLabel = 'Rollout de Modulos';

    protected static ?string $navigationGroup = 'Sistema & Auditoria';

    protected static ?int $navigationSort = 74;

    protected static string $view = 'filament.admin.pages.module-rollout';

    public string $module = '';

    public string $state = 'on';

    public string $cities = '';

    public string $except = '';

    public bool $dryRun = true;

    public string $rollbackId = '';

    public string $output = '';

    public static function canAccess(): bool
    {
        return auth()->user()?->can('page_ModuleRollout') ?? false;
    }

    public function runRollout(): void
    {
        if (trim($this->module) === '') {
            Notification::make()
                ->title('Informe o modulo')
                ->warning()
                ->send();
            return;
        }

        $params = [
            'module' => trim($this->module),
            'state' => $this->state === 'off' ? 'off' : 'on',
            '--dry-run' => $this->dryRun,
            '--cities' => $this->parseCsv($this->cities),
            '--except' => $this->parseCsv($this->except),
        ];

        Artisan::call('modules:rollout', $params);
        $this->output = trim(Artisan::output());

        Notification::make()
            ->title('Comando executado')
            ->body($this->dryRun ? 'Dry-run concluido.' : 'Rollout aplicado.')
            ->success()
            ->send();
    }

    public function runRollback(): void
    {
        if (trim($this->rollbackId) === '') {
            Notification::make()
                ->title('Informe o rollout_id')
                ->warning()
                ->send();
            return;
        }

        Artisan::call('modules:rollout', [
            'module' => 'forum',
            'state' => 'off',
            '--rollback' => trim($this->rollbackId),
        ]);

        $this->output = trim(Artisan::output());

        Notification::make()
            ->title('Rollback executado')
            ->success()
            ->send();
    }

    /**
     * @return list<string>
     */
    private function parseCsv(string $raw): array
    {
        $parts = array_map('trim', explode(',', $raw));

        return array_values(array_filter($parts, static fn(string $value): bool => $value !== ''));
    }
}
