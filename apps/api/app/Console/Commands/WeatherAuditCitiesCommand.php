<?php

namespace App\Console\Commands;

use App\Models\City;
use BackedEnum;
use DateTimeZone;
use Illuminate\Console\Command;

class WeatherAuditCitiesCommand extends Command
{
    protected $signature = 'weather:audit-cities
        {--all : Include non-active cities in audit}';

    protected $description = 'Audit city weather readiness (lat/lon/timezone) for multi-tenancy.';

    public function handle(): int
    {
        $query = City::query()
            ->select(['id', 'name', 'slug', 'uf', 'status', 'active', 'lat', 'lon', 'timezone', 'is_coastal'])
            ->orderBy('slug');

        if (!$this->option('all')) {
            $query->where(function ($inner): void {
                $inner->where('active', true)
                    ->orWhere('status', 'active');
            });
        }

        $cities = $query->get();

        if ($cities->isEmpty()) {
            $this->warn('No cities matched the selected scope.');
            return self::SUCCESS;
        }

        $validTimezones = array_flip(DateTimeZone::listIdentifiers());
        $issues = [];

        foreach ($cities as $city) {
            $missing = [];
            $status = $city->status instanceof BackedEnum
                ? $city->status->value
                : (string) $city->status;

            if ($city->lat === null) {
                $missing[] = 'lat';
            }

            if ($city->lon === null) {
                $missing[] = 'lon';
            }

            if ($city->timezone === null || $city->timezone === '') {
                $missing[] = 'timezone';
            }

            $timezoneValid = $city->timezone !== null
                && $city->timezone !== ''
                && isset($validTimezones[$city->timezone]);

            if (!empty($missing) || !$timezoneValid) {
                $issues[] = [
                    'city' => $city->slug,
                    'status' => $status,
                    'active' => $city->active ? '1' : '0',
                    'missing' => empty($missing) ? '-' : implode(',', $missing),
                    'timezone_valid' => $timezoneValid ? 'yes' : 'no',
                    'is_coastal' => $city->is_coastal ? '1' : '0',
                ];
            }
        }

        if (empty($issues)) {
            $this->info("Audit passed for {$cities->count()} city/cities.");
            return self::SUCCESS;
        }

        $this->error('Audit found cities with incomplete weather data.');
        $this->table(
            ['city', 'status', 'active', 'missing', 'timezone_valid', 'is_coastal'],
            $issues
        );

        return self::FAILURE;
    }
}
