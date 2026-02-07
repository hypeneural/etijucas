<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\City;
use App\Models\CityModule;
use App\Models\Module;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

class ModulesRolloutCommand extends Command
{
    protected $signature = 'modules:rollout
        {module : Module key or legacy identifier}
        {state : on|off}
        {--cities=* : Restrict rollout to these city slugs}
        {--except=* : Exclude city slugs from rollout}
        {--dry-run : Simulate rollout without persisting}
        {--rollout-id= : Custom rollout identifier}
        {--rollback= : Rollback a previous rollout_id}';

    protected $description = 'Rollout module activation state for multiple cities with audit and rollback support.';

    public function handle(): int
    {
        $rollbackId = $this->option('rollback');
        if (is_string($rollbackId) && $rollbackId !== '') {
            return $this->rollback($rollbackId);
        }

        $moduleIdentifier = (string) $this->argument('module');
        $state = strtolower((string) $this->argument('state'));
        $enable = match ($state) {
            'on' => true,
            'off' => false,
            default => null,
        };

        if ($enable === null) {
            $this->error('State must be "on" or "off".');
            return self::FAILURE;
        }

        $module = Module::findByIdentifier($moduleIdentifier);
        if (!$module) {
            $this->error("Module not found: {$moduleIdentifier}");
            return self::FAILURE;
        }

        $targetCities = $this->resolveTargetCities();
        if ($targetCities->isEmpty()) {
            $this->warn('No target cities matched the filters.');
            return self::SUCCESS;
        }

        $plan = $this->buildPlan($targetCities, $module, $enable);

        $this->table(
            ['city', 'module', 'current_enabled', 'next_enabled', 'will_change'],
            $plan->map(fn(array $item) => [
                $item['city_slug'],
                $module->module_key,
                $item['previous_enabled'] === null ? 'none' : ($item['previous_enabled'] ? 'on' : 'off'),
                $item['next_enabled'] ? 'on' : 'off',
                $item['will_change'] ? 'yes' : 'no',
            ])->all()
        );

        if ($this->option('dry-run')) {
            $this->info('Dry-run complete. No changes persisted.');
            return self::SUCCESS;
        }

        $rolloutId = (string) ($this->option('rollout-id') ?: Str::uuid());
        DB::transaction(function () use ($plan, $module, $rolloutId): void {
            foreach ($plan as $item) {
                CityModule::query()->updateOrCreate(
                    [
                        'city_id' => $item['city_id'],
                        'module_id' => $module->id,
                    ],
                    [
                        'enabled' => $item['next_enabled'],
                        'version' => 1,
                    ]
                );
            }

            $this->audit('modules_rollout_executed', [
                'rollout_id' => $rolloutId,
                'module_id' => $module->id,
                'module_key' => $module->module_key,
                'changes' => $plan->all(),
                'total' => $plan->count(),
            ]);
        });

        $this->info("Rollout applied. rollout_id={$rolloutId}");

        return self::SUCCESS;
    }

    /**
     * @return Collection<int, City>
     */
    private function resolveTargetCities(): Collection
    {
        $cities = City::query()->where('active', true);
        $includeSlugs = array_values(array_filter((array) $this->option('cities')));
        $excludeSlugs = array_values(array_filter((array) $this->option('except')));

        if ($includeSlugs !== []) {
            $cities->whereIn('slug', $includeSlugs);
        }

        if ($excludeSlugs !== []) {
            $cities->whereNotIn('slug', $excludeSlugs);
        }

        return $cities->orderBy('slug')->get();
    }

    /**
     * @param Collection<int, City> $cities
     * @return Collection<int, array{
     *   city_id: string,
     *   city_slug: string,
     *   previous_exists: bool,
     *   previous_enabled: ?bool,
     *   next_enabled: bool,
     *   will_change: bool
     * }>
     */
    private function buildPlan(Collection $cities, Module $module, bool $enable): Collection
    {
        $existing = CityModule::query()
            ->where('module_id', $module->id)
            ->whereIn('city_id', $cities->pluck('id'))
            ->get()
            ->keyBy('city_id');

        return $cities->map(function (City $city) use ($existing, $enable): array {
            /** @var CityModule|null $current */
            $current = $existing->get($city->id);

            $previousEnabled = $current ? (bool) $current->enabled : null;
            $nextEnabled = $enable;

            return [
                'city_id' => $city->id,
                'city_slug' => $city->slug,
                'previous_exists' => $current !== null,
                'previous_enabled' => $previousEnabled,
                'next_enabled' => $nextEnabled,
                'will_change' => $previousEnabled !== $nextEnabled || $current === null,
            ];
        });
    }

    private function rollback(string $rolloutId): int
    {
        $activity = Activity::query()
            ->where('event', 'modules_rollout_executed')
            ->whereJsonContains('properties->rollout_id', $rolloutId)
            ->latest('created_at')
            ->first();

        if (!$activity) {
            $this->error("No rollout found for rollout_id={$rolloutId}");
            return self::FAILURE;
        }

        $properties = $activity->properties?->toArray() ?? [];
        $moduleId = $properties['module_id'] ?? null;
        $changes = $properties['changes'] ?? [];

        if (!is_string($moduleId) || !is_array($changes)) {
            $this->error('Rollout payload is invalid, rollback aborted.');
            return self::FAILURE;
        }

        DB::transaction(function () use ($changes, $moduleId, $rolloutId): void {
            foreach ($changes as $item) {
                $cityId = $item['city_id'] ?? null;
                $previousExists = (bool) ($item['previous_exists'] ?? false);
                $previousEnabled = $item['previous_enabled'] ?? null;

                if (!is_string($cityId) || $cityId === '') {
                    continue;
                }

                if (!$previousExists) {
                    CityModule::query()
                        ->where('city_id', $cityId)
                        ->where('module_id', $moduleId)
                        ->delete();
                    continue;
                }

                CityModule::query()->updateOrCreate(
                    [
                        'city_id' => $cityId,
                        'module_id' => $moduleId,
                    ],
                    [
                        'enabled' => (bool) $previousEnabled,
                        'version' => 1,
                    ]
                );
            }

            $this->audit('modules_rollout_rollback', [
                'rollback_of' => $rolloutId,
                'changes' => $changes,
                'total' => count($changes),
            ]);
        });

        $this->info("Rollback completed for rollout_id={$rolloutId}");

        return self::SUCCESS;
    }

    private function audit(string $event, array $properties): void
    {
        if (!function_exists('activity')) {
            return;
        }

        activity('modules_rollout')
            ->causedBy(auth()->user())
            ->withProperties($properties)
            ->event($event)
            ->log($event);
    }
}
