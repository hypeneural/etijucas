<?php

namespace App\Jobs;

use App\Models\AddressMismatchAgg;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * LogAddressMismatch
 * 
 * Job to log unmatched bairro names asynchronously.
 * Uses aggregation to avoid overwhelming the database.
 */
class LogAddressMismatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $cityId,
        public string $bairroTextKey,
        public string $bairroTextExample,
        public string $provider = 'viacep',
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Use upsert pattern for aggregation
            $existing = AddressMismatchAgg::where('city_id', $this->cityId)
                ->where('bairro_text_key', $this->bairroTextKey)
                ->where('provider', $this->provider)
                ->first();

            if ($existing) {
                $existing->increment('count');
                $existing->update(['last_seen_at' => now()]);
            } else {
                AddressMismatchAgg::create([
                    'city_id' => $this->cityId,
                    'bairro_text_key' => $this->bairroTextKey,
                    'bairro_text_example' => $this->bairroTextExample,
                    'provider' => $this->provider,
                    'count' => 1,
                    'last_seen_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to log address mismatch', [
                'city_id' => $this->cityId,
                'bairro_text_key' => $this->bairroTextKey,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
