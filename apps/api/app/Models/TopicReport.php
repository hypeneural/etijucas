<?php

namespace App\Models;

use App\Domain\Forum\Enums\ReportMotivo;
use App\Domain\Forum\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicReport extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'topic_id',
        'user_id',
        'motivo',
        'descricao',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'motivo' => ReportMotivo::class,
            'status' => ReportStatus::class,
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopePending($query)
    {
        return $query->where('status', ReportStatus::Pending);
    }
}
