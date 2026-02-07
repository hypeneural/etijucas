<?php

namespace App\Console\Commands;

use App\Models\TenantIncident;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TenancyIncidentsSummaryCommand extends Command
{
    protected $signature = 'tenancy:incidents:summary
        {--minutes=60 : Time window in minutes}
        {--severity= : Filter by severity (warning|critical)}';

    protected $description = 'Summarize tenancy incidents grouped by city and incident type.';

    public function handle(): int
    {
        $minutes = max(1, (int) $this->option('minutes'));
        $severity = $this->option('severity');

        $query = TenantIncident::query()
            ->leftJoin('cities', 'cities.id', '=', 'tenant_incidents.city_id')
            ->where('tenant_incidents.created_at', '>=', now()->subMinutes($minutes))
            ->selectRaw(
                "COALESCE(cities.slug, 'global') AS city_slug, tenant_incidents.type, tenant_incidents.severity, COUNT(*) AS total"
            )
            ->groupBy('city_slug', 'tenant_incidents.type', 'tenant_incidents.severity')
            ->orderByDesc(DB::raw('COUNT(*)'));

        if (is_string($severity) && $severity !== '') {
            $query->where('tenant_incidents.severity', $severity);
        }

        $rows = $query->get();

        if ($rows->isEmpty()) {
            $this->info("No tenancy incidents in the last {$minutes} minute(s).");
            return self::SUCCESS;
        }

        $this->table(
            ['city', 'type', 'severity', 'count'],
            $rows->map(static fn($row) => [
                $row->city_slug,
                $row->type,
                $row->severity,
                (int) $row->total,
            ])->all()
        );

        return self::SUCCESS;
    }
}
