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
        'scope_city_id',
        'scope_module_key',
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

    public function scopeCity(): BelongsTo
    {
        return $this->belongsTo(City::class, 'scope_city_id');
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

    public function scopeForModule($query, string $moduleKey)
    {
        $legacyScope = self::legacyScopeForModule($moduleKey);

        return $query->where(function ($scopeQuery) use ($moduleKey, $legacyScope): void {
            $scopeQuery->where('scope', RestrictionScope::Global)
                ->orWhere('scope_module_key', $moduleKey);

            if ($legacyScope !== null) {
                $scopeQuery->orWhere('scope', $legacyScope);
            }
        });
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

    public static function normalizeScopeModuleKey(mixed $scope, ?string $scopeModuleKey): ?string
    {
        $resolvedScope = $scope instanceof RestrictionScope ? $scope : RestrictionScope::tryFrom((string) $scope);

        if ($resolvedScope === RestrictionScope::Global) {
            return null;
        }

        if (is_string($scopeModuleKey) && $scopeModuleKey !== '') {
            return strtolower(trim($scopeModuleKey));
        }

        return match ($resolvedScope) {
            RestrictionScope::Forum => 'forum',
            RestrictionScope::Reports => 'reports',
            RestrictionScope::Uploads => 'forum',
            default => null,
        };
    }

    public static function legacyScopeForModule(string $moduleKey): ?RestrictionScope
    {
        return match ($moduleKey) {
            'forum' => RestrictionScope::Forum,
            'reports' => RestrictionScope::Reports,
            default => null,
        };
    }

    protected static function booted(): void
    {
        static::saving(function (UserRestriction $restriction): void {
            $restriction->scope_module_key = self::normalizeScopeModuleKey(
                $restriction->scope,
                $restriction->scope_module_key
            );

            if ($restriction->scope === RestrictionScope::Global) {
                $restriction->scope_city_id = null;
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'user_id',
                'type',
                'scope',
                'scope_city_id',
                'scope_module_key',
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
