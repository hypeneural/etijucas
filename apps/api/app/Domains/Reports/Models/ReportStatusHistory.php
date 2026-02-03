<?php

namespace App\Domains\Reports\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportStatusHistory extends Model
{
    use HasUuids;

    protected $table = 'report_status_history';

    public $timestamps = false;

    protected $fillable = [
        'report_id',
        'status',
        'note',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function report(): BelongsTo
    {
        return $this->belongsTo(CitizenReport::class, 'report_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // =====================================================
    // Boot
    // =====================================================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (ReportStatusHistory $history) {
            $history->created_at = now();
        });
    }
}
