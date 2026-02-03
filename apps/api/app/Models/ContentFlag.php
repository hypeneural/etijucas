<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Moderation\Enums\FlagAction;
use App\Domain\Moderation\Enums\FlagContentType;
use App\Domain\Moderation\Enums\FlagReason;
use App\Domain\Moderation\Enums\FlagStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ContentFlag extends Model
{
    use HasUuids;
    use LogsActivity;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $table = 'content_flags';
    protected static string $logName = 'moderation';

    protected $attributes = [
        'status' => FlagStatus::Open->value,
        'action' => FlagAction::None->value,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'content_type',
        'content_id',
        'reported_by',
        'reason',
        'message',
        'status',
        'handled_by',
        'handled_at',
        'action',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content_type' => FlagContentType::class,
            'reason' => FlagReason::class,
            'status' => FlagStatus::class,
            'action' => FlagAction::class,
            'handled_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function markReviewing(User $actor): void
    {
        $this->update([
            'status' => FlagStatus::Reviewing,
            'handled_by' => $actor->id,
            'handled_at' => now(),
        ]);
    }

    public function markDismissed(User $actor): void
    {
        $this->update([
            'status' => FlagStatus::Dismissed,
            'handled_by' => $actor->id,
            'handled_at' => now(),
            'action' => FlagAction::None,
        ]);
    }

    public function markActionTaken(User $actor, ?FlagAction $action = null): void
    {
        $this->update([
            'status' => FlagStatus::ActionTaken,
            'handled_by' => $actor->id,
            'handled_at' => now(),
            'action' => $action ?? FlagAction::None,
        ]);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'content_type',
                'content_id',
                'reported_by',
                'reason',
                'message',
                'status',
                'handled_by',
                'handled_at',
                'action',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
