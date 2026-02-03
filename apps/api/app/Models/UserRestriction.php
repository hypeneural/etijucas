<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Domain\Moderation\Enums\RestrictionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class UserRestriction extends Model
{
    use HasUuids;
    use LogsActivity;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $table = 'user_restrictions';
    protected static string $logName = 'moderation';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'scope',
        'reason',
        'created_by',
        'starts_at',
        'ends_at',
        'revoked_at',
        'revoked_by',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => RestrictionType::class,
            'scope' => RestrictionScope::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'revoked_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function scopeActive($query)
    {
        return $query
            ->whereNull('revoked_at')
            ->where(function ($q) {
                $q->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            });
    }

    public function scopeExpired($query)
    {
        return $query
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->whereNull('revoked_at');
    }

    public function scopeRevoked($query)
    {
        return $query->whereNotNull('revoked_at');
    }

    public function isActive(): bool
    {
        if ($this->revoked_at !== null) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->ends_at === null) {
            return true;
        }

        return $this->ends_at->isFuture();
    }

    public function revoke(User $actor): void
    {
        $this->update([
            'revoked_at' => now(),
            'revoked_by' => $actor->id,
        ]);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'user_id',
                'type',
                'scope',
                'reason',
                'created_by',
                'starts_at',
                'ends_at',
                'revoked_at',
                'revoked_by',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
