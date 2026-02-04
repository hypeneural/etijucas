<?php

namespace App\Domains\Reports\Models;

use App\Domains\Reports\Enums\LocationQuality;
use App\Domains\Reports\Enums\ReportStatus;
use App\Models\Bairro;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class CitizenReport extends Model implements HasMedia
{
    use HasUuids, SoftDeletes, InteractsWithMedia;

    protected $table = 'citizen_reports';

    protected $fillable = [
        'user_id',
        'assigned_to',
        'category_id',
        'bairro_id',
        'title',
        'description',
        'status',
        'protocol',
        'address_text',
        'address_source',
        'location_quality',
        'latitude',
        'longitude',
        'location_accuracy_m',
        'resolved_at',
        'assigned_at',
    ];

    protected $casts = [
        'status' => ReportStatus::class,
        'location_quality' => LocationQuality::class,
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'location_accuracy_m' => 'integer',
        'resolved_at' => 'datetime',
        'assigned_at' => 'datetime',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ReportCategory::class, 'category_id');
    }

    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ReportStatusHistory::class, 'report_id')
            ->orderByDesc('created_at');
    }

    // =====================================================
    // Media Library
    // =====================================================

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('report_images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp'])
            ->useDisk('public');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(200)
            ->height(200)
            ->sharpen(10)
            ->performOnCollections('report_images')
            ->nonQueued();

        $this->addMediaConversion('web')
            ->width(800)
            ->height(800)
            ->performOnCollections('report_images')
            ->nonQueued();
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeByUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByStatus($query, ReportStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory($query, string $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByBairro($query, string $bairroId)
    {
        return $query->where('bairro_id', $bairroId);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [
            ReportStatus::Recebido,
            ReportStatus::EmAnalise,
        ]);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', ReportStatus::Resolvido);
    }

    // =====================================================
    // Protocol Generation
    // =====================================================

    public static function generateProtocol(): string
    {
        $year = date('Y');
        $maxRetries = 10;

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            // Get the max protocol number for this year, with lock
            $lastReport = self::whereYear('created_at', $year)
                ->orderByRaw("CAST(SUBSTRING(protocol, -6) AS UNSIGNED) DESC")
                ->lockForUpdate()
                ->first();

            if ($lastReport && preg_match('/ETJ-\d{4}-(\d{6})/', $lastReport->protocol, $matches)) {
                $nextNum = (int) $matches[1] + 1;
            } else {
                $nextNum = self::whereYear('created_at', $year)->count() + 1;
            }

            $protocol = sprintf('ETJ-%s-%06d', $year, $nextNum);

            // Check if it already exists (race condition check)
            if (!self::where('protocol', $protocol)->exists()) {
                return $protocol;
            }

            // If exists, increment and try again
            usleep(50000 * ($attempt + 1)); // 50ms, 100ms, 150ms...
        }

        // Fallback: use timestamp-based unique protocol
        return sprintf('ETJ-%s-%06d', $year, (int) (microtime(true) * 1000) % 1000000);
    }

    // =====================================================
    // Status Management
    // =====================================================

    public function updateStatus(ReportStatus $newStatus, ?string $note = null, ?string $userId = null): void
    {
        $this->status = $newStatus;

        if ($newStatus === ReportStatus::Resolvido) {
            $this->resolved_at = now();
        }

        $this->save();

        // Log to history
        ReportStatusHistory::create([
            'report_id' => $this->id,
            'status' => $newStatus->value,
            'note' => $note,
            'created_by' => $userId,
        ]);
    }

    // =====================================================
    // Boot
    // =====================================================

    protected static function boot(): void
    {
        parent::boot();

        // Generate protocol on creation
        static::creating(function (CitizenReport $report) {
            if (empty($report->protocol)) {
                $report->protocol = self::generateProtocol();
            }
        });

        // Log initial status after creation
        static::created(function (CitizenReport $report) {
            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => $report->status->value,
                'note' => 'Denúncia recebida no sistema',
                'created_by' => null,
            ]);
        });
    }
}
