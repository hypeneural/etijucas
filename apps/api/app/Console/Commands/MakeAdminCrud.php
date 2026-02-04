<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class MakeAdminCrud extends Command
{
    protected $signature = 'make:admin-crud
        {name : Model class name (e.g. CitizenReport)}
        {--domain= : Domain name (e.g. Reports)}
        {--model= : Fully-qualified model class}
        {--panel=admin : Filament panel id}
        {--media= : Media collection name}
        {--soft-deletes : Hint that model uses SoftDeletes}
        {--no-shield : Skip shield:generate}
        {--no-policy : Skip policy generation}';

    protected $description = 'Scaffold Filament Admin CRUD with policy + shield and register policy.';

    public function handle(): int
    {
        $name = Str::studly($this->argument('name'));
        $panel = (string) $this->option('panel');
        $domain = $this->option('domain');
        $modelOption = $this->option('model');
        $modelFqn = $modelOption ?: $this->resolveModelFqn($name, $domain);

        $this->info("Model: {$modelFqn}");
        $this->info("Panel: {$panel}");

        $this->runFilamentResource($name, $modelFqn, $panel);

        if (! $this->option('no-policy')) {
            $this->runPolicy($name, $modelFqn);
            $this->registerPolicy($modelFqn, "App\\Policies\\{$name}Policy");
        }

        if (! $this->option('no-shield')) {
            $this->runShield("{$name}Resource", $panel);
        }

        $media = $this->option('media');
        if ($media) {
            $this->warn("Media collection '{$media}' not wired. Use HasMediaLibraryTrait in the Resource form.");
        }

        if ($this->option('soft-deletes')) {
            $this->warn('Soft deletes enabled: ensure the model uses SoftDeletes.');
        }

        $this->info('Admin CRUD scaffolding complete.');

        return self::SUCCESS;
    }

    private function resolveModelFqn(string $name, ?string $domain): string
    {
        if ($domain) {
            $domain = Str::studly((string) $domain);
            $domainPath = app_path("Domains/{$domain}/Models/{$name}.php");
            if (file_exists($domainPath)) {
                return "App\\Domains\\{$domain}\\Models\\{$name}";
            }
        }

        $modelPath = app_path("Models/{$name}.php");
        if (file_exists($modelPath)) {
            return "App\\Models\\{$name}";
        }

        return "App\\Models\\{$name}";
    }

    private function runFilamentResource(string $name, string $modelFqn, string $panel): void
    {
        $exit = Artisan::call('make:filament-resource', [
            'name' => $name,
            '--generate' => true,
            '--panel' => $panel,
            '--model' => $modelFqn,
        ]);

        $this->outputCommand('make:filament-resource', $exit);
    }

    private function runPolicy(string $name, string $modelFqn): void
    {
        $exit = Artisan::call('make:policy', [
            'name' => "{$name}Policy",
            '--model' => $modelFqn,
        ]);

        $this->outputCommand('make:policy', $exit);
    }

    private function runShield(string $resource, string $panel): void
    {
        $exit = Artisan::call('shield:generate', [
            '--resource' => $resource,
            '--panel' => $panel,
        ]);

        $this->outputCommand('shield:generate', $exit);
    }

    private function outputCommand(string $command, int $exit): void
    {
        if ($exit !== 0) {
            $this->error("Command failed: {$command}");
            $this->line(Artisan::output());
            return;
        }

        $this->line(Artisan::output());
    }

    private function registerPolicy(string $modelFqn, string $policyFqn): void
    {
        $providerPath = app_path('Providers/AppServiceProvider.php');
        if (! file_exists($providerPath)) {
            $this->warn('AppServiceProvider not found. Register policy manually.');
            return;
        }

        $content = file_get_contents($providerPath);
        if ($content === false) {
            $this->warn('Failed to read AppServiceProvider. Register policy manually.');
            return;
        }

        $modelClass = class_basename($modelFqn);
        $policyClass = class_basename($policyFqn);
        $policyLine = "        Gate::policy({$modelClass}::class, {$policyClass}::class);";

        if (str_contains($content, $policyLine)) {
            return;
        }

        $content = $this->ensureUseStatement($content, $modelFqn);
        $content = $this->ensureUseStatement($content, $policyFqn);

        if (str_contains($content, '// Policies')) {
            $content = preg_replace(
                '/(\\s*\\/\\/ Policies\\s*\\n)/',
                "$1{$policyLine}\n",
                $content,
                1
            ) ?? $content;
        } else {
            $content = preg_replace(
                '/(public function boot\\(\\): void\\s*\\n\\s*\\{\\s*\\n)/',
                "$1{$policyLine}\n",
                $content,
                1
            ) ?? $content;
        }

        file_put_contents($providerPath, $content);
    }

    private function ensureUseStatement(string $content, string $fqn): string
    {
        $useLine = "use {$fqn};";
        if (str_contains($content, $useLine)) {
            return $content;
        }

        $matches = [];
        if (preg_match_all('/^use\\s+[^;]+;$/m', $content, $matches, PREG_OFFSET_CAPTURE) && !empty($matches[0])) {
            $last = end($matches[0]);
            $pos = $last[1] + strlen($last[0]);
            return substr($content, 0, $pos) . "\n{$useLine}" . substr($content, $pos);
        }

        return preg_replace('/^namespace\\s+[^;]+;\\s*\\n/m', "$0\n{$useLine}\n", $content, 1) ?? $content;
    }
}
