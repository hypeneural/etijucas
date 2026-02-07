<?php

namespace App\Jobs;

use App\Jobs\Contracts\TenantAwareJob as TenantAwareJobContract;
use App\Jobs\Middleware\EnsureTenantContext;
use App\Models\AddressMismatchAgg;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LogAddressMismatch
 * 
 * Job to log unmatched bairro names asynchronously.
 * Uses aggregation to avoid overwhelming the database.
 */
class LogAddressMismatch implements ShouldQueue, TenantAwareJobContract
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $traceId;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $cityId,
        public string $bairroTextKey,
        public string $bairroTextExample,
        public string $provider = 'viacep',
        public string $moduleKey = 'reports',
        ?string $traceId = null,
    ) {
        $this->traceId = is_string($traceId) && trim($traceId) !== ''
            ? $traceId
            : (string) Str::uuid();
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
                'module_key' => $this->moduleKey,
                'trace_id' => $this->traceId,
                'bairro_text_key' => $this->bairroTextKey,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [new EnsureTenantContext()];
    }

    public function tenantCityId(): ?string
    {
        return $this->cityId;
    }

    public function tenantModuleKey(): ?string
    {
        return $this->moduleKey;
    }

    public function tenantTraceId(): ?string
    {
        return $this->traceId;
    }
}
