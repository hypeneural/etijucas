<?php

namespace App\Jobs;

use App\Models\City;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * BackfillCityId Job
 * 
 * Backfills city_id in all content tables based on:
 * 1. bairro_id -> bairros.city_id (when available)
 * 2. Fallback to Tijucas (when bairro is null)
 */
class BackfillCityId implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const TIJUCAS_IBGE = 4218007;

    /**
     * Tables to backfill (table => has_bairro_id)
     */
    private array $tables = [
        'topics' => true,
        'comments' => false,
        'citizen_reports' => true,
        'events' => false,
        'tourism_spots' => false,
        'alerts' => true,
        'phones' => false,
        'users' => false, // users has separate logic
    ];

    public function handle(): void
    {
        $tijucasId = City::where('ibge_code', self::TIJUCAS_IBGE)->value('id');

        if (!$tijucasId) {
            Log::error('BackfillCityId: Tijucas city not found');
            return;
        }

        Log::info('BackfillCityId: Starting backfill with Tijucas ID: ' . $tijucasId);

        foreach ($this->tables as $table => $hasBairroId) {
            $this->backfillTable($table, $hasBairroId, $tijucasId);
        }

        Log::info('BackfillCityId: Completed');
    }

    private function backfillTable(string $table, bool $hasBairroId, string $tijucasId): void
    {
        // Check if table has city_id column
        if (!$this->columnExists($table, 'city_id')) {
            Log::warning("BackfillCityId: Table {$table} does not have city_id column");
            return;
        }

        $updated = 0;

        // Strategy 1: Backfill via bairro_id if table has it
        if ($hasBairroId && $this->columnExists($table, 'bairro_id')) {
            $updated += DB::statement("
                UPDATE {$table} t
                SET city_id = (
                    SELECT b.city_id 
                    FROM bairros b 
                    WHERE b.id = t.bairro_id
                )
                WHERE t.city_id IS NULL
                AND t.bairro_id IS NOT NULL
            ");
        }

        // Strategy 2: Fallback to Tijucas for remaining nulls
        $fallbackCount = DB::table($table)
            ->whereNull('city_id')
            ->update(['city_id' => $tijucasId]);

        $updated += $fallbackCount;

        Log::info("BackfillCityId: {$table} - {$updated} records updated");
    }

    private function columnExists(string $table, string $column): bool
    {
        try {
            return DB::getSchemaBuilder()->hasColumn($table, $column);
        } catch (\Exception $e) {
            return false;
        }
    }
}
