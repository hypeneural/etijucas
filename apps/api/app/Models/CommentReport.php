<?php

namespace App\Models;

use App\Domain\Forum\Enums\ReportMotivo;
use App\Domain\Forum\Enums\ReportStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommentReport extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'city_id',
        'comment_id',
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

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopePending($query)
    {
        return $query->where('status', ReportStatus::Pending);
    }
}
